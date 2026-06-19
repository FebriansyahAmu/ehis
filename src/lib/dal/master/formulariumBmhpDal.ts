// formulariumBmhpDal — akses Prisma MURNI domain master/FormulariumBmhp (FLOWS §2).
// Join table BMHP ⇄ Location → HARD delete (tak ada soft-delete/version). Reads meng-INCLUDE
// location (kode dibaca dari sana, BUKAN diduplikasi). Terima `tx?`. Bentuk persis formulariumDal.

import { db, type Tx } from "@/lib/db/prisma";

export interface CreateFormulariumBmhpData {
  bmhpId: string;
  locationId: string;
}

// Kode ruangan dibaca bersama edge (read-only di domain ini) untuk DTO matriks.
const includeRel = {
  location: { select: { id: true, kode: true } },
} as const;

export type FormulariumBmhpEntity = Awaited<ReturnType<typeof findById>>;
export type FormulariumBmhpListEntity = Awaited<ReturnType<typeof list>>["items"][number];

// ── Create ─────────────────────────────────────────────────────────────────--
export function create(data: CreateFormulariumBmhpData, tx?: Tx) {
  return db(tx).formulariumBmhp.create({ data, include: includeRel });
}

// ── Reads ──────────────────────────────────────────────────────────────────--
export function findById(id: string, tx?: Tx) {
  return db(tx).formulariumBmhp.findUnique({ where: { id }, include: includeRel });
}

/** Idempotency / cegah dobel — edge untuk pasangan (bmhp, ruangan). */
export function findByPair(bmhpId: string, locationId: string, tx?: Tx) {
  return db(tx).formulariumBmhp.findUnique({
    where: { bmhpId_locationId: { bmhpId, locationId } },
    include: includeRel,
  });
}

/** List + filter (bmhpId / locationId). Cursor by id (createdAt asc → stabil saat tambah). */
export async function list(
  params: { bmhpId?: string; locationId?: string; cursor?: string; limit: number },
  tx?: Tx,
) {
  const { bmhpId, locationId, cursor, limit } = params;
  const rows = await db(tx).formulariumBmhp.findMany({
    where: {
      ...(bmhpId ? { bmhpId } : {}),
      ...(locationId ? { locationId } : {}),
    },
    include: includeRel,
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: limit + 1, // +1 → deteksi halaman berikutnya
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  return { items, nextCursor: hasMore ? items[items.length - 1].id : null };
}

// ── Delete (hard) ──────────────────────────────────────────────────────────---
export function deleteById(id: string, tx?: Tx) {
  return db(tx).formulariumBmhp.delete({ where: { id } });
}

// ── Guards (eksistensi parent; soft-delete difilter) ──────────────────────────
export function findBmhp(id: string, tx?: Tx) {
  return db(tx).bmhp.findFirst({ where: { id, deletedAt: null }, select: { id: true, nama: true } });
}

export function findLocation(id: string, tx?: Tx) {
  return db(tx).location.findFirst({ where: { id, deletedAt: null }, select: { id: true, kode: true, nama: true } });
}
