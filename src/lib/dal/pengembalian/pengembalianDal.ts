// pengembalianDal — Prisma murni medicalrecord.PengembalianObat (+ item nested). Read filter
// deletedAt: null (terbaru dulu). Transisi status guarded via updateMany (count 0 = konflik).
// Tanpa aturan bisnis. Terima `tx?`. Selaras resepDal.

import { db, type Tx } from "@/lib/db/prisma";

export interface CreatePengembalianItemData {
  resepItemId?: string | null;
  namaObat: string;
  satuan: string;
  isHAM: boolean;
  isNarPsi: boolean;
  jumlahDispensasi: number;
  jumlahDiberikan: number;
  jumlahKembalikan: number;
  kondisi: string;
  alasan: string;
}

export interface CreatePengembalianData {
  kunjunganId: string;
  resepOrderId?: string | null;
  noResepRef: string;
  tanggal: string;
  catatan: string;
  perawatPenyerah: string;
  authorUserId?: string | null;
  authorPegawaiId?: string | null;
  items: CreatePengembalianItemData[];
}

const withItems = { items: { orderBy: { createdAt: "asc" as const } } };

export type PengembalianEntity = NonNullable<Awaited<ReturnType<typeof findById>>>;

export function list(kunjunganId: string, tx?: Tx) {
  return db(tx).pengembalianObat.findMany({
    where: { kunjunganId, deletedAt: null },
    include: withItems,
    orderBy: { createdAt: "desc" },
  });
}

export function findById(id: string, tx?: Tx) {
  return db(tx).pengembalianObat.findUnique({ where: { id }, include: withItems });
}

export function create(data: CreatePengembalianData, tx?: Tx) {
  const { items, ...header } = data;
  return db(tx).pengembalianObat.create({
    data: { ...header, items: { create: items } },
    include: withItems,
  });
}

/** Update header draft — guarded status Draft (count 0 = sudah terkunci/berubah). */
export async function updateDraftHeader(
  id: string,
  data: { tanggal?: string; catatan?: string },
  tx?: Tx,
): Promise<number> {
  const r = await db(tx).pengembalianObat.updateMany({
    where: { id, status: "Draft", deletedAt: null },
    data,
  });
  return r.count;
}

/** Replace-all items (koreksi Draft) — hapus lama + tulis baru. Panggil dalam tx Service. */
export async function replaceItems(
  pengembalianId: string,
  items: CreatePengembalianItemData[],
  tx?: Tx,
): Promise<void> {
  await db(tx).pengembalianObatItem.deleteMany({ where: { pengembalianId } });
  await db(tx).pengembalianObatItem.createMany({
    data: items.map((i) => ({ ...i, pengembalianId })),
  });
}

/** Verifikasi (stamp sekali) — guarded Draft → Diverifikasi. */
export async function verify(
  id: string,
  apotekerPenerima: string,
  tx?: Tx,
): Promise<number> {
  const r = await db(tx).pengembalianObat.updateMany({
    where: { id, status: "Draft", deletedAt: null },
    data: { status: "Diverifikasi", apotekerPenerima, verifiedAt: new Date() },
  });
  return r.count;
}

/** Soft-delete (Draft saja — dokumen terverifikasi tidak boleh hilang). */
export async function softDeleteDraft(id: string, tx?: Tx): Promise<number> {
  const r = await db(tx).pengembalianObat.updateMany({
    where: { id, status: "Draft", deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return r.count;
}
