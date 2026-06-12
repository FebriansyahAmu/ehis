// ════════════════════════════════════════════════════════════════════════════
//  Katalog Pemeriksaan Laboratorium — model TES → PARAMETER (LOINC/Pranata-style).
//  Satu tes (orderable) memuat 1..N parameter (analit); tiap parameter punya satuan
//  + nilai rujukan (numerik per gender/usia) ATAU nilai normal teks (kualitatif).
//
//  File ini @/-IMPORT-FREE supaya dapat diimpor langsung oleh skrip seed (tsx) tanpa
//  resolusi alias. Hanya tipe + konstanta + factory. Warna/ikon FE ada di
//  katalogLabShared.ts. Seed data riset ada di labTestSeed.ts.
//
//  Standar acuan: ISO 15189:2022 · SNARS AP 5 · PMK 43/2013 (Pranata Lab) ·
//  satuan SI + konvensional · NCEP ATP III (lipid) · WHO (glukosa/DM) · SAMHSA (NAPZA).
// ════════════════════════════════════════════════════════════════════════════

// ── Vocab ─────────────────────────────────────────────────
export type LabTestStatus = "Aktif" | "NonAktif";

/** Tipe hasil sebuah parameter. Numerik → satuan + rentang rujukan; Kualitatif → teks normal. */
export type LabResultType = "Numerik" | "Kualitatif";

export type LabKategori =
  | "Hematologi"
  | "Kimia Klinik"
  | "Koagulasi"
  | "Urinalisis"
  | "Feses"
  | "Serologi"
  | "Imunologi"
  | "Mikrobiologi"
  | "Toksikologi"
  | "Analisa Gas Darah";

export const LAB_KATEGORI_ORDER: LabKategori[] = [
  "Hematologi", "Kimia Klinik", "Koagulasi", "Urinalisis", "Feses",
  "Serologi", "Imunologi", "Mikrobiologi", "Toksikologi", "Analisa Gas Darah",
];

// ── Satuan baku (riset standar nasional/internasional) ────
// Dikelompokkan agar dropdown mudah dipindai. Tetap boleh ketik manual (combobox).
export interface SatuanGroup {
  label: string;
  options: string[];
}

export const LAB_SATUAN_GROUPS: SatuanGroup[] = [
  {
    label: "Konsentrasi massa",
    options: ["g/dL", "g/L", "mg/dL", "mg/L", "µg/dL", "µg/L", "ng/mL", "ng/dL", "pg/mL", "µg/mL"],
  },
  {
    label: "Konsentrasi molar (SI)",
    options: ["mmol/L", "µmol/L", "nmol/L", "mEq/L"],
  },
  {
    label: "Aktivitas enzim",
    options: ["U/L", "IU/L", "mU/L"],
  },
  {
    label: "Hitung sel",
    options: ["10³/µL", "10⁶/µL", "10⁹/L", "10¹²/L", "/µL", "sel/µL"],
  },
  {
    label: "Indeks hematologi",
    options: ["fL", "pg", "%"],
  },
  {
    label: "Laju / waktu",
    options: ["mm/jam", "detik", "menit"],
  },
  {
    label: "Urin / sedimen",
    options: ["/LPB", "/LPK", "mg/24jam", "BJ"],
  },
  {
    label: "Hormon / imuno",
    options: ["mIU/mL", "µIU/mL", "IU/mL"],
  },
  {
    label: "Fungsi ginjal & koagulasi",
    options: ["mL/menit/1,73m²", "INR", "µg/mL FEU"],
  },
];

/** Daftar datar satuan untuk pencarian combobox (urut sesuai grup). */
export const LAB_SATUAN_FLAT: string[] = LAB_SATUAN_GROUPS.flatMap((g) => g.options);

// ── Tipe record ───────────────────────────────────────────

/** Rentang rujukan numerik untuk satu parameter (per gender & kelompok usia). */
export interface LabRujukanRow {
  id: string;
  gender: "L" | "P" | "LP";
  usiaMin?: number; // tahun, undefined = tanpa batas bawah
  usiaMax?: number; // tahun, undefined = tanpa batas atas
  low: number;
  high: number;
  keterangan?: string;
}

/** Parameter (analit) di dalam sebuah tes. */
export interface LabParameterRow {
  id: string;
  nama: string;
  satuan: string;              // "" untuk kualitatif
  tipeHasil: LabResultType;
  nilaiNormalText?: string;    // kualitatif: "Negatif", "A / B / AB / O", "< 1/160"
  rujukan: LabRujukanRow[];    // numerik: rentang per gender/usia
  criticalLow?: number;
  criticalHigh?: number;
  deltaAbsolute?: number;
  deltaPercent?: number;
  metode?: string;             // metode spesifik parameter (opsional, override metode tes)
  urutan: number;
}

/** Tes laboratorium (orderable) — memuat 1..N parameter. */
export interface LabTestRecord {
  id: string;
  kode: string;                // kode internal lab (opsional, auto/diisi belakangan)
  nama: string;
  kategori: LabKategori;
  spesimen?: string;           // mis. "Darah EDTA", "Serum", "Urin sewaktu"
  metode?: string;             // metode utama tes
  waktuTunggu?: string;        // TAT, mis. "60 mnt"
  keterangan?: string;
  status: LabTestStatus;
  parameters: LabParameterRow[];
}

// ── Factories ─────────────────────────────────────────────
let _seq = 0;
function uid(prefix: string): string {
  _seq += 1;
  return `${prefix}-${Date.now().toString(36)}-${_seq}`;
}

export function emptyLabParameter(urutan = 0): LabParameterRow {
  return {
    id: uid("par"),
    nama: "",
    satuan: "",
    tipeHasil: "Numerik",
    rujukan: [],
    urutan,
  };
}

export function emptyLabRujukan(): LabRujukanRow {
  return { id: uid("ruj"), gender: "LP", low: 0, high: 0 };
}

export function emptyLabTest(): LabTestRecord {
  return {
    id: uid("lt"),
    kode: "",
    nama: "",
    kategori: "Hematologi",
    spesimen: "",
    metode: "",
    waktuTunggu: "",
    status: "Aktif",
    parameters: [emptyLabParameter(0)],
  };
}

// ── Helpers ───────────────────────────────────────────────
export function paramHasCritical(p: LabParameterRow): boolean {
  return p.criticalLow !== undefined || p.criticalHigh !== undefined;
}

export function paramHasDelta(p: LabParameterRow): boolean {
  return p.deltaAbsolute !== undefined || p.deltaPercent !== undefined;
}

export function testHasCritical(t: LabTestRecord): boolean {
  return t.parameters.some(paramHasCritical);
}

export function countParameters(t: LabTestRecord): number {
  return t.parameters.length;
}
