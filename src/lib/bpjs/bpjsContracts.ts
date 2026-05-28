/**
 * BPJS V-Claim Endpoint Payloads & Responses.
 *
 * Aligned 1:1 dengan **Trustmark BPJS V-Claim Contracts**
 * ([contracts/SEP-Contracts.md]). Pisah dari [bpjsShared.ts] (domain
 * types) untuk menjaga file-size limit + memisahkan API surface dari
 * domain.
 *
 * Tipe di file ini = wire format BPJS (kode "1"/"2"/"3"/dst, snake-case
 * dari spec). Domain rich types (`SEPRecordExt`/`PesertaRecord`/dst)
 * tetap di `bpjsShared.ts`.
 *
 * Cakupan 16 endpoint SEP — lihat [vClaimSEP.ts] untuk implementasi
 * adapter method per endpoint.
 */

import type {
  FingerPrintKode,
  JnsPelayananKode,
  JnsPengajuanKode,
  PesertaRecord,
  SEPCob,
  SEPJaminan,
  SEPKatarak,
  SEPKelasRawat,
  SEPPoli,
  StatusPulangKode,
} from "./bpjsShared";

// ── SEP CRUD Payloads ──────────────────────────────────

/**
 * Update SEP payload — spec endpoint 2.
 * Wire format: `{ "request": { "t_sep": <this> } }`.
 *
 * Catatan: `klsRawatNaik/pembiayaan/penanggungJawab` di spec di-set
 * "" string kosong jika tidak naik kelas (bukan undefined).
 */
export interface UpdateSEPPayload {
  noSep: string;
  klsRawat: SEPKelasRawat;
  noMR?: string;
  catatan?: string;
  diagAwal: string;
  poli: SEPPoli;
  cob?: SEPCob;
  katarak?: SEPKatarak;
  jaminan?: SEPJaminan;
  dpjpLayan?: string;
  noTelp?: string;
  user: string;
}

/** Delete SEP payload — spec endpoint 3. */
export interface DeleteSEPPayload {
  noSep: string;
  user: string;
}

// ── Update Tanggal Pulang ──────────────────────────────

/**
 * Update Tanggal Pulang payload — spec endpoint 5 (PUT).
 *
 * **Conditional rules:**
 * - `noSuratMeninggal` + `tglMeninggal` wajib jika `statusPulang = "4"`.
 * - `noLPManual` wajib jika SEP adalah KLL (jaminan.lakaLantas != "0").
 */
export interface UpdateTglPulangPayload {
  noSep: string;
  statusPulang: StatusPulangKode;
  noSuratMeninggal?: string;
  /** Format yyyy-MM-dd. */
  tglMeninggal?: string;
  /** Format yyyy-MM-dd. */
  tglPulang: string;
  noLPManual?: string;
  user: string;
}

/** Item response list update tgl pulang — spec endpoint 6. */
export interface UpdateTglPulangListItem {
  noSep: string;
  noSepUpdating?: string;
  jnsPelayanan: JnsPelayananKode;
  ppkTujuan?: string;
  noKartu: string;
  nama: string;
  tglSep: string;
  tglPulang: string;
  status?: string;
  tglMeninggal?: string;
  noSurat?: string;
  keterangan?: string;
  user: string;
}

// ── Potensi Suplesi Jasa Raharja + Data Induk Kecelakaan

/** Item jaminan response Potensi Suplesi Jasa Raharja — spec endpoint 4. */
export interface SuplesiJaminanItem {
  noRegister: string;
  noSep: string;
  noSepAwal: string;
  noSuratJaminan: string;
  /** Format yyyy-mm-dd. */
  tglKejadian: string;
  /** Format yyyy-mm-dd. */
  tglSep: string;
}

/** Item response Data Induk Kecelakaan — spec endpoint 5 (Suplesi). */
export interface DataIndukKecelakaanItem {
  noSEP: string;
  /** Format yyyy-mm-dd. */
  tglKejadian: string;
  ppkPelSEP: string;
  kdProp: string;
  kdKab: string;
  kdKec: string;
  ketKejadian: string;
  /** CSV string atau null jika tidak ada suplesi. */
  noSEPSuplesi: string | null;
}

// ── Approval Penjamin ──────────────────────────────────

/** Pengajuan SEP (Approval Penjamin) payload — spec endpoint 3a. */
export interface PengajuanSEPPayload {
  noKartu: string;
  /** Format yyyy-mm-dd. */
  tglSep: string;
  jnsPelayanan: JnsPelayananKode;
  jnsPengajuan: JnsPengajuanKode;
  keterangan: string;
  user: string;
}

/** Item response list persetujuan SEP — spec endpoint 4 (Persetujuan). */
export interface PersetujuanSEPItem {
  noKartu: string;
  nama: string;
  /** Format yyyy-mm-dd. */
  tglsep: string;
  /** Label RJ/RI. */
  jnspelayanan: "RI" | "RJ";
  /** Label "Pengajuan" / "Disetujui" / dst. */
  persetujuan: string;
  /** Detail status mis. "Tgl.SEP Backdate". */
  status: string;
}

// ── Integrasi SEP dgn Inacbgs ──────────────────────────

/**
 * Response Integrasi SEP dgn Inacbgs — spec endpoint 7.
 * Read-only — untuk validasi kelengkapan data SEP sebelum klaim INA-CBG.
 */
export interface SEPInacbgsResponse {
  pesertasep: {
    kelamin: "L" | "P";
    /** Kelas rawat aktual ("1"|"2"|"3"). */
    klsRawat: string;
    nama: string;
    noKartuBpjs: string;
    noMr: string;
    noRujukan: string;
    /** Format yyyy-mm-dd. */
    tglLahir: string;
    /** Format yyyy-mm-dd. */
    tglPelayanan: string;
    /** Tingkat pelayanan RS. */
    tktPelayanan: string;
  };
}

// ── SEP Internal ───────────────────────────────────────

/**
 * Item response Data SEP Internal — spec endpoint 8.
 * SEP internal = transfer antar poli/SMF dalam 1 episode.
 *
 * Catatan: spec hanya provide GET (data) + DELETE (hapus).
 * **Tidak ada endpoint Insert/Update SEP Internal di spec resmi.**
 */
export interface SEPInternalItem {
  tujuanrujuk: string;
  nmtujuanrujuk: string;
  nmpoliasal: string;
  /** Format yyyy-mm-dd. */
  tglrujukinternal: string;
  nosep: string;
  nosepref: string;
  ppkpelsep: string;
  nokapst: string;
  /** Format yyyy-mm-dd. */
  tglsep: string;
  nosurat: string;
  flaginternal: string;
  kdpoliasal: string;
  kdpolituj: string;
  kdpenunjang: string;
  nmpenunjang: string | null;
  diagppk: string;
  kddokter: string;
  nmdokter: string;
  flagprosedur: string | null;
  opsikonsul: string;
  flagsep: "True" | "False";
  fuser: string;
  /** Format yyyy-mm-dd. */
  fdate: string;
  nmdiag: string;
}

/** Hapus SEP Internal payload — spec endpoint 9 (DELETE). */
export interface HapusSEPInternalPayload {
  noSep: string;
  noSurat: string;
  /** Format yyyy-MM-dd. */
  tglRujukanInternal: string;
  /** 3 digit kode poli. */
  kdPoliTuj: string;
  user: string;
}

// ── Finger Print ───────────────────────────────────────

/** Response Get Finger Print — spec endpoint 10. */
export interface FingerPrintResponse {
  kode: FingerPrintKode;
  /** Pesan deskriptif: "Peserta telah melakukan validasi finger print pada tanggal yyyy-mm-dd". */
  status: string;
}

/** Item response List Finger Print — spec endpoint 12. */
export interface FingerPrintListItem {
  noKartu: string;
  noSEP: string;
}

// ── Random Question / Answer (alternatif fingerprint) ──

/** Item faskes pilihan Random Question — spec endpoint 13. */
export interface RandomQuestionFaskes {
  kode: string;
  nama: string;
}

/** Response Random Question. */
export interface RandomQuestionResponse {
  faskes: RandomQuestionFaskes[];
}

/** Post Random Answer payload — spec endpoint 14. */
export interface PostRandomAnswerPayload {
  noKartu: string;
  /** Format yyyy-mm-dd. */
  tglSep: string;
  jenPel: JnsPelayananKode;
  ppkPelSep: string;
  /** Format yyyy-mm-dd. */
  tglLahir: string;
  /** PPK peserta yang dijawab. */
  ppkPst: string;
  user: string;
}

// ── Rujukan Keluar (Rujukan-Contracts.md endpoint 1-6) ──

/**
 * Tipe rujukan — `tipeRujukan` di Insert/Update Rujukan.
 * - "0" Rujukan Penuh
 * - "1" Rujukan Partial
 * - "2" Rujukan Balik PRB (Program Rujuk Balik)
 *
 * **Conditional rule:** `poliRujukan` kosong jika `tipeRujukan="2"`,
 * wajib diisi jika "0" atau "1".
 */
export type TipeRujukanKode = "0" | "1" | "2";

/**
 * Insert Rujukan payload — spec endpoint 1 (Rujukan Keluar).
 * Wire format: `{ "request": { "t_rujukan": <this> } }`.
 *
 * Catatan: `ppkDirujuk` 8 digit kode faskes tujuan (referensi faskes).
 */
export interface InsertRujukanPayload {
  /** Nomor SEP terkait. */
  noSep: string;
  /** Format yyyy-MM-dd. */
  tglRujukan: string;
  /** Format yyyy-MM-dd. */
  tglRencanaKunjungan: string;
  /** 8 digit kode faskes tujuan. */
  ppkDirujuk: string;
  jnsPelayanan: JnsPelayananKode;
  catatan: string;
  /** Kode diagnosa ICD-10. */
  diagRujukan: string;
  tipeRujukan: TipeRujukanKode;
  /** Kode poli — kosong jika tipeRujukan="2", wajib jika "0"/"1". */
  poliRujukan: string;
  /** User WS pembuat rujukan. */
  user: string;
}

/**
 * Update Rujukan payload — spec endpoint 2 (PUT).
 * Wire format: `{ "request": { "t_rujukan": <this> } }`.
 */
export interface UpdateRujukanPayload {
  noRujukan: string;
  /** Format yyyy-MM-dd. */
  tglRujukan: string;
  /** Format yyyy-MM-dd. */
  tglRencanaKunjungan: string;
  ppkDirujuk: string;
  jnsPelayanan: JnsPelayananKode;
  catatan: string;
  diagRujukan: string;
  tipeRujukan: TipeRujukanKode;
  poliRujukan: string;
  user: string;
}

/**
 * Item list spesialistik per PPK Rujukan — spec endpoint 3.
 * Response: capacity + jumlah rujukan + persentase utilisasi per spesialis.
 */
export interface SpesialistikRujukanPPKItem {
  kodeSpesialis: string;
  namaSpesialis: string;
  /** String number "0" — kapasitas slot. */
  kapasitas: string;
  /** String number — jumlah rujukan sudah masuk. */
  jumlahRujukan: string;
  /** String number Indonesian decimal mis. "0,00". */
  persentase: string;
}

/**
 * Item list Rujukan Keluar — spec endpoint 4.
 * Pre-aggregated per periode.
 */
export interface RujukanKeluarListItem {
  noRujukan: string;
  /** Format yyyy-MM-dd. */
  tglRujukan: string;
  jnsPelayanan: JnsPelayananKode;
  noSep: string;
  noKartu: string;
  nama: string;
  ppkDirujuk: string;
  namaPpkDirujuk: string;
}

/**
 * Detail Rujukan Keluar — spec endpoint 5.
 * Response: rich object dengan label nama (diag/poli/tipe) untuk display.
 */
export interface RujukanKeluarDetail {
  noRujukan: string;
  noSep: string;
  noKartu: string;
  nama: string;
  kelasRawat: string;
  kelamin: "L" | "P";
  /** Format yyyy-MM-dd. */
  tglLahir: string;
  /** Format yyyy-MM-dd. */
  tglSep: string;
  /** Format yyyy-MM-dd. */
  tglRujukan: string;
  /** Format yyyy-MM-dd. */
  tglRencanaKunjungan: string;
  ppkDirujuk: string;
  namaPpkDirujuk: string;
  jnsPelayanan: JnsPelayananKode;
  catatan: string;
  diagRujukan: string;
  namaDiagRujukan: string;
  tipeRujukan: TipeRujukanKode;
  /** Display label: "Rujukan Penuh" / "Rujukan Partial" / "Rujukan Balik PRB". */
  namaTipeRujukan: string;
  poliRujukan: string;
  namaPoliRujukan: string;
}

/**
 * Response Jumlah SEP per Rujukan — spec endpoint 6.
 * Track berapa SEP yang sudah dibentuk untuk satu rujukan masuk
 * (penting untuk validasi rujukan habis dipakai vs masih bisa lanjut).
 */
export interface JumlahSEPRujukanResponse {
  noRujukan: string;
  /** "1" FKTP atau "2" FKRTL. */
  jnsRujukan: "1" | "2";
  /** Jumlah SEP yang sudah dibentuk dari rujukan ini. */
  jumlahSep: number;
}

// ── Rujukan Khusus (endpoint 7-9) ──────────────────────

/**
 * Tipe diagnosa pada Rujukan Khusus — `primer` atau `sekunder`.
 * Spec format kode: `{primer/sekunder};{kodediagnosa}` (mis. "primer;N18").
 */
export type DiagnosaRujukanKhususTipe = "primer" | "sekunder";

/** Item diagnosa pada Insert Rujukan Khusus. */
export interface DiagnosaRujukanKhususItem {
  /** Format spec: `${tipe};${kodeDiag}`, mis. "primer;N18". */
  kode: string;
}

/** Item procedure pada Insert Rujukan Khusus (kode ICD-9-CM). */
export interface ProcedureRujukanKhususItem {
  kode: string;
}

/**
 * Insert Rujukan Khusus payload — spec endpoint 7.
 * Kategorisasi rujukan untuk kasus khusus (kanker, jantung intervensi,
 * dialisis, dll) — diagnosa + procedure tambahan di atas rujukan biasa.
 */
export interface InsertRujukanKhususPayload {
  /** No. rujukan yang sudah ada (induk). */
  noRujukan: string;
  diagnosa: DiagnosaRujukanKhususItem[];
  procedure: ProcedureRujukanKhususItem[];
  user: string;
}

/**
 * Delete Rujukan Khusus payload — spec endpoint 8.
 * Wire format: `{ "request": { "t_rujukan": <this> } }`.
 */
export interface DeleteRujukanKhususPayload {
  /** ID internal BPJS dari record rujukan khusus. */
  idRujukan: string;
  noRujukan: string;
  user: string;
}

/** Item response List Rujukan Khusus — spec endpoint 9. */
export interface RujukanKhususListItem {
  idrujukan: string;
  norujukan: string;
  /** No. kartu peserta (snake case per spec). */
  nokapst: string;
  /** Nama peserta. */
  nmpst: string;
  /** Kode diagnosa PPK. */
  diagppk: string;
  /** Format yyyy-MM-dd. */
  tglrujukan_awal: string;
  /** Format yyyy-MM-dd. */
  tglrujukan_berakhir: string;
}

// ── Pencarian Rujukan dari RS (endpoint 10-12) ─────────

/** Diagnosa dengan kode + nama (display). */
export interface KodeNamaItem {
  kode: string;
  nama: string;
}

/**
 * Rujukan dari RS (incoming referral) — rich detail response untuk
 * spec endpoint 10/11/12. Berbeda dari `RujukanRecord` legacy —
 * shape kaya dengan `peserta` lengkap dan `provPerujuk`.
 */
export interface RujukanRSDetail {
  diagnosa: KodeNamaItem;
  keluhan: string;
  /** Nomor kunjungan rujukan. */
  noKunjungan: string;
  /** Pelayanan: kode "1"/"2" + nama "Rawat Inap"/"Rawat Jalan". */
  pelayanan: KodeNamaItem;
  /** Peserta full sesuai spec Peserta-Contracts.md. */
  peserta: PesertaRecord;
  /** Poli rujukan tujuan (kode + nama, bisa empty). */
  poliRujukan: KodeNamaItem;
  /** Provider perujuk (RS asal). */
  provPerujuk: KodeNamaItem;
  /** Format yyyy-MM-dd. */
  tglKunjungan: string;
}

// ╔══════════════════════════════════════════════════════════╗
// ║ Rencana Kontrol Contracts (11 endpoint)                  ║
// ║ Aligned 1:1 dengan [contracts/RencanaKontrol-Contracts.md]║
// ╚══════════════════════════════════════════════════════════╝

// ── PRB (Program Rujuk Balik) Form ─────────────────────

/**
 * Kode jenis penyakit PRB (Program Rujuk Balik) — 9 penyakit kronis
 * yang di-bridging via Rencana Kontrol V2.
 *
 * - 01 = Diabetes Melitus
 * - 02 = Hipertensi
 * - 03 = Asma
 * - 04 = Penyakit Jantung
 * - 05 = PPOK (Penyakit Paru Obstruktif Kronik)
 * - 06 = Skizofrenia
 * - 07 = Stroke
 * - 08 = Epilepsi
 * - 09 = SLE (Systemic Lupus Erythematosus)
 *
 * Spec: RencanaKontrol V2 insert `formPRB.kdStatusPRB`.
 */
export type PRBKodeStatus =
  | "01" | "02" | "03" | "04" | "05"
  | "06" | "07" | "08" | "09";

export const PRB_LABELS: Record<PRBKodeStatus, string> = {
  "01": "Diabetes Melitus",
  "02": "Hipertensi",
  "03": "Asma",
  "04": "Penyakit Jantung",
  "05": "PPOK",
  "06": "Skizofrenia",
  "07": "Stroke",
  "08": "Epilepsi",
  "09": "SLE",
};

/**
 * Data measurement PRB — 37 field per spec V2.
 *
 * Komentar nomor (01-09) di setiap field menandakan kode penyakit yang
 * MEMAKAI field tsb. Semua field nullable (number | null).
 *
 * Validasi range per spec V2:
 * - HBA1C: 0.1 - 15
 * - GDP/GD2JPP: 10 - 500
 * - eGFR: 5 - 150
 * - TD_Sistolik/TD_Diastolik/Rata_TD_*: 20 - 200
 * - LDL: 20 - 500
 * - NadiIstirahat: 20 - 200
 * - FungsiParu/Remisi/RemisiSLE: 0 - 100
 * - SkorMMRC: 0 - 40
 * - Usia: 1 - 100
 * - AsamUrat: 0.1 - 20
 * - Flag boolean fields: 0 atau 1
 */
export interface PRBFormData {
  /** 01 — HbA1c (%). Range 0.1-15. */
  HBA1C: number | null;
  /** 01,07 — Gula Darah Puasa (mg/dL). Range 10-500. */
  GDP: number | null;
  /** 01 — Gula Darah 2 Jam Post-Prandial (mg/dL). Range 10-500. */
  GD2JPP: number | null;
  /** 01,02 — eGFR (mL/min/1.73m²). Range 5-150. */
  eGFR: number | null;
  /** 01,07 — Tekanan darah sistolik (mmHg). Range 20-200. */
  TD_Sistolik: number | null;
  /** 01,07 — Tekanan darah diastolik (mmHg). Range 20-200. */
  TD_Diastolik: number | null;
  /** 01,07 — LDL kolesterol (mg/dL). Range 20-500. */
  LDL: number | null;
  /** 02,04 — Rata-rata TD sistolik. Range 20-200. */
  Rata_TD_Sistolik: number | null;
  /** 02,04 — Rata-rata TD diastolik. Range 20-200. */
  Rata_TD_Diastolik: number | null;
  /** 02 — Riwayat jantung koroner. 0 atau 1. */
  JantungKoroner: number | null;
  /** 02 — Riwayat stroke. 0 atau 1. */
  Stroke: number | null;
  /** 02 — Vaskular perifer. 0 atau 1. */
  VaskularPerifer: number | null;
  /** 02,04 — Aritmia. 0 atau 1. */
  Aritmia: number | null;
  /** 02 — Atrial fibrilasi. 0 atau 1. */
  AtrialFibrilasi: number | null;
  /** 04 — Nadi istirahat (bpm). Range 20-200. */
  NadiIstirahat: number | null;
  /** 04 — Sesak napas 3 bulan terakhir. 0 atau 1. */
  SesakNapas3Bulan: number | null;
  /** 04 — Nyeri dada 3 bulan terakhir. 0 atau 1. */
  NyeriDada3Bulan: number | null;
  /** 04 — Sesak napas saat aktivitas. 0 atau 1. */
  SesakNapasAktivitas: number | null;
  /** 04 — Nyeri dada saat aktivitas. 0 atau 1. */
  NyeriDadaAktivitas: number | null;
  /** 03 — Asma terkontrol. 0 atau 1. */
  Terkontrol: number | null;
  /** 03 — Gejala 2x seminggu. 0 atau 1. */
  Gejala2xMinggu: number | null;
  /** 03 — Terbangun malam karena gejala. 0 atau 1. */
  BangunMalam: number | null;
  /** 03 — Keterbatasan aktivitas fisik. 0 atau 1. */
  KeterbatasanFisik: number | null;
  /** 03 — Fungsi paru (% prediksi). Range 0-100. */
  FungsiParu: number | null;
  /** 05 — Skor mMRC (PPOK). Range 0-40. */
  SkorMMRC: number | null;
  /** 05 — Eksaserbasi 1 tahun terakhir. 0 atau 1. */
  Eksaserbasi1Tahun: number | null;
  /** 05 — Masih mampu aktivitas. 0 atau 1. */
  MampuAktivitas: number | null;
  /** 08 — Kejang epileptik 6 bulan terakhir. 0 atau 1. */
  Epileptik6Bulan: number | null;
  /** 08 — Efek samping OAB (Obat Anti Epilepsi). 0 atau 1. */
  EfekSampingOAB: number | null;
  /** 08 — Pasien hamil/menyusui. 0 atau 1. */
  HamilMenyusui: number | null;
  /** 06 — Remisi skizofrenia (%). Range 0-100. */
  Remisi: number | null;
  /** 06 — Pakai terapi rumatan. 0 atau 1. */
  TerapiRumatan: number | null;
  /** 06 — Usia (tahun). Range 1-100. */
  Usia: number | null;
  /** 07 — Asam urat (mg/dL). Range 0.1-20. */
  AsamUrat: number | null;
  /** 09 — Remisi SLE (%). Range 0-100. */
  RemisiSLE: number | null;
  /** 09 — Sedang hamil. 0 atau 1. */
  Hamil: number | null;
}

/** Wadah PRB form — `formPRB` field pada Insert/Update RK V2. */
export interface FormPRB {
  kdStatusPRB: PRBKodeStatus;
  data: PRBFormData;
}

/** Helper builder PRB data kosong (semua null). */
export function emptyPRBFormData(): PRBFormData {
  return {
    HBA1C: null, GDP: null, GD2JPP: null, eGFR: null,
    TD_Sistolik: null, TD_Diastolik: null, LDL: null,
    Rata_TD_Sistolik: null, Rata_TD_Diastolik: null,
    JantungKoroner: null, Stroke: null, VaskularPerifer: null,
    Aritmia: null, AtrialFibrilasi: null,
    NadiIstirahat: null,
    SesakNapas3Bulan: null, NyeriDada3Bulan: null,
    SesakNapasAktivitas: null, NyeriDadaAktivitas: null,
    Terkontrol: null, Gejala2xMinggu: null, BangunMalam: null,
    KeterbatasanFisik: null, FungsiParu: null,
    SkorMMRC: null, Eksaserbasi1Tahun: null, MampuAktivitas: null,
    Epileptik6Bulan: null, EfekSampingOAB: null, HamilMenyusui: null,
    Remisi: null, TerapiRumatan: null, Usia: null,
    AsamUrat: null, RemisiSLE: null, Hamil: null,
  };
}

// ── RK V2 CRUD Payloads (spec 1-5) ─────────────────────

/**
 * Insert Rencana Kontrol V2 — spec endpoint 1.
 *
 * Wire format: `{ "request": <this> }`.
 *
 * `tglRencanaKontrol`:
 * - Rawat Jalan → tanggal rencana kontrol
 * - Rawat Inap → tanggal SPRI
 *
 * `formPRB` wajib untuk peserta PRB (9 penyakit kronik).
 */
export interface InsertRKV2Payload {
  noSEP: string;
  kodeDokter: string;
  poliKontrol: string;
  /** Format yyyy-MM-dd. */
  tglRencanaKontrol: string;
  /** User pembuat rencana kontrol. */
  user: string;
  formPRB: FormPRB;
}

/**
 * Update Rencana Kontrol V2 — spec endpoint 2.
 * Method: PUT. Wire format: `{ "request": <this> }`.
 */
export interface UpdateRKV2Payload {
  noSuratKontrol: string;
  noSEP: string;
  kodeDokter: string;
  poliKontrol: string;
  /** Format yyyy-MM-dd. */
  tglRencanaKontrol: string;
  user: string;
  formPRB: FormPRB;
}

/**
 * Delete Rencana Kontrol — spec endpoint 3.
 * Method: DELETE. Wire format: `{ "request": { "t_suratkontrol": <this> } }`.
 */
export interface DeleteRKPayload {
  noSuratKontrol: string;
  user: string;
}

/**
 * Insert SPRI — spec endpoint 4.
 *
 * Berbeda dari Insert RK V2:
 * - Pakai `noKartu` (bukan `noSEP`) — SPRI tidak ada SEP asal
 * - TANPA `formPRB` (SPRI bukan PRB)
 *
 * Wire format: `{ "request": <this> }`.
 */
export interface InsertSPRIPayload {
  noKartu: string;
  kodeDokter: string;
  poliKontrol: string;
  /** Format yyyy-MM-dd. */
  tglRencanaKontrol: string;
  user: string;
}

/**
 * Update SPRI — spec endpoint 5.
 * Method: PUT. Wire format: `{ "request": <this> }`.
 */
export interface UpdateSPRIPayload {
  noSPRI: string;
  kodeDokter: string;
  poliKontrol: string;
  tglRencanaKontrol: string;
  user: string;
}

// ── GET SEP untuk RK (spec 6) ──────────────────────────

/** Peserta ringkas pada response SEP untuk RK (subset PesertaRecord). */
export interface SEPUntukRKPeserta {
  noKartu: string;
  nama: string;
  /** Format yyyy-MM-dd. */
  tglLahir: string;
  /** "L" / "P". */
  kelamin: "L" | "P";
  /** Hak kelas (string spec, biasanya "-" untuk legacy). */
  hakKelas: string;
}

/** Provider umum (FKTP) pada response SEP untuk RK. */
export interface SEPUntukRKProvUmum {
  kdProvider: string;
  nmProvider: string;
}

/** Provider perujuk pada response SEP untuk RK. */
export interface SEPUntukRKProvPerujuk {
  kdProviderPerujuk: string;
  nmProviderPerujuk: string;
  /** "1"=FKTP, "2"=FKRTL. */
  asalRujukan: string;
  noRujukan: string;
  /** Format yyyy-MM-dd. */
  tglRujukan: string;
}

/**
 * Response GET SEP untuk RK — spec endpoint 6.
 *
 * Shape KHUSUS untuk konteks rencana kontrol (lebih ringkas dari
 * SEPRecordExt). Pakai field display string (poli/diagnosa = "KODE - Nama").
 */
export interface SEPUntukRKRecord {
  noSep: string;
  /** Format yyyy-MM-dd. */
  tglSep: string;
  /** "Rawat Jalan" / "Rawat Inap" (display). */
  jnsPelayanan: string;
  /** Format "KODE - Nama Poli". */
  poli: string;
  /** Format "ICD - Nama Diagnosa". */
  diagnosa: string;
  peserta: SEPUntukRKPeserta;
  provUmum: SEPUntukRKProvUmum;
  provPerujuk: SEPUntukRKProvPerujuk;
}

// ── GET Detail RK by No Surat (spec 7) ─────────────────

/** Sub-section SEP pada response detail RK by noSurat. */
export interface RKDetailSEP {
  noSep: string;
  tglSep: string;
  jnsPelayanan: string;
  poli: string;
  diagnosa: string;
  peserta: SEPUntukRKPeserta;
  provUmum: SEPUntukRKProvUmum;
  provPerujuk: SEPUntukRKProvPerujuk;
}

/**
 * Detail RK by noSuratKontrol — spec endpoint 7.
 *
 * Catatan spec:
 * - Jika `jnsKontrol="1"` (SPRI), `sep` kosong/null (tidak ada SEP asal).
 * - Jika `jnsKontrol="2"` (Kontrol), `sep` terisi (referensi SEP asal).
 */
export interface RKDetailRecord {
  noSuratKontrol: string;
  /** Format yyyy-MM-dd. */
  tglRencanaKontrol: string;
  /** Format yyyy-MM-dd. */
  tglTerbit: string;
  /** "1"=SPRI, "2"=Kontrol. */
  jnsKontrol: "1" | "2";
  /** Kode poli tujuan. */
  poliTujuan: string;
  namaPoliTujuan: string;
  kodeDokter: string;
  namaDokter: string;
  /** "True"/"False" string spec. */
  flagKontrol: string;
  kodeDokterPembuat: string;
  namaDokterPembuat: string;
  /** "SPRI" atau "Kontrol" display. */
  namaJnsKontrol: string;
  sep: RKDetailSEP | null;
  formPRB: {
    kdStatusPRB: PRBKodeStatus | null;
    data: PRBFormData;
  };
}

// ── List RK by Kartu / Periode (spec 8-9) ──────────────

/**
 * Item list RK by No Kartu — spec endpoint 8.
 *
 * Note `noSepAsalKontrol` ada untuk kontrol (jnsKontrol="2"),
 * kosong/null untuk SPRI (jnsKontrol="1").
 *
 * `terbitSEP`: "Sudah" / "Belum" — apakah SEP kunjungan kontrol sudah terbit.
 */
export interface RKListByKartuItem {
  noSuratKontrol: string;
  /** "Rawat Inap" / "Rawat Jalan". */
  jnsPelayanan: string;
  /** "1"=SPRI, "2"=Kontrol. */
  jnsKontrol: "1" | "2";
  namaJnsKontrol: string;
  /** Format yyyy-MM-dd. */
  tglRencanaKontrol: string;
  /** Format yyyy-MM-dd. */
  tglTerbitKontrol: string;
  noSepAsalKontrol: string;
  poliAsal: string;
  namaPoliAsal: string;
  poliTujuan: string;
  namaPoliTujuan: string;
  /** Format yyyy-MM-dd. */
  tglSEP: string;
  kodeDokter: string;
  namaDokter: string;
  noKartu: string;
  nama: string;
  terbitSEP: "Sudah" | "Belum";
}

/**
 * Item list RK periode — spec endpoint 9.
 * Shape mirip RKListByKartuItem minus `terbitSEP`.
 */
export interface RKListPeriodeItem {
  noSuratKontrol: string;
  jnsPelayanan: string;
  jnsKontrol: "1" | "2";
  namaJnsKontrol: string;
  tglRencanaKontrol: string;
  tglTerbitKontrol: string;
  noSepAsalKontrol: string;
  poliAsal: string;
  namaPoliAsal: string;
  poliTujuan: string;
  namaPoliTujuan: string;
  tglSEP: string;
  kodeDokter: string;
  namaDokter: string;
  noKartu: string;
  nama: string;
}

/** Filter mode list RK — 1=tgl entri, 2=tgl rencana kontrol. */
export type RKListFilterMode = "1" | "2";

// ── Referensi Poli & Dokter RK (spec 10-11) ────────────

/**
 * Item poli untuk RK — spec endpoint 10.
 * Parameter spec: jnsKontrol + nomor (kartu jika SPRI, SEP jika RK) + tglRencana.
 *
 * `persentase`: string spec (e.g. "0.00") — utilisasi kapasitas poli.
 */
export interface PoliRKSpecItem {
  kodePoli: string;
  namaPoli: string;
  kapasitas: string;
  jmlRencanaKontroldanRujukan: string;
  persentase: string;
}

/**
 * Item dokter untuk RK — spec endpoint 11.
 * Parameter: jnsKontrol + kdPoli + tglRencana.
 */
export interface DokterRKSpecItem {
  kodeDokter: string;
  namaDokter: string;
  /** Format "HH:mm - HH:mm". */
  jadwalPraktek: string;
  kapasitas: string;
}
