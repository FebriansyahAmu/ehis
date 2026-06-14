// penilaianFisikDal — Prisma murni medicalrecord.PenilaianFisik (append-only time-series).
// Tanpa aturan bisnis. Terima `tx?`. Read urut createdAt desc (terbaru dulu). Selaras asesmenGiziDal.

import { db, type Tx } from "@/lib/db/prisma";

export interface CreatePenilaianFisikData {
  kunjunganId: string;
  pemeriksaanUmum: string;
  keadaanUmum: string;
  kesadaran: string;
  gizi: string;
  mobilitas: string;
  pemeriksa: string;
  authorUserId?: string | null;
  authorPegawaiId?: string | null;
}

export type PenilaianFisikEntity = NonNullable<Awaited<ReturnType<typeof findById>>>;

/** Riwayat penilaian fisik per kunjungan (terbaru dulu). */
export function list(kunjunganId: string, tx?: Tx) {
  return db(tx).penilaianFisik.findMany({
    where: { kunjunganId },
    orderBy: { createdAt: "desc" },
  });
}

export function findById(id: string, tx?: Tx) {
  return db(tx).penilaianFisik.findUnique({ where: { id } });
}

export function create(data: CreatePenilaianFisikData, tx?: Tx) {
  return db(tx).penilaianFisik.create({ data });
}
