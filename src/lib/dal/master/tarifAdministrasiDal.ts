// tarifAdministrasiDal — akses Prisma MURNI domain master/TarifAdministrasi (FLOWS §2).
// Edge (unit × penjaminKode) → biaya/kunjungan. UPSERT by pair; list keyset cursor. Terima `tx?`.
// Paralel tarifKamarDal.

import { db, type Tx } from "@/lib/db/prisma";

export interface TarifAdministrasiPair {
  unit: string;
  penjaminKode: string;
}

export type TarifAdministrasiEntity = Awaited<ReturnType<typeof findById>>;
export type TarifAdministrasiListEntity = Awaited<ReturnType<typeof list>>["items"][number];

// ── Reads ──────────────────────────────────────────────────────────────────---
export function findById(id: string, tx?: Tx) {
  return db(tx).tarifAdministrasi.findUnique({ where: { id } });
}

export function findByPair(pair: TarifAdministrasiPair, tx?: Tx) {
  return db(tx).tarifAdministrasi.findUnique({
    where: { unit_penjaminKode: pair },
  });
}

/** List + filter. Cursor by id (createdAt asc → stabil saat tambah). */
export async function list(
  params: { unit?: string; penjaminKode?: string; cursor?: string; limit: number },
  tx?: Tx,
) {
  const { unit, penjaminKode, cursor, limit } = params;
  const rows = await db(tx).tarifAdministrasi.findMany({
    where: {
      ...(unit ? { unit } : {}),
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

export function upsert(data: TarifAdministrasiPair & { harga: number } & TarifKomponen & TarifSkMeta, tx?: Tx) {
  const { unit, penjaminKode, harga, jasaSarana, jasaMedis, jasaParamedis, noSk, tglSk } = data;
  return db(tx).tarifAdministrasi.upsert({
    where: { unit_penjaminKode: { unit, penjaminKode } },
    create: { unit, penjaminKode, harga, jasaSarana, jasaMedis, jasaParamedis, noSk, tglSk },
    update: { harga, jasaSarana, jasaMedis, jasaParamedis, noSk, tglSk },
  });
}

// ── Delete (hard) ──────────────────────────────────────────────────────────---
export function deleteById(id: string, tx?: Tx) {
  return db(tx).tarifAdministrasi.delete({ where: { id } });
}
