// layananUnitLabDal — akses Prisma MURNI domain master/LayananUnitLab (FLOWS §2).
// Join table LabTest ⇄ Location → HARD delete (tak ada soft-delete/version). Reads meng-INCLUDE
// location (kode dibaca dari sana, BUKAN diduplikasi). Terima `tx?`. Selaras layananUnitDal.

import { db, type Tx } from "@/lib/db/prisma";

export interface CreateLayananLabData {
  labTestId: string;
  locationId: string;
}

// Kode ruangan dibaca bersama edge (read-only di domain ini) untuk DTO matriks.
const includeRel = {
  location: { select: { id: true, kode: true } },
} as const;

export type LayananLabEntity = Awaited<ReturnType<typeof findById>>;
export type LayananLabListEntity = Awaited<ReturnType<typeof list>>["items"][number];

// ── Create ─────────────────────────────────────────────────────────────────--
export function create(data: CreateLayananLabData, tx?: Tx) {
  return db(tx).layananUnitLab.create({ data, include: includeRel });
}

// ── Reads ──────────────────────────────────────────────────────────────────--
export function findById(id: string, tx?: Tx) {
  return db(tx).layananUnitLab.findUnique({ where: { id }, include: includeRel });
}

/** Idempotency / cegah dobel — edge untuk pasangan (lab test, ruangan). */
export function findByPair(labTestId: string, locationId: string, tx?: Tx) {
  return db(tx).layananUnitLab.findUnique({
    where: { labTestId_locationId: { labTestId, locationId } },
    include: includeRel,
  });
}

/** List + filter (labTestId / locationId). Cursor by id (createdAt asc → stabil saat tambah). */
export async function list(
  params: { labTestId?: string; locationId?: string; cursor?: string; limit: number },
  tx?: Tx,
) {
  const { labTestId, locationId, cursor, limit } = params;
  const rows = await db(tx).layananUnitLab.findMany({
    where: {
      ...(labTestId ? { labTestId } : {}),
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

// ── Read klinis: tes lab ter-assign (join LayananUnitLab → LabTest) ────────────
// Untuk endpoint /master/lab-test-tersedia (gate clinical.tindakan). Hanya tes AKTIF & non-deleted
// yang ter-assign ke ruangan LABORATORIUM (location_type=Laboratorium) — "unit tujuan order lab".
// Opsional difilter ruangan (kode). Include lab test (field ramping) + kode ruangan → Service
// agregasi distinct per tes dgn daftar ruanganKodes. HARGA: include relasi tarif yang match
// (penjaminKode, jenisRuangan) — keduanya wajib bareng; bila absen, where pakai "" → harga null.
export function listAssignedLabTest(
  params: { ruanganKode?: string; penjaminKode?: string; jenisRuangan?: string },
  tx?: Tx,
) {
  return db(tx).layananUnitLab.findMany({
    where: {
      labTest: { deletedAt: null, active: true },
      location: {
        deletedAt: null,
        locationType: "Laboratorium",
        ...(params.ruanganKode ? { kode: params.ruanganKode } : {}),
      },
    },
    include: {
      labTest: {
        select: {
          id: true, kode: true, nama: true, kategori: true, waktuTunggu: true,
          tarif: {
            where: { penjaminKode: params.penjaminKode ?? "", jenisRuangan: params.jenisRuangan ?? "" },
            select: { harga: true },
            take: 1,
          },
        },
      },
      location: { select: { kode: true } },
    },
    orderBy: [{ labTest: { nama: "asc" } }],
  });
}

// ── Delete (hard) ────────────────────────────────────────────────────────────
export function deleteById(id: string, tx?: Tx) {
  return db(tx).layananUnitLab.delete({ where: { id } });
}

// ── Guards (eksistensi parent; soft-delete difilter) ──────────────────────────
export function findLabTest(id: string, tx?: Tx) {
  return db(tx).labTest.findFirst({ where: { id, deletedAt: null }, select: { id: true, nama: true } });
}

export function findLocation(id: string, tx?: Tx) {
  return db(tx).location.findFirst({ where: { id, deletedAt: null }, select: { id: true, kode: true, nama: true } });
}
