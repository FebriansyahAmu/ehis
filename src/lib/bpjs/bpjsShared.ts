/**
 * BPJS Shared Types & Utilities.
 *
 * Single source of truth lintas adapter BPJS (V-Claim + Aplicares).
 *
 * Phase BP0.1: scaffold — tone palette · BPJSConfig · BPJSEnvelope ·
 * code map · helper latency/network simulation · Result re-export.
 *
 * Phase BP0.2: domain types — PesertaRecord · SEPRecordExt ·
 * RujukanRecord · RencanaKontrolRecord · SPRIRecord ·
 * KunjunganBPJSRecord · HistoriPelayananRecord · AplicaresKamarRecord ·
 * MapKelasRecord · BPJSError · BPJSAuditEntry · IdempotencyKey.
 *
 * Referensi: TODO-BPJS.md § BP0.
 */

// Import + re-export Result pattern dari eklaim shared (single source).
// Import diperlukan untuk local scope (mis. `extends SEPRecord`),
// re-export untuk akses ergonomis dari consumer.
import { Ok, Err } from "@/lib/eklaim/eklaimShared";
import type {
  ClaimError,
  KelasRawat,
  Result,
  Rupiah,
  SEPRecord,
  TingkatKompetensiRS,
} from "@/lib/eklaim/eklaimShared";

export { Ok, Err };
export type { ClaimError, KelasRawat, Result, Rupiah, SEPRecord, TingkatKompetensiRS };

// ── Adapter Config ─────────────────────────────────────

/**
 * Config umum semua adapter BPJS (V-Claim + Aplicares).
 *
 * Override credentials per-call via `consId/userKey`. Deterministic
 * test via `failRate / fixedLatencyMs / forceResult`.
 */
export interface BPJSConfig {
  /** Override consumer ID. Default dari `BPJS_CREDS_MOCK`. */
  consId?: string;
  /** Override user_key. */
  userKey?: string;
  /** Override timestamp Unix epoch second (test deterministic signature). */
  timestampOverride?: string;
  /** Override kode PPK RS — default dari `BPJS_CREDS_MOCK.kodePPK`. Wajib untuk endpoint Aplicares bed. */
  kodePPK?: string;
  /** 0-1 probabilitas network error simulated. Default 0.04. */
  failRate?: number;
  /** Latency tetap (ms). Default random 200-600. */
  fixedLatencyMs?: number;
  /** Force result untuk test deterministic — adapter return ini langsung. */
  forceResult?: unknown;
}

// ── Envelope ───────────────────────────────────────────

/** Envelope respons BPJS (V-Claim/Aplicares konsisten). */
export interface BPJSEnvelope<T> {
  metaData: {
    /** Code standar BPJS. Lihat `BPJSCode`. */
    code: string;
    message: string;
  };
  response?: T;
}

// ── BPJS Response Code Map ─────────────────────────────

/**
 * Code standar BPJS V-Claim / Aplicares.
 * - 200 OK
 * - 201 Data tidak ditemukan
 * - 202 Data sudah pernah dimasukkan (duplicate)
 * - 203 Eligibility expired
 * - 204 Validasi gagal
 * - 500 Server error BPJS
 * - 503 Service unavailable
 */
export type BPJSCode = "200" | "201" | "202" | "203" | "204" | "500" | "503";

export const BPJS_CODE_MESSAGES: Record<BPJSCode, string> = {
  "200": "Sukses",
  "201": "Data tidak ditemukan",
  "202": "Data sudah pernah dimasukkan",
  "203": "Eligibility expired",
  "204": "Validasi gagal",
  "500": "Server error BPJS",
  "503": "Service unavailable",
};

/** Code yang aman untuk auto-retry dengan exponential backoff. */
export const BPJS_RETRYABLE_CODES: ReadonlySet<BPJSCode> = new Set([
  "500",
  "503",
]);

/** Type guard — string BPJS response code valid. */
export function isBPJSCode(code: string): code is BPJSCode {
  return code in BPJS_CODE_MESSAGES;
}

// ── Tone Palette ───────────────────────────────────────

/**
 * Tone palette per area `/ehis-bpjs`. Purge-safe static (Tailwind v4).
 *
 * Emerald = primary BPJS · slate = neutral · per tab tone berbeda
 * untuk memisahkan visual fungsi.
 *
 * No indigo · No purple primary (per memory feedback).
 */
export const TONE_PALETTE_BPJS = {
  kepesertaan: "sky",
  sep: "emerald",
  rujukan: "teal",
  monitoring: "amber",
  "rencana-kontrol": "violet",
  aplicares: "pink",
  audit: "slate",
} as const;

export type BPJSToneKey = keyof typeof TONE_PALETTE_BPJS;
export type BPJSTone = (typeof TONE_PALETTE_BPJS)[BPJSToneKey];

// ── Helpers ────────────────────────────────────────────

/**
 * Simulate latency untuk mock adapter — pattern dari vClaimAdapter existing.
 * Backend swap: hapus call ini, langsung fetch.
 */
export function simulateLatency(fixedMs?: number): Promise<void> {
  const ms = fixedMs ?? 200 + Math.random() * 400;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Simulate network error dengan probabilitas configurable.
 * Return true jika harus return `Err({ type: "NetworkError" })`.
 */
export function shouldSimulateNetworkError(failRate?: number): boolean {
  const rate = failRate ?? 0.04;
  return rate > 0 && Math.random() < rate;
}

// ╔══════════════════════════════════════════════════════════╗
// ║ BP0.2 — Domain Types                                     ║
// ╚══════════════════════════════════════════════════════════╝

// ── Shared Building Blocks ─────────────────────────────

/** Pasangan kode + nama untuk referensi BPJS (poli, dokter, faskes, dst). */
export interface CodeLabel {
  kode: string;
  nama: string;
}

/** Audit trail standar per-record. */
export interface RecordAudit {
  createdBy: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt?: string;
  deletedBy?: string;
  deletedAt?: string;
}

/** Rupiah re-export type alias untuk akses ergonomis dari modul BPJS. */
export type { Rupiah as RupiahType } from "@/lib/eklaim/eklaimShared";

// ── PesertaRecord ──────────────────────────────────────

/**
 * Jenis peserta BPJS — kode numeric per pedoman resmi BPJS.
 *
 * Sample kode (subset):
 * - "11" Pekerja Penerima Upah PNS Pusat
 * - "12" PBI APBN/Jamkesda
 * - "13" Pegawai Swasta
 * - "14" PBPU Mandiri
 * - "15" Bukan Pekerja
 *
 * Tetap string (bukan enum) — trust BPJS untuk kode valid, label
 * di-supply via `jenisPeserta.keterangan` dari response.
 */
export type JenisPesertaKode = string;

/** Status keaktifan peserta BPJS — `peserta.statusPeserta.kode`. */
export type StatusPesertaKode = "0" | "1"; // 0=Aktif, 1=Non-Aktif

export interface PesertaMR {
  noMR: string | null;
  noTelepon: string | null;
}

/** COB — Coordination of Benefit (asuransi tambahan). */
export interface PesertaCOB {
  nmAsuransi: string | null;
  noAsuransi: string | null;
  /** Tanggal Akhir Tanggungan asuransi. */
  tglTAT: string | null;
  /** Tanggal Mulai Tanggungan asuransi. */
  tglTMT: string | null;
}

/** Provider FKTP terdaftar (Puskesmas/Klinik/Praktik Mandiri). */
export interface PesertaProvUmum {
  kdProvider: string;
  nmProvider: string;
}

/** Umur deskriptif per response BPJS (string format "X tahun, Y bulan, Z hari"). */
export interface PesertaUmur {
  /** Umur saat tanggal pelayanan yang di-query. */
  umurSaatPelayanan: string;
  umurSekarang: string;
}

/** Informasi tambahan peserta (PRB, SKTM, dinsos). */
export interface PesertaInformasi {
  /** Bantuan Dinas Sosial (string id atau null). */
  dinsos: string | null;
  /** Surat Keterangan Tidak Mampu. */
  noSKTM: string | null;
  /** Program Rujuk Balik (kode jenis PRB jika ada). */
  prolanisPRB: string | null;
}

/**
 * Detail peserta BPJS hasil cek kepesertaan — spec V-Claim
 * `/Peserta/nokartu/{noKartu}/tglSEP/{tgl}` atau `/Peserta/nik/{nik}/tglSEP/{tgl}`.
 *
 * Shape **1:1 spec Trustmark BPJS** (lihat [contracts/Peserta-Contracts.md]).
 *
 * Fields yang BUKAN dari endpoint `/Peserta/...` (sisaHariRawat,
 * suplesi, tunggakan) sengaja **tidak ada** di type ini —
 * mereka di-handle endpoint terpisah:
 * - `sisaHariRawat` → tidak tersedia di Peserta endpoint (legacy assumption)
 * - `suplesi` → call `suplesiCek()` SEP endpoint
 * - `tunggakan` → tidak tersedia di Peserta endpoint
 */
export interface PesertaRecord {
  /** 13-digit BPJS card number. */
  noKartu: string;
  /** 16-digit NIK Kemendagri. */
  nik: string;
  nama: string;
  /** ISO date yyyy-MM-dd. */
  tglLahir: string;
  /** Kode kelamin: "L"=Laki-laki, "P"=Perempuan. */
  sex: "L" | "P";
  /** PISA indicator (kode string per BPJS internal — biasanya "1" atau "2"). */
  pisa: string;
  hakKelas: { kode: "1" | "2" | "3"; keterangan: string };
  jenisPeserta: { kode: JenisPesertaKode; keterangan: string };
  statusPeserta: { kode: StatusPesertaKode; keterangan: string };
  mr: PesertaMR;
  cob: PesertaCOB;
  /** FKTP terdaftar peserta. */
  provUmum: PesertaProvUmum;
  /** Tanggal cetak kartu (ISO yyyy-MM-dd) atau null. */
  tglCetakKartu: string | null;
  /** Tanggal Akhir Tanggungan kepesertaan. */
  tglTAT: string | null;
  /** Tanggal Mulai Tanggungan kepesertaan. */
  tglTMT: string | null;
  umur: PesertaUmur;
  informasi: PesertaInformasi;
}

// ── SEPRecordExt ───────────────────────────────────────

/** Status internal SEP — workflow RS (bukan field BPJS). */
export type SEPStatusInternal =
  | "Draft"
  | "Issued"
  | "Suplesi"
  | "Updated"
  | "Closed"
  | "Deleted";

/** Jenis pelayanan SEP — sesuai field V-Claim. */
export type JnsPelayananKode = "1" | "2"; // 1=Rawat Inap, 2=Rawat Jalan

/** Tipe rujukan asal SEP. */
export type AsalRujukanKode = "1" | "2"; // 1=Faskes 1 (FKTP), 2=Faskes 2 (FKRTL)

/**
 * Status pulang (Update Tgl Pulang spec — endpoint 5).
 * 1=Atas Persetujuan Dokter · 3=Atas Permintaan Sendiri (APS) ·
 * 4=Meninggal (wajib `noSuratMeninggal` + `tglMeninggal`) · 5=Lain-lain
 */
export type StatusPulangKode = "1" | "3" | "4" | "5";

/**
 * Jenis pengajuan SEP (Approval Penjamin spec — endpoint 3a).
 * 1=Pengajuan backdate · 2=Pengajuan finger print
 */
export type JnsPengajuanKode = "1" | "2";

/**
 * Finger print kode response (spec 10).
 * 0=Belum validasi finger print · 1=Sudah validasi
 */
export type FingerPrintKode = "0" | "1";

/** Boolean flag BPJS — kode angka string. */
export type ZeroOneFlag = "0" | "1";

/**
 * Status laka lantas (kode BPJS) — wajib di Insert SEP `jaminan.lakaLantas`.
 * - 0 = BKLL (Bukan Kecelakaan Lalu Lintas)
 * - 1 = KLL bukan KK
 * - 2 = KLL dan KK
 * - 3 = KK saja (Kecelakaan Kerja)
 */
export type LakaLantasKode = "0" | "1" | "2" | "3";

/**
 * Naik kelas rawat — 8 enum BPJS Insert SEP `klsRawat.klsRawatNaik`.
 * Hanya diisi jika ada upgrade kelas.
 *
 * 1=VVIP · 2=VIP · 3=Kelas 1 · 4=Kelas 2 · 5=Kelas 3 · 6=ICCU · 7=ICU · 8=Diatas Kelas 1
 */
export type KlsRawatNaikKode = "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8";

/**
 * Pembiayaan kenaikan kelas — `klsRawat.pembiayaan`.
 * Wajib + paired dengan `klsRawatNaik`.
 *
 * 1=Pribadi · 2=Pemberi Kerja · 3=Asuransi Kesehatan Tambahan
 */
export type PembiayaanKenaikanKelasKode = "1" | "2" | "3";

/**
 * Hak kelas peserta — `klsRawat.klsRawatHak`.
 * 1=Kelas 1 · 2=Kelas 2 · 3=Kelas 3
 */
export type KlsRawatHakKode = "1" | "2" | "3";

/**
 * Tujuan kunjungan — `tujuanKunj`.
 * 0=Normal · 1=Prosedur · 2=Konsul Dokter
 */
export type TujuanKunjKode = "0" | "1" | "2";

/**
 * Flag prosedur berkelanjutan — `flagProcedure`.
 * 0=Tidak berkelanjutan · 1=Berkelanjutan.
 * **Conditional rule:** diisi `""` (string kosong) jika `tujuanKunj = "0"`.
 */
export type FlagProcedureKode = "0" | "1";

/**
 * Kode penunjang — `kdPenunjang`.
 * 12 enum: 1=Radioterapi · 2=Kemoterapi · 3=Rehab Medik · 4=Rehab Psikososial ·
 * 5=Transfusi Darah · 6=Pelayanan Gigi · 7=Laboratorium · 8=USG · 9=Farmasi ·
 * 10=Lain-Lain · 11=MRI · 12=HEMODIALISA.
 * **Conditional rule:** diisi `""` jika `tujuanKunj = "0"`.
 */
export type KdPenunjangKode =
  | "1" | "2" | "3" | "4" | "5" | "6"
  | "7" | "8" | "9" | "10" | "11" | "12";

/**
 * Asesmen pelayanan — `assesmentPel`.
 * 1=Poli spesialis tidak tersedia hari sebelumnya · 2=Jam poli berakhir ·
 * 3=Dokter spesialis tidak praktek · 4=Instruksi RS · 5=Tujuan Kontrol.
 * **Conditional rule:** wajib jika `tujuanKunj = "2"` atau poli tujuan berbeda dengan poli rujukan.
 */
export type AssesmentPelKode = "1" | "2" | "3" | "4" | "5";

// ── SEP Sub-Structures ─────────────────────────────────

/**
 * `klsRawat` per Insert SEP spec.
 * **Conditional rule:** `klsRawatNaik` + `pembiayaan` + `penanggungJawab`
 * wajib di-set bersama (atomic group) jika naik kelas.
 */
export interface SEPKelasRawat {
  klsRawatHak: KlsRawatHakKode;
  klsRawatNaik?: KlsRawatNaikKode;
  pembiayaan?: PembiayaanKenaikanKelasKode;
  /** Penanggung jawab kenaikan kelas (mis. "Pribadi" jika pembiayaan=1). */
  penanggungJawab?: string;
}

/**
 * `poli` per Insert SEP spec — `{ tujuan, eksekutif }`.
 * Catatan: cari nama poli via referensi `getPoli(kode)` (referenceCache).
 */
export interface SEPPoli {
  /** Kode poli tujuan — referensi poli BPJS. */
  tujuan: string;
  /** 0=Bukan poli eksekutif · 1=Poli eksekutif. */
  eksekutif: ZeroOneFlag;
}

/**
 * `rujukan` per Insert SEP spec — `asalRujukan` di DALAM rujukan
 * (bukan top-level SEP).
 */
export interface SEPRujukan {
  asalRujukan: AsalRujukanKode;
  tglRujukan?: string;
  noRujukan?: string;
  /** Kode faskes rujukan (string) — lookup via `getFaskes(kode)` untuk nama. */
  ppkRujukan?: string;
}

export interface SEPRencanaTindakLanjut {
  jenis?: "1" | "2" | "3"; // 1=Kontrol, 2=Rujuk, 3=Rawat
  noKontrol?: string;
  poli?: string;
  tgl?: string;
}

/** Lokasi laka — `jaminan.penjamin.suplesi.lokasiLaka` per spec. */
export interface SEPLokasiLaka {
  kdPropinsi: string;
  kdKabupaten: string;
  kdKecamatan: string;
}

/** Suplesi info — `jaminan.penjamin.suplesi` per spec. */
export interface SEPJaminanSuplesi {
  suplesi: ZeroOneFlag;
  noSepSuplesi?: string;
  lokasiLaka?: SEPLokasiLaka;
}

/** Penjamin info nested — `jaminan.penjamin` per spec (info kecelakaan). */
export interface SEPJaminanPenjamin {
  tglKejadian?: string;
  keterangan?: string;
  suplesi?: SEPJaminanSuplesi;
}

/**
 * `jaminan` per Insert SEP spec — wadah info laka lantas / kecelakaan kerja.
 *
 * Replace lama `SEPJaminanKecelakaan` yang flat — sekarang nested
 * sesuai spek `jaminan.penjamin.suplesi.lokasiLaka`.
 */
export interface SEPJaminan {
  lakaLantas: LakaLantasKode;
  /** No. Laporan Polisi (jika KLL). */
  noLP?: string;
  penjamin?: SEPJaminanPenjamin;
}

/** Surat Kontrol DPJP — `skdp`. Wajib jika SEP RJ kontrol. */
export interface SEPSkdp {
  noSurat: string;
  kodeDPJP: string;
}

export interface SEPCob {
  /** Coordination Of Benefit — Asuransi swasta tambahan. */
  cob: ZeroOneFlag;
}

export interface SEPKatarak {
  katarak: ZeroOneFlag;
}

/**
 * SEPRecordExt — full V-Claim 2.0 field set sesuai spec resmi BPJS.
 *
 * Extends `SEPRecord` (eklaim) — menambah ~25 field spesifik V-Claim.
 * Field `jenisRawat` (RI/RJ) tetap untuk konsistensi domain;
 * `jnsPelayanan` ("1"/"2") untuk API contract V-Claim.
 *
 * Conditional rules (enforce di adapter/UI):
 * 1. `dpjpLayan` kosong jika `jnsPelayanan = "1"` (DPJP RANAP set saat admisi).
 * 2. `flagProcedure` & `kdPenunjang` kosong string jika `tujuanKunj = "0"`.
 * 3. `assesmentPel` wajib jika `tujuanKunj = "2"` atau poli tujuan ≠ poli rujukan.
 * 4. `klsRawatNaik` + `pembiayaan` + `penanggungJawab` wajib triple (atomic).
 *
 * Status internal & audit di-track terpisah untuk workflow RS (bukan field BPJS).
 */
export interface SEPRecordExt extends SEPRecord {
  // ── Field V-Claim 2.0 (extension)
  jnsPelayanan: JnsPelayananKode;
  /** Kode PPK pelayanan (RS kita). */
  ppkPelayanan?: string;
  poli: SEPPoli;
  klsRawat: SEPKelasRawat;
  catatan?: string;
  /** Nomor MR pasien di RS. */
  noMR?: string;
  /** No. telepon kontak pasien. */
  noTelp?: string;
  rencanaTindakLanjut?: SEPRencanaTindakLanjut;
  rujukan: SEPRujukan;
  catatanDiagnosaPertama?: string;
  /** Kode ICD-10 diagnosa awal (string per spec). Domain juga bisa simpan CodeLabel via lookup. */
  diagAwal: string;
  /** Display nama diagnosa awal — domain extra (lookup dari icd ref). */
  diagAwalNama?: string;
  kelainanBawaan?: boolean;
  cob?: SEPCob;
  katarak?: SEPKatarak;
  jaminan?: SEPJaminan;
  skdp?: SEPSkdp;
  /** DPJP layanan — kode dokter. Wajib kosong jika jnsPelayanan="1". */
  dpjpLayan?: string;
  tujuanKunj?: TujuanKunjKode;
  /** Kosong string `""` jika tujuanKunj="0". */
  flagProcedure?: FlagProcedureKode | "";
  /** Kosong string `""` jika tujuanKunj="0". */
  kdPenunjang?: KdPenunjangKode | "";
  assesmentPel?: AssesmentPelKode;
  // ── Status internal RS (bukan field BPJS)
  statusInternal: SEPStatusInternal;
  tglPulang?: string;
  audit: RecordAudit;
}

// ── Conditional Rule Validator ─────────────────────────

/**
 * Validate conditional rules SEPRecordExt / InsertSEPPayload.
 * Return array error messages — empty array berarti valid.
 */
export function validateSEPConditionalRules(input: {
  jnsPelayanan: JnsPelayananKode;
  dpjpLayan?: string;
  tujuanKunj?: TujuanKunjKode;
  flagProcedure?: string;
  kdPenunjang?: string;
  assesmentPel?: AssesmentPelKode;
  klsRawat: SEPKelasRawat;
  poliTujuan?: string;
  poliRujukan?: string;
}): string[] {
  const errors: string[] = [];

  // Rule 1: jnsPelayanan="1" (RANAP) → dpjpLayan kosong
  if (input.jnsPelayanan === "1" && input.dpjpLayan && input.dpjpLayan.length > 0) {
    errors.push("dpjpLayan harus kosong untuk Rawat Inap (jnsPelayanan=1)");
  }

  // Rule 2: tujuanKunj="0" → flagProcedure & kdPenunjang kosong string
  if (input.tujuanKunj === "0") {
    if (input.flagProcedure && input.flagProcedure !== "") {
      errors.push("flagProcedure harus '' jika tujuanKunj=0 (Normal)");
    }
    if (input.kdPenunjang && input.kdPenunjang !== "") {
      errors.push("kdPenunjang harus '' jika tujuanKunj=0 (Normal)");
    }
  }

  // Rule 3: tujuanKunj="2" → assesmentPel wajib
  if (input.tujuanKunj === "2" && !input.assesmentPel) {
    errors.push("assesmentPel wajib jika tujuanKunj=2 (Konsul Dokter)");
  }
  // Rule 3b: poli tujuan beda dari poli rujukan → assesmentPel wajib
  if (
    input.poliTujuan &&
    input.poliRujukan &&
    input.poliTujuan !== input.poliRujukan &&
    !input.assesmentPel
  ) {
    errors.push("assesmentPel wajib jika poli tujuan beda dengan poli rujukan");
  }

  // Rule 4: klsRawatNaik + pembiayaan + penanggungJawab atomic triple
  const k = input.klsRawat;
  const hasNaik = !!k.klsRawatNaik;
  const hasBiaya = !!k.pembiayaan;
  const hasPj = !!(k.penanggungJawab && k.penanggungJawab.trim().length > 0);
  if ([hasNaik, hasBiaya, hasPj].some((v) => v) && !(hasNaik && hasBiaya && hasPj)) {
    errors.push(
      "klsRawatNaik + pembiayaan + penanggungJawab wajib di-set bersama (atomic) jika ada kenaikan kelas",
    );
  }

  return errors;
}

// Endpoint Payloads/Responses (Trustmark BPJS contracts) →
// pindah ke [bpjsContracts.ts] untuk file-size discipline.
// Re-export untuk akses ergonomis.
export type {
  DataIndukKecelakaanItem,
  DeleteRujukanKhususPayload,
  DeleteSEPPayload,
  DiagnosaRujukanKhususItem,
  DiagnosaRujukanKhususTipe,
  FingerPrintListItem,
  FingerPrintResponse,
  HapusSEPInternalPayload,
  InsertRujukanKhususPayload,
  InsertRujukanPayload,
  JumlahSEPRujukanResponse,
  KodeNamaItem,
  PengajuanSEPPayload,
  PersetujuanSEPItem,
  PostRandomAnswerPayload,
  ProcedureRujukanKhususItem,
  RandomQuestionFaskes,
  RandomQuestionResponse,
  RujukanKeluarDetail,
  RujukanKeluarListItem,
  RujukanKhususListItem,
  RujukanRSDetail,
  SEPInacbgsResponse,
  SEPInternalItem,
  SpesialistikRujukanPPKItem,
  SuplesiJaminanItem,
  TipeRujukanKode,
  UpdateRujukanPayload,
  UpdateSEPPayload,
  UpdateTglPulangListItem,
  UpdateTglPulangPayload,
  // Rencana Kontrol (RencanaKontrol-Contracts.md)
  DeleteRKPayload,
  DokterRKSpecItem,
  FormPRB,
  InsertRKV2Payload,
  InsertSPRIPayload,
  PoliRKSpecItem,
  PRBFormData,
  PRBKodeStatus,
  RKDetailRecord,
  RKDetailSEP,
  RKListByKartuItem,
  RKListFilterMode,
  RKListPeriodeItem,
  SEPUntukRKPeserta,
  SEPUntukRKProvPerujuk,
  SEPUntukRKProvUmum,
  SEPUntukRKRecord,
  UpdateRKV2Payload,
  UpdateSPRIPayload,
  // Monitoring (Monitoring-Contracts.md)
  HistoriPelayananMonitoringItem,
  JasaRaharjaDetail,
  JasaRaharjaMonitoringItem,
  JasaRaharjaPeserta,
  JasaRaharjaSEP,
  KlaimBiaya,
  KlaimInacbg,
  KlaimMonitoringItem,
  KlaimMonitoringPeserta,
  KlaimMonitoringStatusKode,
  KunjunganMonitoringItem,
} from "./bpjsContracts";
export {
  PRB_LABELS,
  emptyPRBFormData,
  KLAIM_MONITORING_STATUS_LABEL,
} from "./bpjsContracts";

// ── RujukanRecord ──────────────────────────────────────

export type AsalRujukanTipe = "FKTP" | "FKRTL";

export type RujukanStatus = "Aktif" | "Expired" | "Used";

export interface RujukanPPK extends CodeLabel {
  tipe?: AsalRujukanTipe;
}

/**
 * Rujukan FKTP atau FKRTL hasil cari V-Claim `/Rujukan/...`.
 *
 * Masa berlaku rujukan: FKTP 90 hari, FKRTL bervariasi per
 * jenis rujukan (referensi PMK 71/2013).
 */
export interface RujukanRecord {
  noRujukan: string;
  asalRujukan: AsalRujukanTipe;
  tglKunjungan: string;
  tglRujukan: string;
  ppkAsal: RujukanPPK;
  ppkRujukan: CodeLabel;
  jnsPelayanan: JnsPelayananKode;
  poli: CodeLabel;
  diagnosa: CodeLabel;
  catatan?: string;
  peserta: PesertaRecord;
  keluhan?: string;
  status: RujukanStatus;
  masaBerlaku: { from: string; to: string };
}

// ── RencanaKontrolRecord + SPRIRecord ──────────────────

export type RKJenis = "Kontrol" | "SPRI";

/** Tipe kontrol BPJS — kode API. */
export type TipeKontrolKode = "1" | "2"; // 1=Kontrol pasca RJ, 2=SPRI

export type RKStatus = "Issued" | "Used" | "Expired" | "Cancelled";

/**
 * Rencana Kontrol / Surat Pengantar Rawat Inap.
 *
 * Discriminated by `jenis`:
 * - `Kontrol` → tipeKontrol "1" → kontrol pasca pelayanan RJ
 * - `SPRI`    → tipeKontrol "2" → jadwal masuk RI
 *
 * Type narrowing: `SPRIRecord` adalah `RencanaKontrolRecord & { jenis: "SPRI" }`.
 */
export interface RencanaKontrolRecord {
  noSurat: string;
  jenis: RKJenis;
  tipeKontrol: TipeKontrolKode;
  noSEPAsal: string;
  tglRencana: string;
  poli: CodeLabel;
  dokter: CodeLabel;
  keterangan?: string;
  status: RKStatus;
  audit: RecordAudit;
}

/** SPRI = Surat Pengantar Rawat Inap — narrow dari RencanaKontrol. */
export type SPRIRecord = RencanaKontrolRecord & {
  jenis: "SPRI";
  tipeKontrol: "2";
};

/** Type guard — apakah record SPRI. */
export function isSPRI(rk: RencanaKontrolRecord): rk is SPRIRecord {
  return rk.jenis === "SPRI" && rk.tipeKontrol === "2";
}

// ── Monitoring Records ─────────────────────────────────

/** Status klaim ringkas untuk monitoring (V-Claim returns string singkat). */
export type ClaimStatusRingkas =
  | "Pending"
  | "Verifikasi"
  | "Disetujui"
  | "Ditolak"
  | "Susulan";

/**
 * Kunjungan BPJS — untuk monitoring `/monitoring/Kunjungan/...`.
 * Pre-aggregated per tanggal + jenis pelayanan.
 *
 * `dpjpLayan` optional — RANAP tidak set di Insert SEP (DPJP ditentukan
 * saat admisi).
 */
export interface KunjunganBPJSRecord {
  noSEP: string;
  noKartu: string;
  namaPeserta: string;
  tglSEP: string;
  jnsPelayanan: JnsPelayananKode;
  kelasRawat: string;
  poli: CodeLabel;
  diagnosaAwal: CodeLabel;
  dpjpLayan?: string;
  biayaTagih?: bigint;
  biayaSetuju?: bigint;
  statusKlaim?: ClaimStatusRingkas;
}

/**
 * Histori pelayanan peserta — `/monitoring/HistoriPelayanan/...`.
 * Timeline kunjungan tahun berjalan per peserta.
 */
export interface HistoriPelayananRecord {
  noSEP: string;
  tglSEP: string;
  jnsPelayanan: JnsPelayananKode;
  poli: CodeLabel;
  diagnosa: CodeLabel;
  dpjp: string;
  biayaTagih: bigint;
  biayaSetuju: bigint;
  statusVerifikasi: string;
}

// ── Aplicares ──────────────────────────────────────────

/** Kelas BPJS untuk Aplicares bed monitoring. */
export type KelasBPJSKode = "1" | "2" | "3" | "VIP";

/**
 * Kamar Aplicares — bed monitoring sync ke BPJS.
 * PMK 4/2018 transparansi bed availability publik.
 */
export interface AplicaresKamarRecord {
  kdKelas: KelasBPJSKode;
  namaKelas: string;
  kapasitas: number;
  /** Bed tersedia (gender-campur) — field `tersedia` di wire format. */
  tersedia: number;
  /** Internal: bed terisi = kapasitas - tersedia. Tidak ada di wire format Aplicares. */
  terisi: number;
  /** Internal: bed non-aktif/decommissioned. Tidak ada di wire format Aplicares. */
  kosong: number;
  namaRuang: string;
  kodeRuang: string;
  /** Bed tersedia untuk pria — `tersediapria` wire format (optional, RS yang mendukung pemisahan gender). */
  tersediaPria?: number;
  /** Bed tersedia untuk wanita — `tersediawanita` wire format. */
  tersediaWanita?: number;
  /** Bed tersedia pria-atau-wanita — `tersediapriawanita` wire format. */
  tersediaPriaWanita?: number;
  flagMaintenance?: boolean;
  /** ISO timestamp last sync ke Aplicares. */
  lastSyncISO: string;
}

/**
 * Mapping kelas BPJS ↔ Kelas RS lokal.
 * Multiplier untuk tarif adjustment (kenaikan/penurunan kelas).
 */
export interface MapKelasRecord {
  kdKelasBPJS: KelasBPJSKode;
  namaKelasBPJS: string;
  /** Kelas RS lokal — reuse enum `KelasRawat` dari eklaim. */
  kdKelasLokal: import("@/lib/eklaim/eklaimShared").KelasRawat;
  namaKelasLokal: string;
  /** Multiplier tarif (default 1.0). */
  multiplier?: number;
}

// ── BPJSError ──────────────────────────────────────────

/**
 * BPJS-specific error — extend `ClaimError` dengan error spesifik
 * response code BPJS (metaData.code non-200).
 *
 * Code mapping:
 * - 201 = Data tidak ditemukan
 * - 202 = Data sudah pernah dimasukkan (duplicate)
 * - 203 = Eligibility expired
 * - 204 = Validasi gagal
 * - 500 = Server error BPJS
 * - 503 = Service unavailable
 */
export interface BPJSMetaError {
  type: "BPJSMetaError";
  code: BPJSCode;
  message: string;
  endpoint: string;
  retryable: boolean;
}

/** Union — semua error type yang bisa muncul dari adapter BPJS. */
export type BPJSError = import("@/lib/eklaim/eklaimShared").ClaimError | BPJSMetaError;

/** Helper construct `BPJSMetaError` dari response code. */
export function makeBPJSMetaError(
  code: BPJSCode,
  endpoint: string,
  message?: string,
): BPJSMetaError {
  return {
    type: "BPJSMetaError",
    code,
    message: message ?? BPJS_CODE_MESSAGES[code],
    endpoint,
    retryable: BPJS_RETRYABLE_CODES.has(code),
  };
}

// ── BPJSAuditEntry ─────────────────────────────────────

/** HTTP method untuk audit log adapter. */
export type BPJSAuditMethod = "GET" | "POST" | "PUT" | "DELETE";

/**
 * Audit log entry per call adapter BPJS.
 *
 * UU PDP 27/2022 compliance — request/response di-hash (bukan
 * plaintext) untuk audit integrity tanpa expose PII.
 *
 * Retention: 5 tahun (UU PDP). Phase 1 client store
 * (`useSyncExternalStore`); Phase backend persist ke DB.
 */
export interface BPJSAuditEntry {
  id: string;
  /** ISO timestamp call dimulai. */
  timestamp: string;
  /** Endpoint relative path, e.g. "/SEP/{noSEP}". */
  endpoint: string;
  method: BPJSAuditMethod;
  /** SHA-256 hash of request body (no plaintext). */
  requestHash: string;
  /** BPJS metaData.code. */
  responseCode: string;
  responseHash?: string;
  success: boolean;
  durationMs: number;
  /** User RS yang trigger call. */
  actor: string;
  /** Role RBAC actor. */
  actorRole: string;
  consId: string;
  idempotencyKey?: string;
  errorType?: string;
  retryCount?: number;
}

// ── IdempotencyKey ─────────────────────────────────────

/**
 * Idempotency key untuk mutation BPJS (Insert SEP/RK/SPRI).
 * Deterministic hash dari payload — same input → same key.
 *
 * Saat retry, kirim same key untuk hindari duplicate submission
 * (BPJS server check idempotency).
 */
export type IdempotencyKey = string;

export interface IdempotencyPayload {
  /** Tanda tangan paling diskriminatif — pasien. */
  noKartu: string;
  /** Tanggal pelayanan (ISO date). */
  tglPelayanan: string;
  /** Context tambahan unik per request. */
  context: Record<string, unknown>;
}

/**
 * Generate idempotency key deterministic dari payload.
 *
 * Format: `${noKartu}-${tglPelayanan}-${hash}` — hash djb2 dari
 * canonical JSON context (key-sorted). Same payload → same key.
 */
export function generateIdempotencyKey(payload: IdempotencyPayload): IdempotencyKey {
  const canonical = canonicalJson(payload.context);
  const hash = djb2(canonical).toString(36);
  return `${payload.noKartu}-${payload.tglPelayanan}-${hash}`;
}

/** djb2 hash (Bernstein) — unsigned 32-bit. Deterministic, no crypto dep. */
function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = (h * 33) ^ s.charCodeAt(i);
  }
  return h >>> 0;
}

/** Canonical JSON — key-sorted serialization untuk hash stability. */
function canonicalJson(obj: unknown): string {
  if (obj === null || typeof obj !== "object") return JSON.stringify(obj);
  if (Array.isArray(obj)) return `[${obj.map(canonicalJson).join(",")}]`;
  const keys = Object.keys(obj as Record<string, unknown>).sort();
  const entries = keys.map(
    (k) =>
      `${JSON.stringify(k)}:${canonicalJson((obj as Record<string, unknown>)[k])}`,
  );
  return `{${entries.join(",")}}`;
}
