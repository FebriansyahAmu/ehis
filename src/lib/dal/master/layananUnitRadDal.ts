// layananUnitRadDal — akses Prisma MURNI domain master/LayananUnitRad (FLOWS §2).
// Join table RadCatalog ⇄ Location → HARD delete (tak ada soft-delete/version). Reads meng-INCLUDE
// location (kode dibaca dari sana). Terima `tx?`. Selaras layananUnitLabDal.

import { db, type Tx } from "@/lib/db/prisma";

export interface CreateLayananRadData {
  radCatalogId: string;
  locationId: string;
}

const includeRel = {
  location: { select: { id: true, kode: true } },
} as const;

export type LayananRadEntity = Awaited<ReturnType<typeof findById>>;
export type LayananRadListEntity = Awaited<ReturnType<typeof list>>["items"][number];

// ── Create ─────────────────────────────────────────────────────────────────--
export function create(data: CreateLayananRadData, tx?: Tx) {
  return db(tx).layananUnitRad.create({ data, include: includeRel });
}

// ── Reads ──────────────────────────────────────────────────────────────────--
export function findById(id: string, tx?: Tx) {
  return db(tx).layananUnitRad.findUnique({ where: { id }, include: includeRel });
}

/** Idempotency / cegah dobel — edge untuk pasangan (pemeriksaan rad, ruangan). */
export function findByPair(radCatalogId: string, locationId: string, tx?: Tx) {
  return db(tx).layananUnitRad.findUnique({
    where: { radCatalogId_locationId: { radCatalogId, locationId } },
    include: includeRel,
  });
}

/** List + filter (radCatalogId / locationId). Cursor by id (createdAt asc → stabil saat tambah). */
export async function list(
  params: { radCatalogId?: string; locationId?: string; cursor?: string; limit: number },
  tx?: Tx,
) {
  const { radCatalogId, locationId, cursor, limit } = params;
  const rows = await db(tx).layananUnitRad.findMany({
    where: {
      ...(radCatalogId ? { radCatalogId } : {}),
      ...(locationId ? { locationId } : {}),
    },
    include: includeRel,
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  return { items, nextCursor: hasMore ? items[items.length - 1].id : null };
}

// ── Read klinis: pemeriksaan rad ter-assign (join LayananUnitRad → RadCatalog) ─
// Untuk endpoint /master/rad-catalog-tersedia (gate clinical.tindakan). Hanya pemeriksaan AKTIF &
// non-deleted yang ter-assign ke ruangan RADIOLOGI (location_type=Radiologi) — "unit tujuan order rad".
// Opsional difilter ruangan (kode). Include rad catalog (field ramping + blok JSONB TAT/persiapan) +
// kode ruangan → Service agregasi distinct per pemeriksaan dgn daftar ruanganKodes. HARGA: include
// relasi tarif yang match (penjaminKode, jenisRuangan) — keduanya wajib bareng; absen → harga null.
export function listAssignedRadCatalog(
  params: { ruanganKode?: string; penjaminKode?: string; jenisRuangan?: string },
  tx?: Tx,
) {
  return db(tx).layananUnitRad.findMany({
    where: {
      radCatalog: { deletedAt: null, status: "Aktif" },
      location: {
        deletedAt: null,
        locationType: "Radiologi",
        ...(params.ruanganKode ? { kode: params.ruanganKode } : {}),
      },
    },
    include: {
      radCatalog: {
        select: {
          id: true, kode: true, nama: true, modalitas: true, modalitasSubtype: true,
          region: true, kategori: true, tatTarget: true, persiapan: true,
          tarif: {
            where: { penjaminKode: params.penjaminKode ?? "", jenisRuangan: params.jenisRuangan ?? "" },
            select: { harga: true },
            take: 1,
          },
        },
      },
      location: { select: { kode: true } },
    },
    orderBy: [{ radCatalog: { nama: "asc" } }],
  });
}

// ── Delete (hard) ────────────────────────────────────────────────────────────
export function deleteById(id: string, tx?: Tx) {
  return db(tx).layananUnitRad.delete({ where: { id } });
}

// ── Guards (eksistensi parent; soft-delete difilter) ──────────────────────────
export function findRadCatalog(id: string, tx?: Tx) {
  return db(tx).radCatalog.findFirst({ where: { id, deletedAt: null }, select: { id: true, nama: true } });
}

export function findLocation(id: string, tx?: Tx) {
  return db(tx).location.findFirst({ where: { id, deletedAt: null }, select: { id: true, kode: true, nama: true } });
}
