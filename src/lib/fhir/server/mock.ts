import "server-only";

/**
 * Adapter MOCK SatuSehat (SATUSEHAT_MODE=mock) — shape respons sama dengan server nyata, tanpa
 * jaringan & tanpa kredensial (R13). Stateless: idempotensi dijaga `fhir.ResourceMap` (env=mock),
 * bukan oleh mock ini.
 *
 * Perilaku:
 * - GET `Practitioner?identifier=<nik-system>|<nik>` → Bundle 1 entri (id deterministik dari NIK).
 * - GET pencarian lain (`Type?…`) → Bundle searchset kosong (belum terdaftar → service POST).
 * - GET `Type/{id}` → resource minimal ber-id.
 * - POST `Type` → 201 + resource ber-id `mock-…`.  PUT `Type/{id}` → 200 resource apa adanya.
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

  if (!type) return Err({ type: "HttpError", status: 400, message: "Mock: path kosong", retryable: false });

  if (method === "GET") {
    if (id) return ok(200, { resourceType: type, id });
    if (type === "Practitioner") {
      const nik = new URLSearchParams(query).get("identifier")?.split("|")[1] ?? "";
      if (!/^\d{16}$/.test(nik)) return ok(200, searchset([]));
      return ok(200, searchset([{ resourceType: "Practitioner", id: `mock-prac-${short(nik)}`, active: true }]));
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
