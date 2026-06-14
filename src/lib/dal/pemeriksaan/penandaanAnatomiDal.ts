// penandaanAnatomiDal — Prisma murni medicalrecord.PenandaanAnatomi (daftar hidup per-item).
// Read filter deletedAt: null. Tanpa aturan bisnis. Terima `tx?`. Selaras asesmenAlergiDal.

import { db, type Tx } from "@/lib/db/prisma";

export interface CreatePenandaanData {
  kunjunganId: string;
  region: string;
  label: string;
  catatan: string;
  pemeriksa: string;
  authorUserId?: string | null;
  authorPegawaiId?: string | null;
}

export interface UpdatePenandaanData {
  catatan?: string;
}

export type PenandaanEntity = NonNullable<Awaited<ReturnType<typeof findById>>>;

export function list(kunjunganId: string, tx?: Tx) {
  return db(tx).penandaanAnatomi.findMany({
    where: { kunjunganId, deletedAt: null },
    orderBy: { createdAt: "asc" },
  });
}

export function findById(id: string, tx?: Tx) {
  return db(tx).penandaanAnatomi.findUnique({ where: { id } });
}

export function create(data: CreatePenandaanData, tx?: Tx) {
  return db(tx).penandaanAnatomi.create({ data });
}

export async function update(id: string, data: UpdatePenandaanData, tx?: Tx) {
  const r = await db(tx).penandaanAnatomi.updateMany({ where: { id, deletedAt: null }, data });
  return r.count;
}

export async function softDelete(id: string, tx?: Tx) {
  const r = await db(tx).penandaanAnatomi.updateMany({
    where: { id, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return r.count;
}
