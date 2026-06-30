// asesmenObatDal — Prisma MURNI medicalrecord.AsesmenObat (+item). Append-only nested create.

import { db, type Tx } from "@/lib/db/prisma";

export interface CreateAsesmenObatItemData {
  nama: string;
  dosis?: string | null;
  frekuensi?: string | null;
  rute?: string | null;
  sejak?: string | null;
  indikasi?: string | null;
  urutan: number;
}

export interface CreateAsesmenObatData {
  kunjunganId: string;
  pemeriksa: string;
  authorUserId?: string | null;
  authorPegawaiId?: string | null;
  items: CreateAsesmenObatItemData[];
}

const withItems = { items: { orderBy: { urutan: "asc" as const } } };

export type AsesmenObatEntity = Awaited<ReturnType<typeof latestByKunjungan>>;

export function create(data: CreateAsesmenObatData, tx?: Tx) {
  const { items, ...rest } = data;
  return db(tx).asesmenObat.create({
    data: { ...rest, items: { create: items } },
    include: withItems,
  });
}

export function latestByKunjungan(kunjunganId: string, tx?: Tx) {
  return db(tx).asesmenObat.findFirst({
    where: { kunjunganId },
    orderBy: { createdAt: "desc" },
    include: withItems,
  });
}

export function listLatestByKunjunganIds(kunjunganIds: string[], tx?: Tx) {
  if (kunjunganIds.length === 0) return Promise.resolve([]);
  return db(tx).asesmenObat.findMany({
    where: { kunjunganId: { in: kunjunganIds } },
    orderBy: [{ kunjunganId: "asc" }, { createdAt: "desc" }],
    distinct: ["kunjunganId"],
    include: withItems,
  });
}
