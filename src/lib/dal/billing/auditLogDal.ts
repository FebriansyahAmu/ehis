// auditLogDal — Prisma murni billing.AuditLog (jejak immutable). Tanpa aturan bisnis. Terima `tx?`.
// Ditulis dalam tx aksi (append-only, tak pernah update/delete). Dibaca per kunjungan (detail).

import { db, type Tx } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";

export interface AuditLogData {
  invoiceId: string;
  kunjunganId: string;
  action: string;
  actorNama: string;
  actorRole: string | null;
  actorUserId: string | null;
  summary: string;
  amount?: number | null;
  reason?: string | null;
  noKwitansi?: string | null;
  meta?: Prisma.InputJsonValue;
}

export function create(data: AuditLogData, tx?: Tx) {
  return db(tx).auditLog.create({
    data: {
      invoiceId: data.invoiceId,
      kunjunganId: data.kunjunganId,
      action: data.action,
      actorNama: data.actorNama,
      actorRole: data.actorRole,
      actorUserId: data.actorUserId,
      summary: data.summary,
      amount: data.amount ?? null,
      reason: data.reason ?? null,
      noKwitansi: data.noKwitansi ?? null,
      meta: data.meta,
    },
  });
}

/** Riwayat audit 1 kunjungan (terbaru dulu). */
export function listByKunjungan(kunjunganId: string, tx?: Tx) {
  return db(tx).auditLog.findMany({
    where: { kunjunganId },
    orderBy: { createdAt: "desc" },
  });
}

export type AuditLogEntity = Awaited<ReturnType<typeof listByKunjungan>>[number];
