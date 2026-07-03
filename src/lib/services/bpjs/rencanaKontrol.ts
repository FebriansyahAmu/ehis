// Service BPJS V-Claim — Rencana Kontrol / SPRI. Layering: Service → connector (R3).
//
// insertSPRI (RencanaKontrol/InsertSPRI):
//   • BPJS_MODE=mock (belum ada cons-id) → SELALU SUKSES, generate noSuratKontrol. ⚠️ removable
//     kapan saja (lihat TECH_DEBT "BPJS InsertSPRI mock always-true").
//   • sandbox/prod → POST ke V-Claim via callBpjs (Content-Type x-www-form-urlencoded), audited.
//
// Audit (R9) + PII hash (R14) via auditedCall. Connector tetap murni.

import { Ok, type Result, type BPJSEnvelope, type BPJSError } from "@/lib/bpjs/bpjsShared";
import type {
  InsertSPRIPayload, InsertSPRIResponse, UpdateSPRIPayload, DeleteRKPayload,
} from "@/lib/bpjs/bpjsContracts";
import { isBpjsMockMode } from "@/lib/bpjs/server/config";
import { callBpjs } from "@/lib/bpjs/server/httpClient";
import {
  toSpriWire, toSpriUpdateWire, toSpriDeleteWire, toRencanaKontrolWire,
  type InsertRencanaKontrolRequest,
} from "@/lib/schemas/bpjs/rencanaKontrol";
import { auditedCall, type AuditContext } from "./audit";

const ENDPOINT = "RencanaKontrol/InsertSPRI";
const ENDPOINT_UPDATE = "RencanaKontrol/UpdateSPRI";
const ENDPOINT_DELETE = "RencanaKontrol/Delete";
const ENDPOINT_INSERT_RK = "RencanaKontrol/insert";

/** Payload RencanaKontrol/insert — kontrak Zod di schemas/bpjs/rencanaKontrol.ts
 *  (`InsertRencanaKontrolRequestSchema`); validasi di Service sebelum connector dipanggil. */
export type InsertRencanaKontrolInput = InsertRencanaKontrolRequest;

/** Response Delete RK/SPRI — V-Claim hanya kirim metaData; response = pesan. */
export interface DeleteRKResponse {
  message?: string;
}

export interface BpjsAuditActor {
  actor: string;
  actorRole: string;
}

/** Format noSuratKontrol (= No. Referensi SPRI): PPK(4) R 001 MM YY K SEQ(6). */
function genNoSuratKontrol(): string {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yy = String(now.getFullYear() % 100).padStart(2, "0");
  const seq = String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");
  return `0491R001${mm}${yy}K${seq}`;
}

function auditCtx(input: InsertSPRIPayload, who: BpjsAuditActor): AuditContext {
  return {
    service: "vclaim",
    endpoint: ENDPOINT,
    method: "POST",
    actor: who.actor,
    actorRole: who.actorRole,
    noKartu: input.noKartu,
    requestBody: toSpriWire(input),
  };
}

/**
 * V-Claim RencanaKontrol/InsertSPRI — terbitkan SPRI, kembalikan `noSuratKontrol`.
 * Mock SELALU sukses (return true) selama belum ada cons-id sandbox.
 */
export async function insertSPRI(
  input: InsertSPRIPayload,
  who: BpjsAuditActor,
): Promise<Result<BPJSEnvelope<InsertSPRIResponse>, BPJSError>> {
  if (isBpjsMockMode()) {
    return auditedCall<InsertSPRIResponse>(auditCtx(input, who), async () =>
      Ok({
        metaData: { code: "200", message: "Sukses (mock — tanpa cons-id)" },
        response: {
          noSuratKontrol: genNoSuratKontrol(),
          namaJnsKontrol: "Surat Perintah Rawat Inap",
          tglRencanaKontrol: input.tglRencanaKontrol,
          noKartu: input.noKartu,
        },
      }),
    );
  }

  return auditedCall<InsertSPRIResponse>(auditCtx(input, who), () =>
    callBpjs<InsertSPRIResponse>({
      service: "vclaim",
      method: "POST",
      path: ENDPOINT,
      body: toSpriWire(input),
      contentType: "application/x-www-form-urlencoded",
    }),
  );
}

/**
 * V-Claim RencanaKontrol/insert — terbitkan surat kontrol pasca-pulang, kembalikan
 * `noSuratKontrol` (= No. Referensi jadwal kontrol). Mock SELALU sukses (pola insertSPRI).
 */
export async function insertRencanaKontrol(
  input: InsertRencanaKontrolInput,
  who: BpjsAuditActor,
): Promise<Result<BPJSEnvelope<InsertSPRIResponse>, BPJSError>> {
  const ctx: AuditContext = {
    service: "vclaim", endpoint: ENDPOINT_INSERT_RK, method: "POST",
    actor: who.actor, actorRole: who.actorRole, requestBody: toRencanaKontrolWire(input),
  };
  // Mock SELALU sukses (belum ada cons-id dev/sandbox) — return noSuratKontrol format valid
  // (PPK+R001+MMYY+K+seq, pola sama SPRI). ⚠️ removable saat sandbox siap (ganti BPJS_MODE).
  if (isBpjsMockMode()) {
    return auditedCall<InsertSPRIResponse>(ctx, async () =>
      Ok({
        metaData: { code: "200", message: "Ok (mock — tanpa cons-id)" },
        response: {
          noSuratKontrol: genNoSuratKontrol(),
          namaJnsKontrol: "Surat Kontrol",
          tglRencanaKontrol: input.tglRencanaKontrol,
        },
      }),
    );
  }
  return auditedCall<InsertSPRIResponse>(ctx, () =>
    callBpjs<InsertSPRIResponse>({
      service: "vclaim", method: "POST", path: ENDPOINT_INSERT_RK,
      body: toRencanaKontrolWire(input), contentType: "application/x-www-form-urlencoded",
    }),
  );
}

/**
 * V-Claim RencanaKontrol/UpdateSPRI (PUT) — perbarui SPRI (DPJP/poli/tgl rencana).
 * Mock SELALU sukses (kembalikan noSuratKontrol = noSPRI). `noSPRI` = No. Referensi SPRI.
 */
export async function updateSPRI(
  input: UpdateSPRIPayload,
  who: BpjsAuditActor,
): Promise<Result<BPJSEnvelope<InsertSPRIResponse>, BPJSError>> {
  const ctx: AuditContext = {
    service: "vclaim", endpoint: ENDPOINT_UPDATE, method: "PUT",
    actor: who.actor, actorRole: who.actorRole, requestBody: toSpriUpdateWire(input),
  };
  if (isBpjsMockMode()) {
    return auditedCall<InsertSPRIResponse>(ctx, async () =>
      Ok({
        metaData: { code: "200", message: "Update berhasil (mock — tanpa cons-id)" },
        response: { noSuratKontrol: input.noSPRI, tglRencanaKontrol: input.tglRencanaKontrol },
      }),
    );
  }
  return auditedCall<InsertSPRIResponse>(ctx, () =>
    callBpjs<InsertSPRIResponse>({
      service: "vclaim", method: "PUT", path: ENDPOINT_UPDATE,
      body: toSpriUpdateWire(input), contentType: "application/x-www-form-urlencoded",
    }),
  );
}

/**
 * V-Claim RencanaKontrol/Delete (DELETE) — batalkan SPRI. Mock SELALU sukses.
 * `noSuratKontrol` = No. Referensi SPRI.
 */
export async function deleteSPRI(
  input: DeleteRKPayload,
  who: BpjsAuditActor,
): Promise<Result<BPJSEnvelope<DeleteRKResponse>, BPJSError>> {
  const ctx: AuditContext = {
    service: "vclaim", endpoint: ENDPOINT_DELETE, method: "DELETE",
    actor: who.actor, actorRole: who.actorRole, requestBody: toSpriDeleteWire(input),
  };
  if (isBpjsMockMode()) {
    return auditedCall<DeleteRKResponse>(ctx, async () =>
      Ok({
        metaData: { code: "200", message: "Pembatalan SPRI berhasil (mock — tanpa cons-id)" },
        response: { message: "Surat kontrol/SPRI dibatalkan" },
      }),
    );
  }
  return auditedCall<DeleteRKResponse>(ctx, () =>
    callBpjs<DeleteRKResponse>({
      service: "vclaim", method: "DELETE", path: ENDPOINT_DELETE,
      body: toSpriDeleteWire(input), contentType: "application/x-www-form-urlencoded",
    }),
  );
}
