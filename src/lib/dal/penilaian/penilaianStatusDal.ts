// penilaianStatusDal — Prisma murni medicalrecord.PenilaianStatus (append-only time-series).
// Tanpa aturan bisnis. Terima `tx?`. Read urut createdAt desc (terbaru dulu). Selaras penilaianNyeriDal.

import { db, type Tx } from "@/lib/db/prisma";

export interface CreatePenilaianStatusData {
  kunjunganId: string;
  status: string;
  kesadaran: string;
  catatan: string;
  pemeriksa: string;
  authorUserId?: string | null;
  authorPegawaiId?: string | null;
}

export type PenilaianStatusEntity = NonNullable<Awaited<ReturnType<typeof findById>>>;

/** Riwayat penilaian status klinis per kunjungan (terbaru dulu). */
export function list(kunjunganId: string, tx?: Tx) {
  return db(tx).penilaianStatus.findMany({
    where: { kunjunganId },
    orderBy: { createdAt: "desc" },
  });
}

export function findById(id: string, tx?: Tx) {
  return db(tx).penilaianStatus.findUnique({ where: { id } });
}

export function create(data: CreatePenilaianStatusData, tx?: Tx) {
  return db(tx).penilaianStatus.create({ data });
}
