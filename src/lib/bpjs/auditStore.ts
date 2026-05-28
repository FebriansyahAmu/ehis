/**
 * BPJS Audit Store (BP0.4).
 *
 * Client-side log per call adapter BPJS — `useSyncExternalStore` ready
 * untuk subscribe dari React component (Beranda recent calls panel,
 * AuditTrailPage filter view).
 *
 * Phase 1: in-memory ring buffer 200 entries terakhir.
 * Phase backend: persist ke DB table dengan retention 5 tahun (UU PDP 27/2022).
 *
 * Audit-first development — semua adapter method wajib `logAuditEntry()`
 * sebelum return Result (via `wrapWithAudit` HOF di [vClaimShared.ts]).
 */

import type { BPJSAuditEntry } from "./bpjsShared";

const MAX_ENTRIES = 200;

type AuditListener = () => void;

let entries: ReadonlyArray<BPJSAuditEntry> = [];
const listeners: Set<AuditListener> = new Set();

/** Append entry baru — ring buffer, oldest dipotong. */
export function logAuditEntry(entry: BPJSAuditEntry): void {
  entries = [entry, ...entries].slice(0, MAX_ENTRIES);
  listeners.forEach((l) => l());
}

/** Snapshot semua entry (immutable). */
export function getAuditEntries(): ReadonlyArray<BPJSAuditEntry> {
  return entries;
}

/** Filter by endpoint / method / status untuk AuditTrailPage. */
export function filterAuditEntries(filter: {
  endpoint?: string;
  method?: BPJSAuditEntry["method"];
  successOnly?: boolean;
  actor?: string;
  periode?: { from: string; to: string };
}): BPJSAuditEntry[] {
  return entries.filter((e) => {
    if (filter.endpoint && !e.endpoint.includes(filter.endpoint)) return false;
    if (filter.method && e.method !== filter.method) return false;
    if (filter.successOnly && !e.success) return false;
    if (filter.actor && !e.actor.includes(filter.actor)) return false;
    if (filter.periode) {
      const ts = e.timestamp.slice(0, 10);
      if (ts < filter.periode.from || ts > filter.periode.to) return false;
    }
    return true;
  });
}

/** Subscribe — pattern useSyncExternalStore. */
export function subscribeAudit(listener: AuditListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Test only — reset state. */
export function _resetAuditStoreForTest(): void {
  entries = [];
  listeners.forEach((l) => l());
}

/** Snapshot KPI summary (KPI strip Beranda BPJS). */
export function summarizeAudit24h(): {
  total: number;
  success: number;
  failed: number;
  topFailedEndpoint?: string;
} {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  const recent = entries.filter((e) => new Date(e.timestamp).getTime() >= cutoff);
  const failed = recent.filter((e) => !e.success);
  const failureCounts: Record<string, number> = {};
  failed.forEach((e) => {
    failureCounts[e.endpoint] = (failureCounts[e.endpoint] ?? 0) + 1;
  });
  const topFailedEndpoint = Object.entries(failureCounts).sort(
    (a, b) => b[1] - a[1],
  )[0]?.[0];

  return {
    total: recent.length,
    success: recent.length - failed.length,
    failed: failed.length,
    topFailedEndpoint,
  };
}
