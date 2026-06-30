// asesmenPerawatanDal — Prisma MURNI medicalrecord.AsesmenPerawatan (+rawat & pembedahan item).

import { db, type Tx } from "@/lib/db/prisma";

export interface CreateRawatItemData {
  rs?: string | null;
  unit?: string | null;
  tanggal?: string | null;
  diagnosa?: string | null;
  keterangan?: string | null;
  urutan: number;
}

export interface CreateBedahItemData {
  tanggal?: string | null;
  tindakan?: string | null;
  rs?: string | null;
  dokter?: string | null;
  keterangan?: string | null;
  urutan: number;
}

export interface CreateAsesmenPerawatanData {
  kunjunganId: string;
  pemeriksa: string;
  authorUserId?: string | null;
  authorPegawaiId?: string | null;
  rawat: CreateRawatItemData[];
  bedah: CreateBedahItemData[];
}

const withItems = {
  rawatItems: { orderBy: { urutan: "asc" as const } },
  pembedahanItems: { orderBy: { urutan: "asc" as const } },
};

export type AsesmenPerawatanEntity = Awaited<ReturnType<typeof latestByKunjungan>>;

export function create(data: CreateAsesmenPerawatanData, tx?: Tx) {
  const { rawat, bedah, ...rest } = data;
  return db(tx).asesmenPerawatan.create({
    data: { ...rest, rawatItems: { create: rawat }, pembedahanItems: { create: bedah } },
    include: withItems,
  });
}

export function latestByKunjungan(kunjunganId: string, tx?: Tx) {
  return db(tx).asesmenPerawatan.findFirst({
    where: { kunjunganId },
    orderBy: { createdAt: "desc" },
    include: withItems,
  });
}

export function listLatestByKunjunganIds(kunjunganIds: string[], tx?: Tx) {
  if (kunjunganIds.length === 0) return Promise.resolve([]);
  return db(tx).asesmenPerawatan.findMany({
    where: { kunjunganId: { in: kunjunganIds } },
    orderBy: [{ kunjunganId: "asc" }, { createdAt: "desc" }],
    distinct: ["kunjunganId"],
    include: withItems,
  });
}
