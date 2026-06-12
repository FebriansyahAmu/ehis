// tarifTindakanDal — akses Prisma MURNI domain master/TarifTindakan (FLOWS §2).
// Edge (tindakan × penjaminKode × jenisRuangan) → harga. UPSERT by triple; list keyset cursor.
// Terima `tx?`. Selaras layananUnitDal.

import { db, type Tx } from "@/lib/db/prisma";

export interface TarifTriple {
  tindakanId: string;
  penjaminKode: string;
  jenisRuangan: string;
}

export type TarifEntity = Awaited<ReturnType<typeof findById>>;
export type TarifListEntity = Awaited<ReturnType<typeof list>>["items"][number];

// ── Reads ──────────────────────────────────────────────────────────────────--
export function findById(id: string, tx?: Tx) {
  return db(tx).tarifTindakan.findUnique({ where: { id } });
}

export function findByTriple(triple: TarifTriple, tx?: Tx) {
  return db(tx).tarifTindakan.findUnique({
    where: { tindakanId_penjaminKode_jenisRuangan: triple },
  });
}

/** List + filter. Cursor by id (createdAt asc → stabil saat tambah). */
export async function list(
  params: { tindakanId?: string; penjaminKode?: string; jenisRuangan?: string; cursor?: string; limit: number },
  tx?: Tx,
) {
  const { tindakanId, penjaminKode, jenisRuangan, cursor, limit } = params;
  const rows = await db(tx).tarifTindakan.findMany({
    where: {
      ...(tindakanId ? { tindakanId } : {}),
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
export function upsert(data: TarifTriple & { harga: number }, tx?: Tx) {
  const { tindakanId, penjaminKode, jenisRuangan, harga } = data;
  return db(tx).tarifTindakan.upsert({
    where: { tindakanId_penjaminKode_jenisRuangan: { tindakanId, penjaminKode, jenisRuangan } },
    create: { tindakanId, penjaminKode, jenisRuangan, harga },
    update: { harga },
  });
}

// ── Delete (hard) ──────────────────────────────────────────────────────────---
export function deleteById(id: string, tx?: Tx) {
  return db(tx).tarifTindakan.delete({ where: { id } });
}

// ── Guard (eksistensi tindakan; soft-delete difilter) ─────────────────────────
export function findTindakan(id: string, tx?: Tx) {
  return db(tx).tindakan.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
}
