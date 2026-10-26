import "server-only";

/**
 * FH0 — Token OAuth2 SatuSehat: SATU manager, cache + auto-refresh (R5/R11).
 *
 * - `client_credentials`: client_id + client_secret di BODY (x-www-form-urlencoded), grant_type di query.
 * - Cache per-proses (globalThis → selamat dari HMR dev); refresh saat sisa < 60 dtk.
 * - Single-flight: request paralel berbagi 1 promise → tak pernah >1 permintaan token bersamaan.
 * - Cooldown 60 dtk setelah gagal: SatuSehat membatasi 1 req/menit per client_id setelah gagal,
 *   jadi permintaan berikutnya ditahan lokal (RateLimited) alih-alih memperpanjang blokir.
 *
 * ⚠️ Multi-instance → pindahkan cache ke Redis (seam: isi getCache/setCache), signature tetap.
 */

import { Ok, Err, type Result, type FhirError } from "../fhirShared";
import { getSatuSehatConfig, satuSehatTokenUrl } from "./config";
import { FhirConfigError } from "./errors";

const REFRESH_MARGIN_MS = 60_000;
const FAIL_COOLDOWN_MS = 60_000;

interface TokenState {
  token: string | null;
  expiresAt: number;
  failedAt: number;
  inflight: Promise<Result<string, FhirError>> | null;
}

const g = globalThis as unknown as { __ehisSatuSehatToken?: TokenState };
const state: TokenState = (g.__ehisSatuSehatToken ??= { token: null, expiresAt: 0, failedAt: 0, inflight: null });

/** Info token tanpa nilai rahasia — untuk panel status. */
export function describeToken(): { cached: boolean; expiresInSec: number; coolingDownSec: number } {
  const now = Date.now();
  return {
    cached: !!state.token && state.expiresAt > now,
    expiresInSec: state.token ? Math.max(0, Math.round((state.expiresAt - now) / 1000)) : 0,
    coolingDownSec: Math.max(0, Math.round((state.failedAt + FAIL_COOLDOWN_MS - now) / 1000)),
  };
}

/** Buang token cache (mis. setelah 401) — permintaan berikutnya ambil token baru. */
export function invalidateSatuSehatToken(): void {
  state.token = null;
  state.expiresAt = 0;
}

/**
 * Ambil Bearer token (cache-first). Throw `FhirConfigError` bila mode mock / kredensial kurang;
 * error jaringan/kredensial ditolak = `Err` (jalur normal).
 */
export async function getSatuSehatToken(): Promise<Result<string, FhirError>> {
  const cfg = getSatuSehatConfig();
  if (cfg.mode === "mock") {
    throw new FhirConfigError("getSatuSehatToken dipanggil saat SATUSEHAT_MODE=mock — gunakan adapter mock di layer service.");
  }

  const now = Date.now();
  if (state.token && state.expiresAt - REFRESH_MARGIN_MS > now) return Ok(state.token);
  if (state.inflight) return state.inflight;

  if (state.failedAt + FAIL_COOLDOWN_MS > now) {
    const wait = Math.ceil((state.failedAt + FAIL_COOLDOWN_MS - now) / 1000);
    return Err({ type: "RateLimited", message: `Token SatuSehat gagal sebelumnya — coba lagi dalam ${wait} dtk`, retryable: true });
  }

  state.inflight = requestToken(cfg.clientId, cfg.clientSecret, cfg.requestTimeoutMs).finally(() => {
    state.inflight = null;
  });
  return state.inflight;
}

async function requestToken(clientId: string, clientSecret: string, timeoutMs: number): Promise<Result<string, FhirError>> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(satuSehatTokenUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret }).toString(),
      signal: ac.signal,
      cache: "no-store",
    });
    const text = await res.text();
    let json: { access_token?: string; expires_in?: string | number } = {};
    try {
      json = JSON.parse(text);
    } catch {
      /* body non-JSON → ditangani di bawah */
    }

    if (!res.ok || !json.access_token) {
      state.failedAt = Date.now();
      return Err({
        type: res.status === 429 ? "RateLimited" : "AuthError",
        status: res.status,
        message: `Token SatuSehat ditolak (HTTP ${res.status})`,
        retryable: res.status === 429 || res.status >= 500,
      });
    }

    const expiresInSec = Number(json.expires_in) || 3599;
    state.token = json.access_token;
    state.expiresAt = Date.now() + expiresInSec * 1000;
    state.failedAt = 0;
    return Ok(json.access_token);
  } catch (e) {
    state.failedAt = Date.now();
    const aborted = (e as { name?: string })?.name === "AbortError";
    return Err({
      type: "NetworkError",
      message: aborted ? `Timeout token SatuSehat (${timeoutMs}ms)` : `Network error token → ${(e as Error).message}`,
      retryable: true,
    });
  } finally {
    clearTimeout(timer);
  }
}
