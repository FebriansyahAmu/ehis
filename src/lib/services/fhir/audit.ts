// FH0 — auditedFhirCall: wrapper rung SERVICE yang membungkus 1 panggilan SatuSehat lalu menulis
// 1 baris audit ke DB (R9). PII (NIK) di-HASH (R14). Connector tetap murni — audit TIDAK di connector
// (butuh actor + DB). Mirror services/bpjs/audit.ts.
//
// Log pengiriman (2026-11-21): baris audit ditautkan ke data lokal (localType/localId/kunjungan) dan
// isi request/response disimpan TERSEGEL (NIK dimasker → AES-256-GCM, tabel terpisah, retensi
// SATUSEHAT_LOG_BODY_DAYS). Target `oauth` tak pernah dicatat isinya (token/secret).
//
// Kegagalan tulis audit TIDAK menggagalkan panggilan (best-effort, di-log tanpa payload).

import { createHash } from "node:crypto";
import { hashPii } from "@/lib/crypto/pii";
import { getSatuSehatConfig } from "@/lib/fhir/server/config";
import type { FhirResponse } from "@/lib/fhir/server/httpClient";
import { insertAudit, purgePayloadsBefore, type FhirAuditInsert, type FhirAuditPayloadInsert } from "@/lib/dal/fhir/auditDal";
import type { Actor } from "@/lib/auth/actor";
import type { Result, FhirError, FhirMethod } from "@/lib/fhir/fhirShared";
import { redactText, sealBody } from "./auditBody";

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
  /** Di-hash → request_hash; disimpan tersegel di log pengiriman. */
  requestBody?: unknown;
  /** Path nyata (relatif base target) — NIK dimasker sebelum disimpan. */
  path?: string;
  /** Data lokal yang dikirim/dicari → riwayat per data di konsol. Bundle: "Bundle" + kunjunganId. */
  localType?: string;
  localId?: string;
  kunjunganId?: string;
  /** Bundle transaction: isi entry berurutan "<localType>|<localId>". */
  localRefs?: string[];
}

/** Tautan log ke data lokal — dipakai service saat memanggil `fhirRequest`. */
export type FhirLogLink = Pick<FhirAuditContext, "localType" | "localId" | "kunjunganId" | "localRefs">;

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
    localType: ctx.localType ?? null,
    localId: ctx.localId ?? null,
    kunjunganId: ctx.kunjunganId ?? null,
    localRefs: ctx.localRefs ?? null,
    requestPath: ctx.path !== undefined ? redactText(ctx.path) : null,
  } satisfies Partial<FhirAuditInsert>;

  let result: Result<FhirResponse<T>, FhirError>;
  try {
    result = await fn();
  } catch (e) {
    await safeInsert(
      {
        ...base,
        responseStatus: "ERR",
        success: false,
        durationMs: Date.now() - startedAt.getTime(),
        errorType: e instanceof Error ? e.name : "UnknownError",
      },
      sealPayload(ctx, undefined),
    );
    throw e; // config error → fail-loud
  }

  await safeInsert(
    {
      ...base,
      ihsId: result.ok ? idOf(result.value.body) : null,
      responseStatus: result.ok ? String(result.value.status) : String(result.error.status ?? "ERR"),
      success: result.ok,
      durationMs: Date.now() - startedAt.getTime(),
      errorType: result.ok ? null : result.error.type,
      retryCount: result.ok ? result.value.retries : 0,
    },
    sealPayload(ctx, result.ok ? result.value.body : (result.error.body ?? errorOutcome(result.error))),
  );
  return result;
}

/** Respons gagal tanpa body (jaringan/timeout/circuit) → catat sebagai OperationOutcome sintetis. */
function errorOutcome(e: FhirError): unknown {
  if (e.issues?.length) return { resourceType: "OperationOutcome", issue: e.issues };
  return { resourceType: "OperationOutcome", issue: [{ severity: "error", code: "exception", diagnostics: e.message }], _sumber: "EHIS (tanpa respons server)" };
}

function sealPayload(ctx: FhirAuditContext, response: unknown): FhirAuditPayloadInsert | null {
  if (ctx.target === "oauth" || logBodyDays() === 0) return null;
  try {
    const req = sealBody(ctx.requestBody);
    const res = sealBody(response);
    if (!req && !res) return null;
    return {
      requestEnc: req?.enc ?? null,
      responseEnc: res?.enc ?? null,
      requestBytes: req?.bytes ?? null,
      responseBytes: res?.bytes ?? null,
      truncated: !!(req?.truncated || res?.truncated),
    };
  } catch (e) {
    console.error("[fhir-audit] gagal menyegel isi log:", (e as Error).message);
    return null;
  }
}

function safeMode(): string {
  try {
    return getSatuSehatConfig().mode;
  } catch {
    return "invalid";
  }
}

function logBodyDays(): number {
  try {
    return getSatuSehatConfig().logBodyDays;
  } catch {
    return 0;
  }
}

/** Ambil `id` resource tunggal (bukan Bundle searchset) untuk kolom ihs_id. */
function idOf(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const b = body as { resourceType?: string; id?: unknown };
  return b.resourceType && b.resourceType !== "Bundle" && typeof b.id === "string" ? b.id : null;
}

async function safeInsert(data: FhirAuditInsert, payload: FhirAuditPayloadInsert | null): Promise<void> {
  try {
    await insertAudit(data, payload);
  } catch (e) {
    console.error("[fhir-audit] gagal tulis audit:", (e as Error).message);
  }
  maybePurge();
}

// ── Retensi isi log ─────────────────────────────────────────
// Dipangkas oportunistik maks 1×/jam per proses (tanpa cron): DELETE bertahap ber-index created_at.

const PURGE_EVERY_MS = 60 * 60 * 1000;
const g = globalThis as unknown as { __ehisFhirLogPurgeAt?: number };

function maybePurge(): void {
  const days = logBodyDays();
  const now = Date.now();
  if (days === 0 || now - (g.__ehisFhirLogPurgeAt ?? 0) < PURGE_EVERY_MS) return;
  g.__ehisFhirLogPurgeAt = now;
  purgePayloadsBefore(new Date(now - days * 86_400_000)).catch((e) =>
    console.error("[fhir-audit] gagal memangkas isi log:", (e as Error).message),
  );
}
