// penilaianPediatrikDal — Prisma murni medicalrecord.PenilaianPediatrik (append-only time-series).
// Tanpa aturan bisnis. Terima `tx?`. Read urut createdAt desc (terbaru dulu). Selaras penilaianStatusDal.

import { db, type Tx } from "@/lib/db/prisma";

export interface CreatePenilaianPediatrikData {
  kunjunganId: string;
  beratLahir: string;
  usiaGestasi: string;
  imunisasi: string;
  tumbuhKembang: string;
  catatan: string;
  pemeriksa: string;
  authorUserId?: string | null;
  authorPegawaiId?: string | null;
}

export type PenilaianPediatrikEntity = NonNullable<Awaited<ReturnType<typeof findById>>>;

/** Riwayat penilaian pediatrik per kunjungan (terbaru dulu). */
export function list(kunjunganId: string, tx?: Tx) {
  return db(tx).penilaianPediatrik.findMany({
    where: { kunjunganId },
    orderBy: { createdAt: "desc" },
  });
}

export function findById(id: string, tx?: Tx) {
  return db(tx).penilaianPediatrik.findUnique({ where: { id } });
}

export function create(data: CreatePenilaianPediatrikData, tx?: Tx) {
  return db(tx).penilaianPediatrik.create({ data });
}
