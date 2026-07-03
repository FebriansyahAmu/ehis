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

export function createSep(data: CreateSepData, tx?: Tx) {
  return db(tx).sEP.create({ data });
}

export function findSepByKunjungan(kunjunganId: string, tx?: Tx) {
  return db(tx).sEP.findFirst({ where: { kunjunganId, deletedAt: null } });
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
