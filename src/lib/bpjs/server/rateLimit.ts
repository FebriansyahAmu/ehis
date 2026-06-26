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

/** Reset (test). */
export function resetRateLimit(): void {
  buckets.clear();
}
