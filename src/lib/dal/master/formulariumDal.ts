// formulariumDal — akses Prisma MURNI domain master/FormulariumObat (FLOWS §2).
// Join table Obat ⇄ Location → HARD delete (tak ada soft-delete/version). Reads meng-INCLUDE
// location (kode dibaca dari sana, BUKAN diduplikasi). Terima `tx?`. Bentuk persis layananUnitDal.

import { db, type Tx } from "@/lib/db/prisma";

export interface CreateFormulariumData {
  obatId: string;
  locationId: string;
}

// Kode ruangan dibaca bersama edge (read-only di domain ini) untuk DTO matriks.
const includeRel = {
  location: { select: { id: true, kode: true } },
} as const;

export type FormulariumEntity = Awaited<ReturnType<typeof findById>>;
export type FormulariumListEntity = Awaited<ReturnType<typeof list>>["items"][number];

// ── Create ─────────────────────────────────────────────────────────────────--
export function create(data: CreateFormulariumData, tx?: Tx) {
  return db(tx).formulariumObat.create({ data, include: includeRel });
}

// ── Reads ──────────────────────────────────────────────────────────────────--
export function findById(id: string, tx?: Tx) {
  return db(tx).formulariumObat.findUnique({ where: { id }, include: includeRel });
}

/** Idempotency / cegah dobel — edge untuk pasangan (obat, ruangan). */
export function findByPair(obatId: string, locationId: string, tx?: Tx) {
  return db(tx).formulariumObat.findUnique({
    where: { obatId_locationId: { obatId, locationId } },
    include: includeRel,
  });
}

/** List + filter (obatId / locationId). Cursor by id (createdAt asc → stabil saat tambah). */
export async function list(
  params: { obatId?: string; locationId?: string; cursor?: string; limit: number },
  tx?: Tx,
) {
  const { obatId, locationId, cursor, limit } = params;
  const rows = await db(tx).formulariumObat.findMany({
    where: {
      ...(obatId ? { obatId } : {}),
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
  return db(tx).formulariumObat.delete({ where: { id } });
}

// ── Read klinis: obat ter-formularium (join FormulariumObat → Obat) ────────────
// Untuk endpoint /master/obat-tersedia (gate clinical.resep). Hanya obat AKTIF & non-deleted;
// opsional difilter ruangan (kode). Include obat (field ramping utk katalog FE) + kode ruangan
// → Service agregasi distinct per obat dgn daftar ruanganKodes.
export function listAssignedObat(params: { ruanganKode?: string }, tx?: Tx) {
  return db(tx).formulariumObat.findMany({
    where: {
      obat: { deletedAt: null, status: "Aktif" },
      ...(params.ruanganKode ? { location: { kode: params.ruanganKode } } : {}),
    },
    include: {
      obat: {
        select: {
          id: true, kode: true, namaGenerik: true, namaDagang: true,
          bentuk: true, kekuatan: true, satuanTerkecil: true,
          kategori: true, golongan: true, isHAM: true,
          efekSamping: true, kfa: true, // efek samping + pemetaan KFA (BZA zat aktif) utk konsumsi klinis/alergi
        },
      },
      location: { select: { kode: true } },
    },
    orderBy: [{ obat: { namaGenerik: "asc" } }],
  });
}

// ── Guards (eksistensi parent; soft-delete difilter) ──────────────────────────
export function findObat(id: string, tx?: Tx) {
  return db(tx).obat.findFirst({ where: { id, deletedAt: null }, select: { id: true, namaGenerik: true } });
}

export function findLocation(id: string, tx?: Tx) {
  return db(tx).location.findFirst({ where: { id, deletedAt: null }, select: { id: true, kode: true, nama: true } });
}
