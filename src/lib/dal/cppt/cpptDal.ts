// cpptDal — Prisma murni medicalrecord.Cppt (per-item). Tanpa aturan bisnis.
// Terima `tx?`. Read filter deletedAt: null (hapus = soft-delete medico-legal).

import { db, type Tx } from "@/lib/db/prisma";

export interface CreateCpptData {
  kunjunganId: string;
  profesi: string;
  penulis: string;
  jenisCatatan: string;
  subjektif?: string | null;
  objektif?: string | null;
  asesmen?: string | null;
  planning?: string | null;
  instruksi?: string | null;
  tbakPemberi?: string | null;
  tbakMetode?: string | null;
  tbakTulis?: boolean | null;
  tbakBaca?: boolean | null;
  tbakKonfirmasi?: boolean | null;
  verified?: boolean | null;
  flagged: boolean;
  waktuCatatan: Date;
  authorUserId?: string | null;
  authorPegawaiId?: string | null;
}

export interface UpdateCpptData {
  profesi?: string;
  jenisCatatan?: string;
  subjektif?: string | null;
  objektif?: string | null;
  asesmen?: string | null;
  planning?: string | null;
  instruksi?: string | null;
  tbakPemberi?: string | null;
  tbakMetode?: string | null;
  tbakTulis?: boolean | null;
  tbakBaca?: boolean | null;
  tbakKonfirmasi?: boolean | null;
  verified?: boolean | null;
  verifiedBy?: string | null;
  verifiedAt?: Date | null;
  flagged?: boolean;
}

export type CpptEntity = NonNullable<Awaited<ReturnType<typeof findById>>>;

export function list(kunjunganId: string, tx?: Tx) {
  return db(tx).cppt.findMany({
    where: { kunjunganId, deletedAt: null },
    orderBy: { waktuCatatan: "desc" },
  });
}

export function findById(id: string, tx?: Tx) {
  return db(tx).cppt.findUnique({ where: { id } });
}

export function create(data: CreateCpptData, tx?: Tx) {
  return db(tx).cppt.create({ data });
}

export async function update(id: string, data: UpdateCpptData, tx?: Tx) {
  const r = await db(tx).cppt.updateMany({
    where: { id, deletedAt: null },
    data: { ...data, version: { increment: 1 } },
  });
  return r.count;
}

export async function softDelete(id: string, tx?: Tx) {
  const r = await db(tx).cppt.updateMany({
    where: { id, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return r.count;
}
