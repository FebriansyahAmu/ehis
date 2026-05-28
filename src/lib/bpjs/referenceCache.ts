/**
 * Reference Cache (BP0.4).
 *
 * Local cache TTL 24 jam untuk data referensi BPJS yang jarang berubah:
 * diagnosa · poli · dokter · faskes · spesialistik · pasca-pulang.
 *
 * Cache key strategy: `${kind}:${normalizedQuery}` — agar query variant
 * tetap konsisten (case-insensitive trim).
 *
 * Phase 1: in-memory dengan ISO timestamp (testability via `now()` injection).
 * Phase backend: scheduled job refresh (BullMQ cron) — UI cache jadi
 * thin client side.
 *
 * Reference: TODO-BPJS.md § BP0.4 + § Architecture Decisions #6.
 */

export type ReferenceKind =
  | "diagnosa"
  | "poli"
  | "dokter"
  | "faskes"
  | "spesialistik"
  | "pasca-pulang";

interface CacheEntry<T> {
  data: T;
  /** ISO timestamp when entry was cached. */
  cachedAt: string;
}

const TTL_MS = 24 * 60 * 60 * 1000;

const store = new Map<string, CacheEntry<unknown>>();

/** `now()` injection point untuk test deterministic. */
let nowFn: () => number = () => Date.now();

export function _setNowForTest(fn: () => number): void {
  nowFn = fn;
}

export function _resetNow(): void {
  nowFn = () => Date.now();
}

function makeKey(kind: ReferenceKind, query: string): string {
  return `${kind}:${query.trim().toLowerCase()}`;
}

function isFresh(entry: CacheEntry<unknown>): boolean {
  const ageMs = nowFn() - new Date(entry.cachedAt).getTime();
  return ageMs < TTL_MS;
}

/** Get cached data jika fresh, undefined jika expired/absent. */
export function getCached<T>(kind: ReferenceKind, query: string): T | undefined {
  const entry = store.get(makeKey(kind, query));
  if (!entry || !isFresh(entry)) return undefined;
  return entry.data as T;
}

/** Cache new data — overwrite existing entry. */
export function setCached<T>(kind: ReferenceKind, query: string, data: T): void {
  store.set(makeKey(kind, query), {
    data,
    cachedAt: new Date(nowFn()).toISOString(),
  });
}

/** Lazy-load pattern: return cached OR fetch + cache. */
export async function getOrFetch<T>(
  kind: ReferenceKind,
  query: string,
  fetcher: () => Promise<T>,
): Promise<T> {
  const cached = getCached<T>(kind, query);
  if (cached !== undefined) return cached;
  const fresh = await fetcher();
  setCached(kind, query, fresh);
  return fresh;
}

/** Force refresh — invalidate entry, next access akan fetch. */
export function invalidate(kind: ReferenceKind, query?: string): void {
  if (query !== undefined) {
    store.delete(makeKey(kind, query));
    return;
  }
  // Invalidate all entries of this kind
  for (const key of store.keys()) {
    if (key.startsWith(`${kind}:`)) store.delete(key);
  }
}

/** Full reset — Beranda "Refresh All References" CTA. */
export function invalidateAll(): void {
  store.clear();
}

/** Status snapshot per kind untuk Beranda BPJS reference status panel. */
export interface ReferenceCacheStatus {
  kind: ReferenceKind;
  entryCount: number;
  lastSyncISO?: string;
  ageMs?: number;
  staleness: "fresh" | "stale" | "expired";
}

export function getCacheStatus(kind: ReferenceKind): ReferenceCacheStatus {
  const entries = Array.from(store.entries())
    .filter(([k]) => k.startsWith(`${kind}:`))
    .map(([, v]) => v);

  if (entries.length === 0) {
    return { kind, entryCount: 0, staleness: "expired" };
  }

  const latest = entries.reduce((acc, e) =>
    new Date(e.cachedAt).getTime() > new Date(acc.cachedAt).getTime() ? e : acc,
  );
  const ageMs = nowFn() - new Date(latest.cachedAt).getTime();
  const staleness =
    ageMs < TTL_MS / 3
      ? "fresh"
      : ageMs < TTL_MS
        ? "stale"
        : "expired";

  return {
    kind,
    entryCount: entries.length,
    lastSyncISO: latest.cachedAt,
    ageMs,
    staleness,
  };
}

/** Status untuk semua kind. */
export function getAllCacheStatus(): ReferenceCacheStatus[] {
  const kinds: ReferenceKind[] = [
    "diagnosa",
    "poli",
    "dokter",
    "faskes",
    "spesialistik",
    "pasca-pulang",
  ];
  return kinds.map(getCacheStatus);
}
