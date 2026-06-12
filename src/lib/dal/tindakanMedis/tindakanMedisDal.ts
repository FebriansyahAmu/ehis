// tindakanMedisDal — Prisma murni medicalrecord.TindakanMedis (per-item). Read filter
// deletedAt: null. Tanpa aturan bisnis. Terima `tx?`. Selaras diagnosaDal.

import { db, type Tx } from "@/lib/db/prisma";

export interface CreateTindakanMedisData {
  kunjunganId: string;
  tindakanId?: string | null;
  kode: string;
  nama: string;
  kategori: string;
  jumlah: number;
  harga?: number | null;
  penjaminKode?: string | null;
  jenisRuangan?: string | null;
  pelaksana: string;
  authorUserId?: string | null;
  authorPegawaiId?: string | null;
}

export interface UpdateTindakanMedisData {
  jumlah?: number;
  pelaksana?: string;
}

export type TindakanMedisEntity = NonNullable<Awaited<ReturnType<typeof findById>>>;

export function list(kunjunganId: string, tx?: Tx) {
  return db(tx).tindakanMedis.findMany({
    where: { kunjunganId, deletedAt: null },
    orderBy: { createdAt: "asc" },
  });
}

export function findById(id: string, tx?: Tx) {
  return db(tx).tindakanMedis.findUnique({ where: { id } });
}

export function create(data: CreateTindakanMedisData, tx?: Tx) {
  return db(tx).tindakanMedis.create({ data });
}

export async function update(id: string, data: UpdateTindakanMedisData, tx?: Tx) {
  const r = await db(tx).tindakanMedis.updateMany({ where: { id, deletedAt: null }, data });
  return r.count;
}

export async function softDelete(id: string, tx?: Tx) {
  const r = await db(tx).tindakanMedis.updateMany({
    where: { id, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return r.count;
}
