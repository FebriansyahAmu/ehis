// distribusiDal — akses Prisma MURNI inventory.DistribusiRequest (+ items). Header + baris (qtyMinta/
// qtyKeluar). Reads include items. Pola identik receiptDal/transferDal.

import { db, type Tx } from "@/lib/db/prisma";

export type DistribusiStatus = "Draft" | "Diproses" | "Selesai" | "Dibatalkan";

export interface DistribusiHeader {
  noDokumen: string;
  tanggal: Date;
  fromLocationId: string;
  toLocationId: string;
  status: DistribusiStatus;
  pemohon: string;
  petugas?: string | null;
  actorId?: string | null;
}
export interface DistribusiLineData {
  itemJenis: "Obat" | "BMHP";
  itemId: string;
  qtyMinta: number;
  qtyKeluar: number;
}

const include = { items: true } as const;
export type DistribusiEntity = NonNullable<Awaited<ReturnType<typeof findById>>>;

export function createRequest(h: DistribusiHeader, lines: DistribusiLineData[], tx?: Tx) {
  return db(tx).distribusiRequest.create({ data: { ...h, items: { create: lines } }, include });
}

export function findById(id: string, tx?: Tx) {
  return db(tx).distribusiRequest.findFirst({ where: { id, deletedAt: null }, include });
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
  return db(tx).distribusiRequest.findMany({
    where, include,
    orderBy: [{ tanggal: "desc" }, { id: "desc" }],
    take: p.limit,
    ...(p.cursorId ? { cursor: { id: p.cursorId }, skip: 1 } : {}),
  });
}

export function updateHeader(id: string, data: { status: DistribusiStatus; petugas?: string; postedAt?: Date }, tx?: Tx) {
  return db(tx).distribusiRequest.update({ where: { id }, data });
}

/** Set qty yang benar-benar dikeluarkan untuk satu baris (saat fulfill). */
export function setItemKeluar(itemRowId: string, qtyKeluar: number, tx?: Tx) {
  return db(tx).distribusiItem.update({ where: { id: itemRowId }, data: { qtyKeluar } });
}
