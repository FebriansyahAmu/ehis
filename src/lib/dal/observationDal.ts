// observationDal — akses Prisma MURNI domain medicalrecord.Observation. Tanpa
// aturan bisnis. Terima `tx?` (transaksi dimiliki Service). Append-only: create + read.

import { db, type Tx } from "@/lib/db/prisma";

// Bentuk data create (nilai sudah dinormalisasi Service; null untuk kolom kosong).
export interface CreateObservationData {
  kunjunganId: string;
  tdSistolik: number;
  tdDiastolik: number;
  nadi: number;
  respirasi: number;
  suhu: number;
  spo2: number;
  gcsEye: number;
  gcsVerbal: number;
  gcsMotor: number;
  skalaNyeri: number;
  beratBadan?: number | null;
  tinggiBadan?: number | null;
  statusKesadaran: string;
  shift?: string | null;
  perawat: string;
  waktuObservasi: Date;
  authorUserId?: string | null;
  authorPegawaiId?: string | null;
}

export type ObservationEntity = Awaited<ReturnType<typeof listByKunjungan>>[number];

// Cap baris per-ambil — cegah response gemuk saat monitoring berkala panjang (mis.
// Rawat Inap q15min berhari-hari). Timeline klinis hanya butuh observasi terkini;
// baris >LIST_LIMIT terlama tak ditampilkan (histori penuh = laporan terpisah nanti).
const LIST_LIMIT = 100;

// ── Create (1 pengukuran TTV) ──────────────────────────────────────────────────
export function create(data: CreateObservationData, tx?: Tx) {
  return db(tx).observation.create({ data });
}

// ── Read: time-series satu kunjungan (terbaru dulu, dibatasi LIST_LIMIT) ───────
export function listByKunjungan(kunjunganId: string, tx?: Tx) {
  return db(tx).observation.findMany({
    where: { kunjunganId },
    orderBy: [{ waktuObservasi: "desc" }, { createdAt: "desc" }],
    take: LIST_LIMIT,
  });
}
