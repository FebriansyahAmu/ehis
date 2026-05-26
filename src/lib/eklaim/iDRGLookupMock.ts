/**
 * iDRG Lookup Mock (EK0.2).
 *
 * 30 kode iDRG 7-digit numerik — basis grouper untuk Pedoman Pengodean iDRG 2025
 * Kemenkes (resmi 1 Okt 2025). Setiap entry punya 3 severity (Ringan/Sedang/Berat)
 * dengan tarif per 4 tingkat kompetensi RS (dasar/menengah/utama/komprehensif).
 *
 * Format kode: MMNNNNN (2 digit MDC + 5 digit sequence). Real lookup Kemenkes
 * akan punya struktur berbeda — ini representasi mock untuk pengembangan.
 *
 * Distribusi:
 * - MDC 05 (Sirkulasi): 8 cases
 * - MDC 10 (Endokrin): 4 cases
 * - MDC 14 (Obstetri): 5 cases
 * - MDC 04 (Pernapasan): 4 cases
 * - MDC 06 (Pencernaan): 3 cases
 * - MDC 11 (Ginjal): 3 cases
 * - MDC 18 (Infeksi): 3 cases
 *
 * Tarif mock pakai asumsi multiplier per tingkat kompetensi:
 * dasar 70% · menengah 85% · utama 100% (base) · komprehensif 120%.
 */

import type { iDRGLookupEntry, Rupiah, TarifPerTingkat } from "./eklaimShared";

const VERSI_GROUPER = "iDRG_v1.0_2025";

/**
 * Generate `TarifPerTingkat` dari base tarif "utama" (level 3 RS).
 * Multiplier asumsi mock — real Kemenkes punya tarif diskrit per tingkat.
 */
function tpt(utama: Rupiah): TarifPerTingkat {
  return {
    dasar: (utama * 70n) / 100n,
    menengah: (utama * 85n) / 100n,
    utama,
    komprehensif: (utama * 120n) / 100n,
  };
}

// ── MDC 05: Sirkulasi (Kardiovaskular) ──────────────────

const SIRKULASI: ReadonlyArray<iDRGLookupEntry> = [
  {
    code: "0500001",
    mdc: "MDC 05",
    group: "Infark Miokard Akut STEMI",
    severityLevels: {
      1: { label: "Ringan", tarifPerTingkat: tpt(12_000_000n) },
      2: { label: "Sedang", tarifPerTingkat: tpt(20_000_000n) },
      3: { label: "Berat", tarifPerTingkat: tpt(32_000_000n) },
    },
    icd10IMList: ["I21.0", "I21.1"],
    icd9CMIMList: ["36.07", "37.61", "89.52"],
    versiGrouper: VERSI_GROUPER,
  },
  {
    code: "0500002",
    mdc: "MDC 05",
    group: "Infark Miokard Akut NSTEMI",
    severityLevels: {
      1: { label: "Ringan", tarifPerTingkat: tpt(10_000_000n) },
      2: { label: "Sedang", tarifPerTingkat: tpt(16_500_000n) },
      3: { label: "Berat", tarifPerTingkat: tpt(26_000_000n) },
    },
    icd10IMList: ["I21.4"],
    icd9CMIMList: ["36.07", "89.52", "88.72"],
    versiGrouper: VERSI_GROUPER,
  },
  {
    code: "0500003",
    mdc: "MDC 05",
    group: "Gagal Jantung Kongestif",
    severityLevels: {
      1: { label: "Ringan", tarifPerTingkat: tpt(7_500_000n) },
      2: { label: "Sedang", tarifPerTingkat: tpt(12_500_000n) },
      3: { label: "Berat", tarifPerTingkat: tpt(19_500_000n) },
    },
    icd10IMList: ["I50.0", "I50.1"],
    icd9CMIMList: ["89.52", "88.72"],
    versiGrouper: VERSI_GROUPER,
  },
  {
    code: "0500004",
    mdc: "MDC 05",
    group: "Angina Pektoris Tidak Stabil",
    severityLevels: {
      1: { label: "Ringan", tarifPerTingkat: tpt(6_500_000n) },
      2: { label: "Sedang", tarifPerTingkat: tpt(10_500_000n) },
      3: { label: "Berat", tarifPerTingkat: tpt(17_000_000n) },
    },
    icd10IMList: ["I20.0"],
    icd9CMIMList: ["89.52", "36.07"],
    versiGrouper: VERSI_GROUPER,
  },
  {
    code: "0500005",
    mdc: "MDC 05",
    group: "Fibrilasi Atrium / Aritmia",
    severityLevels: {
      1: { label: "Ringan", tarifPerTingkat: tpt(5_500_000n) },
      2: { label: "Sedang", tarifPerTingkat: tpt(8_500_000n) },
      3: { label: "Berat", tarifPerTingkat: tpt(14_000_000n) },
    },
    icd10IMList: ["I48.0", "I48.2"],
    icd9CMIMList: ["89.52", "37.61"],
    versiGrouper: VERSI_GROUPER,
  },
  {
    code: "0500006",
    mdc: "MDC 05",
    group: "Krisis Hipertensi",
    severityLevels: {
      1: { label: "Ringan", tarifPerTingkat: tpt(5_000_000n) },
      2: { label: "Sedang", tarifPerTingkat: tpt(8_000_000n) },
      3: { label: "Berat", tarifPerTingkat: tpt(13_500_000n) },
    },
    icd10IMList: ["I10", "I11.0"],
    icd9CMIMList: ["89.52"],
    versiGrouper: VERSI_GROUPER,
  },
  {
    code: "0500007",
    mdc: "MDC 05",
    group: "Stroke Iskemik (Infark Serebri)",
    severityLevels: {
      1: { label: "Ringan", tarifPerTingkat: tpt(9_500_000n) },
      2: { label: "Sedang", tarifPerTingkat: tpt(15_500_000n) },
      3: { label: "Berat", tarifPerTingkat: tpt(24_000_000n) },
    },
    icd10IMList: ["I63.9"],
    icd9CMIMList: ["88.38"],
    versiGrouper: VERSI_GROUPER,
  },
  {
    code: "0500008",
    mdc: "MDC 05",
    group: "CABG (Coronary Artery Bypass)",
    severityLevels: {
      1: { label: "Ringan", tarifPerTingkat: tpt(45_000_000n) },
      2: { label: "Sedang", tarifPerTingkat: tpt(65_000_000n) },
      3: { label: "Berat", tarifPerTingkat: tpt(95_000_000n) },
    },
    icd10IMList: ["I21.0", "I20.0"],
    icd9CMIMList: ["36.10", "36.13"],
    versiGrouper: VERSI_GROUPER,
  },
];

// ── MDC 10: Endokrin, Nutrisi, Metabolik ────────────────

const ENDOKRIN: ReadonlyArray<iDRGLookupEntry> = [
  {
    code: "1000001",
    mdc: "MDC 10",
    group: "Diabetes Melitus Tipe 2 tanpa Komplikasi",
    severityLevels: {
      1: { label: "Ringan", tarifPerTingkat: tpt(3_500_000n) },
      2: { label: "Sedang", tarifPerTingkat: tpt(5_500_000n) },
      3: { label: "Berat", tarifPerTingkat: tpt(8_500_000n) },
    },
    icd10IMList: ["E11.9"],
    icd9CMIMList: [],
    versiGrouper: VERSI_GROUPER,
  },
  {
    code: "1000002",
    mdc: "MDC 10",
    group: "Diabetes Melitus Tipe 2 dengan Komplikasi",
    severityLevels: {
      1: { label: "Ringan", tarifPerTingkat: tpt(5_500_000n) },
      2: { label: "Sedang", tarifPerTingkat: tpt(9_500_000n) },
      3: { label: "Berat", tarifPerTingkat: tpt(15_500_000n) },
    },
    icd10IMList: ["E11.22"],
    icd9CMIMList: ["39.95"],
    versiGrouper: VERSI_GROUPER,
  },
  {
    code: "1000003",
    mdc: "MDC 10",
    group: "Ketoasidosis Diabetik (DKA)",
    severityLevels: {
      1: { label: "Ringan", tarifPerTingkat: tpt(6_500_000n) },
      2: { label: "Sedang", tarifPerTingkat: tpt(11_000_000n) },
      3: { label: "Berat", tarifPerTingkat: tpt(18_500_000n) },
    },
    icd10IMList: ["E11.65"],
    icd9CMIMList: [],
    versiGrouper: VERSI_GROUPER,
  },
  {
    code: "1000004",
    mdc: "MDC 10",
    group: "Gangguan Tiroid",
    severityLevels: {
      1: { label: "Ringan", tarifPerTingkat: tpt(3_000_000n) },
      2: { label: "Sedang", tarifPerTingkat: tpt(4_800_000n) },
      3: { label: "Berat", tarifPerTingkat: tpt(7_500_000n) },
    },
    icd10IMList: ["E03.9", "E05.9"],
    icd9CMIMList: [],
    versiGrouper: VERSI_GROUPER,
  },
];

// ── MDC 14: Kehamilan, Persalinan, Nifas ────────────────

const OBSTETRI: ReadonlyArray<iDRGLookupEntry> = [
  {
    code: "1400001",
    mdc: "MDC 14",
    group: "Persalinan Pervaginam Spontan Normal",
    severityLevels: {
      1: { label: "Ringan", tarifPerTingkat: tpt(3_000_000n) },
      2: { label: "Sedang", tarifPerTingkat: tpt(4_200_000n) },
      3: { label: "Berat", tarifPerTingkat: tpt(6_500_000n) },
    },
    icd10IMList: ["O80"],
    icd9CMIMList: ["73.59", "75.62"],
    versiGrouper: VERSI_GROUPER,
  },
  {
    code: "1400002",
    mdc: "MDC 14",
    group: "Sectio Caesarea Elektif",
    severityLevels: {
      1: { label: "Ringan", tarifPerTingkat: tpt(7_500_000n) },
      2: { label: "Sedang", tarifPerTingkat: tpt(10_500_000n) },
      3: { label: "Berat", tarifPerTingkat: tpt(15_500_000n) },
    },
    icd10IMList: ["O82"],
    icd9CMIMList: ["74.1", "74.99"],
    versiGrouper: VERSI_GROUPER,
  },
  {
    code: "1400003",
    mdc: "MDC 14",
    group: "Sectio Caesarea Darurat (Indikasi Medis)",
    severityLevels: {
      1: { label: "Ringan", tarifPerTingkat: tpt(9_000_000n) },
      2: { label: "Sedang", tarifPerTingkat: tpt(13_500_000n) },
      3: { label: "Berat", tarifPerTingkat: tpt(20_500_000n) },
    },
    icd10IMList: ["O82", "O14.1"],
    icd9CMIMList: ["74.1"],
    versiGrouper: VERSI_GROUPER,
  },
  {
    code: "1400004",
    mdc: "MDC 14",
    group: "Preeklampsia Berat / Eklampsia",
    severityLevels: {
      1: { label: "Ringan", tarifPerTingkat: tpt(7_000_000n) },
      2: { label: "Sedang", tarifPerTingkat: tpt(11_500_000n) },
      3: { label: "Berat", tarifPerTingkat: tpt(18_500_000n) },
    },
    icd10IMList: ["O14.1"],
    icd9CMIMList: ["74.1"],
    versiGrouper: VERSI_GROUPER,
  },
  {
    code: "1400005",
    mdc: "MDC 14",
    group: "Perdarahan Postpartum (Atonia Uteri)",
    severityLevels: {
      1: { label: "Ringan", tarifPerTingkat: tpt(5_500_000n) },
      2: { label: "Sedang", tarifPerTingkat: tpt(9_500_000n) },
      3: { label: "Berat", tarifPerTingkat: tpt(16_000_000n) },
    },
    icd10IMList: ["O72.1"],
    icd9CMIMList: ["75.62"],
    versiGrouper: VERSI_GROUPER,
  },
];

// ── MDC 04: Sistem Pernapasan ───────────────────────────

const PERNAPASAN: ReadonlyArray<iDRGLookupEntry> = [
  {
    code: "0400001",
    mdc: "MDC 04",
    group: "Pneumonia Bakteri",
    severityLevels: {
      1: { label: "Ringan", tarifPerTingkat: tpt(5_500_000n) },
      2: { label: "Sedang", tarifPerTingkat: tpt(9_000_000n) },
      3: { label: "Berat", tarifPerTingkat: tpt(15_500_000n) },
    },
    icd10IMList: ["J18.9"],
    icd9CMIMList: [],
    versiGrouper: VERSI_GROUPER,
  },
  {
    code: "0400002",
    mdc: "MDC 04",
    group: "PPOK Eksaserbasi Akut",
    severityLevels: {
      1: { label: "Ringan", tarifPerTingkat: tpt(5_000_000n) },
      2: { label: "Sedang", tarifPerTingkat: tpt(8_500_000n) },
      3: { label: "Berat", tarifPerTingkat: tpt(14_500_000n) },
    },
    icd10IMList: ["J44.9"],
    icd9CMIMList: [],
    versiGrouper: VERSI_GROUPER,
  },
  {
    code: "0400003",
    mdc: "MDC 04",
    group: "Asma Akut Berat",
    severityLevels: {
      1: { label: "Ringan", tarifPerTingkat: tpt(4_000_000n) },
      2: { label: "Sedang", tarifPerTingkat: tpt(6_500_000n) },
      3: { label: "Berat", tarifPerTingkat: tpt(11_000_000n) },
    },
    icd10IMList: ["J45.9"],
    icd9CMIMList: [],
    versiGrouper: VERSI_GROUPER,
  },
  {
    code: "0400004",
    mdc: "MDC 04",
    group: "Gagal Nafas Akut dengan Ventilator",
    severityLevels: {
      1: { label: "Ringan", tarifPerTingkat: tpt(12_500_000n) },
      2: { label: "Sedang", tarifPerTingkat: tpt(22_500_000n) },
      3: { label: "Berat", tarifPerTingkat: tpt(38_500_000n) },
    },
    icd10IMList: ["J96.0"],
    icd9CMIMList: ["96.71", "96.72", "31.1"],
    versiGrouper: VERSI_GROUPER,
  },
];

// ── MDC 06: Sistem Pencernaan ───────────────────────────

const PENCERNAAN: ReadonlyArray<iDRGLookupEntry> = [
  {
    code: "0600001",
    mdc: "MDC 06",
    group: "Apendisitis Akut (Operasi)",
    severityLevels: {
      1: { label: "Ringan", tarifPerTingkat: tpt(6_500_000n) },
      2: { label: "Sedang", tarifPerTingkat: tpt(9_500_000n) },
      3: { label: "Berat", tarifPerTingkat: tpt(15_500_000n) },
    },
    icd10IMList: ["K35.9"],
    icd9CMIMList: ["47.01", "47.09"],
    versiGrouper: VERSI_GROUPER,
  },
  {
    code: "0600002",
    mdc: "MDC 06",
    group: "Kolelitiasis (Operasi Kolesistektomi)",
    severityLevels: {
      1: { label: "Ringan", tarifPerTingkat: tpt(8_500_000n) },
      2: { label: "Sedang", tarifPerTingkat: tpt(12_500_000n) },
      3: { label: "Berat", tarifPerTingkat: tpt(19_500_000n) },
    },
    icd10IMList: ["K80.2"],
    icd9CMIMList: ["51.23"],
    versiGrouper: VERSI_GROUPER,
  },
  {
    code: "0600003",
    mdc: "MDC 06",
    group: "Gastroenteritis Akut (Dehidrasi)",
    severityLevels: {
      1: { label: "Ringan", tarifPerTingkat: tpt(2_500_000n) },
      2: { label: "Sedang", tarifPerTingkat: tpt(4_000_000n) },
      3: { label: "Berat", tarifPerTingkat: tpt(6_500_000n) },
    },
    icd10IMList: ["A09"],
    icd9CMIMList: [],
    versiGrouper: VERSI_GROUPER,
  },
];

// ── MDC 11: Sistem Genitourinaria ───────────────────────

const GINJAL: ReadonlyArray<iDRGLookupEntry> = [
  {
    code: "1100001",
    mdc: "MDC 11",
    group: "Gagal Ginjal Akut (AKI)",
    severityLevels: {
      1: { label: "Ringan", tarifPerTingkat: tpt(7_500_000n) },
      2: { label: "Sedang", tarifPerTingkat: tpt(13_500_000n) },
      3: { label: "Berat", tarifPerTingkat: tpt(22_500_000n) },
    },
    icd10IMList: ["N17.9"],
    icd9CMIMList: ["39.95"],
    versiGrouper: VERSI_GROUPER,
  },
  {
    code: "1100002",
    mdc: "MDC 11",
    group: "Gagal Ginjal Kronik Stadium 5 (Dialisis)",
    severityLevels: {
      1: { label: "Ringan", tarifPerTingkat: tpt(8_500_000n) },
      2: { label: "Sedang", tarifPerTingkat: tpt(14_500_000n) },
      3: { label: "Berat", tarifPerTingkat: tpt(23_500_000n) },
    },
    icd10IMList: ["N18.5"],
    icd9CMIMList: ["39.95", "54.98"],
    versiGrouper: VERSI_GROUPER,
  },
  {
    code: "1100003",
    mdc: "MDC 11",
    group: "Pielonefritis Akut",
    severityLevels: {
      1: { label: "Ringan", tarifPerTingkat: tpt(4_500_000n) },
      2: { label: "Sedang", tarifPerTingkat: tpt(7_500_000n) },
      3: { label: "Berat", tarifPerTingkat: tpt(12_500_000n) },
    },
    icd10IMList: ["A41.9"],
    icd9CMIMList: [],
    versiGrouper: VERSI_GROUPER,
  },
];

// ── MDC 18: Infeksi & Parasit ───────────────────────────

const INFEKSI: ReadonlyArray<iDRGLookupEntry> = [
  {
    code: "1800001",
    mdc: "MDC 18",
    group: "Sepsis Non-Syok",
    severityLevels: {
      1: { label: "Ringan", tarifPerTingkat: tpt(9_500_000n) },
      2: { label: "Sedang", tarifPerTingkat: tpt(16_500_000n) },
      3: { label: "Berat", tarifPerTingkat: tpt(27_500_000n) },
    },
    icd10IMList: ["A41.9"],
    icd9CMIMList: [],
    versiGrouper: VERSI_GROUPER,
  },
  {
    code: "1800002",
    mdc: "MDC 18",
    group: "Sepsis Berat dengan Syok Septik",
    severityLevels: {
      1: { label: "Ringan", tarifPerTingkat: tpt(18_500_000n) },
      2: { label: "Sedang", tarifPerTingkat: tpt(32_500_000n) },
      3: { label: "Berat", tarifPerTingkat: tpt(55_500_000n) },
    },
    icd10IMList: ["R65.21", "A41.9"],
    icd9CMIMList: ["96.71", "96.72"],
    versiGrouper: VERSI_GROUPER,
  },
  {
    code: "1800003",
    mdc: "MDC 18",
    group: "Infeksi Luka Operasi (HAIs)",
    severityLevels: {
      1: { label: "Ringan", tarifPerTingkat: tpt(5_500_000n) },
      2: { label: "Sedang", tarifPerTingkat: tpt(9_500_000n) },
      3: { label: "Berat", tarifPerTingkat: tpt(16_500_000n) },
    },
    icd10IMList: ["T81.4"],
    icd9CMIMList: [],
    versiGrouper: VERSI_GROUPER,
  },
];

// ── Aggregate Export ────────────────────────────────────

export const IDRG_LOOKUP_MOCK: ReadonlyArray<iDRGLookupEntry> = [
  ...SIRKULASI,
  ...ENDOKRIN,
  ...OBSTETRI,
  ...PERNAPASAN,
  ...PENCERNAAN,
  ...GINJAL,
  ...INFEKSI,
];

/** Lookup helper — return entry by exact 7-digit code atau undefined. */
export function findIDRG(code: string): iDRGLookupEntry | undefined {
  return IDRG_LOOKUP_MOCK.find((entry) => entry.code === code);
}

/** Lookup helper — return entries yang punya ICD-10-IM tertentu di icd10IMList. */
export function findIDRGByICD10IM(kodeICD: string): ReadonlyArray<iDRGLookupEntry> {
  return IDRG_LOOKUP_MOCK.filter((entry) => entry.icd10IMList.includes(kodeICD));
}
