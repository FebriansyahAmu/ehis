// tarifKamarDal — akses Prisma MURNI domain master/TarifKamar (FLOWS §2).
// Edge (kelas × penjaminKode) → harga/hari. UPSERT by pair; list keyset cursor. Terima `tx?`.
// Paralel tarifLabTestDal (tanpa FK katalog — kelas = tier string).

import { db, type Tx } from "@/lib/db/prisma";

export interface TarifKamarPair {
  kelas: string;
  penjaminKode: string;
}

export type TarifKamarEntity = Awaited<ReturnType<typeof findById>>;
export type TarifKamarListEntity = Awaited<ReturnType<typeof list>>["items"][number];

// ── Reads ──────────────────────────────────────────────────────────────────---
export function findById(id: string, tx?: Tx) {
  return db(tx).tarifKamar.findUnique({ where: { id } });
}

export function findByPair(pair: TarifKamarPair, tx?: Tx) {
  return db(tx).tarifKamar.findUnique({
    where: { kelas_penjaminKode: pair },
  });
}

/** List + filter. Cursor by id (createdAt asc → stabil saat tambah). */
export async function list(
  params: { kelas?: string; penjaminKode?: string; cursor?: string; limit: number },
  tx?: Tx,
) {
  const { kelas, penjaminKode, cursor, limit } = params;
  const rows = await db(tx).tarifKamar.findMany({
    where: {
      ...(kelas ? { kelas } : {}),
      ...(penjaminKode ? { penjaminKode } : {}),
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  return { items, nextCursor: hasMore ? items[items.length - 1].id : null };
}

// ── Upsert (by pair) ──────────────────────────────────────────────────────────
export interface TarifKomponen {
  jasaSarana: number | null;
  jasaMedis: number | null;
  jasaParamedis: number | null;
}

export interface TarifSkMeta {
  noSk: string | null;
  tglSk: Date | null;
}

export function upsert(data: TarifKamarPair & { harga: number } & TarifKomponen & TarifSkMeta, tx?: Tx) {
  const { kelas, penjaminKode, harga, jasaSarana, jasaMedis, jasaParamedis, noSk, tglSk } = data;
  return db(tx).tarifKamar.upsert({
    where: { kelas_penjaminKode: { kelas, penjaminKode } },
    create: { kelas, penjaminKode, harga, jasaSarana, jasaMedis, jasaParamedis, noSk, tglSk },
    update: { harga, jasaSarana, jasaMedis, jasaParamedis, noSk, tglSk },
  });
}

// ── Delete (hard) ──────────────────────────────────────────────────────────---
export function deleteById(id: string, tx?: Tx) {
  return db(tx).tarifKamar.delete({ where: { id } });
}
