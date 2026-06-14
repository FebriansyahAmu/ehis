// penilaianNyeriDal — Prisma murni medicalrecord.PenilaianNyeri (append-only time-series).
// Tanpa aturan bisnis. Terima `tx?`. Read urut createdAt desc (terbaru dulu). Selaras penilaianFisikDal.

import { db, type Tx } from "@/lib/db/prisma";

export interface CreatePenilaianNyeriData {
  kunjunganId: string;
  lokasi: string;
  karakter: string;
  durasi: string;
  faktorPemberat: string;
  faktorPeringan: string;
  tipeNyeri: string;
  dampakFungsional: string;
  rencanaReasesmen: string;
  catatan: string;
  pemeriksa: string;
  authorUserId?: string | null;
  authorPegawaiId?: string | null;
}

export type PenilaianNyeriEntity = NonNullable<Awaited<ReturnType<typeof findById>>>;

/** Riwayat penilaian nyeri per kunjungan (terbaru dulu). */
export function list(kunjunganId: string, tx?: Tx) {
  return db(tx).penilaianNyeri.findMany({
    where: { kunjunganId },
    orderBy: { createdAt: "desc" },
  });
}

export function findById(id: string, tx?: Tx) {
  return db(tx).penilaianNyeri.findUnique({ where: { id } });
}

export function create(data: CreatePenilaianNyeriData, tx?: Tx) {
  return db(tx).penilaianNyeri.create({ data });
}
