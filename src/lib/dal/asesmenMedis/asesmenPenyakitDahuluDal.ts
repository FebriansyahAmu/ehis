// asesmenPenyakitDahuluDal — akses Prisma MURNI domain medicalrecord.AsesmenPenyakitDahulu.
// Tanpa aturan bisnis. Terima `tx?`. Append-only: create + read.

import { db, type Tx } from "@/lib/db/prisma";

export interface CreateAsesmenPenyakitDahuluData {
  kunjunganId: string;
  penyakit: string[];
  catatan?: string | null;
  pemeriksa: string;
  authorUserId?: string | null;
  authorPegawaiId?: string | null;
}

export type AsesmenPenyakitDahuluEntity = Awaited<ReturnType<typeof latestByKunjungan>>;

export function create(data: CreateAsesmenPenyakitDahuluData, tx?: Tx) {
  return db(tx).asesmenPenyakitDahulu.create({ data });
}

export function latestByKunjungan(kunjunganId: string, tx?: Tx) {
  return db(tx).asesmenPenyakitDahulu.findFirst({
    where: { kunjunganId },
    orderBy: { createdAt: "desc" },
  });
}
