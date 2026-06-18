// tarifLabTestDal — akses Prisma MURNI domain master/TarifLabTest (FLOWS §2).
// Edge (labTest × penjaminKode × jenisRuangan) → harga. UPSERT by triple; list keyset cursor.
// Terima `tx?`. Paralel tarifTindakanDal.

import { db, type Tx } from "@/lib/db/prisma";

export interface TarifLabTriple {
  labTestId: string;
  penjaminKode: string;
  jenisRuangan: string;
}

export type TarifLabEntity = Awaited<ReturnType<typeof findById>>;
export type TarifLabListEntity = Awaited<ReturnType<typeof list>>["items"][number];

// ── Reads ──────────────────────────────────────────────────────────────────--
export function findById(id: string, tx?: Tx) {
  return db(tx).tarifLabTest.findUnique({ where: { id } });
}

export function findByTriple(triple: TarifLabTriple, tx?: Tx) {
  return db(tx).tarifLabTest.findUnique({
    where: { labTestId_penjaminKode_jenisRuangan: triple },
  });
}

/** List + filter. Cursor by id (createdAt asc → stabil saat tambah). */
export async function list(
  params: { labTestId?: string; penjaminKode?: string; jenisRuangan?: string; cursor?: string; limit: number },
  tx?: Tx,
) {
  const { labTestId, penjaminKode, jenisRuangan, cursor, limit } = params;
  const rows = await db(tx).tarifLabTest.findMany({
    where: {
      ...(labTestId ? { labTestId } : {}),
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

export function upsert(data: TarifLabTriple & { harga: number } & TarifKomponen, tx?: Tx) {
  const { labTestId, penjaminKode, jenisRuangan, harga, jasaSarana, jasaMedis, jasaParamedis } = data;
  return db(tx).tarifLabTest.upsert({
    where: { labTestId_penjaminKode_jenisRuangan: { labTestId, penjaminKode, jenisRuangan } },
    create: { labTestId, penjaminKode, jenisRuangan, harga, jasaSarana, jasaMedis, jasaParamedis },
    update: { harga, jasaSarana, jasaMedis, jasaParamedis },
  });
}

// ── Delete (hard) ──────────────────────────────────────────────────────────---
export function deleteById(id: string, tx?: Tx) {
  return db(tx).tarifLabTest.delete({ where: { id } });
}

// ── Guard (eksistensi lab test; soft-delete difilter) ─────────────────────────
export function findLabTest(id: string, tx?: Tx) {
  return db(tx).labTest.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
}
