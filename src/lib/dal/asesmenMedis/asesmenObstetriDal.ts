// asesmenObstetriDal — Prisma MURNI medicalrecord.AsesmenObstetri (+persalinan item).

import { db, type Tx } from "@/lib/db/prisma";

export interface CreatePersalinanItemData {
  tahun?: string | null;
  usiaKehamilan?: string | null;
  jenis?: string | null;
  bbLahir?: string | null;
  kondisiAnak?: string | null;
  keterangan?: string | null;
  urutan: number;
}

export interface CreateAsesmenObstetriData {
  kunjunganId: string;
  metodeKb?: string | null;
  kbSejak?: string | null;
  kbKeterangan?: string | null;
  gravida?: string | null;
  para?: string | null;
  abortus?: string | null;
  ancKunjungan?: string | null;
  ancUsiaKehamilan?: string | null;
  ancTempat?: string | null;
  ancPetugas?: string | null;
  ancCatatan?: string | null;
  pemeriksa: string;
  authorUserId?: string | null;
  authorPegawaiId?: string | null;
  persalinan: CreatePersalinanItemData[];
}

const withItems = { persalinanItems: { orderBy: { urutan: "asc" as const } } };

export type AsesmenObstetriEntity = Awaited<ReturnType<typeof latestByKunjungan>>;

export function create(data: CreateAsesmenObstetriData, tx?: Tx) {
  const { persalinan, ...rest } = data;
  return db(tx).asesmenObstetri.create({
    data: { ...rest, persalinanItems: { create: persalinan } },
    include: withItems,
  });
}

export function latestByKunjungan(kunjunganId: string, tx?: Tx) {
  return db(tx).asesmenObstetri.findFirst({
    where: { kunjunganId },
    orderBy: { createdAt: "desc" },
    include: withItems,
  });
}
