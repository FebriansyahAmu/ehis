import "server-only";

/**
 * BWS0.5 — Rate-limit per cons-id (R11). BPJS membatasi kuota harian per consumer.
 *
 * ⚠️ Implementasi awal = **in-memory per-proses** (Map). Untuk multi-instance WAJIB
 * di-swap ke counter Redis (atomik lintas proses) — seam: ganti isi consume/check,
 * signature tetap. Reset harian (key = tanggal UTC).
 */

interface Bucket {
  day: string;
  count: number;
}

const buckets = new Map<string, Bucket>();

/** Kuota harian default per cons-id — placeholder; sesuaikan kontrak BPJS RS. */
export const DEFAULT_DAILY_LIMIT = 50_000;

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  limit: number;
}

/** Cek tanpa konsumsi (read-only). */
export function checkRateLimit(consId: string, limit = DEFAULT_DAILY_LIMIT): RateLimitResult {
  const day = todayUtc();
  const b = buckets.get(consId);
  const count = b && b.day === day ? b.count : 0;
  return { ok: count < limit, remaining: Math.max(0, limit - count), limit };
}

/** Konsumsi 1 kuota (panggil tepat sebelum request nyata). `ok=false` → jangan kirim. */
export function consumeRateLimit(consId: string, limit = DEFAULT_DAILY_LIMIT): RateLimitResult {
  const day = todayUtc();
  let b = buckets.get(consId);
  if (!b || b.day !== day) {
    b = { day, count: 0 };
    buckets.set(consId, b);
  }
  if (b.count >= limit) return { ok: false, remaining: 0, limit };
  b.count += 1;
  return { ok: true, remaining: limit - b.count, limit };
}

// ── Jendela per kunci (mis. per pengguna) ───────────────

interface Jendela {
  mulai: number;
  count: number;
}

const jendela = new Map<string, Jendela>();

export interface JendelaResult {
  ok: boolean;
  /** Detik sampai jendela berikutnya (0 bila ok). */
  retryAfterSec: number;
}

/**
 * Batas `limit` panggilan per `windowMs` per `key` (jendela tetap). Dipakai untuk pencarian data
 * pribadi per pengguna (cek kepesertaan) — mencegah panen data massal (OWASP API4/API6).
 * ⚠️ in-memory per-proses, sama seperti kuota harian di atas → Redis saat multi-instance.
 */
export function consumeWindow(key: string, limit: number, windowMs: number, now = Date.now()): JendelaResult {
  let j = jendela.get(key);
  if (!j || now - j.mulai >= windowMs) {
    j = { mulai: now, count: 0 };
    jendela.set(key, j);
  }
  if (j.count >= limit) return { ok: false, retryAfterSec: Math.max(1, Math.ceil((j.mulai + windowMs - now) / 1000)) };
  j.count += 1;
  return { ok: true, retryAfterSec: 0 };
}

/** Reset (test). */
export function resetRateLimit(): void {
  buckets.clear();
  jendela.clear();
}
