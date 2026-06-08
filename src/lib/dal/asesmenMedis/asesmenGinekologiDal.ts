// asesmenGinekologiDal — akses Prisma MURNI medicalrecord.AsesmenGinekologi. Append-only.

import { db, type Tx } from "@/lib/db/prisma";

export interface CreateAsesmenGinekologiData {
  kunjunganId: string;
  statusMenstruasi?: string | null;
  hpht?: string | null;
  siklus?: string | null;
  lamaMenstruasi?: string | null;
  dismenorea?: boolean | null;
  menoragia?: boolean | null;
  keputihan?: boolean | null;
  papSmear?: boolean | null;
  papTahun?: string | null;
  papHasil?: string | null;
  iva?: boolean | null;
  ivaTahun?: string | null;
  ivaHasil?: string | null;
  catatan?: string | null;
  pemeriksa: string;
  authorUserId?: string | null;
  authorPegawaiId?: string | null;
}

export type AsesmenGinekologiEntity = Awaited<ReturnType<typeof latestByKunjungan>>;

export function create(data: CreateAsesmenGinekologiData, tx?: Tx) {
  return db(tx).asesmenGinekologi.create({ data });
}

export function latestByKunjungan(kunjunganId: string, tx?: Tx) {
  return db(tx).asesmenGinekologi.findFirst({
    where: { kunjunganId },
    orderBy: { createdAt: "desc" },
  });
}
