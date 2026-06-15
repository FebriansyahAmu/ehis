// penandaanGambarDal — Prisma murni medicalrecord.PenandaanGambar (daftar hidup per-item).
// Read filter deletedAt: null, urut createdAt asc (nomor pin stabil ikut urutan buat). Tanpa
// aturan bisnis. Terima `tx?`. `path` = JSONB. Selaras penandaanAnatomiDal/penilaianSkalaDal.

import { db, type Tx } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";

export interface CreatePenandaanGambarData {
  kunjunganId: string;
  modelJenis: string;
  kind: string;
  koordinatX: number;
  koordinatY: number;
  path: Prisma.InputJsonValue;
  region: string;
  label: string;
  deskripsi: string;
  severitas: string;
  pemeriksa: string;
  authorUserId?: string | null;
  authorPegawaiId?: string | null;
}

export type PenandaanGambarEntity = NonNullable<Awaited<ReturnType<typeof findById>>>;

/** Daftar penanda aktif per kunjungan (urut buat). */
export function list(kunjunganId: string, tx?: Tx) {
  return db(tx).penandaanGambar.findMany({
    where: { kunjunganId, deletedAt: null },
    orderBy: { createdAt: "asc" },
  });
}

export function findById(id: string, tx?: Tx) {
  return db(tx).penandaanGambar.findUnique({ where: { id } });
}

export function create(data: CreatePenandaanGambarData, tx?: Tx) {
  return db(tx).penandaanGambar.create({ data });
}

export async function softDelete(id: string, tx?: Tx) {
  const r = await db(tx).penandaanGambar.updateMany({
    where: { id, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return r.count;
}
