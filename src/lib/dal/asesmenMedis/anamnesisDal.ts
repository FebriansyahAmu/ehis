// anamnesisDal — akses Prisma MURNI domain medicalrecord.Anamnesis. Tanpa aturan
// bisnis. Terima `tx?` (transaksi dimiliki Service). Append-only: create + read.

import { db, type Tx } from "@/lib/db/prisma";

// Bentuk data create (nilai sudah dinormalisasi Service; null untuk kolom kosong).
export interface CreateAnamnesisData {
  kunjunganId: string;
  sumberAnamnesis: string;
  keluhanUtama: string;
  rps: string;
  onsetDurasi?: string | null;
  mekanismeCedera?: string | null;
  faktorPemberat?: string | null;
  faktorPeringan?: string | null;
  statusGeneralis: string;
  obatSaatIni?: string | null;
  pemeriksa: string;
  authorUserId?: string | null;
  authorPegawaiId?: string | null;
}

export type AnamnesisEntity = Awaited<ReturnType<typeof latestByKunjungan>>;

// ── Create (1 asesmen anamnesis) ──────────────────────────────────────────────
export function create(data: CreateAnamnesisData, tx?: Tx) {
  return db(tx).anamnesis.create({ data });
}

// ── Read: baris terbaru milik satu kunjungan (latest by createdAt) ─────────────
export function latestByKunjungan(kunjunganId: string, tx?: Tx) {
  return db(tx).anamnesis.findFirst({
    where: { kunjunganId },
    orderBy: { createdAt: "desc" },
  });
}
