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
  /** Kunjungan pemilik — hanya resource klinis per kunjungan. Tidak ditimpa NULL saat update. */
  kunjunganId?: string | null;
}

export function findByLocal(env: string, localType: string, localId: string, tx?: Tx) {
  return db(tx).resourceMap.findUnique({
    where: { env_localType_localId: { env, localType, localId } },
  });
}

/** Data lokal pemilik 1 IHS id (index `env, resource_type, ihs_id`). Bisa >1 bila data ganda → ambil terbaru. */
export function findByIhs(env: string, resourceType: string, ihsId: string, tx?: Tx) {
  return db(tx).resourceMap.findFirst({
    where: { env, resourceType, ihsId },
    orderBy: { lastSyncAt: "desc" },
    select: { localType: true, localId: true, lastSyncAt: true },
  });
}

/** Data lokal LAIN (≠ `excludeLocalId`) yang memakai IHS id ini — cek pemakaian bersama saat petakan manual. */
export function findOtherByIhs(env: string, resourceType: string, ihsId: string, excludeLocalId: string, tx?: Tx) {
  return db(tx).resourceMap.findFirst({
    where: { env, resourceType, ihsId, localId: { not: excludeLocalId } },
    orderBy: { lastSyncAt: "desc" },
    select: { localType: true, localId: true },
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
      ...(data.kunjunganId ? { kunjunganId: data.kunjunganId } : {}),
    },
  });
}

/** Lengkapi tautan kunjungan pada peta lama (dibuat sebelum kolom ada) tanpa menyentuh lastSyncAt. */
export function attachKunjungan(id: string, kunjunganId: string, tx?: Tx) {
  return db(tx).resourceMap.updateMany({ where: { id, kunjunganId: null }, data: { kunjunganId } });
}

export function findById(id: string, tx?: Tx) {
  return db(tx).resourceMap.findUnique({ where: { id } });
}

export function listByKunjungan(env: string, kunjunganId: string, tx?: Tx) {
  return db(tx).resourceMap.findMany({ where: { env, kunjunganId }, orderBy: { lastSyncAt: "asc" } });
}

/** Ringkasan per resourceType (env aktif): jumlah + sinkron terakhir — kartu konsol Resource. */
export async function summaryByResourceType(env: string, tx?: Tx) {
  const rows = await db(tx).resourceMap.groupBy({
    by: ["resourceType"],
    where: { env },
    _count: { _all: true },
    _max: { lastSyncAt: true },
  });
  return rows.map((r) => ({ resourceType: r.resourceType, count: r._count._all, lastSyncAt: r._max.lastSyncAt }));
}

/** Halaman peta per resourceType, terbaru dulu. `q` = cari IHS id / local id (prefix). */
export async function listPage(
  env: string,
  q: { resourceType: string; q?: string; page: number; pageSize: number },
  tx?: Tx,
) {
  const where = {
    env,
    resourceType: q.resourceType,
    ...(q.q ? { OR: [{ ihsId: { startsWith: q.q } }, { localId: { startsWith: q.q } }] } : {}),
  };
  const [total, rows] = await Promise.all([
    db(tx).resourceMap.count({ where }),
    db(tx).resourceMap.findMany({
      where,
      orderBy: { lastSyncAt: "desc" },
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
    }),
  ]);
  return { total, rows };
}

/** Jumlah peta per localType untuk env aktif (panel status). */
export async function countByType(env: string, tx?: Tx): Promise<Record<string, number>> {
  const rows = await db(tx).resourceMap.groupBy({ by: ["localType"], where: { env }, _count: { _all: true } });
  return Object.fromEntries(rows.map((r) => [r.localType, r._count._all]));
}
