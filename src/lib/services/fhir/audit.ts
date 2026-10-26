// FH0 — auditedFhirCall: wrapper rung SERVICE yang membungkus 1 panggilan SatuSehat lalu menulis
// 1 baris audit ke DB (R9). PII (NIK) di-HASH (R14). Connector tetap murni — audit TIDAK di connector
// (butuh actor + DB). Mirror services/bpjs/audit.ts.
//
// Kegagalan tulis audit TIDAK menggagalkan panggilan (best-effort, di-log tanpa payload).

import { createHash } from "node:crypto";
import { hashPii } from "@/lib/crypto/pii";
import { getSatuSehatConfig } from "@/lib/fhir/server/config";
import type { FhirResponse } from "@/lib/fhir/server/httpClient";
import { insertAudit, type FhirAuditInsert } from "@/lib/dal/fhir/auditDal";
import type { Actor } from "@/lib/auth/actor";
import type { Result, FhirError, FhirMethod } from "@/lib/fhir/fhirShared";

export interface FhirAuditContext {
  target: "fhir" | "kfa" | "masterdata" | "kyc" | "oauth";
  /** Path template DENGAN placeholder, TANPA PII (mis. "Patient?identifier={nik}"). */
  endpoint: string;
  method: FhirMethod;
  resourceType?: string;
  actor: string;
  actorRole: string;
  idempotencyKey?: string;
  /** Di-hash → nik_hash. */
  nik?: string;
  /** Di-hash → request_hash. */
  requestBody?: unknown;
}

/** Identitas audit dari actor sesi; worker/outbox pakai `SYSTEM_AUDIT_ACTOR`. */
export function auditActorOf(actor: Actor): Pick<FhirAuditContext, "actor" | "actorRole"> {
  return { actor: actor.userId, actorRole: actor.roles.join(",") || "-" };
}

export const SYSTEM_AUDIT_ACTOR: Pick<FhirAuditContext, "actor" | "actorRole"> = {
  actor: "system:fhir-outbox",
  actorRole: "system",
};

function sha256Hex(s: string): string {
  return createHash("sha256").update(s, "utf8").digest("hex");
}

/** Bungkus `fn` (panggilan connector) dengan audit. Mengembalikan Result apa adanya. */
export async function auditedFhirCall<T>(
  ctx: FhirAuditContext,
  fn: () => Promise<Result<FhirResponse<T>, FhirError>>,
): Promise<Result<FhirResponse<T>, FhirError>> {
  const startedAt = new Date();
  const base = {
    startedAt,
    mode: safeMode(),
    target: ctx.target,
    endpoint: ctx.endpoint,
    method: ctx.method,
    resourceType: ctx.resourceType ?? null,
    requestHash: ctx.requestBody !== undefined ? sha256Hex(JSON.stringify(ctx.requestBody)) : null,
    nikHash: ctx.nik ? hashPii(ctx.nik) : null,
    actor: ctx.actor,
    actorRole: ctx.actorRole,
    idempotencyKey: ctx.idempotencyKey ?? null,
  } satisfies Partial<FhirAuditInsert>;

  let result: Result<FhirResponse<T>, FhirError>;
  try {
    result = await fn();
  } catch (e) {
    await safeInsert({
      ...base,
      responseStatus: "ERR",
      success: false,
      durationMs: Date.now() - startedAt.getTime(),
      errorType: e instanceof Error ? e.name : "UnknownError",
    });
    throw e; // config error → fail-loud
  }

  await safeInsert({
    ...base,
    ihsId: result.ok ? idOf(result.value.body) : null,
    responseStatus: result.ok ? String(result.value.status) : String(result.error.status ?? "ERR"),
    success: result.ok,
    durationMs: Date.now() - startedAt.getTime(),
    errorType: result.ok ? null : result.error.type,
    retryCount: result.ok ? result.value.retries : 0,
  });
  return result;
}

function safeMode(): string {
  try {
    return getSatuSehatConfig().mode;
  } catch {
    return "invalid";
  }
}

/** Ambil `id` resource tunggal (bukan Bundle searchset) untuk kolom ihs_id. */
function idOf(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const b = body as { resourceType?: string; id?: unknown };
  return b.resourceType && b.resourceType !== "Bundle" && typeof b.id === "string" ? b.id : null;
}

async function safeInsert(data: FhirAuditInsert): Promise<void> {
  try {
    await insertAudit(data);
  } catch (e) {
    console.error("[fhir-audit] gagal tulis audit:", (e as Error).message);
  }
}
