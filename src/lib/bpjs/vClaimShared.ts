/**
 * V-Claim Adapter Shared Helpers (BP0.4).
 *
 * `wrapWithAudit` HOF — auto-log audit entry sebelum return Result.
 * Semua adapter method baru wajib pakai HOF ini untuk enforce
 * audit-first development.
 *
 * Reference: TODO-BPJS.md § Catatan Implementasi — "wajib tulis
 * audit log entry sebelum return Result".
 */

import { logAuditEntry } from "./auditStore";
import { BPJS_CREDS_MOCK } from "./credentialsStore";
import {
  Err,
  type BPJSAuditEntry,
  type BPJSAuditMethod,
  type BPJSError,
  type BPJSEnvelope,
  type Result,
  Ok,
  makeBPJSMetaError,
  shouldSimulateNetworkError,
  simulateLatency,
  type BPJSConfig,
  type BPJSCode,
} from "./bpjsShared";

// ── Audit Wrapping ─────────────────────────────────────

interface AuditMeta {
  /** Endpoint relative path (with `{placeholders}`). */
  endpoint: string;
  method: BPJSAuditMethod;
  /** Idempotency key untuk mutation (optional). */
  idempotencyKey?: string;
}

interface AuditActor {
  actor: string;
  actorRole: string;
}

const DEFAULT_ACTOR: AuditActor = {
  actor: "system@bpjs",
  actorRole: "operator-bpjs",
};

/**
 * HOF — wrap adapter call dengan auto-audit logging.
 *
 * Generic atas `T` (response data) — return Result<BPJSEnvelope<T>, BPJSError>.
 * Auto-track durationMs · requestHash · responseCode · success · errorType.
 *
 * Usage di adapter method:
 * ```ts
 * export async function getPesertaByKartu(noKartu, tgl, config) {
 *   return wrapWithAudit(
 *     { endpoint: `/Peserta/nokartu/${noKartu}/tglSEP/${tgl}`, method: "GET" },
 *     async () => {
 *       // mock logic
 *       return Ok({ metaData: { code: "200", ... }, response: {...} });
 *     }
 *   )();
 * }
 * ```
 */
export function wrapWithAudit<T>(
  meta: AuditMeta,
  fn: () => Promise<Result<BPJSEnvelope<T>, BPJSError>>,
  actor: AuditActor = DEFAULT_ACTOR,
): () => Promise<Result<BPJSEnvelope<T>, BPJSError>> {
  return async () => {
    const start = Date.now();
    const requestHash = simpleHash(`${meta.method}:${meta.endpoint}`);
    let result: Result<BPJSEnvelope<T>, BPJSError>;

    try {
      result = await fn();
    } catch (e) {
      // unexpected throw — log as failure
      const entry: BPJSAuditEntry = {
        id: makeAuditId(start),
        timestamp: new Date(start).toISOString(),
        endpoint: meta.endpoint,
        method: meta.method,
        requestHash,
        responseCode: "ERR",
        success: false,
        durationMs: Date.now() - start,
        actor: actor.actor,
        actorRole: actor.actorRole,
        consId: BPJS_CREDS_MOCK.consId,
        idempotencyKey: meta.idempotencyKey,
        errorType: e instanceof Error ? e.name : "UnknownError",
      };
      logAuditEntry(entry);
      throw e;
    }

    const code = result.ok ? result.value.metaData.code : "ERR";
    const success = result.ok && result.value.metaData.code === "200";
    const errorType = result.ok
      ? success
        ? undefined
        : `BPJSCode-${code}`
      : result.error.type;

    const entry: BPJSAuditEntry = {
      id: makeAuditId(start),
      timestamp: new Date(start).toISOString(),
      endpoint: meta.endpoint,
      method: meta.method,
      requestHash,
      responseCode: code,
      responseHash: result.ok ? simpleHash(JSON.stringify(result.value)) : undefined,
      success,
      durationMs: Date.now() - start,
      actor: actor.actor,
      actorRole: actor.actorRole,
      consId: BPJS_CREDS_MOCK.consId,
      idempotencyKey: meta.idempotencyKey,
      errorType,
    };
    logAuditEntry(entry);
    return result;
  };
}

// ── Mock Result Helpers ────────────────────────────────

/**
 * Standard pre-flight (latency + network error simulation).
 * Return `BPJSError` jika harus fail, null jika boleh lanjut.
 *
 * Pattern di adapter method:
 * ```ts
 * const err = await preflightMock(config);
 * if (err) return Err(err);
 * ```
 */
export async function preflightMock(config: BPJSConfig): Promise<BPJSError | null> {
  await simulateLatency(config.fixedLatencyMs);
  if (shouldSimulateNetworkError(config.failRate)) {
    return {
      type: "NetworkError",
      message: "V-Claim API timeout (simulated)",
      retryable: true,
    };
  }
  return null;
}

/** Envelope success builder. */
export function okEnvelope<T>(response: T, message = "Sukses"): Result<BPJSEnvelope<T>, BPJSError> {
  return Ok({ metaData: { code: "200", message }, response });
}

/** Envelope error (code non-200, response empty) builder. */
export function errEnvelope<T>(
  code: BPJSCode,
  endpoint: string,
  message?: string,
): Result<BPJSEnvelope<T>, BPJSError> {
  return Err(makeBPJSMetaError(code, endpoint, message));
}

/** Empty envelope (e.g. code 201 not found wrapped as Ok envelope, no response). */
export function okEnvelopeEmpty<T>(message: string, code: BPJSCode = "201"): Result<BPJSEnvelope<T>, BPJSError> {
  return Ok({ metaData: { code, message } });
}

// ── Hash Helper ────────────────────────────────────────

/** Deterministic short hash — bukan cryptographic, untuk audit hash field. */
function simpleHash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
  return (h >>> 0).toString(16).padStart(8, "0");
}

function makeAuditId(ts: number): string {
  return `audit-${ts}-${Math.random().toString(36).slice(2, 8)}`;
}
