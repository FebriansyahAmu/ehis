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

// ── Worklist Farmasi (lintas-kunjungan) — join pasien utk tampil noRM/nama/unit ──
const withKunjungan = {
  ...withItems,
  kunjungan: {
    select: {
      unit: true,
      noKunjungan: true,
      pasien: { select: { noRm: true, nama: true } },
    },
  },
};

/** Satu order + join kunjungan/pasien (detail worklist Farmasi). Filter deletedAt: null. */
export function findByIdWithKunjungan(id: string, tx?: Tx) {
  return db(tx).bmhpOrder.findFirst({ where: { id, deletedAt: null }, include: withKunjungan });
}

export function listForFarmasi(filter: { depoKode?: string; status?: string; noRM?: string }, tx?: Tx) {
  return db(tx).bmhpOrder.findMany({
    where: {
      deletedAt: null,
      ...(filter.depoKode ? { depoKode: filter.depoKode } : {}),
      ...(filter.noRM ? { kunjungan: { pasien: { noRm: filter.noRM } } } : {}),
      // Status eksplisit → pakai. Riwayat pasien (noRM) → SEMUA status (termasuk Dibatalkan).
      // Worklist aktif (tanpa filter) → kecualikan order yang dibatalkan klinisi.
      ...(filter.status ? { status: filter.status } : filter.noRM ? {} : { status: { not: "Dibatalkan" } }),
    },
    include: withKunjungan,
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

/** Transisi status ter-guard (atomik via where) — pindah hanya bila status ∈ `from`.
 *  Return count: 1 = berhasil, 0 = tak ada / status sudah lanjut (race). */
export async function transition(id: string, from: string[], to: string, tx?: Tx) {
  const r = await db(tx).bmhpOrder.updateMany({
    where: { id, deletedAt: null, status: { in: from } },
    data: { status: to },
  });
  return r.count;
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
export type BmhpOrderFarmasiEntity = NonNullable<Awaited<ReturnType<typeof findByIdWithKunjungan>>>;
