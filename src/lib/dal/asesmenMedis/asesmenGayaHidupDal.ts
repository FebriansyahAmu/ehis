// asesmenGayaHidupDal — akses Prisma MURNI medicalrecord.AsesmenGayaHidup. Append-only.

import { db, type Tx } from "@/lib/db/prisma";

export interface CreateAsesmenGayaHidupData {
  kunjunganId: string;
  merokokStatus?: string | null;
  rokokPerHari?: string | null;
  merokokSejak?: string | null;
  berhentiSejak?: string | null;
  paparanAsap?: boolean | null;
  paparanDetail?: string | null;
  catatan?: string | null;
  pemeriksa: string;
  authorUserId?: string | null;
  authorPegawaiId?: string | null;
}

export type AsesmenGayaHidupEntity = Awaited<ReturnType<typeof latestByKunjungan>>;

export function create(data: CreateAsesmenGayaHidupData, tx?: Tx) {
  return db(tx).asesmenGayaHidup.create({ data });
}

export function latestByKunjungan(kunjunganId: string, tx?: Tx) {
  return db(tx).asesmenGayaHidup.findFirst({
    where: { kunjunganId },
    orderBy: { createdAt: "desc" },
  });
}

export function listLatestByKunjunganIds(kunjunganIds: string[], tx?: Tx) {
  if (kunjunganIds.length === 0) return Promise.resolve([]);
  return db(tx).asesmenGayaHidup.findMany({
    where: { kunjunganId: { in: kunjunganIds } },
    orderBy: [{ kunjunganId: "asc" }, { createdAt: "desc" }],
    distinct: ["kunjunganId"],
  });
}
