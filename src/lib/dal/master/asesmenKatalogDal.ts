// asesmenKatalogDal — akses Prisma MURNI master.AsesmenItem. Tanpa aturan bisnis.
// Terima `tx?`. Read filter deletedAt: null. Katalog leaf → tanpa optimistic-version.
// Counter kode per-kategori (scope = prefix, mis. "ALG-OB") — atomik, anti-race (pola skala/sdki).

import { db, type Tx } from "@/lib/db/prisma";

export interface AsesmenData {
  kode: string;
  nama: string;
  kategori: string;
  deskripsi: string;
  snomedCode: string | null;
  severityDefault: string | null;
  status: string;
}

/** Patch parsial — `kode`/`kategori` immutable (tak ikut). */
export type AsesmenPatch = Partial<Omit<AsesmenData, "kode" | "kategori">>;

export type AsesmenEntity = NonNullable<Awaited<ReturnType<typeof findById>>>;

const ALIVE = { deletedAt: null } as const;

// Counter kode asesmen (atomik, anti-race) per scope (prefix kategori, mis. "ALG-OB").
export async function nextAsesmenSeq(scope: string, tx?: Tx): Promise<number> {
  const row = await db(tx).asesmenCounter.upsert({
    where: { scope },
    create: { scope, lastSeq: 1 },
    update: { lastSeq: { increment: 1 } },
    select: { lastSeq: true },
  });
  return row.lastSeq;
}

export function create(data: AsesmenData, tx?: Tx) {
  return db(tx).asesmenItem.create({ data });
}

export function findById(id: string, tx?: Tx) {
  return db(tx).asesmenItem.findFirst({ where: { id, ...ALIVE } });
}

export function update(id: string, data: AsesmenPatch, tx?: Tx) {
  return db(tx).asesmenItem.update({ where: { id }, data });
}

/** Soft-delete (deletedAt + status Non_Aktif). Idempoten via where deletedAt: null. */
export async function softDelete(id: string, tx?: Tx) {
  const r = await db(tx).asesmenItem.updateMany({
    where: { id, ...ALIVE },
    data: { deletedAt: new Date(), status: "Non_Aktif" },
  });
  return r.count;
}

export interface ListParams {
  kategori?: string;
  q?: string;
  status?: string;
  limit: number;
}

export function list(p: ListParams, tx?: Tx) {
  const where: Record<string, unknown> = { ...ALIVE };
  if (p.kategori) where.kategori = p.kategori;
  if (p.status) where.status = p.status;
  if (p.q) {
    where.OR = [
      { kode: { contains: p.q, mode: "insensitive" } },
      { nama: { contains: p.q, mode: "insensitive" } },
      { snomedCode: { contains: p.q, mode: "insensitive" } },
    ];
  }
  return db(tx).asesmenItem.findMany({
    where,
    orderBy: [{ kategori: "asc" }, { kode: "asc" }, { id: "asc" }],
    take: p.limit,
  });
}
