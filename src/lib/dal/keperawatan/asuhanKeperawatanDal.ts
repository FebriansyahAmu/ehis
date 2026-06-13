// asuhanKeperawatanDal — Prisma murni medicalrecord.AsuhanKeperawatan (per-item). Read
// filter deletedAt: null. Tanpa aturan bisnis. Terima `tx?`. Blok dataMayor/dataMinor/
// intervensi/evaluasi = JSONB (di-set/replace utuh oleh Service). Selaras tindakanMedisDal.

import { db, type Tx } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";

type Json = Prisma.InputJsonValue;

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
  evaluasi: Json;
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
  evaluasi?: Json;
  tanggalInput?: Date;
  perawat?: string;
  verified?: boolean;
  verifiedBy?: string | null;
  verifiedAt?: Date | null;
  aktif?: boolean;
}

export type AsuhanEntity = NonNullable<Awaited<ReturnType<typeof findById>>>;

export function list(kunjunganId: string, tx?: Tx) {
  return db(tx).asuhanKeperawatan.findMany({
    where: { kunjunganId, deletedAt: null },
    orderBy: { createdAt: "asc" },
  });
}

export function findById(id: string, tx?: Tx) {
  return db(tx).asuhanKeperawatan.findUnique({ where: { id } });
}

export function create(data: CreateAsuhanData, tx?: Tx) {
  return db(tx).asuhanKeperawatan.create({ data });
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
