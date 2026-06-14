// pemeriksaanPenunjangDal — Prisma murni medicalrecord.PemeriksaanPenunjang (daftar hidup per-item).
// Read filter deletedAt: null (terbaru dulu). Tanpa aturan bisnis. Terima `tx?`. Selaras penandaanAnatomiDal.

import { db, type Tx } from "@/lib/db/prisma";

export interface CreatePenunjangData {
  kunjunganId: string;
  jenis: string;
  keterangan: string;
  hasil: string;
  kesimpulan: string;
  waktu: Date | null;
  pemeriksa: string;
  authorUserId?: string | null;
  authorPegawaiId?: string | null;
}

export type PenunjangEntity = NonNullable<Awaited<ReturnType<typeof findById>>>;

export function list(kunjunganId: string, tx?: Tx) {
  return db(tx).pemeriksaanPenunjang.findMany({
    where: { kunjunganId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });
}

export function findById(id: string, tx?: Tx) {
  return db(tx).pemeriksaanPenunjang.findUnique({ where: { id } });
}

export function create(data: CreatePenunjangData, tx?: Tx) {
  return db(tx).pemeriksaanPenunjang.create({ data });
}

export async function softDelete(id: string, tx?: Tx) {
  const r = await db(tx).pemeriksaanPenunjang.updateMany({
    where: { id, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return r.count;
}
