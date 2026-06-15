// penilaianSkalaDal — Prisma murni medicalrecord.PenilaianSkala (append-only time-series).
// Tanpa aturan bisnis. Terima `tx?`. Read urut createdAt desc (terbaru dulu). `jawaban` = JSONB.
// Selaras penilaianStatusDal.

import { db, type Tx } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";

export interface CreatePenilaianSkalaData {
  kunjunganId: string;
  skalaKode: string;
  skalaNama: string;
  kategori: string;
  totalSkor: number;
  totalMax: number;
  interpretasiLabel: string;
  interpretasiTone: string;
  jawaban: Prisma.InputJsonValue;
  catatan: string;
  pemeriksa: string;
  authorUserId?: string | null;
  authorPegawaiId?: string | null;
}

export type PenilaianSkalaEntity = NonNullable<Awaited<ReturnType<typeof findById>>>;

/** Riwayat penilaian skala per kunjungan (terbaru dulu). */
export function list(kunjunganId: string, tx?: Tx) {
  return db(tx).penilaianSkala.findMany({
    where: { kunjunganId },
    orderBy: { createdAt: "desc" },
  });
}

export function findById(id: string, tx?: Tx) {
  return db(tx).penilaianSkala.findUnique({ where: { id } });
}

export function create(data: CreatePenilaianSkalaData, tx?: Tx) {
  return db(tx).penilaianSkala.create({ data });
}
