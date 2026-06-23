// bmhpOrderDal — Prisma murni medicalrecord.BmhpOrder (+ BmhpItem nested). Read filter
// deletedAt: null. Tanpa aturan bisnis. Terima `tx?`. Selaras resepDal / labOrderDal.

import { db, type Tx } from "@/lib/db/prisma";

export interface CreateBmhpItemData {
  bmhpId?: string | null;
  kode: string;
  nama: string;
  satuan: string;
  kategori: string;
  jumlah: number;
  keterangan?: string | null;
  harga?: number | null;
}

export interface CreateBmhpOrderData {
  kunjunganId: string;
  depoKode?: string | null;
  depoNama: string;
  catatan?: string | null;
  prioritas: string;
  status: string;
  penulis: string;
  penulisKontak?: string | null;
  authorUserId?: string | null;
  authorPegawaiId?: string | null;
  items: CreateBmhpItemData[];
}

const withItems = { items: { orderBy: { createdAt: "asc" as const } } };

export function create(data: CreateBmhpOrderData, tx?: Tx) {
  const { items, ...header } = data;
  return db(tx).bmhpOrder.create({
    data: { ...header, items: { create: items } },
    include: withItems,
  });
}

export function listByKunjungan(kunjunganId: string, tx?: Tx) {
  return db(tx).bmhpOrder.findMany({
    where: { kunjunganId, deletedAt: null },
    include: withItems,
    orderBy: { createdAt: "desc" },
  });
}

export function findById(id: string, tx?: Tx) {
  return db(tx).bmhpOrder.findUnique({ where: { id }, include: withItems });
}

/** Batalkan order — hanya saat masih "Menunggu" (belum disentuh Farmasi). Atomic guard via where.
 *  Return count: 1 = berhasil, 0 = tak ada / status sudah lanjut (race). */
export async function cancel(id: string, kunjunganId: string, tx?: Tx) {
  const r = await db(tx).bmhpOrder.updateMany({
    where: { id, kunjunganId, deletedAt: null, status: "Menunggu" },
    data: { status: "Dibatalkan" },
  });
  return r.count;
}

export type BmhpOrderEntity = NonNullable<Awaited<ReturnType<typeof findById>>>;
