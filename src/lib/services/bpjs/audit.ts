// BWS0.5 — auditedCall: wrapper rung SERVICE yang membungkus 1 panggilan BPJS lalu menulis
// 1 baris audit ke DB (R9). PII (noKartu/NIK) di-HASH (R14). Connector tetap murni — audit
// TIDAK di connector (butuh actor/session + DB). Pengganti `wrapWithAudit` client.
//
// Kegagalan tulis audit TIDAK menggagalkan panggilan (best-effort, di-log).

import { createHash } from "node:crypto";
import { hashPii } from "@/lib/crypto/pii";
import { getBpjsConfig } from "@/lib/bpjs/server/config";
import { insertAudit, type AuditInsert } from "@/lib/dal/bpjs/auditDal";
import type { Result, BPJSEnvelope, BPJSError } from "@/lib/bpjs/bpjsShared";

export interface AuditContext {
  service: "vclaim" | "aplicares" | "antrean";
  /** Path template DENGAN placeholder, TANPA PII (mis. "Peserta/nokartu/{kartu}/tglSEP/{tgl}"). */
  endpoint: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  actor: string;
  actorRole: string;
  idempotencyKey?: string;
  /** Di-hash → no_kartu_hash. */
  noKartu?: string;
  /** Di-hash → nik_hash. */
  nik?: string;
  /** Di-hash → request_hash. */
  requestBody?: unknown;
  retryCount?: number;
}

function sha256Hex(s: string): string {
  return createHash("sha256").update(s, "utf8").digest("hex");
}

/** Bungkus `fn` (panggilan connector) dengan audit. Mengembalikan Result apa adanya. */
export async function auditedCall<T>(
  ctx: AuditContext,
  fn: () => Promise<Result<BPJSEnvelope<T>, BPJSError>>,
): Promise<Result<BPJSEnvelope<T>, BPJSError>> {
  const cfg = getBpjsConfig();
  const startedAt = new Date();
  const base: Omit<AuditInsert, "responseCode" | "success" | "durationMs" | "errorType" | "responseHash"> = {
    startedAt,
    mode: cfg.mode,
    service: ctx.service,
    endpoint: ctx.endpoint,
    method: ctx.method,
    requestHash: ctx.requestBody !== undefined ? sha256Hex(JSON.stringify(ctx.requestBody)) : null,
    noKartuHash: ctx.noKartu ? hashPii(ctx.noKartu) : null,
    nikHash: ctx.nik ? hashPii(ctx.nik) : null,
    actor: ctx.actor,
    actorRole: ctx.actorRole,
    consId: cfg.consId,
    idempotencyKey: ctx.idempotencyKey ?? null,
    retryCount: ctx.retryCount ?? 0,
  };

  let result: Result<BPJSEnvelope<T>, BPJSError>;
  try {
    result = await fn();
  } catch (e) {
    await safeInsert({
      ...base,
      responseCode: "ERR",
      success: false,
      durationMs: Date.now() - startedAt.getTime(),
      errorType: e instanceof Error ? e.name : "UnknownError",
      responseHash: null,
    });
    throw e; // decode/config error → fail-loud (R5)
  }

  const code = result.ok ? result.value.metaData.code : "ERR";
  const success = result.ok && result.value.metaData.code === "200";
  const errorType = result.ok ? (success ? null : `BPJSCode-${code}`) : result.error.type;
  const responseHash = result.ok ? sha256Hex(JSON.stringify(result.value)) : null;

  await safeInsert({
    ...base,
    responseCode: code,
    success,
    durationMs: Date.now() - startedAt.getTime(),
    errorType,
    responseHash,
  });
  return result;
}

async function safeInsert(data: AuditInsert): Promise<void> {
  try {
    await insertAudit(data);
  } catch (e) {
    // Audit best-effort — jangan gagalkan panggilan klinis karena audit gagal.
    console.error("[bpjs-audit] gagal tulis audit:", (e as Error).message);
  }
}
