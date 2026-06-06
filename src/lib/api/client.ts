// API client (browser) — satu pintu fetch ke backend EHIS. Envelope-aware:
// sukses → kembalikan data; gagal → lempar ApiError (code+message dari server).
//
// Keamanan (FLOWS §8):
//  • Same-origin relatif ("/api/v1") → tak ada CORS, base URL tak terekspos, cookie HttpOnly
//    ikut otomatis (credentials: "same-origin"). TIDAK pernah kirim kredensial lintas-origin.
//  • Mutation kirim Idempotency-Key (UUID) → cegah dobel-submit saat retry/klik ganda.
//  • Tak ada secret di klien. Pesan error = pesan aman dari server (sudah disanitasi backend).
//  • Mendukung AbortSignal → batalkan in-flight saat unmount (anti memory leak / set-state-after-unmount).

const BASE = "/api/v1";

export interface ApiErrorDetail {
  path?: string;
  message: string;
}

/** Error terstruktur dari envelope `{ ok:false, error }`. */
export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;
  constructor(code: string, message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
  /** Daftar pesan field (dari Zod) bila ada — untuk binding error form. */
  fieldErrors(): ApiErrorDetail[] {
    return Array.isArray(this.details) ? (this.details as ApiErrorDetail[]) : [];
  }
}

type Query = Record<string, string | number | boolean | undefined | null>;

interface RequestOptions {
  query?: Query;
  body?: unknown;
  signal?: AbortSignal;
  /** Override Idempotency-Key (default: UUID baru per mutation). */
  idempotencyKey?: string;
}

const MUTATIONS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

// Endpoint auth yang TIDAK boleh memicu auto-refresh (mencegah loop: login/refresh/logout).
// `/auth/me` & endpoint data lain TETAP dapat refresh-retry saat access JWT kedaluwarsa.
const NO_REFRESH = new Set(["/auth/login", "/auth/refresh", "/auth/logout"]);

// Single-flight refresh — banyak request 401 berbarengan hanya memicu SATU panggilan refresh.
let refreshInFlight: Promise<boolean> | null = null;
function ensureRefresh(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = fetch(`${BASE}/auth/refresh`, {
      method: "POST",
      headers: { Accept: "application/json" },
      credentials: "same-origin",
      cache: "no-store",
    })
      .then((r) => r.ok)
      .catch(() => false)
      .finally(() => { refreshInFlight = null; });
  }
  return refreshInFlight;
}

function buildUrl(path: string, query?: Query): string {
  if (!query) return BASE + path;
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  }
  const qs = sp.toString();
  return qs ? `${BASE}${path}?${qs}` : BASE + path;
}

function newIdempotencyKey(): string {
  // crypto.randomUUID tersedia di browser modern + Node 19+.
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export interface ApiResult<T> {
  data: T;
  message?: string;
  meta?: unknown;
  status: number;
}

async function request<T>(
  method: string,
  path: string,
  opts: RequestOptions = {},
  isRetry = false,
): Promise<ApiResult<T>> {
  const headers: Record<string, string> = { Accept: "application/json" };
  let body: string | undefined;

  if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.body);
  }
  if (MUTATIONS.has(method)) {
    headers["Idempotency-Key"] = opts.idempotencyKey ?? newIdempotencyKey();
  }

  let res: Response;
  try {
    res = await fetch(buildUrl(path, opts.query), {
      method,
      headers,
      body,
      signal: opts.signal,
      credentials: "same-origin",
      cache: "no-store",
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw e;
    throw new ApiError("NETWORK", "Tidak dapat terhubung ke server", 0);
  }

  // Access JWT kedaluwarsa → coba rotasi refresh sekali, lalu ulangi request asli.
  if (res.status === 401 && !isRetry && !NO_REFRESH.has(path)) {
    if (await ensureRefresh()) return request<T>(method, path, opts, true);
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    throw new ApiError("INTERNAL", "Respons server tidak valid", res.status);
  }

  if (json && typeof json === "object" && "ok" in json) {
    const env = json as
      | { ok: true; data: T; message?: string; meta?: unknown }
      | { ok: false; error: { code: string; message: string; details?: unknown } };
    if (env.ok) return { data: env.data, message: env.message, meta: env.meta, status: res.status };
    throw new ApiError(env.error.code, env.error.message, res.status, env.error.details);
  }
  throw new ApiError("INTERNAL", "Format respons tidak dikenal", res.status);
}

export const api = {
  get: <T>(path: string, opts?: Omit<RequestOptions, "body">) => request<T>("GET", path, opts),
  post: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, "body">) =>
    request<T>("POST", path, { ...opts, body }),
  patch: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, "body">) =>
    request<T>("PATCH", path, { ...opts, body }),
  del: <T>(path: string, opts?: Omit<RequestOptions, "body">) => request<T>("DELETE", path, opts),
};
