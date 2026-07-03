// dischargeEdukasiDal — Prisma murni medicalrecord.DischargeEdukasi (daftar hidup per-log).
// Read filter deletedAt: null (terbaru dulu). Tanpa aturan bisnis. Terima `tx?`.
// Selaras pemeriksaanPenunjangDal (add + soft-delete only).

import { db, type Tx } from "@/lib/db/prisma";

export interface CreateDischargeEdukasiData {
  kunjunganId: string;
  topikId: string;
  topik: string;
  kategori: string;
  tanggal: string;
  profesi: string;
  metode: string;
  penerima: string;
  pemahaman: string;
  catatan: string;
  petugas: string;
  authorUserId?: string | null;
  authorPegawaiId?: string | null;
}

export type DischargeEdukasiEntity = NonNullable<Awaited<ReturnType<typeof findById>>>;

export function list(kunjunganId: string, tx?: Tx) {
  return db(tx).dischargeEdukasi.findMany({
    where: { kunjunganId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });
}

export function findById(id: string, tx?: Tx) {
  return db(tx).dischargeEdukasi.findUnique({ where: { id } });
}

export function create(data: CreateDischargeEdukasiData, tx?: Tx) {
  return db(tx).dischargeEdukasi.create({ data });
}

export async function softDelete(id: string, tx?: Tx) {
  const r = await db(tx).dischargeEdukasi.updateMany({
    where: { id, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return r.count;
}
