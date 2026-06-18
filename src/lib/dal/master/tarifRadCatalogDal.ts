// tarifRadCatalogDal — akses Prisma MURNI domain master/TarifRadCatalog (FLOWS §2).
// Edge (radCatalog × penjaminKode × jenisRuangan) → harga. UPSERT by triple; list keyset cursor.
// Terima `tx?`. Paralel tarifLabTestDal.

import { db, type Tx } from "@/lib/db/prisma";

export interface TarifRadTriple {
  radCatalogId: string;
  penjaminKode: string;
  jenisRuangan: string;
}

export type TarifRadEntity = Awaited<ReturnType<typeof findById>>;
export type TarifRadListEntity = Awaited<ReturnType<typeof list>>["items"][number];

// ── Reads ──────────────────────────────────────────────────────────────────--
export function findById(id: string, tx?: Tx) {
  return db(tx).tarifRadCatalog.findUnique({ where: { id } });
}

export function findByTriple(triple: TarifRadTriple, tx?: Tx) {
  return db(tx).tarifRadCatalog.findUnique({
    where: { radCatalogId_penjaminKode_jenisRuangan: triple },
  });
}

/** List + filter. Cursor by id (createdAt asc → stabil saat tambah). */
export async function list(
  params: { radCatalogId?: string; penjaminKode?: string; jenisRuangan?: string; cursor?: string; limit: number },
  tx?: Tx,
) {
  const { radCatalogId, penjaminKode, jenisRuangan, cursor, limit } = params;
  const rows = await db(tx).tarifRadCatalog.findMany({
    where: {
      ...(radCatalogId ? { radCatalogId } : {}),
      ...(penjaminKode ? { penjaminKode } : {}),
      ...(jenisRuangan ? { jenisRuangan } : {}),
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  return { items, nextCursor: hasMore ? items[items.length - 1].id : null };
}

// ── Upsert (by triple) ────────────────────────────────────────────────────────
export interface TarifKomponen {
  jasaSarana: number | null;
  jasaMedis: number | null;
  jasaParamedis: number | null;
}

export function upsert(data: TarifRadTriple & { harga: number } & TarifKomponen, tx?: Tx) {
  const { radCatalogId, penjaminKode, jenisRuangan, harga, jasaSarana, jasaMedis, jasaParamedis } = data;
  return db(tx).tarifRadCatalog.upsert({
    where: { radCatalogId_penjaminKode_jenisRuangan: { radCatalogId, penjaminKode, jenisRuangan } },
    create: { radCatalogId, penjaminKode, jenisRuangan, harga, jasaSarana, jasaMedis, jasaParamedis },
    update: { harga, jasaSarana, jasaMedis, jasaParamedis },
  });
}

// ── Delete (hard) ──────────────────────────────────────────────────────────---
export function deleteById(id: string, tx?: Tx) {
  return db(tx).tarifRadCatalog.delete({ where: { id } });
}

// ── Guard (eksistensi rad catalog; soft-delete difilter) ──────────────────────
export function findRadCatalog(id: string, tx?: Tx) {
  return db(tx).radCatalog.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
}
