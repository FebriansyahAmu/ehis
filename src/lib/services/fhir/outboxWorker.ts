// FH3 — Outbox worker SatuSehat (R4/R10). Satu "tick": pulihkan job macet → ambil job jatuh tempo →
// klaim atomik (Pending→Sending) → jalankan handler per `payload.kind` → Acked / Pending terjadwal
// (backoff) / Failed. Dipanggil oleh runner interval (src/instrumentation.ts, opsional) atau manual
// dari konsol (`POST /api/v1/fhir/outbox/run`).

import "server-only";
import * as syncLogDal from "@/lib/dal/fhir/syncLogDal";
import { syncEncounter, type JobResult } from "./encounterSyncService";
import { SYSTEM_AUDIT_ACTOR } from "./audit";

const MAX_ATTEMPTS = 8;
const STALE_SENDING_MS = 10 * 60_000;

export interface OutboxTickResult {
  diproses: number;
  acked: number;
  dijadwalUlang: number;
  failed: number;
  skipped: number;
  dipulihkan: number;
}

/** Backoff eksponensial: 30 dtk · 1 · 2 · 4 … menit, maks 1 jam. */
function retryAt(attempts: number): Date {
  const ms = Math.min(60 * 60_000, 30_000 * 2 ** Math.max(0, attempts - 1));
  return new Date(Date.now() + ms);
}

let ticking = false;

export async function processDue(limit = 10): Promise<OutboxTickResult> {
  const out: OutboxTickResult = { diproses: 0, acked: 0, dijadwalUlang: 0, failed: 0, skipped: 0, dipulihkan: 0 };
  if (ticking) return out; // tick sebelumnya belum selesai (runner + manual bersamaan)
  ticking = true;
  try {
    out.dipulihkan = await syncLogDal.releaseStale(new Date(Date.now() - STALE_SENDING_MS));
    const due = await syncLogDal.listDue(limit);

    for (const job of due) {
      if (!(await syncLogDal.claim(job.id))) continue; // diambil proses lain
      out.diproses++;
      const attempts = job.attempts + 1;

      let r: JobResult;
      try {
        r = await runJob(job.payload);
      } catch (e) {
        // Error tak terduga (mis. config invalid) → perlakukan retryable agar tak hilang.
        r = { kind: "failed", message: (e as Error).message || "Error tak terduga", retryable: true };
      }

      if (r.kind === "acked") {
        await syncLogDal.markAcked(job.id, r.refs);
        out.acked++;
      } else if (r.kind === "skipped") {
        await syncLogDal.markSkipped(job.id, { reason: r.reason });
        out.skipped++;
      } else {
        const lastError = {
          message: r.message,
          ...(r.error?.type ? { type: r.error.type } : {}),
          ...(r.error?.status ? { status: r.error.status } : {}),
          ...(r.error?.issues ? { issues: r.error.issues.slice(0, 5).map((i) => ({ code: i.code, diagnostics: i.diagnostics ?? null })) } : {}),
        };
        const again = r.retryable && attempts < MAX_ATTEMPTS;
        await syncLogDal.markFailed(job.id, lastError, again ? retryAt(attempts) : null);
        if (again) out.dijadwalUlang++;
        else out.failed++;
      }
    }
    return out;
  } finally {
    ticking = false;
  }
}

function runJob(payload: unknown): Promise<JobResult> {
  const p = (payload ?? {}) as { kind?: string; kunjunganId?: string };
  if (p.kind === "encounter" && p.kunjunganId) return syncEncounter(p.kunjunganId, SYSTEM_AUDIT_ACTOR);
  return Promise.resolve({ kind: "skipped", reason: `Jenis job tidak dikenal: ${p.kind ?? "-"}` });
}
