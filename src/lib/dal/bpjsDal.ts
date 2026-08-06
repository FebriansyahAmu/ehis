// bpjsDal — akses Prisma MURNI schema bpjs (Rujukan + SEP). Tak ada aturan bisnis.
// Terima `tx?` (transaksi dimiliki Service). PII (no. kartu) di-resolve Service sebelum
// sampai sini. Selaras patientDal/kunjunganDal — enum = string-union lokal.

import { db, type Tx } from "@/lib/db/prisma";

type SumberRujukan = "RujukanMasuk" | "KontrolPascaRanap" | "RujukanIGD";
type AsalRujukan = "Faskes1" | "Faskes2";
type JenisPelayananSep = "RawatInap" | "RawatJalan";
type TujuanKunjungan = "Normal" | "Prosedur" | "KonsulDokter";
type LakaLantas = "BKLL" | "KLL_BKK" | "KLL_KK" | "KK";
type SepStatus = "Draft" | "Terbit" | "Batal" | "Gagal";

export interface CreateRujukanData {
  kunjunganId: string;
  sumber: SumberRujukan;
  asalRujukan: AsalRujukan;
  noRujukan: string;
  tglRujukan?: Date;
  ppkRujukan?: string;
  diagnosaKode?: string;
  diagnosaNama?: string;
  poliTujuan?: string;
  noSepAsal?: string;
}

export interface CreateSepData {
  kunjunganId: string;
  rujukanId?: string;
  status: SepStatus;
  noSep?: string;
  noKartu: string;
  tglSep: Date;
  ppkPelayanan: string;
  jnsPelayanan: JenisPelayananSep;
  klsRawatHak?: string;
  noMr?: string;
  naikKelas?: boolean;
  klsRawatNaik?: string;
  pembiayaan?: string;
  penanggungJawab?: string;
  tujuanKunj?: TujuanKunjungan;
  flagProcedure?: string;
  kdPenunjang?: string;
  assesmentPel?: string;
  poliEksekutif?: boolean;
  dpjpLayan?: string;
  poliTujuan?: string;
  diagAwal?: string;
  lakaLantas?: LakaLantas;
  noLp?: string;
  tglKejadian?: Date;
  keteranganLaka?: string;
  suplesi?: boolean;
  noSepSuplesi?: string;
  lokasiKdProp?: string;
  lokasiKdKab?: string;
  lokasiKdKec?: string;
  cob?: boolean;
  katarak?: boolean;
  skdpNoSurat?: string;
  skdpKodeDpjp?: string;
  noTelp?: string;
  catatan?: string;
  userPembuat?: string;
}

export type RujukanEntity = Awaited<ReturnType<typeof createRujukan>>;
export type SepEntity = Awaited<ReturnType<typeof createSep>>;

// ── no. SEP sequence (atomik → no_sep @unique aman) ───────────────────────────
export async function nextNoSepSeq(tx?: Tx): Promise<number> {
  const rows = await db(tx).$queryRaw<{ nextval: bigint }[]>`SELECT nextval('"bpjs"."no_sep_seq"')`;
  return Number(rows[0].nextval);
}

export function createRujukan(data: CreateRujukanData, tx?: Tx) {
  return db(tx).rujukan.create({ data });
}

/** Upsert rujukan by kunjunganId (1:1 @unique). Dipakai Ubah Penjamin RJ — kunjungan
 *  yang sudah punya rujukan tak boleh create ganda (P2002). */
export function upsertRujukanByKunjungan(data: CreateRujukanData, tx?: Tx) {
  const { kunjunganId, ...rest } = data;
  return db(tx).rujukan.upsert({
    where: { kunjunganId },
    create: data,
    update: rest,
  });
}

export function createSep(data: CreateSepData, tx?: Tx) {
  return db(tx).sEP.create({ data });
}

export function findSepByKunjungan(kunjunganId: string, tx?: Tx) {
  return db(tx).sEP.findFirst({ where: { kunjunganId, deletedAt: null } });
}

/** Tautkan/segarkan rujukan pada SEP aktif yang ADA + sinkronkan diagAwal (tab Surat Rujukan).
 *  Menjaga SEP tetap sesuai rujukan & diagnosa. `diagAwal` di-update hanya bila disertakan
 *  (undefined = biarkan; null/string = set). Update by id (SEP aktif tunggal per kunjungan). */
export async function linkSepRujukan(
  sepId: string,
  data: { rujukanId: string; diagAwal?: string | null },
  tx?: Tx,
): Promise<number> {
  const res = await db(tx).sEP.updateMany({
    where: { id: sepId, deletedAt: null },
    data: {
      rujukanId: data.rujukanId,
      ...(data.diagAwal !== undefined ? { diagAwal: data.diagAwal } : {}),
    },
  });
  return res.count;
}

/** Tulis blok JAMINAN kecelakaan pada SEP aktif yang ADA (jembatan Data Kecelakaan → SEP).
 *  Menyalin lakaLantas + No. LP + tgl kejadian + keterangan + suplesi. `lokasiKd*` DITUNDA
 *  (butuh referensi wilayah BPJS). Field `undefined` = biarkan; null/nilai = set. Update by id. */
export async function updateSepJaminan(
  sepId: string,
  data: {
    lakaLantas: LakaLantas;
    penjamin?: string | null; // badan penyelenggara (jaminan.penjamin.penjamin): "1"/"2"/"1,2"/…
    noLp?: string | null;
    tglKejadian?: Date | null;
    keteranganLaka?: string | null;
    suplesi?: boolean;
    noSepSuplesi?: string | null;
  },
  tx?: Tx,
): Promise<number> {
  const res = await db(tx).sEP.updateMany({
    where: { id: sepId, deletedAt: null },
    data: {
      lakaLantas: data.lakaLantas,
      ...(data.penjamin !== undefined ? { penjamin: data.penjamin } : {}),
      ...(data.noLp !== undefined ? { noLp: data.noLp } : {}),
      ...(data.tglKejadian !== undefined ? { tglKejadian: data.tglKejadian } : {}),
      ...(data.keteranganLaka !== undefined ? { keteranganLaka: data.keteranganLaka } : {}),
      ...(data.suplesi !== undefined ? { suplesi: data.suplesi } : {}),
      ...(data.noSepSuplesi !== undefined ? { noSepSuplesi: data.noSepSuplesi } : {}),
    },
  });
  return res.count;
}

/** SEP KLL TERBIT milik pasien (lintas kunjungan, exclude kunjungan berjalan) — kandidat
 *  No. SEP suplesi (episode kecelakaan yang sama). lakaLantas ≠ BKLL = ada unsur kecelakaan. */
export function listLakaSepByPatient(patientId: string, excludeKunjunganId: string, tx?: Tx) {
  return db(tx).sEP.findMany({
    where: {
      status: "Terbit",
      noSep: { not: null },
      deletedAt: null,
      lakaLantas: { not: "BKLL" },
      kunjungan: { patientId },
      kunjunganId: { not: excludeKunjunganId },
    },
    select: { noSep: true, tglSep: true, lakaLantas: true, kunjunganId: true },
    orderBy: { tglSep: "desc" },
    take: 20,
  });
}

/** Supersede (soft-delete) SEMUA SEP aktif satu kunjungan — dipanggil sebelum terbit
 *  SEP baru (Ubah Penjamin) agar hanya satu SEP aktif per kunjungan. */
export async function supersedeSepByKunjungan(kunjunganId: string, when: Date, tx?: Tx): Promise<number> {
  const res = await db(tx).sEP.updateMany({
    where: { kunjunganId, deletedAt: null },
    data: { deletedAt: when },
  });
  return res.count;
}

/** SEP TERBIT milik pasien (lintas kunjungan), terbaru dulu — picker No. SEP (jadwal kontrol dsb). */
export function listSepTerbitByPatient(patientId: string, tx?: Tx) {
  return db(tx).sEP.findMany({
    where: { status: "Terbit", noSep: { not: null }, deletedAt: null, kunjungan: { patientId } },
    select: {
      noSep: true, tglSep: true, jnsPelayanan: true, poliTujuan: true,
      kunjunganId: true, createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}
