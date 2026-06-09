// asesmenGiziDal — Prisma MURNI medicalrecord.AsesmenGizi. Append-only: create + read.
// Tanpa aturan bisnis. Terima `tx?` (transaksi dimiliki Service).

import { db, type Tx } from "@/lib/db/prisma";

export interface CreateAsesmenGiziData {
  kunjunganId: string;
  skorBmi: number;
  skorBb: number;
  skorAkut: number;
  ahliGizi?: string | null;
  catatan?: string | null;
  tanggal?: string | null;
  petugas: string;
  authorUserId?: string | null;
  authorPegawaiId?: string | null;
}

export type AsesmenGiziEntity = Awaited<ReturnType<typeof listByKunjungan>>[number];

const LIST_LIMIT = 100; // cegah response gemuk bila skrining berkala panjang

export function create(data: CreateAsesmenGiziData, tx?: Tx) {
  return db(tx).asesmenGizi.create({ data });
}

/** Riwayat skrining kunjungan (terbaru dulu, dibatasi LIST_LIMIT). */
export function listByKunjungan(kunjunganId: string, tx?: Tx) {
  return db(tx).asesmenGizi.findMany({
    where: { kunjunganId },
    orderBy: { createdAt: "desc" },
    take: LIST_LIMIT,
  });
}
