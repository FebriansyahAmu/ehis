/**
 * Source-of-truth Katalog Pemeriksaan Laboratorium.
 * Digunakan oleh: KatalogLabPage, HasilPane (autoFlag), TrendPane (DELTA_THRESHOLDS).
 * Standard: ISO 15189:2022 · SNARS AP 5 · PMK 43/2013
 */

import type { KategoriLab } from "@/components/lab/labShared";

// ── Types ─────────────────────────────────────────────────

export type LabKatalogStatus = "Aktif" | "NonAktif";

export interface NilaiRujukanRow {
  id: string;
  gender: "L" | "P" | "LP";
  usiaMin?: number; // tahun, undefined = tanpa batas bawah
  usiaMax?: number; // tahun, undefined = tanpa batas atas
  low: number;
  high: number;
  keterangan?: string;
}

export interface LabKatalogItem {
  id: string;
  kode: string;
  nama: string;
  kategori: KategoriLab;
  satuan: string;
  waktuTunggu?: string; // "30 mnt", "60 mnt", dst
  nilaiRujukan: NilaiRujukanRow[];
  criticalLow?: number;
  criticalHigh?: number;
  deltaAbsolute?: number; // perubahan absolut memicu delta check
  deltaPercent?: number;  // perubahan % memicu delta check
  status: LabKatalogStatus;
  keterangan?: string;
}

export function emptyLabKatalogItem(): LabKatalogItem {
  return {
    id: `lk-${Date.now()}`,
    kode: "",
    nama: "",
    kategori: "Hematologi",
    satuan: "",
    waktuTunggu: "",
    nilaiRujukan: [],
    status: "Aktif",
  };
}

// ── Helper (private) ──────────────────────────────────────

function ru(
  id: string,
  gender: NilaiRujukanRow["gender"],
  low: number,
  high: number,
  usiaMin?: number,
  usiaMax?: number,
  keterangan?: string,
): NilaiRujukanRow {
  return { id, gender, low, high, usiaMin, usiaMax, keterangan };
}

// ── Mock Data ─────────────────────────────────────────────

export const LAB_KATALOG_MOCK: LabKatalogItem[] = [
  // ── Hematologi ────────────────────────────────────
  {
    id: "lk-001", kode: "HEM-001", nama: "Hemoglobin", kategori: "Hematologi",
    satuan: "g/dL", waktuTunggu: "60 mnt", status: "Aktif",
    nilaiRujukan: [ru("r1", "L", 13.0, 17.0), ru("r2", "P", 12.0, 15.0)],
    criticalLow: 7.0, criticalHigh: 20.0, deltaAbsolute: 2,
    keterangan: "Penurunan → anemia. Serial monitoring pada perdarahan aktif.",
  },
  {
    id: "lk-002", kode: "HEM-002", nama: "Hematokrit", kategori: "Hematologi",
    satuan: "%", waktuTunggu: "60 mnt", status: "Aktif",
    nilaiRujukan: [ru("r1", "L", 40, 52), ru("r2", "P", 37, 47)],
    criticalLow: 20, criticalHigh: 60, deltaAbsolute: 6,
  },
  {
    id: "lk-003", kode: "HEM-003", nama: "Leukosit", kategori: "Hematologi",
    satuan: "×10³/µL", waktuTunggu: "60 mnt", status: "Aktif",
    nilaiRujukan: [ru("r1", "LP", 4.0, 10.0)],
    criticalLow: 2.0, criticalHigh: 30.0, deltaPercent: 50,
    keterangan: "Leukositosis → infeksi/inflamasi. Leukopenia → imunosupresi.",
  },
  {
    id: "lk-004", kode: "HEM-004", nama: "Eritrosit", kategori: "Hematologi",
    satuan: "×10⁶/µL", waktuTunggu: "60 mnt", status: "Aktif",
    nilaiRujukan: [ru("r1", "L", 4.5, 5.9), ru("r2", "P", 4.0, 5.3)],
    criticalLow: 2.0,
  },
  {
    id: "lk-005", kode: "HEM-005", nama: "Trombosit", kategori: "Hematologi",
    satuan: "×10³/µL", waktuTunggu: "60 mnt", status: "Aktif",
    nilaiRujukan: [ru("r1", "LP", 150, 400)],
    criticalLow: 50, criticalHigh: 1000, deltaPercent: 30,
  },
  {
    id: "lk-006", kode: "HEM-006", nama: "MCV", kategori: "Hematologi",
    satuan: "fL", waktuTunggu: "60 mnt", status: "Aktif",
    nilaiRujukan: [ru("r1", "LP", 80, 100)],
  },
  {
    id: "lk-007", kode: "HEM-007", nama: "MCH", kategori: "Hematologi",
    satuan: "pg", waktuTunggu: "60 mnt", status: "Aktif",
    nilaiRujukan: [ru("r1", "LP", 26, 32)],
  },
  {
    id: "lk-008", kode: "HEM-008", nama: "MCHC", kategori: "Hematologi",
    satuan: "g/dL", waktuTunggu: "60 mnt", status: "Aktif",
    nilaiRujukan: [ru("r1", "LP", 31, 37)],
  },

  // ── Kimia Klinik ──────────────────────────────────
  {
    id: "lk-009", kode: "KIM-001", nama: "Glukosa Sewaktu (GDS)", kategori: "Kimia Klinik",
    satuan: "mg/dL", waktuTunggu: "60 mnt", status: "Aktif",
    nilaiRujukan: [ru("r1", "LP", 70, 200, undefined, undefined, "≥200 mg/dL curiga DM (WHO)")],
    criticalLow: 50, criticalHigh: 500,
    keterangan: "Tanpa puasa. Cutoff DM WHO: ≥200 mg/dL disertai gejala.",
  },
  {
    id: "lk-010", kode: "KIM-002", nama: "Glukosa Puasa (GDP)", kategori: "Kimia Klinik",
    satuan: "mg/dL", waktuTunggu: "60 mnt", status: "Aktif",
    nilaiRujukan: [ru("r1", "LP", 70, 100)],
    criticalLow: 50, criticalHigh: 400,
  },
  {
    id: "lk-011", kode: "KIM-003", nama: "HbA1c", kategori: "Kimia Klinik",
    satuan: "%", waktuTunggu: "120 mnt", status: "Aktif",
    nilaiRujukan: [ru("r1", "LP", 0, 5.7, undefined, undefined, "Pre-DM: 5.7–6.4%; DM: ≥6.5%")],
    keterangan: "Indikator kontrol glukosa 3 bulan. Tidak terpengaruh puasa.",
  },
  {
    id: "lk-012", kode: "KIM-004", nama: "Ureum", kategori: "Kimia Klinik",
    satuan: "mg/dL", waktuTunggu: "60 mnt", status: "Aktif",
    nilaiRujukan: [ru("r1", "LP", 10, 50)],
    criticalHigh: 200, deltaPercent: 50,
  },
  {
    id: "lk-013", kode: "KIM-005", nama: "Kreatinin", kategori: "Kimia Klinik",
    satuan: "mg/dL", waktuTunggu: "60 mnt", status: "Aktif",
    nilaiRujukan: [ru("r1", "L", 0.7, 1.2), ru("r2", "P", 0.5, 1.0)],
    criticalHigh: 10, deltaPercent: 50,
    keterangan: "Marker fungsi ginjal. Kreatinin ×2 dari baseline → AKI.",
  },
  {
    id: "lk-014", kode: "KIM-006", nama: "Asam Urat", kategori: "Kimia Klinik",
    satuan: "mg/dL", waktuTunggu: "60 mnt", status: "Aktif",
    nilaiRujukan: [ru("r1", "L", 3.4, 7.0), ru("r2", "P", 2.4, 5.7)],
  },
  {
    id: "lk-015", kode: "KIM-007", nama: "AST (SGOT)", kategori: "Kimia Klinik",
    satuan: "U/L", waktuTunggu: "60 mnt", status: "Aktif",
    nilaiRujukan: [ru("r1", "L", 10, 37), ru("r2", "P", 10, 31)],
    criticalHigh: 1000, deltaPercent: 30,
  },
  {
    id: "lk-016", kode: "KIM-008", nama: "ALT (SGPT)", kategori: "Kimia Klinik",
    satuan: "U/L", waktuTunggu: "60 mnt", status: "Aktif",
    nilaiRujukan: [ru("r1", "L", 10, 40), ru("r2", "P", 9, 36)],
    criticalHigh: 1000, deltaPercent: 30,
  },
  {
    id: "lk-017", kode: "KIM-009", nama: "Bilirubin Total", kategori: "Kimia Klinik",
    satuan: "mg/dL", waktuTunggu: "60 mnt", status: "Aktif",
    nilaiRujukan: [ru("r1", "LP", 0.2, 1.2)],
    criticalHigh: 15, deltaPercent: 30,
  },
  {
    id: "lk-018", kode: "KIM-010", nama: "Kolesterol Total", kategori: "Kimia Klinik",
    satuan: "mg/dL", waktuTunggu: "60 mnt", status: "Aktif",
    nilaiRujukan: [ru("r1", "LP", 0, 200, undefined, undefined, "Borderline 200–239; Tinggi ≥240")],
  },
  {
    id: "lk-019", kode: "KIM-011", nama: "Trigliserida", kategori: "Kimia Klinik",
    satuan: "mg/dL", waktuTunggu: "60 mnt", status: "Aktif",
    nilaiRujukan: [ru("r1", "LP", 0, 150)],
    criticalHigh: 1000,
  },
  {
    id: "lk-020", kode: "KIM-012", nama: "Troponin I", kategori: "Kimia Klinik",
    satuan: "ng/mL", waktuTunggu: "30 mnt", status: "Aktif",
    nilaiRujukan: [ru("r1", "LP", 0, 0.04)],
    criticalHigh: 0.5, deltaPercent: 20,
    keterangan: "Marker miokard injury. Serial tiap 3–6 jam pada suspek ACS.",
  },
  {
    id: "lk-021", kode: "KIM-013", nama: "BNP", kategori: "Kimia Klinik",
    satuan: "pg/mL", waktuTunggu: "60 mnt", status: "Aktif",
    nilaiRujukan: [ru("r1", "LP", 0, 100)],
    criticalHigh: 400, deltaPercent: 30,
    keterangan: "B-type Natriuretic Peptide. Marker gagal jantung.",
  },
  {
    id: "lk-022", kode: "KIM-014", nama: "Prokalsitonin (PCT)", kategori: "Kimia Klinik",
    satuan: "ng/mL", waktuTunggu: "120 mnt", status: "Aktif",
    nilaiRujukan: [ru("r1", "LP", 0, 0.5)],
    criticalHigh: 2.0, deltaPercent: 100,
    keterangan: "PCT > 2 ng/mL → sepsis berat. Panduan de-eskalasi antibiotik.",
  },
  {
    id: "lk-023", kode: "KIM-015", nama: "Natrium (Na)", kategori: "Kimia Klinik",
    satuan: "mEq/L", waktuTunggu: "60 mnt", status: "Aktif",
    nilaiRujukan: [ru("r1", "LP", 135, 145)],
    criticalLow: 120, criticalHigh: 160, deltaAbsolute: 10,
  },
  {
    id: "lk-024", kode: "KIM-016", nama: "Kalium (K)", kategori: "Kimia Klinik",
    satuan: "mEq/L", waktuTunggu: "60 mnt", status: "Aktif",
    nilaiRujukan: [ru("r1", "LP", 3.5, 5.0)],
    criticalLow: 2.5, criticalHigh: 6.5, deltaAbsolute: 1.0,
    keterangan: "Hipo/hiperkalemia → aritmia fatal. Monitoring ketat pada gagal ginjal.",
  },
  {
    id: "lk-025", kode: "KIM-017", nama: "Klorida (Cl)", kategori: "Kimia Klinik",
    satuan: "mEq/L", waktuTunggu: "60 mnt", status: "Aktif",
    nilaiRujukan: [ru("r1", "LP", 96, 106)],
    criticalLow: 80, criticalHigh: 120, deltaAbsolute: 10,
  },

  // ── Koagulasi ─────────────────────────────────────
  {
    id: "lk-026", kode: "KOA-001", nama: "Protrombin Time (PT)", kategori: "Koagulasi",
    satuan: "detik", waktuTunggu: "90 mnt", status: "Aktif",
    nilaiRujukan: [ru("r1", "LP", 11, 14)],
    criticalHigh: 35,
    keterangan: "Defisiensi faktor II,V,VII,X atau terapi warfarin.",
  },
  {
    id: "lk-027", kode: "KOA-002", nama: "aPTT", kategori: "Koagulasi",
    satuan: "detik", waktuTunggu: "90 mnt", status: "Aktif",
    nilaiRujukan: [ru("r1", "LP", 25, 35)],
    criticalHigh: 70,
    keterangan: "Jalur intrinsik. Monitoring terapi heparin.",
  },
  {
    id: "lk-028", kode: "KOA-003", nama: "D-Dimer", kategori: "Koagulasi",
    satuan: "µg/mL FEU", waktuTunggu: "60 mnt", status: "Aktif",
    nilaiRujukan: [ru("r1", "LP", 0, 0.5)],
    criticalHigh: 5.0,
    keterangan: "Elevated → DVT, PE, DIC. Age-adjusted cutoff: usia/100 µg/mL.",
  },

  // ── Urinalisis ────────────────────────────────────
  {
    id: "lk-029", kode: "URI-001", nama: "pH Urin", kategori: "Urinalisis",
    satuan: "", waktuTunggu: "30 mnt", status: "Aktif",
    nilaiRujukan: [ru("r1", "LP", 4.5, 8.0)],
  },
  {
    id: "lk-030", kode: "URI-002", nama: "Protein Urin Kuantitatif", kategori: "Urinalisis",
    satuan: "mg/dL", waktuTunggu: "60 mnt", status: "Aktif",
    nilaiRujukan: [ru("r1", "LP", 0, 0.15)],
    criticalHigh: 0.5,
    keterangan: "Proteinuria persisten → CKD, sindrom nefrotik.",
  },
  {
    id: "lk-031", kode: "URI-003", nama: "Glukosa Urin", kategori: "Urinalisis",
    satuan: "mg/dL", waktuTunggu: "30 mnt", status: "Aktif",
    nilaiRujukan: [ru("r1", "LP", 0, 0)],
    keterangan: "Glukosuria → hiperglikemia atau gangguan reabsorpsi tubulus.",
  },
];
