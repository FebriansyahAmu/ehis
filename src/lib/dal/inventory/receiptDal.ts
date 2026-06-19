// receiptDal — akses Prisma MURNI inventory.GoodsReceipt (+ items). Header + baris (nested create).
// Reads include items. Master/vendor/pegawai joins untuk enrich DTO (cross-schema soft-ref).

import { db, type Tx } from "@/lib/db/prisma";

export type GRStatus = "Draft" | "Diproses" | "Selesai" | "Dibatalkan";

export interface ReceiptHeader {
  noDokumen: string;
  tanggal: Date;
  vendorId: string;
  noSuratJalan?: string | null;
  noPo?: string | null;
  toLocationId: string;
  status: GRStatus;
  petugas: string;
  actorId?: string | null;
}
export interface ReceiptLineData {
  itemJenis: "Obat" | "BMHP";
  itemId: string;
  batchNo: string;
  expiryDate: Date | null;
  qty: number;
  hargaBeli: number;
}

const include = { items: true } as const;
export type ReceiptEntity = NonNullable<Awaited<ReturnType<typeof findById>>>;

export function createReceipt(h: ReceiptHeader, lines: ReceiptLineData[], tx?: Tx) {
  return db(tx).goodsReceipt.create({ data: { ...h, items: { create: lines } }, include });
}

export function findById(id: string, tx?: Tx) {
  return db(tx).goodsReceipt.findFirst({ where: { id, deletedAt: null }, include });
}

export interface ListParams {
  status?: string;
  vendorId?: string;
  toLocationId?: string;
  cursorId?: string;
  limit: number;
}
export function list(p: ListParams, tx?: Tx) {
  const where: Record<string, unknown> = { deletedAt: null };
  if (p.status) where.status = p.status;
  if (p.vendorId) where.vendorId = p.vendorId;
  if (p.toLocationId) where.toLocationId = p.toLocationId;
  return db(tx).goodsReceipt.findMany({
    where, include,
    orderBy: [{ tanggal: "desc" }, { id: "desc" }],
    take: p.limit,
    ...(p.cursorId ? { cursor: { id: p.cursorId }, skip: 1 } : {}),
  });
}

export function updateStatus(id: string, data: { status: GRStatus; postedAt?: Date }, tx?: Tx) {
  return db(tx).goodsReceipt.update({ where: { id }, data });
}

// ── Joins untuk enrich ──
export function findVendorsByIds(ids: string[], tx?: Tx) {
  return db(tx).vendor.findMany({ where: { id: { in: ids } }, select: { id: true, nama: true } });
}
export function findPegawaiNama(id: string, tx?: Tx) {
  return db(tx).pegawai.findFirst({ where: { id }, select: { namaLengkap: true } });
}
