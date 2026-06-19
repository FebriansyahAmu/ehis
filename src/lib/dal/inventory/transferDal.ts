// transferDal — akses Prisma MURNI inventory.StockTransfer (+ items). Header + baris (nested create).
// Reads include items. Pola identik receiptDal.

import { db, type Tx } from "@/lib/db/prisma";

export type TransferStatus = "Draft" | "Diproses" | "Selesai" | "Dibatalkan";

export interface TransferHeader {
  noDokumen: string;
  tanggal: Date;
  fromLocationId: string;
  toLocationId: string;
  status: TransferStatus;
  petugas: string;
  actorId?: string | null;
}
export interface TransferLineData {
  itemJenis: "Obat" | "BMHP";
  itemId: string;
  batchNo: string | null;
  qty: number;
}

const include = { items: true } as const;
export type TransferEntity = NonNullable<Awaited<ReturnType<typeof findById>>>;

export function createTransfer(h: TransferHeader, lines: TransferLineData[], tx?: Tx) {
  return db(tx).stockTransfer.create({ data: { ...h, items: { create: lines } }, include });
}

export function findById(id: string, tx?: Tx) {
  return db(tx).stockTransfer.findFirst({ where: { id, deletedAt: null }, include });
}

export interface ListParams {
  status?: string;
  fromLocationId?: string;
  toLocationId?: string;
  cursorId?: string;
  limit: number;
}
export function list(p: ListParams, tx?: Tx) {
  const where: Record<string, unknown> = { deletedAt: null };
  if (p.status) where.status = p.status;
  if (p.fromLocationId) where.fromLocationId = p.fromLocationId;
  if (p.toLocationId) where.toLocationId = p.toLocationId;
  return db(tx).stockTransfer.findMany({
    where, include,
    orderBy: [{ tanggal: "desc" }, { id: "desc" }],
    take: p.limit,
    ...(p.cursorId ? { cursor: { id: p.cursorId }, skip: 1 } : {}),
  });
}

export function updateStatus(id: string, data: { status: TransferStatus; postedAt?: Date }, tx?: Tx) {
  return db(tx).stockTransfer.update({ where: { id }, data });
}
