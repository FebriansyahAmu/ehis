import "server-only";

/**
 * Adapter MOCK SatuSehat (SATUSEHAT_MODE=mock) — shape respons sama dengan server nyata, tanpa
 * jaringan & tanpa kredensial (R13). Stateless: idempotensi dijaga `fhir.ResourceMap` (env=mock),
 * bukan oleh mock ini.
 *
 * Perilaku:
 * - GET `Practitioner|Patient?identifier=<nik-system>|<nik>` → Bundle 1 entri (id deterministik dari NIK).
 * - GET pencarian lain (`Type?…`) → Bundle searchset kosong (belum terdaftar → service POST).
 * - GET `Type/{id}` → resource minimal ber-id.
 * - POST `Type` → 201 + resource ber-id `mock-…`.  PUT `Type/{id}` → 200 resource apa adanya.
 * - POST root (Bundle transaction) → transaction-response dengan `location` per entry (FH7).
 */

import { createHash, randomUUID } from "node:crypto";
import { Ok, Err, type Result, type FhirError, type Bundle } from "../fhirShared";
import type { FhirCallOptions, FhirResponse } from "./httpClient";

const short = (s: string) => createHash("sha256").update(s).digest("hex").slice(0, 10);

function searchset(entries: { resourceType: string; id: string; [k: string]: unknown }[]): Bundle {
  return {
    resourceType: "Bundle",
    type: "searchset",
    total: entries.length,
    entry: entries.map((r) => ({ fullUrl: `${r.resourceType}/${r.id}`, resource: r })),
  };
}

export async function mockSatuSehat<T>(opts: FhirCallOptions): Promise<Result<FhirResponse<T>, FhirError>> {
  const method = opts.method ?? "GET";
  const [pathPart, query = ""] = opts.path.split("?");
  const [type, id] = pathPart.replace(/^\/+/, "").split("/");
  const ok = (status: number, body: unknown) => Ok({ status, body: body as T, retries: 0 });

  // POST ke root = Bundle transaction → transaction-response (urutan entry dipertahankan).
  if (!type && method === "POST") {
    const b = (opts.body ?? {}) as Bundle;
    if (b.resourceType !== "Bundle" || b.type !== "transaction") {
      return Err({ type: "HttpError", status: 400, message: "Mock: POST root wajib Bundle transaction", retryable: false });
    }
    return ok(200, {
      resourceType: "Bundle",
      type: "transaction-response",
      entry: (b.entry ?? []).map((e) => {
        const [rt, existingId] = (e.request?.url ?? "").split("/");
        const id = e.request?.method === "PUT" && existingId ? existingId : `mock-${randomUUID()}`;
        // Bentuk seperti SatuSehat nyata: `location` URL absolut + `resourceType`/`resourceID`.
        return {
          response: {
            status: e.request?.method === "PUT" ? "200 OK" : "201 Created",
            location: `https://mock.satusehat.local/fhir-r4/v1/${rt}/${id}/_history/${e.request?.method === "PUT" ? 2 : 1}`,
            resourceType: rt,
            resourceID: id,
          },
        };
      }),
    } satisfies Bundle);
  }
  if (!type) return Err({ type: "HttpError", status: 400, message: "Mock: path kosong", retryable: false });

  if (method === "GET") {
    if (id) return ok(200, { resourceType: type, id });
    if (type === "Practitioner" || type === "Patient") {
      const nik = new URLSearchParams(query).get("identifier")?.split("|")[1] ?? "";
      if (!/^\d{16}$/.test(nik)) return ok(200, searchset([]));
      // Patient mock tanpa gender/birthDate → verifikasi kecocokan dilewati (bukan "tidak cocok").
      const prefix = type === "Practitioner" ? "prac" : "pat";
      return ok(200, searchset([{ resourceType: type, id: `mock-${prefix}-${short(nik)}`, active: true }]));
    }
    return ok(200, searchset([]));
  }

  if (method === "POST") {
    const body = (opts.body ?? {}) as Record<string, unknown>;
    return ok(201, { ...body, resourceType: type, id: `mock-${randomUUID()}`, meta: { versionId: "1" } });
  }

  if ((method === "PUT" || method === "PATCH") && id) {
    const body = method === "PUT" ? ((opts.body ?? {}) as Record<string, unknown>) : {};
    return ok(200, { ...body, resourceType: type, id, meta: { versionId: "2" } });
  }

  return Err({ type: "HttpError", status: 405, message: `Mock: ${method} ${opts.path} tidak didukung`, retryable: false });
}
