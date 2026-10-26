import "server-only";

/**
 * FH0 — HTTP client SatuSehat (SERVER-ONLY). Satu choke-point transport:
 * circuit → token → fetch (timeout + retry terbatas) → parse JSON/OperationOutcome →
 * `Result<FhirResponse<T>, FhirError>`.
 *
 * - Retry HANYA network/timeout/5xx/429 (≤ `retries`, backoff). 4xx OperationOutcome TIDAK di-retry
 *   (perbaiki payload). 401 → buang token cache + 1× ulang dengan token baru.
 * - Audit (R9) di layer service (`auditedFhirCall`), bukan di sini — connector tak tahu actor/DB.
 *
 * Aturan: [docs/FHIR-RULES.md](../../../../docs/FHIR-RULES.md) R5/R6/R7/R10.
 */

import {
  Ok, Err, isOperationOutcome, summarizeIssues,
  type Result, type FhirError, type FhirMethod, type FhirTarget,
} from "../fhirShared";
import { getSatuSehatConfig, satuSehatUrl } from "./config";
import { getSatuSehatToken, invalidateSatuSehatToken } from "./token";
import { circuitAllows, recordFailure, recordSuccess } from "./circuit";
import { FhirConfigError } from "./errors";

export interface FhirCallOptions {
  /** Default "fhir". */
  target?: FhirTarget;
  /** Default "GET". */
  method?: FhirMethod;
  /** Path relatif base target, mis. `Patient?identifier=...|...` · `Encounter/{id}` · "" (Bundle ke root). */
  path: string;
  /** Resource / Bundle (POST/PUT/PATCH). */
  body?: unknown;
  /** Izinkan panggilan nyata walau SATUSEHAT_MODE=mock (uji read-only). Default false. */
  allowInMock?: boolean;
  timeoutMs?: number;
  /** Maksimum retry (network/5xx/429). Default 2. */
  retries?: number;
}

export interface FhirResponse<T> {
  status: number;
  body: T;
  /** Jumlah percobaan ulang yang terjadi (untuk audit retryCount). */
  retries: number;
}

const backoff = (attempt: number): Promise<void> =>
  new Promise((r) => setTimeout(r, Math.min(4_000, 500 * 2 ** (attempt - 1))));

/**
 * Panggil SatuSehat. **Menolak** saat `SATUSEHAT_MODE=mock` (kecuali `allowInMock`) — pakai adapter
 * mock di service. Throw hanya untuk config error; selebihnya `Result`.
 */
export async function callSatuSehat<T = unknown>(opts: FhirCallOptions): Promise<Result<FhirResponse<T>, FhirError>> {
  const cfg = getSatuSehatConfig();
  if (cfg.mode === "mock" && !opts.allowInMock) {
    throw new FhirConfigError("callSatuSehat dipanggil saat SATUSEHAT_MODE=mock — gunakan adapter mock di layer service.");
  }

  const target = opts.target ?? "fhir";
  if (!circuitAllows(target)) {
    return Err({ type: "CircuitOpen", message: `Circuit SatuSehat (${target}) terbuka — gagal beruntun, coba sebentar lagi`, retryable: true });
  }

  const method = opts.method ?? "GET";
  const url = satuSehatUrl(target, opts.path);
  const maxRetries = opts.retries ?? 2;
  const timeoutMs = opts.timeoutMs ?? cfg.requestTimeoutMs;

  let attempt = 0;
  let reauthed = false;
  let lastErr: FhirError = { type: "NetworkError", message: "Unknown network error", retryable: true };

  while (attempt <= maxRetries) {
    const tok = await getSatuSehatToken();
    if (!tok.ok) return tok;

    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), timeoutMs);
    let status: number;
    let text: string;
    try {
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${tok.value}`,
          "Content-Type": method === "PATCH" ? "application/json-patch+json" : "application/json",
          Accept: "application/json",
        },
        body: method === "GET" ? undefined : JSON.stringify(opts.body ?? {}),
        signal: ac.signal,
        cache: "no-store",
      });
      status = res.status;
      text = await res.text();
    } catch (e) {
      const aborted = (e as { name?: string })?.name === "AbortError";
      lastErr = {
        type: "NetworkError",
        message: aborted ? `Timeout SatuSehat (${timeoutMs}ms)` : `Network error → ${(e as Error).message}`,
        retryable: true,
      };
      recordFailure(target);
      attempt++;
      if (attempt <= maxRetries) await backoff(attempt);
      continue;
    } finally {
      clearTimeout(timer);
    }

    // 401 → token kedaluwarsa/dicabut di sisi server: ambil token baru sekali.
    if (status === 401 && !reauthed) {
      invalidateSatuSehatToken();
      reauthed = true;
      continue;
    }

    const parsed = parseJson(text);

    if (status >= 200 && status < 300) {
      recordSuccess(target);
      return Ok({ status, body: parsed as T, retries: attempt });
    }

    const err = toFhirError(status, parsed);
    if (status >= 500) recordFailure(target);
    if (err.retryable && attempt < maxRetries) {
      lastErr = err;
      attempt++;
      await backoff(attempt);
      continue;
    }
    return Err(err);
  }

  return Err(lastErr);
}

function parseJson(text: string): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function toFhirError(status: number, body: unknown): FhirError {
  const retryable = status === 429 || status >= 500;
  if (isOperationOutcome(body)) {
    return {
      type: status === 429 ? "RateLimited" : "OperationOutcome",
      status,
      message: summarizeIssues(body.issue) || `SatuSehat HTTP ${status}`,
      issues: body.issue,
      retryable,
    };
  }
  return {
    type: status === 401 || status === 403 ? "AuthError" : status === 429 ? "RateLimited" : "HttpError",
    status,
    message: `SatuSehat HTTP ${status}`,
    retryable,
  };
}
