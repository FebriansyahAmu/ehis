// Lab Manajemen QC — Types, Config, Mock Data
// ISO 15189:2022 §5.3/§5.6 · PMK 43/2013

// ── Types ─────────────────────────────────────────────────

export type WestgardRule = "1-2s" | "1-3s" | "2-2s" | "R-4s" | "4-1s" | "10x";

export interface QCRun {
  id: string; no: number; tanggal: string;
  shift: "Pagi" | "Siang" | "Malam"; nilai: number; petugas: string;
}

export interface QCLot {
  lotNumber: string; tglMasuk: string; tglKadaluarsa: string;
  mean: number; sd: number; cv: number;
}

export interface QCParameter {
  paramNama: string; satuan: string; instrumen: string;
  lot: QCLot; runs: QCRun[];
}

export interface ReagenItem {
  id: string; nama: string; instrumen: string;
  lotNumber: string; tglMasuk: string; tglKadaluarsa: string;
  stokSaat: number; stokMin: number; satuan: string;
}

export type KalibrasiStatus = "Valid" | "Overdue" | "Segera";

export interface KalibrasiRecord {
  id: string; instrumen: string; serialNo: string; jenis: string;
  tanggalTerakhir: string; tanggalBerikut: string; frekuensi: string;
  status: KalibrasiStatus; hasilTerakhir: "Lulus" | "Tidak Lulus" | "Pending";
  petugas?: string; catatan?: string;
}

export type EQAStatus = "Lulus" | "Tidak Lulus" | "Pending";

export interface EQASiklus {
  siklus: string; tanggal: string; parameter: string;
  nilaiRS: number; nilaiTarget: number; satuan: string;
  deviasi: number; status: EQAStatus;
}

export interface EQAProvider {
  id: string; nama: string; singkatan: string; tahun: number;
  siklus: EQASiklus[];
}

export interface DailyRegister {
  tanggal: string; total: number;
  byKategori: Record<string, number>;
  byUnit: Record<string, number>;
  tatRataRata: number; tatCITO: number; tatTarget: number;
  kritisCount: number; kritisRespon: number;
}

// ── Config ─────────────────────────────────────────────────

export const WESTGARD_CFG: Record<WestgardRule, { desc: string; severity: "warning" | "reject" }> = {
  "1-2s": { desc: "1 titik > mean ± 2SD",                       severity: "warning" },
  "1-3s": { desc: "1 titik > mean ± 3SD",                       severity: "reject"  },
  "2-2s": { desc: "2 titik berurutan > mean ± 2SD (sisi sama)", severity: "reject"  },
  "R-4s": { desc: "Range 2 titik berurutan > 4SD",              severity: "reject"  },
  "4-1s": { desc: "4 titik berurutan > mean ± 1SD (sisi sama)", severity: "reject"  },
  "10x":  { desc: "10 titik berurutan satu sisi mean",           severity: "reject"  },
};

export const KALIBRASI_STATUS_CFG: Record<KalibrasiStatus, { badge: string; dot: string }> = {
  Valid:   { badge: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200", dot: "bg-emerald-400" },
  Overdue: { badge: "bg-rose-100 text-rose-700 ring-1 ring-rose-200",         dot: "bg-rose-500"    },
  Segera:  { badge: "bg-amber-100 text-amber-700 ring-1 ring-amber-200",      dot: "bg-amber-400"   },
};

export const EQA_STATUS_CFG: Record<EQAStatus, { badge: string }> = {
  Lulus:         { badge: "bg-emerald-100 text-emerald-700" },
  "Tidak Lulus": { badge: "bg-rose-100 text-rose-700"       },
  Pending:       { badge: "bg-slate-100 text-slate-500"     },
};

// ── Mock Data ─────────────────────────────────────────────

export const QC_PARAMETERS: QCParameter[] = [
  {
    paramNama: "Hemoglobin", satuan: "g/dL", instrumen: "Sysmex XN-550",
    lot: { lotNumber: "LN-HB-0426", tglMasuk: "2026-04-01", tglKadaluarsa: "2026-10-31", mean: 12.0, sd: 0.22, cv: 1.8 },
    runs: [
      { id: "hb1",  no: 1,  tanggal: "2026-05-12", shift: "Pagi",  nilai: 12.1, petugas: "Mira" },
      { id: "hb2",  no: 2,  tanggal: "2026-05-12", shift: "Siang", nilai: 11.9, petugas: "Budi" },
      { id: "hb3",  no: 3,  tanggal: "2026-05-13", shift: "Pagi",  nilai: 12.3, petugas: "Mira" },
      { id: "hb4",  no: 4,  tanggal: "2026-05-13", shift: "Siang", nilai: 12.0, petugas: "Budi" },
      { id: "hb5",  no: 5,  tanggal: "2026-05-14", shift: "Pagi",  nilai: 11.8, petugas: "Mira" },
      { id: "hb6",  no: 6,  tanggal: "2026-05-14", shift: "Siang", nilai: 11.7, petugas: "Budi" },
      { id: "hb7",  no: 7,  tanggal: "2026-05-15", shift: "Pagi",  nilai: 12.2, petugas: "Mira" },
      { id: "hb8",  no: 8,  tanggal: "2026-05-15", shift: "Siang", nilai: 12.4, petugas: "Budi" },
      { id: "hb9",  no: 9,  tanggal: "2026-05-16", shift: "Pagi",  nilai: 12.5, petugas: "Mira" },
      { id: "hb10", no: 10, tanggal: "2026-05-16", shift: "Siang", nilai: 12.0, petugas: "Budi" },
      { id: "hb11", no: 11, tanggal: "2026-05-17", shift: "Pagi",  nilai: 11.9, petugas: "Mira" },
      { id: "hb12", no: 12, tanggal: "2026-05-17", shift: "Siang", nilai: 12.1, petugas: "Budi" },
      { id: "hb13", no: 13, tanggal: "2026-05-18", shift: "Pagi",  nilai: 12.5, petugas: "Mira" },
      { id: "hb14", no: 14, tanggal: "2026-05-18", shift: "Siang", nilai: 12.6, petugas: "Budi" },
    ],
  },
  {
    paramNama: "Glukosa", satuan: "mg/dL", instrumen: "Cobas C-111",
    lot: { lotNumber: "LN-GLU-0426", tglMasuk: "2026-04-15", tglKadaluarsa: "2026-09-30", mean: 100.0, sd: 2.5, cv: 2.5 },
    runs: [
      { id: "gl1",  no: 1,  tanggal: "2026-05-12", shift: "Pagi",  nilai: 100.1, petugas: "Mira" },
      { id: "gl2",  no: 2,  tanggal: "2026-05-12", shift: "Siang", nilai: 99.5,  petugas: "Budi" },
      { id: "gl3",  no: 3,  tanggal: "2026-05-13", shift: "Pagi",  nilai: 100.8, petugas: "Mira" },
      { id: "gl4",  no: 4,  tanggal: "2026-05-13", shift: "Siang", nilai: 101.2, petugas: "Budi" },
      { id: "gl5",  no: 5,  tanggal: "2026-05-14", shift: "Pagi",  nilai: 105.5, petugas: "Mira" },
      { id: "gl6",  no: 6,  tanggal: "2026-05-14", shift: "Siang", nilai: 106.0, petugas: "Budi" },
      { id: "gl7",  no: 7,  tanggal: "2026-05-15", shift: "Pagi",  nilai: 100.3, petugas: "Mira" },
      { id: "gl8",  no: 8,  tanggal: "2026-05-15", shift: "Siang", nilai: 99.8,  petugas: "Budi" },
      { id: "gl9",  no: 9,  tanggal: "2026-05-16", shift: "Pagi",  nilai: 100.5, petugas: "Mira" },
      { id: "gl10", no: 10, tanggal: "2026-05-16", shift: "Siang", nilai: 100.2, petugas: "Budi" },
      { id: "gl11", no: 11, tanggal: "2026-05-17", shift: "Pagi",  nilai: 99.1,  petugas: "Mira" },
      { id: "gl12", no: 12, tanggal: "2026-05-17", shift: "Siang", nilai: 100.7, petugas: "Budi" },
      { id: "gl13", no: 13, tanggal: "2026-05-18", shift: "Pagi",  nilai: 99.5,  petugas: "Mira" },
      { id: "gl14", no: 14, tanggal: "2026-05-18", shift: "Siang", nilai: 107.8, petugas: "Budi" },
    ],
  },
  {
    paramNama: "Kreatinin", satuan: "mg/dL", instrumen: "Cobas C-111",
    lot: { lotNumber: "LN-CRE-0426", tglMasuk: "2026-04-01", tglKadaluarsa: "2026-12-31", mean: 1.0, sd: 0.03, cv: 3.0 },
    runs: [
      { id: "cr1",  no: 1,  tanggal: "2026-05-12", shift: "Pagi",  nilai: 1.01, petugas: "Mira" },
      { id: "cr2",  no: 2,  tanggal: "2026-05-12", shift: "Siang", nilai: 0.99, petugas: "Budi" },
      { id: "cr3",  no: 3,  tanggal: "2026-05-13", shift: "Pagi",  nilai: 1.02, petugas: "Mira" },
      { id: "cr4",  no: 4,  tanggal: "2026-05-13", shift: "Siang", nilai: 1.00, petugas: "Budi" },
      { id: "cr5",  no: 5,  tanggal: "2026-05-14", shift: "Pagi",  nilai: 0.98, petugas: "Mira" },
      { id: "cr6",  no: 6,  tanggal: "2026-05-14", shift: "Siang", nilai: 1.01, petugas: "Budi" },
      { id: "cr7",  no: 7,  tanggal: "2026-05-15", shift: "Pagi",  nilai: 1.03, petugas: "Mira" },
      { id: "cr8",  no: 8,  tanggal: "2026-05-15", shift: "Siang", nilai: 1.00, petugas: "Budi" },
      { id: "cr9",  no: 9,  tanggal: "2026-05-16", shift: "Pagi",  nilai: 0.99, petugas: "Mira" },
      { id: "cr10", no: 10, tanggal: "2026-05-16", shift: "Siang", nilai: 1.02, petugas: "Budi" },
      { id: "cr11", no: 11, tanggal: "2026-05-17", shift: "Pagi",  nilai: 1.01, petugas: "Mira" },
      { id: "cr12", no: 12, tanggal: "2026-05-17", shift: "Siang", nilai: 0.98, petugas: "Budi" },
      { id: "cr13", no: 13, tanggal: "2026-05-18", shift: "Pagi",  nilai: 1.00, petugas: "Mira" },
      { id: "cr14", no: 14, tanggal: "2026-05-18", shift: "Siang", nilai: 1.01, petugas: "Budi" },
    ],
  },
];

export const REAGEN_LIST: ReagenItem[] = [
  { id: "rg1", nama: "Hemoglobin Reagent",   instrumen: "Sysmex XN-550",  lotNumber: "SX-HB-0426",  tglMasuk: "2026-04-01", tglKadaluarsa: "2026-10-31", stokSaat: 4, stokMin: 2, satuan: "botol" },
  { id: "rg2", nama: "Diff Pack (5-Part)",    instrumen: "Sysmex XN-550",  lotNumber: "SX-DP-0326",  tglMasuk: "2026-03-15", tglKadaluarsa: "2026-09-30", stokSaat: 1, stokMin: 2, satuan: "pak"   },
  { id: "rg3", nama: "Glukosa Reagent",       instrumen: "Cobas C-111",    lotNumber: "RC-GLU-0426", tglMasuk: "2026-04-10", tglKadaluarsa: "2026-10-09", stokSaat: 3, stokMin: 2, satuan: "botol" },
  { id: "rg4", nama: "Kreatinin Enzymatic",   instrumen: "Cobas C-111",    lotNumber: "RC-CRE-0326", tglMasuk: "2026-03-01", tglKadaluarsa: "2026-06-10", stokSaat: 2, stokMin: 2, satuan: "botol" },
  { id: "rg5", nama: "Ureum UV",              instrumen: "Cobas C-111",    lotNumber: "RC-URE-0426", tglMasuk: "2026-04-20", tglKadaluarsa: "2026-11-30", stokSaat: 5, stokMin: 2, satuan: "botol" },
  { id: "rg6", nama: "Troponin I Reagent",    instrumen: "Abbott Alinity", lotNumber: "AB-TnI-0426", tglMasuk: "2026-04-05", tglKadaluarsa: "2026-08-15", stokSaat: 1, stokMin: 3, satuan: "kit"   },
  { id: "rg7", nama: "PCT (Procalcitonin)",   instrumen: "Abbott Alinity", lotNumber: "AB-PCT-0426", tglMasuk: "2026-04-05", tglKadaluarsa: "2026-09-30", stokSaat: 2, stokMin: 2, satuan: "kit"   },
  { id: "rg8", nama: "NT-proBNP Reagent",     instrumen: "Abbott Alinity", lotNumber: "AB-BNP-0326", tglMasuk: "2026-03-10", tglKadaluarsa: "2026-07-31", stokSaat: 1, stokMin: 2, satuan: "kit"   },
];

export const KALIBRASI_LIST: KalibrasiRecord[] = [
  { id: "k1", instrumen: "Sysmex XN-550",      serialNo: "SX-XN550-001", jenis: "Hematologi Analyzer",   tanggalTerakhir: "2026-03-10", tanggalBerikut: "2026-06-10", frekuensi: "3 bulan", status: "Valid",   hasilTerakhir: "Lulus",  petugas: "Mira" },
  { id: "k2", instrumen: "Cobas C-111",         serialNo: "RC-C111-003",  jenis: "Kimia Klinik Analyzer", tanggalTerakhir: "2026-04-15", tanggalBerikut: "2026-07-15", frekuensi: "3 bulan", status: "Valid",   hasilTerakhir: "Lulus",  petugas: "Budi" },
  { id: "k3", instrumen: "Abbott Alinity i",    serialNo: "AB-Ali-002",   jenis: "Imunoanalizer",         tanggalTerakhir: "2026-01-20", tanggalBerikut: "2026-04-20", frekuensi: "3 bulan", status: "Overdue", hasilTerakhir: "Lulus",  catatan: "Kontak vendor Abbott segera" },
  { id: "k4", instrumen: "Uro-Dipstick Reader", serialNo: "UD-DR-004",    jenis: "Urinalisis Reader",     tanggalTerakhir: "2026-05-01", tanggalBerikut: "2026-08-01", frekuensi: "3 bulan", status: "Valid",   hasilTerakhir: "Lulus"  },
  { id: "k5", instrumen: "iStat Analyzer",      serialNo: "AB-iST-001",   jenis: "Blood Gas / POCT",      tanggalTerakhir: "2026-05-05", tanggalBerikut: "2026-06-05", frekuensi: "1 bulan", status: "Segera",  hasilTerakhir: "Lulus",  catatan: "Kalibrasi bulanan, segera jadwalkan" },
  { id: "k6", instrumen: "Centrifuge Hettich",  serialNo: "HT-CF-005",    jenis: "Centrifuge RPM",        tanggalTerakhir: "2025-12-01", tanggalBerikut: "2026-06-01", frekuensi: "6 bulan", status: "Segera",  hasilTerakhir: "Lulus"  },
];

export const EQA_PROVIDERS: EQAProvider[] = [
  {
    id: "pnpme", nama: "PNPME-BLK (Hematologi)", singkatan: "PNPME-BLK", tahun: 2026,
    siklus: [
      { siklus: "Siklus 1", tanggal: "2026-02-15", parameter: "Hemoglobin", nilaiRS: 12.1, nilaiTarget: 12.0, satuan: "g/dL",     deviasi: 0.8,  status: "Lulus"   },
      { siklus: "Siklus 1", tanggal: "2026-02-15", parameter: "Leukosit",   nilaiRS: 5.2,  nilaiTarget: 5.0,  satuan: "×10³/µL", deviasi: 4.0,  status: "Lulus"   },
      { siklus: "Siklus 1", tanggal: "2026-02-15", parameter: "Trombosit",  nilaiRS: 198,  nilaiTarget: 200,  satuan: "×10³/µL", deviasi: -1.0, status: "Lulus"   },
      { siklus: "Siklus 2", tanggal: "2026-05-10", parameter: "Hemoglobin", nilaiRS: 0,    nilaiTarget: 12.5, satuan: "g/dL",     deviasi: 0,    status: "Pending" },
      { siklus: "Siklus 2", tanggal: "2026-05-10", parameter: "Leukosit",   nilaiRS: 0,    nilaiTarget: 6.2,  satuan: "×10³/µL", deviasi: 0,    status: "Pending" },
    ],
  },
  {
    id: "eqas", nama: "EQAS labQuality (Kimia Klinik)", singkatan: "EQAS-labQ", tahun: 2026,
    siklus: [
      { siklus: "Q1-2026", tanggal: "2026-03-01", parameter: "Glukosa",   nilaiRS: 100.5, nilaiTarget: 100.0, satuan: "mg/dL", deviasi: 0.5,  status: "Lulus"       },
      { siklus: "Q1-2026", tanggal: "2026-03-01", parameter: "Kreatinin", nilaiRS: 1.05,  nilaiTarget: 1.00,  satuan: "mg/dL", deviasi: 5.0,  status: "Lulus"       },
      { siklus: "Q1-2026", tanggal: "2026-03-01", parameter: "Ureum",     nilaiRS: 28.5,  nilaiTarget: 25.0,  satuan: "mg/dL", deviasi: 14.0, status: "Tidak Lulus" },
      { siklus: "Q2-2026", tanggal: "2026-06-01", parameter: "Glukosa",   nilaiRS: 0,     nilaiTarget: 105.0, satuan: "mg/dL", deviasi: 0,    status: "Pending"     },
    ],
  },
];

export const REGISTER_DAILY: DailyRegister[] = [
  { tanggal: "2026-05-18", total: 42, byKategori: { "Hematologi": 14, "Kimia Klinik": 18, "Urinalisis": 5,  "Serologi": 2, "Koagulasi": 3 }, byUnit: { "IGD": 16, "Rawat Inap": 18, "Rawat Jalan": 8  }, tatRataRata: 68, tatCITO: 38, tatTarget: 87, kritisCount: 2, kritisRespon: 18 },
  { tanggal: "2026-05-17", total: 58, byKategori: { "Hematologi": 22, "Kimia Klinik": 24, "Urinalisis": 7,  "Serologi": 3, "Koagulasi": 2 }, byUnit: { "IGD": 20, "Rawat Inap": 24, "Rawat Jalan": 14 }, tatRataRata: 72, tatCITO: 42, tatTarget: 84, kritisCount: 3, kritisRespon: 22 },
  { tanggal: "2026-05-16", total: 61, byKategori: { "Hematologi": 24, "Kimia Klinik": 26, "Urinalisis": 6,  "Serologi": 2, "Koagulasi": 3 }, byUnit: { "IGD": 22, "Rawat Inap": 26, "Rawat Jalan": 13 }, tatRataRata: 70, tatCITO: 35, tatTarget: 89, kritisCount: 1, kritisRespon: 15 },
  { tanggal: "2026-05-15", total: 55, byKategori: { "Hematologi": 20, "Kimia Klinik": 22, "Urinalisis": 8,  "Serologi": 3, "Koagulasi": 2 }, byUnit: { "IGD": 18, "Rawat Inap": 22, "Rawat Jalan": 15 }, tatRataRata: 65, tatCITO: 31, tatTarget: 92, kritisCount: 0, kritisRespon: 0  },
  { tanggal: "2026-05-14", total: 48, byKategori: { "Hematologi": 18, "Kimia Klinik": 20, "Urinalisis": 5,  "Serologi": 2, "Koagulasi": 3 }, byUnit: { "IGD": 15, "Rawat Inap": 21, "Rawat Jalan": 12 }, tatRataRata: 74, tatCITO: 44, tatTarget: 82, kritisCount: 2, kritisRespon: 27 },
  { tanggal: "2026-05-13", total: 53, byKategori: { "Hematologi": 20, "Kimia Klinik": 21, "Urinalisis": 7,  "Serologi": 3, "Koagulasi": 2 }, byUnit: { "IGD": 19, "Rawat Inap": 22, "Rawat Jalan": 12 }, tatRataRata: 69, tatCITO: 40, tatTarget: 88, kritisCount: 1, kritisRespon: 20 },
  { tanggal: "2026-05-12", total: 50, byKategori: { "Hematologi": 19, "Kimia Klinik": 21, "Urinalisis": 6,  "Serologi": 2, "Koagulasi": 2 }, byUnit: { "IGD": 17, "Rawat Inap": 21, "Rawat Jalan": 12 }, tatRataRata: 71, tatCITO: 38, tatTarget: 86, kritisCount: 2, kritisRespon: 19 },
];

// ── Westgard Check ─────────────────────────────────────────

export function checkWestgard(runs: QCRun[], lot: QCLot): Map<string, WestgardRule[]> {
  const { mean, sd } = lot;
  const violations = new Map<string, WestgardRule[]>();
  const vals = runs.map((r) => r.nilai);

  for (let i = 0; i < vals.length; i++) {
    const v = vals[i];
    const rules: WestgardRule[] = [];

    if (Math.abs(v - mean) > 2 * sd) rules.push("1-2s");
    if (Math.abs(v - mean) > 3 * sd) rules.push("1-3s");
    if (i > 0) {
      const vp = vals[i - 1];
      if ((v - mean > 2 * sd && vp - mean > 2 * sd) || (v - mean < -2 * sd && vp - mean < -2 * sd)) rules.push("2-2s");
      if (Math.abs(v - vp) > 4 * sd) rules.push("R-4s");
    }
    if (i >= 3) {
      const seg = vals.slice(i - 3, i + 1);
      if (seg.every((x) => x - mean > sd) || seg.every((x) => x - mean < -sd)) rules.push("4-1s");
    }
    if (i >= 9) {
      const seg = vals.slice(i - 9, i + 1);
      if (seg.every((x) => x > mean) || seg.every((x) => x < mean)) rules.push("10x");
    }

    if (rules.length > 0) violations.set(runs[i].id, rules);
  }
  return violations;
}
