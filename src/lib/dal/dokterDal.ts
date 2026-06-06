// dokterDal — akses Prisma MURNI domain master/Dokter (FLOWS §2). Tak ada aturan bisnis.
// Terima `tx?` (transaksi dimiliki Service). Soft-delete difilter default.
//
// Dokter = ekstensi 1:1 Pegawai → reads meng-INCLUDE relasi `pegawai` (identitas dibaca
// dari sana, BUKAN diduplikasi — doc §B). NIK tetap enc di kolom; masking di Service.
// Pointer denormalized `Pegawai.practitionerId` di-maintain via linkPegawai/unlinkPegawai
// (system-maintained, BUKAN field ber-version → update langsung tanpa version bump).

import { db, type Tx } from "@/lib/db/prisma";

type SpesialisKode =
  | "Umum" | "SpJP" | "SpPD" | "SpA" | "SpOG" | "SpB" | "SpAn" | "SpS"
  | "SpM" | "SpEM" | "SpKK" | "SpKJ" | "SpPK" | "SpRad" | "SpTHT" | "SpU";
type StatusPraktik = "Aktif" | "Cuti" | "Non_Aktif";

// Profesi yang valid jadi Dokter (selaras DOCTOR_PROFESI di pegawaiService/FE wizard).
export const DOKTER_PROFESI = ["Dokter", "Dokter Gigi", "Dokter Spesialis"] as const;

// ── Bentuk data (nilai sudah dinormalisasi Service) ────────────────────────────
export interface CreateDokterData {
  pegawaiId: string;
  spesialisKode: SpesialisKode;
  kualifikasi?: string;
  noStr?: string;
  strBerlakuHingga?: Date;
  noSip?: string;
  sipBerlakuHingga?: Date;
  statusPraktik: StatusPraktik;
  ihsPractitionerId?: string;
}

export interface UpdateDokterData {
  spesialisKode?: SpesialisKode;
  kualifikasi?: string;
  noStr?: string;
  strBerlakuHingga?: Date | null; // null = kosongkan
  noSip?: string;
  sipBerlakuHingga?: Date | null;
  statusPraktik?: StatusPraktik;
  ihsPractitionerId?: string;
}

// Identitas Pegawai yang dibaca bersama Dokter (read-only di domain ini). NIK = enc
// (mask di Service). Dipakai untuk DTO gabungan.
const pegawaiInclude = {
  pegawai: {
    select: {
      id: true, nip: true, nikEnc: true, namaLengkap: true,
      gelarDepan: true, gelarBelakang: true, jenisKelamin: true,
      tanggalLahir: true, email: true, noHp: true, profesi: true, isActive: true,
    },
  },
} as const;

export type DokterEntity = Awaited<ReturnType<typeof findById>>;
export type DokterListEntity = Awaited<ReturnType<typeof list>>["items"][number];
export type DokterTanpaProfilEntity = Awaited<ReturnType<typeof listTanpaProfil>>[number];

// ── Create ─────────────────────────────────────────────────────────────────---
export function create(data: CreateDokterData, tx?: Tx) {
  return db(tx).dokter.create({ data, include: pegawaiInclude });
}

// ── Reads (soft-delete difilter) ──────────────────────────────────────────────
export function findById(id: string, tx?: Tx) {
  return db(tx).dokter.findFirst({ where: { id, deletedAt: null }, include: pegawaiInclude });
}

/** Uniqueness 1:1 — cari profil Dokter aktif milik pegawai. */
export function findByPegawai(pegawaiId: string, tx?: Tx) {
  return db(tx).dokter.findFirst({ where: { pegawaiId, deletedAt: null }, select: { id: true } });
}

/** Pegawai (ringkas) untuk guard create — eksistensi + profesi. */
export function findPegawai(pegawaiId: string, tx?: Tx) {
  return db(tx).pegawai.findFirst({
    where: { id: pegawaiId, deletedAt: null },
    select: { id: true, profesi: true },
  });
}

/** List + search (nama/NIP/STR/SIP) + filter spesialis/status/ruangan. Cursor by id. */
export async function list(
  params: { q?: string; spesialis?: SpesialisKode; status?: StatusPraktik; locationId?: string; cursor?: string; limit: number },
  tx?: Tx,
) {
  const { q, spesialis, status, locationId, cursor, limit } = params;
  const rows = await db(tx).dokter.findMany({
    where: {
      deletedAt: null,
      ...(spesialis ? { spesialisKode: spesialis } : {}),
      ...(status ? { statusPraktik: status } : {}),
      // Dokter yang pegawainya punya penugasan ke ruangan ini (SDM Assignment).
      ...(locationId ? { pegawai: { penugasanRuangan: { some: { locationId } } } } : {}),
      ...(q
        ? {
            OR: [
              { noStr: { contains: q, mode: "insensitive" as const } },
              { noSip: { contains: q, mode: "insensitive" as const } },
              { pegawai: { namaLengkap: { contains: q, mode: "insensitive" as const } } },
              { pegawai: { nip: { contains: q, mode: "insensitive" as const } } },
            ],
          }
        : {}),
    },
    include: pegawaiInclude,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1, // +1 → deteksi halaman berikutnya
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  return { items, nextCursor: hasMore ? items[items.length - 1].id : null };
}

/**
 * Dokter tanpa profil (G3): pegawai profesi-dokter yang BELUM punya profil Dokter
 * (relasi `dokter` kosong) — diurut nama. `dokter: { is: null }` = anti-join Prisma.
 */
export function listTanpaProfil(tx?: Tx) {
  return db(tx).pegawai.findMany({
    where: {
      deletedAt: null,
      isActive: true,
      profesi: { in: [...DOKTER_PROFESI] },
      dokter: { is: null },
    },
    select: { id: true, nip: true, namaLengkap: true, gelarDepan: true, gelarBelakang: true, profesi: true, unitKerja: true },
    orderBy: [{ namaLengkap: "asc" }],
  });
}

// ── Update (version guard — optimistic concurrency, FLOWS §7) ─────────────────
export async function updateWithVersion(
  id: string,
  expectedVersion: number,
  data: UpdateDokterData,
  tx?: Tx,
): Promise<number> {
  const res = await db(tx).dokter.updateMany({
    where: { id, version: expectedVersion, deletedAt: null },
    data: { ...data, version: { increment: 1 } },
  });
  return res.count;
}

// ── Soft-delete (version guard) ───────────────────────────────────────────────
export async function softDeleteWithVersion(
  id: string,
  expectedVersion: number,
  when: Date,
  tx?: Tx,
): Promise<number> {
  const res = await db(tx).dokter.updateMany({
    where: { id, version: expectedVersion, deletedAt: null },
    data: { deletedAt: when, version: { increment: 1 } },
  });
  return res.count;
}

// ── Pointer denormalized Pegawai.practitionerId (system-maintained, no version bump) ─
/** Tautkan: set Pegawai.practitionerId = dokterId (dipanggil dlm tx create). */
export function linkPegawai(pegawaiId: string, dokterId: string, tx?: Tx) {
  return db(tx).pegawai.update({ where: { id: pegawaiId }, data: { practitionerId: dokterId } });
}

/** Lepas tautan: set Pegawai.practitionerId = null (dipanggil dlm tx soft-delete). */
export function unlinkPegawai(pegawaiId: string, tx?: Tx) {
  return db(tx).pegawai.update({ where: { id: pegawaiId }, data: { practitionerId: null } });
}
