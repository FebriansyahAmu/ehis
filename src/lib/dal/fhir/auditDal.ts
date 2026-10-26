// auditDal — Prisma murni `fhir.FhirAuditLog` (FH0). Tanpa aturan bisnis. Terima `tx?`.
// Insert append-only. PII sudah di-hash di Service (auditedFhirCall) sebelum sampai sini.

import { db, type Tx } from "@/lib/db/prisma";

export interface FhirAuditInsert {
  startedAt: Date;
  mode: string;
  target: string;
  endpoint: string;
  method: string;
  resourceType?: string | null;
  ihsId?: string | null;
  requestHash?: string | null;
  responseStatus: string;
  success: boolean;
  durationMs: number;
  errorType?: string | null;
  retryCount?: number;
  nikHash?: string | null;
  actor: string;
  actorRole: string;
  idempotencyKey?: string | null;
}

export async function insertAudit(data: FhirAuditInsert, tx?: Tx): Promise<void> {
  await db(tx).fhirAuditLog.create({
    data: { ...data, retryCount: data.retryCount ?? 0 },
  });
}

/** Ringkas N panggilan terakhir (panel status) — tanpa kolom hash. */
export function listRecent(limit = 20, tx?: Tx) {
  return db(tx).fhirAuditLog.findMany({
    orderBy: { startedAt: "desc" },
    take: limit,
    select: {
      id: true, startedAt: true, mode: true, target: true, endpoint: true, method: true,
      resourceType: true, responseStatus: true, success: true, durationMs: true, errorType: true, actor: true,
    },
  });
}
