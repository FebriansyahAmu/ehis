/**
 * Soft Lock — multi-coder concurrency guard.
 *
 * Saat 2 coder mau edit klaim yang sama, coder kedua harus dapat banner
 * "Sedang di-edit oleh Anita (sisa 12 menit)". Soft-lock = advisory (UI guard),
 * BUKAN database lock. Hard write protection via `optimisticLock.version`
 * (lihat `stateMachine.ts`).
 *
 * TTL default 15 menit (sesuai TODO-EKLAIM § EK0.3 spec). Auto-expire saat
 * waktu lewat — caller `isLockedByOther` membandingkan dengan `now`.
 *
 * Implementasi: in-memory `Map<claimId, SoftLock>` — sesuai mock-first stage.
 * Saat backend ready, swap dengan Redis SETNX + TTL (zero refactor caller).
 *
 * Referensi: TODO-EKLAIM.md § EK0.3 · architectural decision AD-15 (concurrency).
 */

import { Err, Ok, type Result, type SoftLock } from "./eklaimShared";

// ── In-Memory Registry ─────────────────────────────────

/**
 * Module-scoped registry. Pakai `Map` bukan plain object agar:
 * - Iteration order deterministik (untuk debug list active locks).
 * - Tidak collide dengan claimId yang kebetulan magic prop name.
 */
const REGISTRY = new Map<string, SoftLock>();

/** Default TTL — sesuai spec EK0.3 (15 menit). */
const DEFAULT_TTL_MINUTES = 15;

// ── Acquire ────────────────────────────────────────────

export type AcquireError = "ALREADY_LOCKED";

export interface AcquireOptions {
  ttlMinutes?: number;
  /** Override clock untuk test determinisme. */
  now?: Date;
}

/**
 * Coba acquire lock untuk `claimId` oleh `userId`.
 *
 * - Return `Ok(SoftLock)` kalau slot kosong / lock sebelumnya expired / sudah
 *   dimiliki `userId` sendiri (re-acquire perpanjang TTL).
 * - Return `Err("ALREADY_LOCKED")` kalau user lain masih hold lock yang belum expired.
 */
export function acquireSoftLock(
  claimId: string,
  userId: string,
  opts: AcquireOptions = {},
): Result<SoftLock, AcquireError> {
  const ttl = opts.ttlMinutes ?? DEFAULT_TTL_MINUTES;
  const now = opts.now ?? new Date();
  const existing = REGISTRY.get(claimId);

  if (existing && !isExpired(existing, now) && existing.lockedBy !== userId) {
    return Err("ALREADY_LOCKED");
  }

  const lock: SoftLock = {
    lockedBy: userId,
    lockedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + ttl * 60_000).toISOString(),
  };
  REGISTRY.set(claimId, lock);
  return Ok(lock);
}

// ── Release ────────────────────────────────────────────

/**
 * Release lock — hanya berhasil kalau `userId` adalah pemilik current.
 * No-op kalau lock sudah expired atau dimiliki user lain (idempotent untuk caller).
 */
export function releaseSoftLock(claimId: string, userId: string): boolean {
  const existing = REGISTRY.get(claimId);
  if (!existing) return false;
  if (existing.lockedBy !== userId) return false;
  REGISTRY.delete(claimId);
  return true;
}

// ── Predicates ─────────────────────────────────────────

/** TRUE kalau lock sudah lewat `expiresAt`. */
function isExpired(lock: SoftLock, now: Date): boolean {
  return new Date(lock.expiresAt).getTime() <= now.getTime();
}

/**
 * UI banner predicate — TRUE jika klaim sedang di-lock user LAIN (bukan currentUser)
 * dan belum expired. Caller pakai untuk show banner "Sedang di-edit oleh X".
 */
export function isLockedByOther(claimId: string, currentUserId: string, now: Date = new Date()): boolean {
  const lock = REGISTRY.get(claimId);
  if (!lock) return false;
  if (isExpired(lock, now)) return false;
  return lock.lockedBy !== currentUserId;
}

/** Return current lock holder + sisa menit, atau undefined kalau no active lock. */
export interface LockInfo {
  lockedBy: string;
  remainingMinutes: number;
  expiresAt: string;
}

export function getLockInfo(claimId: string, now: Date = new Date()): LockInfo | undefined {
  const lock = REGISTRY.get(claimId);
  if (!lock || isExpired(lock, now)) return undefined;
  const remainingMs = new Date(lock.expiresAt).getTime() - now.getTime();
  return {
    lockedBy: lock.lockedBy,
    remainingMinutes: Math.ceil(remainingMs / 60_000),
    expiresAt: lock.expiresAt,
  };
}

// ── Maintenance ────────────────────────────────────────

/**
 * Purge semua lock yang sudah expired. Return jumlah yang di-purge.
 * Dipanggil oleh cron / saat module reload (mock-stage harmless).
 */
export function purgeExpiredLocks(now: Date = new Date()): number {
  let count = 0;
  for (const [claimId, lock] of REGISTRY.entries()) {
    if (isExpired(lock, now)) {
      REGISTRY.delete(claimId);
      count++;
    }
  }
  return count;
}

/** Test-only — reset registry. Jangan dipakai di production code. */
export function _resetSoftLockRegistry(): void {
  REGISTRY.clear();
}
