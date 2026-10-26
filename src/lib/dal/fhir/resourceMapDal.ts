// resourceMapDal — Prisma murni `fhir.ResourceMap` (FH0/FH1). Peta lokal ↔ IHS id (R8/R15).
// Tanpa aturan bisnis. Terima `tx?`. Key unik = (env, localType, localId) — IHS id beda per env.

import { db, type Tx } from "@/lib/db/prisma";

export interface ResourceMapUpsert {
  env: string;
  localType: string;
  localId: string;
  resourceType: string;
  ihsId: string;
  versionId?: string | null;
  hash?: string | null;
}

export function findByLocal(env: string, localType: string, localId: string, tx?: Tx) {
  return db(tx).resourceMap.findUnique({
    where: { env_localType_localId: { env, localType, localId } },
  });
}

export function findManyByLocal(env: string, localType: string, localIds: string[], tx?: Tx) {
  return db(tx).resourceMap.findMany({ where: { env, localType, localId: { in: localIds } } });
}

export function listByType(env: string, localType: string, tx?: Tx) {
  return db(tx).resourceMap.findMany({ where: { env, localType } });
}

/** Upsert by (env, localType, localId) — simpan/refresh IHS id + versi + hash payload. */
export function upsert(data: ResourceMapUpsert, tx?: Tx) {
  const now = new Date();
  return db(tx).resourceMap.upsert({
    where: { env_localType_localId: { env: data.env, localType: data.localType, localId: data.localId } },
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

/** Jumlah peta per localType untuk env aktif (panel status). */
export async function countByType(env: string, tx?: Tx): Promise<Record<string, number>> {
  const rows = await db(tx).resourceMap.groupBy({ by: ["localType"], where: { env }, _count: { _all: true } });
  return Object.fromEntries(rows.map((r) => [r.localType, r._count._all]));
}
