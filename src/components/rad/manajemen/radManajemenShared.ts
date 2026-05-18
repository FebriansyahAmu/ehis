// Rad QC & Manajemen — Types, Config, Mock Data
// BAPETEN Perka No. 2/2018 · IAEA HH-19 §7 · PMK 1014/2008 · ACR Accreditation

import { type Modalitas } from "../radShared";

// ── Types ─────────────────────────────────────────────────

export type KalibrasiStatus = "Valid" | "Overdue" | "Segera";
export type UjiStatus       = "Sesuai" | "Tidak Sesuai" | "Pending";
export type EQAStatus       = "Lulus" | "Tidak Lulus" | "Pending";

export interface KalibrasiLog {
  id: string; tanggal: string;
  hasil: "Lulus" | "Tidak Lulus"; petugas: string;
  sertifikat?: string; catatan?: string;
}

export interface UjiKesesuaian {
  id: string; tanggal: string;
  parameter: string; nilaiTerukur: string; nilaiAcuan: string;
  status: UjiStatus; petugas: string; catatan?: string;
}

export interface Pesawat {
  id: string; nama: string; modalitas: Modalitas;
  serialNo: string; merek: string; lokasi: string;
  kalibrasiTerakhir: string; kalibrasiBerikut: string;
  status: KalibrasiStatus; daysUntil: number;
  logKalibrasi: KalibrasiLog[];
  logUji: UjiKesesuaian[];
}

export interface DosisLogEntry {
  id: string; tanggal: string; noRM: string; namaPasien: string;
  modalitas: Modalitas; region: string;
  ctdiVol?: number; dlp?: number; drlCtdi?: number; drlDlp?: number;
  dap?: number; waktuFluoro?: number;
  entrance?: number; drlEntrance?: number;
  exceeded: boolean;
}

export interface DailyRegister {
  tanggal: string; total: number;
  byModalitas: Record<string, number>;
  byUnit: Record<string, number>;
  tatAvg: number; dalamTarget: number;
  kritis: number; ditolak: number;
}

export interface EQASiklus {
  id: string; tanggal: string; parameter: string;
  nilaiRS: string; nilaiAcuan: string;
  deviasi: number; status: EQAStatus; catatan?: string;
}

export interface EQAProgram {
  id: string; nama: string; modalitas: Modalitas;
  provider: string; tahun: number; siklus: EQASiklus[];
}

// ── Config ─────────────────────────────────────────────────

export const KALIBRASI_STATUS_CFG: Record<KalibrasiStatus, {
  badge: string; dot: string; ring: string;
}> = {
  Valid:   { badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-400", ring: "ring-emerald-200" },
  Segera:  { badge: "bg-amber-100 text-amber-700",     dot: "bg-amber-400",   ring: "ring-amber-200"   },
  Overdue: { badge: "bg-rose-100 text-rose-700",       dot: "bg-rose-500",    ring: "ring-rose-200"    },
};

export const EQA_STATUS_CFG: Record<EQAStatus, { badge: string; bar: string }> = {
  Lulus:         { badge: "bg-emerald-100 text-emerald-700", bar: "bg-emerald-500" },
  "Tidak Lulus": { badge: "bg-rose-100 text-rose-700",       bar: "bg-rose-500"    },
  Pending:       { badge: "bg-slate-100 text-slate-500",     bar: "bg-slate-300"   },
};

// DRL PMK 1014/2008 (CT)
export const DRL_CT: Record<string, { ctdi: number; dlp: number }> = {
  "Kepala":  { ctdi: 60, dlp: 900 },
  "Thoraks": { ctdi: 30, dlp: 400 },
  "Abdomen": { ctdi: 35, dlp: 600 },
  "Pelvis":  { ctdi: 35, dlp: 550 },
  "Leher":   { ctdi: 25, dlp: 350 },
};

export const DRL_ENTRANCE: Record<string, number> = {
  "PA Thoraks":       0.3,
  "Lat Thoraks":      1.5,
  "Abdomen AP":       6.0,
  "Pelvis AP":        5.0,
  "LS AP":           10.0,
  "Mammografi CC":    3.0,
};

// Modalitas color (teal for Rad module)
export const MODALITAS_COLOR: Record<string, string> = {
  Konvensional: "bg-teal-500",
  CT:           "bg-sky-500",
  USG:          "bg-violet-500",
  MRI:          "bg-rose-500",
  Mammografi:   "bg-pink-400",
  Fluoroskopi:  "bg-orange-400",
  DEXA:         "bg-lime-500",
};

// ── Mock Data ─────────────────────────────────────────────

export const PESAWAT_MOCK: Pesawat[] = [
  {
    id: "p1", nama: "X-Ray Konvensional CR/DR", modalitas: "Konvensional",
    serialNo: "CR-2021-0012", merek: "Fujifilm FCR Premier", lokasi: "Ruang Radiografi 1",
    kalibrasiTerakhir: "2025-11-10", kalibrasiBerikut: "2026-05-28",
    status: "Segera", daysUntil: 9,
    logKalibrasi: [
      { id: "k1a", tanggal: "2025-11-10", hasil: "Lulus", petugas: "Fisikawan Medik — BAPETEN", sertifikat: "BAPETEN/2025/1234", catatan: "Semua parameter dalam batas" },
      { id: "k1b", tanggal: "2025-05-08", hasil: "Lulus", petugas: "Fisikawan Medik — BAPETEN", sertifikat: "BAPETEN/2025/0521" },
    ],
    logUji: [
      { id: "u1a", tanggal: "2026-03-15", parameter: "Kolimasi", nilaiTerukur: "±2 mm", nilaiAcuan: "≤2% SID", status: "Sesuai", petugas: "Radiografer Andi" },
      { id: "u1b", tanggal: "2026-03-15", parameter: "Keluaran Radiasi (mGy/mAs)", nilaiTerukur: "4.8", nilaiAcuan: "4.0–6.0", status: "Sesuai", petugas: "Radiografer Andi" },
      { id: "u1c", tanggal: "2026-03-15", parameter: "Resolusi Spasial (lp/mm)", nilaiTerukur: "3.2", nilaiAcuan: "≥3.0", status: "Sesuai", petugas: "Radiografer Andi" },
      { id: "u1d", tanggal: "2026-01-10", parameter: "HVL (mmAl @ 70 kVp)", nilaiTerukur: "2.1", nilaiAcuan: "≥2.5", status: "Tidak Sesuai", petugas: "Radiografer Andi", catatan: "Tindak lanjut: jadwal service filter aluminium" },
    ],
  },
  {
    id: "p2", nama: "CT Scan 128-slice", modalitas: "CT",
    serialNo: "CT-2022-0003", merek: "Siemens SOMATOM Definition AS+", lokasi: "Ruang CT",
    kalibrasiTerakhir: "2026-02-20", kalibrasiBerikut: "2026-08-20",
    status: "Valid", daysUntil: 93,
    logKalibrasi: [
      { id: "k2a", tanggal: "2026-02-20", hasil: "Lulus", petugas: "Fisikawan Medik — Kemenkes", sertifikat: "KMK/2026/0220" },
      { id: "k2b", tanggal: "2025-08-15", hasil: "Lulus", petugas: "Fisikawan Medik — Kemenkes", sertifikat: "KMK/2025/0815" },
    ],
    logUji: [
      { id: "u2a", tanggal: "2026-04-01", parameter: "CTDIvol Baseline (mGy)", nilaiTerukur: "58.4", nilaiAcuan: "55–65", status: "Sesuai", petugas: "Radiografer Budi" },
      { id: "u2b", tanggal: "2026-04-01", parameter: "Noise Index", nilaiTerukur: "11.2", nilaiAcuan: "≤12", status: "Sesuai", petugas: "Radiografer Budi" },
      { id: "u2c", tanggal: "2026-04-01", parameter: "Uniformitas HU Air (ΔHU)", nilaiTerukur: "−2", nilaiAcuan: "0 ± 5", status: "Sesuai", petugas: "Radiografer Budi" },
    ],
  },
  {
    id: "p3", nama: "USG Linear + Konveks", modalitas: "USG",
    serialNo: "USG-2023-0007", merek: "GE Voluson S10", lokasi: "Ruang USG",
    kalibrasiTerakhir: "2025-09-01", kalibrasiBerikut: "2026-03-01",
    status: "Overdue", daysUntil: -79,
    logKalibrasi: [
      { id: "k3a", tanggal: "2025-09-01", hasil: "Lulus", petugas: "Vendor GE Healthcare", catatan: "Kalibrasi tahunan termasuk probe linear dan konveks" },
    ],
    logUji: [
      { id: "u3a", tanggal: "2026-01-20", parameter: "Resolusi Aksial (mm)", nilaiTerukur: "0.38", nilaiAcuan: "≤0.50", status: "Sesuai", petugas: "dr. SpRad" },
      { id: "u3b", tanggal: "2026-01-20", parameter: "Dead Zone (mm)", nilaiTerukur: "3.2", nilaiAcuan: "≤5", status: "Sesuai", petugas: "dr. SpRad" },
    ],
  },
  {
    id: "p4", nama: "MRI 1.5 Tesla", modalitas: "MRI",
    serialNo: "MRI-2020-0001", merek: "Philips Ingenia 1.5T", lokasi: "Ruang MRI",
    kalibrasiTerakhir: "2026-01-15", kalibrasiBerikut: "2026-07-15",
    status: "Valid", daysUntil: 57,
    logKalibrasi: [
      { id: "k4a", tanggal: "2026-01-15", hasil: "Lulus", petugas: "Vendor Philips + Fisikawan Medik", sertifikat: "PHL/2026/0115" },
    ],
    logUji: [
      { id: "u4a", tanggal: "2026-03-01", parameter: "SNR (dB)", nilaiTerukur: "28.4", nilaiAcuan: "≥25", status: "Sesuai", petugas: "Fisikawan Medik" },
      { id: "u4b", tanggal: "2026-03-01", parameter: "Uniformitas B0 (ppm)", nilaiTerukur: "1.8", nilaiAcuan: "≤2.0", status: "Sesuai", petugas: "Fisikawan Medik" },
      { id: "u4c", tanggal: "2026-03-01", parameter: "Distorsi Geometri (mm)", nilaiTerukur: "1.1", nilaiAcuan: "≤2.0", status: "Sesuai", petugas: "Fisikawan Medik" },
    ],
  },
  {
    id: "p5", nama: "Mammografi Digital FFDM", modalitas: "Mammografi",
    serialNo: "MMG-2021-0002", merek: "Hologic Selenia Dimensions", lokasi: "Ruang Mammografi",
    kalibrasiTerakhir: "2026-03-10", kalibrasiBerikut: "2026-09-10",
    status: "Valid", daysUntil: 114,
    logKalibrasi: [
      { id: "k5a", tanggal: "2026-03-10", hasil: "Lulus", petugas: "BAPETEN + Vendor Hologic", sertifikat: "BAPETEN/2026/MMG002" },
    ],
    logUji: [
      { id: "u5a", tanggal: "2026-04-15", parameter: "MGD per Exposure (mGy)", nilaiTerukur: "1.6", nilaiAcuan: "≤2.5", status: "Sesuai", petugas: "Radiografer Sari" },
      { id: "u5b", tanggal: "2026-04-15", parameter: "Artefak Detektor", nilaiTerukur: "0 artefak", nilaiAcuan: "0", status: "Sesuai", petugas: "Radiografer Sari" },
      { id: "u5c", tanggal: "2026-04-15", parameter: "Resolusi MTF50 (lp/mm)", nilaiTerukur: "4.8", nilaiAcuan: "≥4.0", status: "Sesuai", petugas: "Radiografer Sari" },
    ],
  },
];

// Deterministic daily totals (30 days, newest first)
const TOTALS_30 = [20, 22, 18, 24, 21, 9, 7, 23, 25, 20, 19, 26, 18, 10, 8, 22, 21, 20, 23, 17, 11, 8, 21, 24, 22, 19, 20, 9, 7, 18];
const TAT_30   = [95, 88, 102, 78, 91, 110, 105, 85, 92, 88, 96, 80, 94, 88, 107, 86, 90, 95, 82, 99, 100, 115, 84, 87, 93, 91, 88, 108, 112, 96];

export const REGISTER_MOCK: DailyRegister[] = TOTALS_30.map((total, i) => {
  const d = new Date(2026, 4, 19 - i);
  const dateStr = d.toISOString().slice(0, 10);
  const kon = Math.round(total * 0.40);
  const ct  = Math.round(total * 0.25);
  const usg = Math.round(total * 0.20);
  const mri = Math.round(total * 0.10);
  const mmg = total - kon - ct - usg - mri;
  const tatAvg = TAT_30[i];
  return {
    tanggal: dateStr, total,
    byModalitas: { Konvensional: kon, CT: ct, USG: usg, MRI: mri, Mammografi: mmg },
    byUnit: {
      IGD:           Math.round(total * 0.30),
      "Rawat Inap":  Math.round(total * 0.45),
      "Rawat Jalan": Math.round(total * 0.25),
    },
    tatAvg,
    dalamTarget: Math.round(total * (tatAvg <= 100 ? 0.88 : 0.72)),
    kritis: i <= 5 ? [0, 1, 0, 0, 1, 0][i] : 0,
    ditolak: [0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0][i],
  };
});

export const DOSIS_LOG_MOCK: DosisLogEntry[] = [
  { id: "d1",  tanggal: "2026-05-19", noRM: "RM-2025-003", namaPasien: "Ahmad Santoso",    modalitas: "CT",           region: "Thoraks",       ctdiVol: 28.2, dlp: 380,  drlCtdi: 30, drlDlp: 400, exceeded: false },
  { id: "d2",  tanggal: "2026-05-19", noRM: "RM-2025-012", namaPasien: "Siti Rahma",        modalitas: "CT",           region: "Kepala",        ctdiVol: 64.8, dlp: 960,  drlCtdi: 60, drlDlp: 900, exceeded: true  },
  { id: "d3",  tanggal: "2026-05-19", noRM: "RM-2025-007", namaPasien: "Hendra Kusuma",     modalitas: "Konvensional", region: "PA Thoraks",    entrance: 0.25, drlEntrance: 0.30, exceeded: false },
  { id: "d4",  tanggal: "2026-05-18", noRM: "RM-2025-018", namaPasien: "Dewi Anggraeni",    modalitas: "CT",           region: "Abdomen",       ctdiVol: 37.5, dlp: 650,  drlCtdi: 35, drlDlp: 600, exceeded: true  },
  { id: "d5",  tanggal: "2026-05-18", noRM: "RM-2025-022", namaPasien: "Bagus Prabowo",     modalitas: "Konvensional", region: "Abdomen AP",    entrance: 5.2, drlEntrance: 6.0,  exceeded: false },
  { id: "d6",  tanggal: "2026-05-17", noRM: "RM-2025-031", namaPasien: "Rina Wulandari",    modalitas: "Mammografi",   region: "Mammografi CC", entrance: 2.8, drlEntrance: 3.0,  exceeded: false },
  { id: "d7",  tanggal: "2026-05-17", noRM: "RM-2025-043", namaPasien: "Budi Hariyanto",    modalitas: "CT",           region: "Kepala",        ctdiVol: 55.0, dlp: 820,  drlCtdi: 60, drlDlp: 900, exceeded: false },
  { id: "d8",  tanggal: "2026-05-16", noRM: "RM-2025-051", namaPasien: "Yuni Astuti",       modalitas: "Konvensional", region: "Lat Thoraks",   entrance: 1.6, drlEntrance: 1.5,  exceeded: true  },
  { id: "d9",  tanggal: "2026-05-16", noRM: "RM-2025-055", namaPasien: "Fauzi Ramadan",     modalitas: "CT",           region: "Pelvis",        ctdiVol: 30.1, dlp: 480,  drlCtdi: 35, drlDlp: 550, exceeded: false },
  { id: "d10", tanggal: "2026-05-15", noRM: "RM-2025-062", namaPasien: "Kartini Susilo",    modalitas: "CT",           region: "Abdomen",       ctdiVol: 40.2, dlp: 700,  drlCtdi: 35, drlDlp: 600, exceeded: true  },
  { id: "d11", tanggal: "2026-05-15", noRM: "RM-2025-070", namaPasien: "Wahyu Nugroho",     modalitas: "Konvensional", region: "PA Thoraks",    entrance: 0.28, drlEntrance: 0.30, exceeded: false },
  { id: "d12", tanggal: "2026-05-14", noRM: "RM-2025-075", namaPasien: "Lia Permata",       modalitas: "CT",           region: "Thoraks",       ctdiVol: 31.5, dlp: 420,  drlCtdi: 30, drlDlp: 400, exceeded: true  },
];

export const EQA_PROGRAMS_MOCK: EQAProgram[] = [
  {
    id: "eq1", nama: "AAPM CT Phantom Test", modalitas: "CT",
    provider: "AAPM TG-18 / ACR Accreditation", tahun: 2026,
    siklus: [
      { id: "eq1a", tanggal: "2026-04-10", parameter: "CTDIvol Akseptabilitas (mGy)", nilaiRS: "58.8", nilaiAcuan: "55–65", deviasi: -1.8, status: "Lulus" },
      { id: "eq1b", tanggal: "2026-04-10", parameter: "Noise (%)", nilaiRS: "0.45", nilaiAcuan: "≤0.50", deviasi: -10.0, status: "Lulus" },
      { id: "eq1c", tanggal: "2026-04-10", parameter: "Uniformitas HU Air (ΔHU)", nilaiRS: "-1", nilaiAcuan: "0 ± 5", deviasi: -1.0, status: "Lulus" },
      { id: "eq1d", tanggal: "2026-04-10", parameter: "Resolusi Kontras Rendah (lp/cm)", nilaiRS: "3.8", nilaiAcuan: "≥4.0", deviasi: -5.0, status: "Tidak Lulus", catatan: "Evaluasi faktor rekonstruksi kernel — jadwalkan service" },
    ],
  },
  {
    id: "eq2", nama: "SMPTE Phantom USG", modalitas: "USG",
    provider: "SMPTE / AIUM Performance Criteria", tahun: 2026,
    siklus: [
      { id: "eq2a", tanggal: "2026-03-05", parameter: "Akurasi Jarak Vertikal (%)", nilaiRS: "101.2%", nilaiAcuan: "98–102%", deviasi: 1.2, status: "Lulus" },
      { id: "eq2b", tanggal: "2026-03-05", parameter: "Dead Zone (mm)", nilaiRS: "3.1 mm", nilaiAcuan: "≤5 mm", deviasi: -38.0, status: "Lulus" },
      { id: "eq2c", tanggal: "2026-03-05", parameter: "Penetrasi Kedalaman (cm)", nilaiRS: "18.5", nilaiAcuan: "≥18.0", deviasi: 2.8, status: "Lulus" },
    ],
  },
  {
    id: "eq3", nama: "ACR MRI Phantom Test", modalitas: "MRI",
    provider: "ACR MRI Accreditation Program", tahun: 2026,
    siklus: [
      { id: "eq3a", tanggal: "2026-02-18", parameter: "SNR (dB)", nilaiRS: "27.6 dB", nilaiAcuan: "≥25 dB", deviasi: 10.4, status: "Lulus" },
      { id: "eq3b", tanggal: "2026-02-18", parameter: "Uniformitas Gambar (%)", nilaiRS: "83.2%", nilaiAcuan: "≥82%", deviasi: 1.5, status: "Lulus" },
      { id: "eq3c", tanggal: "2026-02-18", parameter: "Resolusi Spasial (lp/mm)", nilaiRS: "1.0", nilaiAcuan: "≥1.0", deviasi: 0.0, status: "Lulus" },
      { id: "eq3d", tanggal: "2026-02-18", parameter: "Ketebalan Irisan (mm)", nilaiRS: "5.8", nilaiAcuan: "5 ± 0.5", deviasi: 16.0, status: "Tidak Lulus", catatan: "Perlu kalibrasi gradient B0; jadwalkan service engineer Philips" },
    ],
  },
];

// ── Utilities ─────────────────────────────────────────────

export function getDaysLabel(days: number, status: KalibrasiStatus): string {
  if (status === "Overdue") return `${Math.abs(days)} hari terlewat`;
  if (days === 0) return "Hari ini";
  return `${days} hari lagi`;
}

export function totalRegister(entries: DailyRegister[]) {
  return entries.reduce((a, e) => a + e.total, 0);
}

export function avgTAT(entries: DailyRegister[]) {
  if (!entries.length) return 0;
  return Math.round(entries.reduce((a, e) => a + e.tatAvg, 0) / entries.length);
}

export function pctTarget(entries: DailyRegister[]) {
  const tot = totalRegister(entries);
  if (!tot) return 0;
  return Math.round((entries.reduce((a, e) => a + e.dalamTarget, 0) / tot) * 100);
}

export function sumModalitas(entries: DailyRegister[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const e of entries)
    for (const [k, v] of Object.entries(e.byModalitas)) out[k] = (out[k] ?? 0) + v;
  return out;
}

export function sumUnit(entries: DailyRegister[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const e of entries)
    for (const [k, v] of Object.entries(e.byUnit)) out[k] = (out[k] ?? 0) + v;
  return out;
}
