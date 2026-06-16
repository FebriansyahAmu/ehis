// statusEnumDal — akses Prisma MURNI master.EnumEntry. Tanpa aturan bisnis.
// Terima `tx?`. Read filter deletedAt: null. Katalog leaf → tanpa optimistic-version.
// Counter kode per-grup (scope = prefix, mis. "SPL") — atomik, anti-race (pola asesmen/skala).

import { db, type Tx } from "@/lib/db/prisma";

export interface EnumEntryData {
  groupKey: string;
  kode: string;
  label: string;
  deskripsi: string;
  tone: string;
  icon: string | null;
  urutan: number;
  status: string;
}

/** Patch parsial — `kode`/`groupKey` immutable (tak ikut). */
export type EnumEntryPatch = Partial<Omit<EnumEntryData, "kode" | "groupKey">>;

export type EnumEntryEntity = NonNullable<Awaited<ReturnType<typeof findById>>>;

const ALIVE = { deletedAt: null } as const;

// Counter kode enum (atomik, anti-race) per scope (prefix grup, mis. "SPL").
export async function nextEnumSeq(scope: string, tx?: Tx): Promise<number> {
  const row = await db(tx).enumCounter.upsert({
    where: { scope },
    create: { scope, lastSeq: 1 },
    update: { lastSeq: { increment: 1 } },
    select: { lastSeq: true },
  });
  return row.lastSeq;
}

/** Urutan tertinggi grup (utk default urutan entri baru). 0 bila grup kosong. */
export async function maxUrutan(groupKey: string, tx?: Tx): Promise<number> {
  const row = await db(tx).enumEntry.aggregate({
    where: { groupKey, ...ALIVE },
    _max: { urutan: true },
  });
  return row._max.urutan ?? 0;
}

export function create(data: EnumEntryData, tx?: Tx) {
  return db(tx).enumEntry.create({ data });
}

export function findById(id: string, tx?: Tx) {
  return db(tx).enumEntry.findFirst({ where: { id, ...ALIVE } });
}

export function update(id: string, data: EnumEntryPatch, tx?: Tx) {
  return db(tx).enumEntry.update({ where: { id }, data });
}

/** Soft-delete (deletedAt + status NonAktif). Idempoten via where deletedAt: null. */
export async function softDelete(id: string, tx?: Tx) {
  const r = await db(tx).enumEntry.updateMany({
    where: { id, ...ALIVE },
    data: { deletedAt: new Date(), status: "NonAktif" },
  });
  return r.count;
}

export interface ListParams {
  groupKey?: string;
  q?: string;
  status?: string;
  limit: number;
}

export function list(p: ListParams, tx?: Tx) {
  const where: Record<string, unknown> = { ...ALIVE };
  if (p.groupKey) where.groupKey = p.groupKey;
  if (p.status) where.status = p.status;
  if (p.q) {
    where.OR = [
      { kode: { contains: p.q, mode: "insensitive" } },
      { label: { contains: p.q, mode: "insensitive" } },
      { deskripsi: { contains: p.q, mode: "insensitive" } },
    ];
  }
  return db(tx).enumEntry.findMany({
    where,
    orderBy: [{ groupKey: "asc" }, { urutan: "asc" }, { kode: "asc" }, { id: "asc" }],
    take: p.limit,
  });
}
