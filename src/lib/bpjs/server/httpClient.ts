import "server-only";

/**
 * BWS0.4 — HTTP client BPJS (SERVER-ONLY). Satu choke-point transport:
 * sign → fetch (timeout + retry network-only) → parse envelope → decode →
 * `Result<BPJSEnvelope<T>, BPJSError>`.
 *
 * - Retry HANYA network/timeout (backoff terbatas). Error bisnis (code non-200)
 *   TIDAK di-retry. Decode gagal → throw `BpjsDecodeError` (ditangkap audit wrapper).
 * - `timestamp` per attempt dipakai untuk header DAN decode (konsisten).
 *
 * Aturan: [docs/BPJS-WS-RULES.md](../../../../docs/BPJS-WS-RULES.md) R5/R7/R10.
 * Audit (R9) + rate-limit (R11) di-hook di layer service (BWS0.5), bukan di sini.
 */

import {
  Ok, Err, isBPJSCode, makeBPJSMetaError,
  type Result, type BPJSEnvelope, type BPJSError,
} from "../bpjsShared";
import { getBpjsConfig, type BpjsService } from "./config";
import { buildBpjsHeaders } from "./signature";
import { decodeBpjsResponse } from "./decrypt";
import { BpjsConfigError } from "./errors";

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export interface BpjsCallOptions {
  /** Default "vclaim". */
  service?: BpjsService;
  /** Default "GET". */
  method?: HttpMethod;
  /** Path relatif terhadap base URL service (mis. `Peserta/nokartu/000/tglSEP/2026-06-26`). */
  path: string;
  /** Body JSON untuk POST/PUT/DELETE (V-Claim: body plaintext JSON; response yg ter-enkripsi). */
  body?: unknown;
  /**
   * Override Content-Type. Sebagian endpoint V-Claim (mis. RencanaKontrol/InsertSPRI) minta
   * `application/x-www-form-urlencoded` walau body tetap string JSON. Default JSON.
   */
  contentType?: string;
  /** Decode response (AES+LZ). Default true utk vclaim, false utk service lain. Override sesuai endpoint. */
  decode?: boolean;
  /** Timeout per attempt (ms). Default dari config. */
  timeoutMs?: number;
  /** Maksimum retry network (bukan business). Default 2. */
  retries?: number;
}

const isAbortError = (e: unknown): boolean =>
  (e instanceof DOMException && e.name === "AbortError") || (e as { name?: string })?.name === "AbortError";

function joinUrl(base: string, path: string): string {
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

const backoff = (attempt: number): Promise<void> =>
  new Promise((r) => setTimeout(r, Math.min(2_000, 200 * 2 ** (attempt - 1))));

/**
 * Panggil endpoint BPJS nyata. **Menolak** saat `BPJS_MODE=mock` (pakai adapter
 * mock di layer service). Return `Result` untuk jalur normal; throw untuk
 * config/decode error.
 */
export async function callBpjs<T = unknown>(opts: BpjsCallOptions): Promise<Result<BPJSEnvelope<T>, BPJSError>> {
  const cfg = getBpjsConfig();
  if (cfg.mode === "mock") {
    throw new BpjsConfigError("callBpjs dipanggil saat BPJS_MODE=mock — gunakan adapter mock di layer service.");
  }

  const serviceKey = opts.service ?? "vclaim";
  const svc = cfg.services[serviceKey];
  if (!svc.baseUrl) {
    throw new BpjsConfigError(`Base URL service "${serviceKey}" belum dikonfigurasi (env BPJS_*_BASE_URL).`);
  }

  const method = opts.method ?? "GET";
  const url = joinUrl(svc.baseUrl, opts.path);
  const decode = opts.decode ?? serviceKey === "vclaim";
  const maxRetries = opts.retries ?? 2;
  const timeoutMs = opts.timeoutMs ?? cfg.requestTimeoutMs;

  let attempt = 0;
  let lastNetErr: BPJSError = { type: "NetworkError", message: "Unknown network error", retryable: true };

  while (attempt <= maxRetries) {
    const { headers, timestamp } = buildBpjsHeaders({
      consId: cfg.consId,
      consSecret: cfg.consSecret,
      userKey: svc.userKey,
    });
    if (opts.contentType) headers["Content-Type"] = opts.contentType;

    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), timeoutMs);

    let bodyText: string;
    try {
      const res = await fetch(url, {
        method,
        headers,
        body: method === "GET" ? undefined : JSON.stringify(opts.body ?? {}),
        signal: ac.signal,
        cache: "no-store",
      });
      bodyText = await res.text();
    } catch (e) {
      lastNetErr = {
        type: "NetworkError",
        message: isAbortError(e) ? `Timeout BPJS (${timeoutMs}ms) → ${url}` : `Network error → ${(e as Error).message}`,
        retryable: true,
      };
      attempt++;
      if (attempt <= maxRetries) {
        await backoff(attempt);
        continue;
      }
      return Err(lastNetErr);
    } finally {
      clearTimeout(timer);
    }

    // Sukses jaringan → parse + decode (TIDAK di-retry; decode throw propagate).
    return finalize<T>(bodyText, opts.path, decode, cfg.consId, cfg.consSecret, timestamp);
  }

  return Err(lastNetErr);
}

/** Parse envelope JSON → cek code → decode response (bila perlu) → Result. */
function finalize<T>(
  bodyText: string,
  path: string,
  decode: boolean,
  consId: string,
  consSecret: string,
  timestamp: string,
): Result<BPJSEnvelope<T>, BPJSError> {
  let outer: { metaData?: { code?: string | number; message?: string }; response?: unknown };
  try {
    outer = JSON.parse(bodyText);
  } catch {
    // Response bukan JSON (mis. HTML gateway error) → perlakukan server error.
    return Err(makeBPJSMetaError("500", path, "Response BPJS bukan JSON"));
  }

  const code = String(outer.metaData?.code ?? "ERR");
  const message = outer.metaData?.message ?? "";

  if (code !== "200") {
    const bpjsCode = isBPJSCode(code) ? code : "500";
    return Err(makeBPJSMetaError(bpjsCode, path, message || undefined));
  }

  let response: T | undefined;
  if (decode && typeof outer.response === "string" && outer.response.length > 0) {
    response = decodeBpjsResponse<T>(outer.response, consId, consSecret, timestamp); // throw BpjsDecodeError
  } else {
    response = outer.response as T | undefined;
  }

  return Ok({ metaData: { code, message }, response });
}
