// FH3 — Operasi konsol outbox SatuSehat: daftar job, jalankan tick manual, antre ulang job gagal,
// dan sinkron manual Encounter 1 kunjungan (backfill kunjungan lama / setelah onboarding).

import "server-only";
import { Errors } from "@/lib/errors/appError";
import * as syncLogDal from "@/lib/dal/fhir/syncLogDal";
import * as encounterSrc from "@/lib/dal/fhir/encounterSourceDal";
import { enqueueEncounterSync } from "./outboxEnqueue";
import { processDue } from "./outboxWorker";
import type { OutboxItemDTO, OutboxRunDTO } from "@/lib/schemas/fhir/outbox";
import type { SyncStatus } from "@/generated/prisma/enums";

export async function list(q: { status?: SyncStatus; kunjunganId?: string; limit: number }): Promise<OutboxItemDTO[]> {
  const rows = await syncLogDal.listForConsole({ status: q.status, kunjunganId: q.kunjunganId }, q.limit);
  return rows.map((r) => ({
    ...r,
    nextAttemptAt: r.nextAttemptAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
}

export function run(limit: number): Promise<OutboxRunDTO> {
  return processDue(limit);
}

export async function retry(id: string): Promise<{ id: string }> {
  const row = await syncLogDal.getById(id);
  if (!row) throw Errors.notFound("Job outbox tidak ditemukan");
  if (!(await syncLogDal.requeue(id))) throw Errors.forbiddenState(`Job berstatus ${row.status} tidak dapat diantre ulang`);
  return { id };
}

export async function enqueueManual(kunjunganId: string): Promise<{ kunjunganId: string }> {
  const k = await encounterSrc.getKunjungan(kunjunganId);
  if (!k) throw Errors.notFound("Kunjungan tidak ditemukan");
  await enqueueEncounterSync(kunjunganId, "manual");
  return { kunjunganId };
}
