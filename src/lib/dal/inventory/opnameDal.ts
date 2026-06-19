// opnameDal — akses Prisma MURNI inventory.OpnameSession (+ items). Header + baris snapshot
// (qtySistem) + isian fisik (qtyFisik/alasan). Reads include items terurut. Pola identik receiptDal.

import { db, type Tx } from "@/lib/db/prisma";

export type OpnameStatus = "Draft" | "Counting" | "Review" | "Posted";

export interface OpnameHeader {
  noDokumen: string;
  tanggal: Date;
  locationId: string;
  status: OpnameStatus;
  petugas: string;
  actorId?: string | null;
}
export interface OpnameLineData {
  itemJenis: "Obat" | "BMHP";
  itemId: string;
  qtySistem: number;
  qtyFisik?: number | null;
  alasan?: string | null;
}

const include = { items: { orderBy: { id: "asc" as const } } } as const;
export type OpnameEntity = NonNullable<Awaited<ReturnType<typeof findById>>>;

export function createSession(h: OpnameHeader, lines: OpnameLineData[], tx?: Tx) {
  return db(tx).opnameSession.create({ data: { ...h, items: { create: lines } }, include });
}

export function findById(id: string, tx?: Tx) {
  return db(tx).opnameSession.findFirst({ where: { id, deletedAt: null }, include });
}

export interface ListParams {
  status?: string;
  locationId?: string;
  cursorId?: string;
  limit: number;
}
export function list(p: ListParams, tx?: Tx) {
  const where: Record<string, unknown> = { deletedAt: null };
  if (p.status) where.status = p.status;
  if (p.locationId) where.locationId = p.locationId;
  return db(tx).opnameSession.findMany({
    where, include,
    orderBy: [{ tanggal: "desc" }, { id: "desc" }],
    take: p.limit,
    ...(p.cursorId ? { cursor: { id: p.cursorId }, skip: 1 } : {}),
  });
}

export function updateItem(itemRowId: string, data: { qtyFisik: number | null; alasan: string | null }, tx?: Tx) {
  return db(tx).opnameItem.update({ where: { id: itemRowId }, data });
}

export function updateStatus(id: string, data: { status: OpnameStatus; postedAt?: Date }, tx?: Tx) {
  return db(tx).opnameSession.update({ where: { id }, data });
}
