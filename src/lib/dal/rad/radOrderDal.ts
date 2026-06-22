// radOrderDal — Prisma murni medicalrecord.RadOrder (+ RadOrderItem nested). Read filter
// deletedAt: null. Tanpa aturan bisnis. Terima `tx?`. Selaras labOrderDal.

import { db, type Tx } from "@/lib/db/prisma";

export interface CreateRadItemData {
  radCatalogId?: string | null;
  kode: string;
  nama: string;
  modalitas: string;
  region: string;
  waktuTunggu?: string | null;
  persiapan?: string | null;
  harga?: number | null;
}

export interface CreateRadOrderData {
  kunjunganId: string;
  radKode?: string | null;
  radNama: string;
  catatan?: string | null;
  prioritas: string;
  status: string;
  penulis: string;
  penulisKontak?: string | null;
  authorUserId?: string | null;
  authorPegawaiId?: string | null;
  items: CreateRadItemData[];
}

const withItems = { items: { orderBy: { createdAt: "asc" as const } } };

export function create(data: CreateRadOrderData, tx?: Tx) {
  const { items, ...header } = data;
  return db(tx).radOrder.create({
    data: { ...header, items: { create: items } },
    include: withItems,
  });
}

export function listByKunjungan(kunjunganId: string, tx?: Tx) {
  return db(tx).radOrder.findMany({
    where: { kunjunganId, deletedAt: null },
    include: withItems,
    orderBy: { createdAt: "desc" },
  });
}

export function findById(id: string, tx?: Tx) {
  return db(tx).radOrder.findUnique({ where: { id }, include: withItems });
}

const withKunjungan = {
  ...withItems,
  kunjungan: {
    select: {
      unit: true,
      noKunjungan: true,
      pasien: { select: { noRm: true, nama: true, tanggalLahir: true, gender: true } },
    },
  },
};

/** Satu order + join kunjungan/pasien (detail Rad worklist). Filter deletedAt: null. */
export function findByIdWithKunjungan(id: string, tx?: Tx) {
  return db(tx).radOrder.findFirst({ where: { id, deletedAt: null }, include: withKunjungan });
}

export function listForRad(filter: { radKode?: string; status?: string; noRM?: string }, tx?: Tx) {
  return db(tx).radOrder.findMany({
    where: {
      deletedAt: null,
      ...(filter.radKode ? { radKode: filter.radKode } : {}),
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
  const r = await db(tx).radOrder.updateMany({
    where: { id, deletedAt: null, status: { in: from } },
    data: { status: to },
  });
  return r.count;
}

/** Terima order — hanya saat "Menunggu" → "Diterima" (masuk worklist). Atomic guard.
 *  Return count: 1 = berhasil, 0 = tak ada / status sudah lanjut. */
export async function receive(id: string, tx?: Tx) {
  const r = await db(tx).radOrder.updateMany({
    where: { id, deletedAt: null, status: "Menunggu" },
    data: { status: "Diterima" },
  });
  return r.count;
}

/** Batalkan order — hanya saat masih "Menunggu" (belum disentuh Rad). Atomic guard via where.
 *  Return count: 1 = berhasil, 0 = tak ada / status sudah lanjut (race). */
export async function cancel(id: string, kunjunganId: string, tx?: Tx) {
  const r = await db(tx).radOrder.updateMany({
    where: { id, kunjunganId, deletedAt: null, status: "Menunggu" },
    data: { status: "Dibatalkan" },
  });
  return r.count;
}

export async function softDelete(id: string, tx?: Tx) {
  const r = await db(tx).radOrder.updateMany({
    where: { id, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return r.count;
}

export type RadOrderEntity = NonNullable<Awaited<ReturnType<typeof findById>>>;
export type RadOrderWorklistEntity = NonNullable<Awaited<ReturnType<typeof findByIdWithKunjungan>>>;
