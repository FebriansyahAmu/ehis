// resourceMapDal — Prisma murni `fhir.ResourceMap` (FH0). Peta lokal ↔ IHS id (R8/R15).
// Tanpa aturan bisnis. Terima `tx?`. Key unik = (localType, localId).

import { db, type Tx } from "@/lib/db/prisma";

export interface ResourceMapUpsert {
  localType: string;
  localId: string;
  resourceType: string;
  ihsId: string;
  versionId?: string | null;
  hash?: string | null;
}

export function findByLocal(localType: string, localId: string, tx?: Tx) {
  return db(tx).resourceMap.findUnique({
    where: { localType_localId: { localType, localId } },
  });
}

export function findManyByLocal(localType: string, localIds: string[], tx?: Tx) {
  return db(tx).resourceMap.findMany({ where: { localType, localId: { in: localIds } } });
}

/** Upsert by (localType, localId) — simpan/refresh IHS id + versi + hash payload. */
export function upsert(data: ResourceMapUpsert, tx?: Tx) {
  const now = new Date();
  return db(tx).resourceMap.upsert({
    where: { localType_localId: { localType: data.localType, localId: data.localId } },
    create: { ...data, lastSyncAt: now },
    update: {
      resourceType: data.resourceType,
      ihsId: data.ihsId,
      versionId: data.versionId ?? null,
      hash: data.hash ?? null,
      lastSyncAt: now,
    },
  });
}

/** Jumlah peta per localType (panel status). */
export async function countByType(tx?: Tx): Promise<Record<string, number>> {
  const rows = await db(tx).resourceMap.groupBy({ by: ["localType"], _count: { _all: true } });
  return Object.fromEntries(rows.map((r) => [r.localType, r._count._all]));
}
