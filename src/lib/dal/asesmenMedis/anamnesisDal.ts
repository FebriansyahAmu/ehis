// anamnesisDal — akses Prisma MURNI domain medicalrecord.Anamnesis. Tanpa aturan
// bisnis. Terima `tx?` (transaksi dimiliki Service). Append-only: create + read.

import { db, type Tx } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";

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
  sosial?: unknown; // JSONB (RI psikososial) — divalidasi di Zod; omit (undefined) utk IGD
  spiritual?: unknown; // JSONB (RI spiritual)
  pemeriksa: string;
  authorUserId?: string | null;
  authorPegawaiId?: string | null;
}

export type AnamnesisEntity = Awaited<ReturnType<typeof latestByKunjungan>>;

// ── Create (1 asesmen anamnesis) ──────────────────────────────────────────────
export function create(data: CreateAnamnesisData, tx?: Tx) {
  const { sosial, spiritual, ...rest } = data;
  return db(tx).anamnesis.create({
    data: {
      ...rest,
      ...(sosial !== undefined ? { sosial: sosial as Prisma.InputJsonValue } : {}),
      ...(spiritual !== undefined ? { spiritual: spiritual as Prisma.InputJsonValue } : {}),
    },
  });
}

// ── Read: baris terbaru milik satu kunjungan (latest by createdAt) ─────────────
export function latestByKunjungan(kunjunganId: string, tx?: Tx) {
  return db(tx).anamnesis.findFirst({
    where: { kunjunganId },
    orderBy: { createdAt: "desc" },
  });
}

// ── Read longitudinal: anamnesis TERBARU per kunjungan utk sekumpulan kunjungan ──
// (DISTINCT ON kunjunganId, ambil createdAt terbaru) — feed "Anamnesis Sebelumnya".
export function listLatestByKunjunganIds(kunjunganIds: string[], tx?: Tx) {
  if (kunjunganIds.length === 0) return Promise.resolve([]);
  return db(tx).anamnesis.findMany({
    where: { kunjunganId: { in: kunjunganIds } },
    orderBy: [{ kunjunganId: "asc" }, { createdAt: "desc" }],
    distinct: ["kunjunganId"],
  });
}
