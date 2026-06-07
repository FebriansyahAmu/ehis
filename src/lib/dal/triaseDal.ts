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
  // Protokol panduan + kriteria terpilih (snapshot).
  protocolId?: string | null;
  protocolKode?: string | null;
  protocolNama?: string | null;
  selectedCriteria?: CreateTriaseCriteriaData[];
}

// Satu item kriteria terpilih (snapshot) — anak Triase.
export interface CreateTriaseCriteriaData {
  parameterKode: string;
  parameterLabel: string;
  levelKode: string;
  levelLabel: string;
  nilai: string;
  sourceCriteriaId?: string | null;
  urutan: number;
}

export type TriaseEntity = Awaited<ReturnType<typeof latestByKunjungan>>;

// Sertakan kriteria terpilih (urut tampil) di setiap read.
const withCriteria = {
  selectedCriteria: { orderBy: { urutan: "asc" } as const },
};

// ── Create (+ kriteria terpilih nested, dalam tx milik Service) ────────────────
export function create(data: CreateTriaseData, tx?: Tx) {
  const { selectedCriteria, ...rest } = data;
  return db(tx).triase.create({
    data: {
      ...rest,
      ...(selectedCriteria?.length
        ? { selectedCriteria: { create: selectedCriteria } }
        : {}),
    },
    include: withCriteria,
  });
}

// ── Read: baris terbaru milik satu kunjungan (latest by createdAt) ─────────────
export function latestByKunjungan(kunjunganId: string, tx?: Tx) {
  return db(tx).triase.findFirst({
    where: { kunjunganId },
    orderBy: { createdAt: "desc" },
    include: withCriteria,
  });
}
