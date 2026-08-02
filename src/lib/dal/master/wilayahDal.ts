// wilayahDal — akses Prisma MURNI master.Wilayah (referensi Kemendagri). Tanpa aturan
// bisnis. Terima `tx?`. Reference read-only → tanpa deletedAt/version.

import { db, type Tx } from "@/lib/db/prisma";

export interface WilayahListFilter {
  level?: number;
  parentKode?: string;
  q?: string;
  limit: number;
}

/** List by filter (level/parent/q). `orderBy kode` → hierarki natural terurut. */
export function list(f: WilayahListFilter, tx?: Tx) {
  const where: {
    level?: number;
    parentKode?: string;
    nama?: { contains: string; mode: "insensitive" };
  } = {};
  if (f.level !== undefined) where.level = f.level;
  if (f.parentKode !== undefined) where.parentKode = f.parentKode;
  if (f.q) where.nama = { contains: f.q, mode: "insensitive" };
  return db(tx).wilayah.findMany({ where, orderBy: { kode: "asc" }, take: f.limit });
}

/** Ambil beberapa kode sekaligus (mode ancestors — rekonstruksi rantai picker). */
export function findByKodes(kodes: string[], tx?: Tx) {
  return db(tx).wilayah.findMany({ where: { kode: { in: kodes } }, orderBy: { kode: "asc" } });
}

/** Jumlah baris per level (untuk stat header). */
export function groupCountByLevel(tx?: Tx) {
  return db(tx).wilayah.groupBy({ by: ["level"], _count: { _all: true } });
}
