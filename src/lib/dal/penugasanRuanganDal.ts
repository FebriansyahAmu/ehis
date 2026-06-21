// penugasanRuanganDal — akses Prisma MURNI domain master/PenugasanRuangan (FLOWS §2).
// Join table Pegawai ⇄ Location → HARD delete (tak ada soft-delete/version). Reads meng-INCLUDE
// pegawai + location (identitas & nama ruangan dibaca dari sana, BUKAN diduplikasi). Terima `tx?`.

import { db, type Tx } from "@/lib/db/prisma";

export interface CreatePenugasanData {
  pegawaiId: string;
  locationId: string;
  peran?: string;
}

// Identitas Pegawai + ruangan yang dibaca bersama Penugasan (read-only di domain ini).
const includeRel = {
  pegawai: {
    select: {
      id: true, nip: true, namaLengkap: true,
      gelarDepan: true, gelarBelakang: true, profesi: true,
    },
  },
  location: { select: { id: true, kode: true, nama: true } },
} as const;

export type PenugasanEntity = Awaited<ReturnType<typeof findById>>;
export type PenugasanListEntity = Awaited<ReturnType<typeof list>>["items"][number];

// ── Create ─────────────────────────────────────────────────────────────────--
export function create(data: CreatePenugasanData, tx?: Tx) {
  return db(tx).penugasanRuangan.create({ data, include: includeRel });
}

// ── Reads ──────────────────────────────────────────────────────────────────--
export function findById(id: string, tx?: Tx) {
  return db(tx).penugasanRuangan.findUnique({ where: { id }, include: includeRel });
}

/** Idempotency / cegah dobel — penugasan untuk pasangan (pegawai, ruangan). */
export function findByPair(pegawaiId: string, locationId: string, tx?: Tx) {
  return db(tx).penugasanRuangan.findUnique({
    where: { pegawaiId_locationId: { pegawaiId, locationId } },
    include: includeRel,
  });
}

/** List + filter (locationId / pegawaiId). Cursor by id (createdAt desc). */
export async function list(
  params: { locationId?: string; pegawaiId?: string; cursor?: string; limit: number },
  tx?: Tx,
) {
  const { locationId, pegawaiId, cursor, limit } = params;
  const rows = await db(tx).penugasanRuangan.findMany({
    where: {
      ...(locationId ? { locationId } : {}),
      ...(pegawaiId ? { pegawaiId } : {}),
    },
    include: includeRel,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1, // +1 → deteksi halaman berikutnya
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  return { items, nextCursor: hasMore ? items[items.length - 1].id : null };
}

/** Roster petugas: penugasan ber-pegawai AKTIF, opsional per-ruangan & per-profesi.
 *  Dipakai endpoint klinis (dropdown PJ/DPJP) — tanpa pagination (roster ruangan kecil). */
export function listPetugas(
  params: { locationId?: string; profesi?: string },
  tx?: Tx,
) {
  return db(tx).penugasanRuangan.findMany({
    where: {
      ...(params.locationId ? { locationId: params.locationId } : {}),
      pegawai: {
        deletedAt: null,
        isActive: true,
        ...(params.profesi ? { profesi: params.profesi } : {}),
      },
    },
    include: includeRel,
    orderBy: [{ pegawai: { namaLengkap: "asc" } }],
  });
}

/** Roster lintas beberapa ruangan (mis. semua Location Laboratorium) — pegawai AKTIF.
 *  Dipakai endpoint penunjang (roster Lab → cek penerima/analis & dropdown validator). */
export function listPetugasByLocations(
  params: { locationIds: string[]; profesi?: string },
  tx?: Tx,
) {
  if (params.locationIds.length === 0) return Promise.resolve([] as PenugasanListEntity[]);
  return db(tx).penugasanRuangan.findMany({
    where: {
      locationId: { in: params.locationIds },
      pegawai: {
        deletedAt: null,
        isActive: true,
        ...(params.profesi ? { profesi: params.profesi } : {}),
      },
    },
    include: includeRel,
    orderBy: [{ pegawai: { namaLengkap: "asc" } }],
  });
}

// ── Delete (hard) ────────────────────────────────────────────────────────────
export function deleteById(id: string, tx?: Tx) {
  return db(tx).penugasanRuangan.delete({ where: { id } });
}

// ── Guards (eksistensi parent; soft-delete difilter) ──────────────────────────
export function findPegawai(id: string, tx?: Tx) {
  return db(tx).pegawai.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
}

export function findLocation(id: string, tx?: Tx) {
  return db(tx).location.findFirst({ where: { id, deletedAt: null }, select: { id: true, nama: true } });
}
