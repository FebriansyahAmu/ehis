// pemeriksaanFisikDal — Prisma murni medicalrecord.PemeriksaanFisik (append-only "latest wins").
// Tanpa aturan bisnis. Terima `tx?`. Blok orientasi/sistem/bodyMarkings = JSONB (di-set utuh oleh
// Service). Read urut createdAt desc (terbaru dulu). Selaras anamnesisDal (point-in-time).

import { db, type Tx } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";

type Json = Prisma.InputJsonValue;

export interface CreatePemeriksaanData {
  kunjunganId: string;
  ku: string;
  kesadaran: string;
  gizi: string;
  mobilitas: string | null;
  orientasi: Json;
  catatanGeneralis: string | null;
  sistem: Json;
  temuanAbnormal: string[];
  temuanLain: string[];
  catatanUmum: string | null;
  bodyMarkings: Json;
  waktuPemeriksaan: Date;
  dokterPemeriksa: string;
  perawat: string;
  authorUserId?: string | null;
  authorPegawaiId?: string | null;
}

export type PemeriksaanEntity = NonNullable<Awaited<ReturnType<typeof findById>>>;

/** Daftar pemeriksaan per kunjungan (terbaru dulu) — riwayat re-pemeriksaan. */
export function list(kunjunganId: string, tx?: Tx) {
  return db(tx).pemeriksaanFisik.findMany({
    where: { kunjunganId },
    orderBy: { createdAt: "desc" },
  });
}

/** Pemeriksaan terbaru (latest wins) — utk prefill form. */
export function findLatest(kunjunganId: string, tx?: Tx) {
  return db(tx).pemeriksaanFisik.findFirst({
    where: { kunjunganId },
    orderBy: { createdAt: "desc" },
  });
}

export function findById(id: string, tx?: Tx) {
  return db(tx).pemeriksaanFisik.findUnique({ where: { id } });
}

export function create(data: CreatePemeriksaanData, tx?: Tx) {
  return db(tx).pemeriksaanFisik.create({ data });
}
