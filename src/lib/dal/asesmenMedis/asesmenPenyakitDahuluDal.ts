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

// Latest per kunjungan untuk sekumpulan kunjungan (feed "Riwayat Sebelumnya").
export function listLatestByKunjunganIds(kunjunganIds: string[], tx?: Tx) {
  if (kunjunganIds.length === 0) return Promise.resolve([]);
  return db(tx).asesmenPenyakitDahulu.findMany({
    where: { kunjunganId: { in: kunjunganIds } },
    orderBy: [{ kunjunganId: "asc" }, { createdAt: "desc" }],
    distinct: ["kunjunganId"],
  });
}
