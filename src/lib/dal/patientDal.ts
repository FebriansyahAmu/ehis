// patientDal — akses Prisma MURNI untuk domain pendaftaran (FLOWS §2). Tak ada aturan
// bisnis. Terima `tx?` (transaksi dimiliki Service). Soft-delete difilter default.
// PII sudah ter-enkripsi oleh Service SEBELUM sampai sini (DAL tak tahu crypto).

import { db, type Tx } from "@/lib/db/prisma";

type Gender = "L" | "P";
type GolonganDarah = "A" | "B" | "AB" | "O" | "TidakDiketahui";
type Rhesus = "Positif" | "Negatif" | "TidakDiketahui";
type StatusPerkawinan = "BelumKawin" | "Kawin" | "CeraiHidup" | "CeraiMati";
type JenisAlamat = "KTP" | "Domisili";
type TipePenjamin = "Umum" | "BPJS_Non_PBI" | "BPJS_PBI" | "Asuransi" | "Jamkesda";
type SumberPendaftaran = "WalkIn" | "MJKN" | "Kiosk";

// ── Bentuk data create (PII sudah enc/hash; nilai sudah dinormalisasi Service) ──
export interface AddressData {
  jenis: JenisAlamat;
  alamat?: string; rtRw?: string; kodePos?: string;
  provinsiKode?: string; provinsiNama?: string; kotaKode?: string; kotaNama?: string;
  kecamatanKode?: string; kecamatanNama?: string; kelurahanKode?: string; kelurahanNama?: string;
  bpjsKodeProp?: string; bpjsKodeDati2?: string; bpjsKodeKec?: string; bpjsKodeKel?: string;
}
export interface PenjaminData {
  tipe: TipePenjamin; nama: string;
  nomorEnc?: string; nomorHash?: string; kelas?: string; berlakuSampai?: Date; noPolis?: string;
  isPrimer: boolean;
}
export interface AlergiData { nama: string; reaksi?: string; tingkat?: string }
export interface KontakData { nama: string; hubungan: string; noHp: string; alamat?: string }

export interface CreatePatientData {
  noRm: string;
  nikEnc?: string; nikHash?: string;
  noKkEnc?: string; noKkHash?: string;
  isWna: boolean; noPasporEnc?: string; noPasporHash?: string;
  isAnonim: boolean;
  nama: string; gender: Gender;
  tempatLahir?: string; tanggalLahir?: Date;
  golonganDarah?: GolonganDarah; rhesus?: Rhesus; statusPerkawinan?: StatusPerkawinan;
  agama?: string; pendidikan?: string; pekerjaan?: string; suku?: string; kewarganegaraan: string;
  noHp?: string; email?: string;
  dataLengkap: boolean; sumberDaftar?: SumberPendaftaran;
  alamat: AddressData[];
  penjamin: PenjaminData[];
  alergiAwal: AlergiData[];
  kontakDarurat: KontakData[];
}

export interface UpdatePatientData {
  nikEnc?: string; nikHash?: string; noKkEnc?: string; noKkHash?: string;
  noPasporEnc?: string; noPasporHash?: string;
  nama?: string; gender?: Gender; tempatLahir?: string; tanggalLahir?: Date;
  golonganDarah?: GolonganDarah; rhesus?: Rhesus; statusPerkawinan?: StatusPerkawinan;
  agama?: string; pendidikan?: string; pekerjaan?: string; suku?: string; kewarganegaraan?: string;
  noHp?: string; email?: string; dataLengkap?: boolean;
}

// Relasi standar untuk read detail (alamat/penjamin aktif + alergi + kontak).
const detailInclude = {
  alamat: true,
  penjamin: { where: { deletedAt: null } },
  alergiAwal: true,
  kontakDarurat: true,
} as const;

export type PatientEntity = Awaited<ReturnType<typeof findById>>;

// ── noRM counter per-bulan (atomik, anti-race — FLOWS §"App vs DB") ───────────
// Format YYMMNNNN reset tiap bulan → tak bisa pakai SEQUENCE global. `upsert` by PK
// `periode` di Postgres dikompilasi jadi native INSERT … ON CONFLICT … RETURNING
// (1 round-trip, race-safe via lock baris implisit) — typed, tanpa raw SQL.
export async function nextNoRmSeq(periode: string, tx?: Tx): Promise<number> {
  const row = await db(tx).rmCounter.upsert({
    where: { periode },
    create: { periode, lastSeq: 1 },
    update: { lastSeq: { increment: 1 } },
    select: { lastSeq: true },
  });
  return row.lastSeq;
}

// ── Create ─────────────────────────────────────────────────────────────────---
export async function create(data: CreatePatientData, tx?: Tx) {
  return db(tx).pasien.create({
    data: {
      noRm: data.noRm,
      nikEnc: data.nikEnc, nikHash: data.nikHash,
      noKkEnc: data.noKkEnc, noKkHash: data.noKkHash,
      isWna: data.isWna, noPasporEnc: data.noPasporEnc, noPasporHash: data.noPasporHash,
      isAnonim: data.isAnonim,
      nama: data.nama, gender: data.gender,
      tempatLahir: data.tempatLahir, tanggalLahir: data.tanggalLahir,
      golonganDarah: data.golonganDarah, rhesus: data.rhesus, statusPerkawinan: data.statusPerkawinan,
      agama: data.agama, pendidikan: data.pendidikan, pekerjaan: data.pekerjaan, suku: data.suku,
      kewarganegaraan: data.kewarganegaraan,
      noHp: data.noHp, email: data.email,
      dataLengkap: data.dataLengkap, sumberDaftar: data.sumberDaftar,
      alamat: { create: data.alamat },
      penjamin: { create: data.penjamin },
      alergiAwal: { create: data.alergiAwal },
      kontakDarurat: { create: data.kontakDarurat },
    },
    include: detailInclude,
  });
}

// ── Reads (soft-delete difilter) ──────────────────────────────────────────────
export function findById(id: string, tx?: Tx) {
  return db(tx).pasien.findFirst({ where: { id, deletedAt: null }, include: detailInclude });
}

export function findByNoRm(noRm: string, tx?: Tx) {
  return db(tx).pasien.findFirst({ where: { noRm, deletedAt: null }, include: detailInclude });
}

/** Dedup: cari pasien aktif by hash NIK (HMAC). */
export function findByNikHash(nikHash: string, tx?: Tx) {
  return db(tx).pasien.findFirst({ where: { nikHash, deletedAt: null }, include: detailInclude });
}

/** Dedup WNA: by hash paspor. */
export function findByPasporHash(pasporHash: string, tx?: Tx) {
  return db(tx).pasien.findFirst({ where: { noPasporHash: pasporHash, deletedAt: null }, include: detailInclude });
}

/** Search nama (trigram ILIKE) + list. Cursor by id (orderBy createdAt,id desc). */
export async function searchByNama(
  params: { q?: string; cursor?: string; limit: number },
  tx?: Tx,
) {
  const { q, cursor, limit } = params;
  const rows = await db(tx).pasien.findMany({
    where: {
      deletedAt: null,
      ...(q ? { nama: { contains: q, mode: "insensitive" as const } } : {}),
    },
    include: detailInclude,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1, // +1 → deteksi halaman berikutnya
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  return { items, nextCursor: hasMore ? items[items.length - 1].id : null };
}

// ── Update (version guard — optimistic concurrency, FLOWS §7) ─────────────────
/** Update bila version cocok; bump version. Mengembalikan count (0 = stale). */
export async function updateWithVersion(
  id: string,
  expectedVersion: number,
  data: UpdatePatientData,
  tx?: Tx,
): Promise<number> {
  const res = await db(tx).pasien.updateMany({
    where: { id, version: expectedVersion, deletedAt: null },
    data: { ...data, version: { increment: 1 } },
  });
  return res.count;
}

// ── Penjamin upsert (jaminan aktif = penjamin kunjungan terakhir) ─────────────
export interface UpsertPenjaminData {
  tipe: TipePenjamin;
  nama: string;
  nomorEnc?: string | null; nomorHash?: string | null; // null = clear; undefined = skip
  kelas?: string | null; berlakuSampai?: Date | null; noPolis?: string | null;
}

/**
 * Upsert penjamin pasien by `tipe` (tak ada unique → find+update/create). PII enc/hash
 * sudah disiapkan Service. `setPrimary` → jadikan primer & turunkan primer lain
 * (single-primary invariant). Kembalikan id penjamin (dipakai sbg FK kunjungan).
 */
export async function upsertPenjaminByTipe(
  pasienId: string,
  data: UpsertPenjaminData,
  opts: { setPrimary?: boolean } = {},
  tx?: Tx,
): Promise<string> {
  const c = db(tx);
  const existing = await c.pasienPenjamin.findFirst({
    where: { pasienId, tipe: data.tipe, deletedAt: null },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  // Turunkan SEMUA primer dulu — partial-unique DB (pasien_penjamin_one_primer_uq)
  // melarang 2 baris is_primer=true; promote target HARUS setelah demote.
  if (opts.setPrimary) {
    await c.pasienPenjamin.updateMany({
      where: { pasienId, deletedAt: null, isPrimer: true },
      data: { isPrimer: false },
    });
  }

  const fields = {
    nama: data.nama,
    nomorEnc: data.nomorEnc, nomorHash: data.nomorHash,
    kelas: data.kelas, berlakuSampai: data.berlakuSampai, noPolis: data.noPolis,
  };

  if (existing) {
    await c.pasienPenjamin.update({
      where: { id: existing.id },
      data: { ...fields, ...(opts.setPrimary ? { isPrimer: true } : {}) },
    });
    return existing.id;
  }
  const created = await c.pasienPenjamin.create({
    data: { pasienId, tipe: data.tipe, ...fields, isPrimer: opts.setPrimary ?? false },
    select: { id: true },
  });
  return created.id;
}

/** Upsert alamat by (pasienId, jenis) — KTP/Domisili unik per pasien. */
export function upsertAddress(pasienId: string, data: AddressData, tx?: Tx) {
  const { jenis, ...rest } = data;
  return db(tx).pasienAlamat.upsert({
    where: { pasienId_jenis: { pasienId, jenis } },
    create: { pasienId, jenis, ...rest },
    update: rest,
  });
}

// ── Soft-delete ────────────────────────────────────────────────────────────---
export function softDelete(id: string, when: Date, tx?: Tx) {
  return db(tx).pasien.updateMany({ where: { id, deletedAt: null }, data: { deletedAt: when } });
}
