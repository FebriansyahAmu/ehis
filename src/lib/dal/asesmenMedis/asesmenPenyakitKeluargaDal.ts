// asesmenPenyakitKeluargaDal — Prisma MURNI medicalrecord.AsesmenPenyakitKeluarga (+item).

import { db, type Tx } from "@/lib/db/prisma";

export interface CreateKeluargaItemData {
  anggota: string;
  penyakit: string[];
  keterangan?: string | null;
  urutan: number;
}

export interface CreateAsesmenPenyakitKeluargaData {
  kunjunganId: string;
  riwayatLain?: string | null;
  pemeriksa: string;
  authorUserId?: string | null;
  authorPegawaiId?: string | null;
  items: CreateKeluargaItemData[];
}

const withItems = { items: { orderBy: { urutan: "asc" as const } } };

export type AsesmenPenyakitKeluargaEntity = Awaited<ReturnType<typeof latestByKunjungan>>;

export function create(data: CreateAsesmenPenyakitKeluargaData, tx?: Tx) {
  const { items, ...rest } = data;
  return db(tx).asesmenPenyakitKeluarga.create({
    data: { ...rest, items: { create: items } },
    include: withItems,
  });
}

export function latestByKunjungan(kunjunganId: string, tx?: Tx) {
  return db(tx).asesmenPenyakitKeluarga.findFirst({
    where: { kunjunganId },
    orderBy: { createdAt: "desc" },
    include: withItems,
  });
}

export function listLatestByKunjunganIds(kunjunganIds: string[], tx?: Tx) {
  if (kunjunganIds.length === 0) return Promise.resolve([]);
  return db(tx).asesmenPenyakitKeluarga.findMany({
    where: { kunjunganId: { in: kunjunganIds } },
    orderBy: [{ kunjunganId: "asc" }, { createdAt: "desc" }],
    distinct: ["kunjunganId"],
    include: withItems,
  });
}
