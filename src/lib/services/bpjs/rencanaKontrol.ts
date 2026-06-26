// Service BPJS V-Claim — Rencana Kontrol / SPRI. Layering: Service → connector (R3).
//
// insertSPRI (RencanaKontrol/InsertSPRI):
//   • BPJS_MODE=mock (belum ada cons-id) → SELALU SUKSES, generate noSuratKontrol. ⚠️ removable
//     kapan saja (lihat TECH_DEBT "BPJS InsertSPRI mock always-true").
//   • sandbox/prod → POST ke V-Claim via callBpjs (Content-Type x-www-form-urlencoded), audited.
//
// Audit (R9) + PII hash (R14) via auditedCall. Connector tetap murni.

import { Ok, type Result, type BPJSEnvelope, type BPJSError } from "@/lib/bpjs/bpjsShared";
import type { InsertSPRIPayload, InsertSPRIResponse } from "@/lib/bpjs/bpjsContracts";
import { isBpjsMockMode } from "@/lib/bpjs/server/config";
import { callBpjs } from "@/lib/bpjs/server/httpClient";
import { toSpriWire } from "@/lib/schemas/bpjs/rencanaKontrol";
import { auditedCall, type AuditContext } from "./audit";

const ENDPOINT = "RencanaKontrol/InsertSPRI";

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
