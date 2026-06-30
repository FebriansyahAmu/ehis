// asesmenTuberkulosisDal — akses Prisma MURNI medicalrecord.AsesmenTuberkulosis. Append-only.

import { db, type Tx } from "@/lib/db/prisma";

export interface CreateAsesmenTuberkulosisData {
  kunjunganId: string;
  riwayatTbc?: boolean | null;
  tahunPengobatan?: string | null;
  statusOat?: string | null;
  kontakTbc?: boolean | null;
  penunjang?: string | null;
  tcmDilakukan?: boolean | null;
  tcmHasil?: string | null;
  sputumDilakukan?: boolean | null;
  sputumHasil?: string | null;
  sputumGrade?: string | null;
  catatan?: string | null;
  pemeriksa: string;
  authorUserId?: string | null;
  authorPegawaiId?: string | null;
}

export type AsesmenTuberkulosisEntity = Awaited<ReturnType<typeof latestByKunjungan>>;

export function create(data: CreateAsesmenTuberkulosisData, tx?: Tx) {
  return db(tx).asesmenTuberkulosis.create({ data });
}

export function latestByKunjungan(kunjunganId: string, tx?: Tx) {
  return db(tx).asesmenTuberkulosis.findFirst({
    where: { kunjunganId },
    orderBy: { createdAt: "desc" },
  });
}

export function listLatestByKunjunganIds(kunjunganIds: string[], tx?: Tx) {
  if (kunjunganIds.length === 0) return Promise.resolve([]);
  return db(tx).asesmenTuberkulosis.findMany({
    where: { kunjunganId: { in: kunjunganIds } },
    orderBy: [{ kunjunganId: "asc" }, { createdAt: "desc" }],
    distinct: ["kunjunganId"],
  });
}
