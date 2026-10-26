// syncLogDal — Prisma murni `fhir.SyncLog` (outbox, R4). Tanpa aturan bisnis. Terima `tx?`.
// enqueue ditulis DALAM tx aksi klinis (Pending); klaim/hasil ditulis worker di tx terpisah.

import { db, type Tx } from "@/lib/db/prisma";
import { Prisma } from "@/generated/prisma/client";
import type { SyncStatus } from "@/generated/prisma/enums";

export interface SyncLogEnqueue {
  trigger: string;
  kunjunganId?: string | null;
  bundleType: "transaction" | "single";
  payload: Prisma.InputJsonValue;
}

export function enqueue(data: SyncLogEnqueue, tx?: Tx) {
  return db(tx).syncLog.create({
    data: { ...data, kunjunganId: data.kunjunganId ?? null, status: "Pending" },
  });
}

/** Kandidat siap kirim: Pending/Failed-retryable yang jadwalnya sudah lewat, terlama dulu. */
export function listDue(limit: number, now = new Date(), tx?: Tx) {
  return db(tx).syncLog.findMany({
    where: {
      status: "Pending",
      OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }],
    },
    orderBy: { createdAt: "asc" },
    take: limit,
  });
}

/**
 * Klaim atomik Pending → Sending (guard status) — cegah 2 worker mengirim baris yang sama.
 * Return `true` bila klaim berhasil.
 */
export async function claim(id: string, tx?: Tx): Promise<boolean> {
  const r = await db(tx).syncLog.updateMany({
    where: { id, status: "Pending" },
    data: { status: "Sending", attempts: { increment: 1 } },
  });
  return r.count === 1;
}

export function markAcked(id: string, ihsRefs: Prisma.InputJsonValue, tx?: Tx) {
  return db(tx).syncLog.update({
    where: { id },
    data: { status: "Acked", ihsRefs, lastError: Prisma.DbNull, nextAttemptAt: null },
  });
}

/**
 * Catat kegagalan. `retryAt` diisi → kembali Pending terjadwal (retryable);
 * null → Failed final (perlu perbaikan payload / aksi manual).
 */
export function markFailed(id: string, lastError: Prisma.InputJsonValue, retryAt: Date | null, tx?: Tx) {
  return db(tx).syncLog.update({
    where: { id },
    data: retryAt
      ? { status: "Pending", lastError, nextAttemptAt: retryAt }
      : { status: "Failed", lastError, nextAttemptAt: null },
  });
}

/** Jumlah per status (panel status). */
export async function countByStatus(tx?: Tx): Promise<Record<SyncStatus, number>> {
  const rows = await db(tx).syncLog.groupBy({ by: ["status"], _count: { _all: true } });
  const out: Record<SyncStatus, number> = { Pending: 0, Sending: 0, Acked: 0, Failed: 0, Skipped: 0 };
  for (const r of rows) out[r.status] = r._count._all;
  return out;
}
