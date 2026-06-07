// triaseDal — akses Prisma MURNI domain medicalrecord.Triase. Tanpa aturan bisnis.
// Terima `tx?` (transaksi dimiliki Service). Append-only: hanya create + read.

import { db, type Tx } from "@/lib/db/prisma";

type TriaseLevelDb = "P1" | "P2" | "P3" | "P4";

// Bentuk data create (nilai sudah dinormalisasi Service; null untuk kolom kosong).
export interface CreateTriaseData {
  kunjunganId: string;
  caraMasuk: string;
  kondisiTiba: string;
  keluhanUtama: string;
  onset: string;
  lokasiKeluhan?: string | null;
  kualitasKeluhan?: string | null;
  skalaBerat?: string | null;
  faktorPemberat?: string | null;
  faktorPeringan?: string | null;
  gejalaPenyerta: string[];
  riwayatSerupa?: string | null;
  airwayStatus: string;
  suaraNapasAbnormal: string[];
  breathingQuality: string;
  pergerakanDada?: string | null;
  ototBantu?: string | null;
  sianosis?: string | null;
  nadiTeraba: string;
  kualitasNadi?: string | null;
  crt?: string | null;
  kondisiKulit?: string | null;
  perdarahan?: string | null;
  avpu: string;
  pupil?: string | null;
  refleksCahaya?: string | null;
  traumaLuka?: string | null;
  lokasiLuka?: string | null;
  suhuKulit?: string | null;
  diagnosisSementara?: string | null;
  tindakanTriase: string[];
  triageLevel: TriaseLevelDb;
  perawatTriase: string;
  waktuTriase: Date;
  authorUserId?: string | null;
  authorPegawaiId?: string | null;
}

export type TriaseEntity = Awaited<ReturnType<typeof latestByKunjungan>>;

// ── Create ───────────────────────────────────────────────────────────────────
export function create(data: CreateTriaseData, tx?: Tx) {
  return db(tx).triase.create({ data });
}

// ── Read: baris terbaru milik satu kunjungan (latest by createdAt) ─────────────
export function latestByKunjungan(kunjunganId: string, tx?: Tx) {
  return db(tx).triase.findFirst({
    where: { kunjunganId },
    orderBy: { createdAt: "desc" },
  });
}
