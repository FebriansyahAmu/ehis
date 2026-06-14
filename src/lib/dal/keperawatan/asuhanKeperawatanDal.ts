// asuhanKeperawatanDal — Prisma murni medicalrecord.AsuhanKeperawatan (per-item) + anak
// AsuhanEvaluasi (timeline shift). Read filter deletedAt: null + include evaluasiShift (urut
// waktu). Tanpa aturan bisnis. Terima `tx?`. Blok dataMayor/dataMinor/intervensi = JSONB
// (di-set/replace utuh oleh Service); evaluasi = tabel anak (append). Selaras tindakanMedisDal.

import { db, type Tx } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";

type Json = Prisma.InputJsonValue;

// Include evaluasiShift (anak) — urut kronologis utk timeline.
const withEvaluasi = {
  evaluasiShift: { orderBy: [{ waktu: "asc" }, { createdAt: "asc" }] },
} satisfies Prisma.AsuhanKeperawatanInclude;

export interface CreateAsuhanData {
  kunjunganId: string;
  kodeSdki: string;
  diagnosa: string;
  penyebab: string;
  faktorResiko: string;
  dataMayor: Json;
  dataMinor: Json;
  tujuanDurasi: string;
  tujuanUnit: string;
  selama: string;
  kriteriaHasil: string[];
  statusLuaran: string;
  intervensi: Json;
  tanggalInput: Date;
  perawat: string;
  authorUserId?: string | null;
  authorPegawaiId?: string | null;
}

export interface UpdateAsuhanData {
  kodeSdki?: string;
  diagnosa?: string;
  penyebab?: string;
  faktorResiko?: string;
  dataMayor?: Json;
  dataMinor?: Json;
  tujuanDurasi?: string;
  tujuanUnit?: string;
  selama?: string;
  kriteriaHasil?: string[];
  statusLuaran?: string;
  intervensi?: Json;
  tanggalInput?: Date;
  perawat?: string;
  verified?: boolean;
  verifiedBy?: string | null;
  verifiedAt?: Date | null;
  aktif?: boolean;
}

// Evaluasi shift (anak) — append-only.
export interface CreateEvaluasiData {
  asuhanId: string;
  shift: string;
  subjektif: string;
  objektif: string;
  statusLuaran: string;
  waktu: Date;
  perawat: string;
  authorUserId?: string | null;
  authorPegawaiId?: string | null;
}

export type AsuhanEntity = NonNullable<Awaited<ReturnType<typeof findById>>>;

export function list(kunjunganId: string, tx?: Tx) {
  return db(tx).asuhanKeperawatan.findMany({
    where: { kunjunganId, deletedAt: null },
    orderBy: { createdAt: "asc" },
    include: withEvaluasi,
  });
}

export function findById(id: string, tx?: Tx) {
  return db(tx).asuhanKeperawatan.findUnique({ where: { id }, include: withEvaluasi });
}

// ── Evaluasi shift (anak) ───────────────────────────────────────────────
export function createEvaluasi(data: CreateEvaluasiData, tx?: Tx) {
  return db(tx).asuhanEvaluasi.create({ data });
}

export function listEvaluasi(asuhanId: string, tx?: Tx) {
  return db(tx).asuhanEvaluasi.findMany({
    where: { asuhanId },
    orderBy: [{ waktu: "asc" }, { createdAt: "asc" }],
  });
}

export function create(data: CreateAsuhanData, tx?: Tx) {
  return db(tx).asuhanKeperawatan.create({ data, include: withEvaluasi });
}

export async function update(id: string, data: UpdateAsuhanData, tx?: Tx) {
  const r = await db(tx).asuhanKeperawatan.updateMany({ where: { id, deletedAt: null }, data });
  return r.count;
}

export async function softDelete(id: string, tx?: Tx) {
  const r = await db(tx).asuhanKeperawatan.updateMany({
    where: { id, deletedAt: null },
    data: { deletedAt: new Date(), aktif: false },
  });
  return r.count;
}
