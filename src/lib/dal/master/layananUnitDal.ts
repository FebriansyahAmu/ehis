// layananUnitDal — akses Prisma MURNI domain master/LayananUnit (FLOWS §2).
// Join table Tindakan ⇄ Location → HARD delete (tak ada soft-delete/version). Reads meng-INCLUDE
// location (kode dibaca dari sana, BUKAN diduplikasi). Terima `tx?`. Selaras penugasanRuanganDal.

import { db, type Tx } from "@/lib/db/prisma";

export interface CreateLayananData {
  tindakanId: string;
  locationId: string;
}

// Kode ruangan dibaca bersama edge (read-only di domain ini) untuk DTO matriks.
const includeRel = {
  location: { select: { id: true, kode: true } },
} as const;

export type LayananEntity = Awaited<ReturnType<typeof findById>>;
export type LayananListEntity = Awaited<ReturnType<typeof list>>["items"][number];

// ── Create ─────────────────────────────────────────────────────────────────--
export function create(data: CreateLayananData, tx?: Tx) {
  return db(tx).layananUnit.create({ data, include: includeRel });
}

// ── Reads ──────────────────────────────────────────────────────────────────--
export function findById(id: string, tx?: Tx) {
  return db(tx).layananUnit.findUnique({ where: { id }, include: includeRel });
}

/** Idempotency / cegah dobel — edge untuk pasangan (tindakan, ruangan). */
export function findByPair(tindakanId: string, locationId: string, tx?: Tx) {
  return db(tx).layananUnit.findUnique({
    where: { tindakanId_locationId: { tindakanId, locationId } },
    include: includeRel,
  });
}

/** List + filter (tindakanId / locationId). Cursor by id (createdAt asc → stabil saat tambah). */
export async function list(
  params: { tindakanId?: string; locationId?: string; cursor?: string; limit: number },
  tx?: Tx,
) {
  const { tindakanId, locationId, cursor, limit } = params;
  const rows = await db(tx).layananUnit.findMany({
    where: {
      ...(tindakanId ? { tindakanId } : {}),
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

// ── Delete (hard) ────────────────────────────────────────────────────────────
export function deleteById(id: string, tx?: Tx) {
  return db(tx).layananUnit.delete({ where: { id } });
}

// ── Read klinis: tindakan ter-assign (join LayananUnit → Tindakan) ─────────────
// Untuk endpoint /master/tindakan-tersedia (gate clinical.tindakan). Hanya tindakan AKTIF &
// non-deleted; opsional difilter ruangan (kode). Include tindakan (field ramping) + kode
// ruangan → Service agregasi distinct per tindakan dgn daftar ruanganKodes.
export function listAssignedTindakan(params: { ruanganKode?: string }, tx?: Tx) {
  return db(tx).layananUnit.findMany({
    where: {
      tindakan: { deletedAt: null, active: true },
      ...(params.ruanganKode ? { location: { kode: params.ruanganKode } } : {}),
    },
    include: {
      tindakan: {
        select: { id: true, kode: true, nama: true, kategori: true, kompleksitas: true },
      },
      location: { select: { kode: true } },
    },
    orderBy: [{ tindakan: { nama: "asc" } }],
  });
}

// ── Guards (eksistensi parent; soft-delete difilter) ──────────────────────────
export function findTindakan(id: string, tx?: Tx) {
  return db(tx).tindakan.findFirst({ where: { id, deletedAt: null }, select: { id: true, nama: true } });
}

export function findLocation(id: string, tx?: Tx) {
  return db(tx).location.findFirst({ where: { id, deletedAt: null }, select: { id: true, kode: true, nama: true } });
}
