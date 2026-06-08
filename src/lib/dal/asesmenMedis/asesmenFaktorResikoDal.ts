// asesmenFaktorResikoDal — akses Prisma MURNI medicalrecord.AsesmenFaktorResiko. Append-only.

import { db, type Tx } from "@/lib/db/prisma";

export interface CreateAsesmenFaktorResikoData {
  kunjunganId: string;
  penyakit: string[];
  penyakitLain?: string | null;
  perilaku: string[];
  perilakuLain?: string | null;
  pemeriksa: string;
  authorUserId?: string | null;
  authorPegawaiId?: string | null;
}

export type AsesmenFaktorResikoEntity = Awaited<ReturnType<typeof latestByKunjungan>>;

export function create(data: CreateAsesmenFaktorResikoData, tx?: Tx) {
  return db(tx).asesmenFaktorResiko.create({ data });
}

export function latestByKunjungan(kunjunganId: string, tx?: Tx) {
  return db(tx).asesmenFaktorResiko.findFirst({
    where: { kunjunganId },
    orderBy: { createdAt: "desc" },
  });
}
