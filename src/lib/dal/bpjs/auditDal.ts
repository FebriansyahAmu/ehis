// auditDal — Prisma murni `bpjs.BpjsAuditLog` (BWS0.5). Tanpa aturan bisnis. Terima `tx?`.
// Insert append-only (audit). PII sudah di-hash di Service (auditedCall) sebelum sampai sini.

import { db, type Tx } from "@/lib/db/prisma";

export interface AuditInsert {
  startedAt: Date;
  mode: string;
  service: string;
  endpoint: string;
  method: string;
  requestHash?: string | null;
  responseHash?: string | null;
  noKartuHash?: string | null;
  nikHash?: string | null;
  responseCode: string;
  success: boolean;
  durationMs: number;
  errorType?: string | null;
  retryCount?: number;
  actor: string;
  actorRole: string;
  consId: string;
  idempotencyKey?: string | null;
}

export async function insertAudit(data: AuditInsert, tx?: Tx): Promise<void> {
  await db(tx).bpjsAuditLog.create({
    data: { ...data, retryCount: data.retryCount ?? 0 },
  });
}

/** Audit SUKSES terakhir untuk idempotencyKey dalam window (default 24 jam). Untuk dedupe write (R8). */
export async function findRecentSuccessByIdempotencyKey(
  key: string,
  withinMs = 24 * 60 * 60 * 1000,
  tx?: Tx,
) {
  const since = new Date(Date.now() - withinMs);
  return db(tx).bpjsAuditLog.findFirst({
    where: { idempotencyKey: key, success: true, startedAt: { gte: since } },
    orderBy: { startedAt: "desc" },
    select: { id: true, startedAt: true, responseCode: true, endpoint: true },
  });
}
