import type { PRBFormData, PRBKodeStatus } from "@/lib/bpjs/bpjsShared";

// ── Format helpers ─────────────────────────────────────

export function fmtDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  const M = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
  return `${d.getDate()} ${M[d.getMonth()]} ${d.getFullYear()}`;
}

export function errMsg(e: unknown): string {
  if (typeof e === "object" && e !== null && "message" in e)
    return String((e as { message: unknown }).message);
  return "Terjadi kesalahan tidak dikenal.";
}

// ── Chip helpers ───────────────────────────────────────

export function statusChipCls(status: string): string {
  switch (status) {
    case "Issued":    return "bg-violet-100 text-violet-700 ring-1 ring-violet-200/60";
    case "Used":      return "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200/60";
    case "Expired":   return "bg-rose-100 text-rose-600 ring-1 ring-rose-200/60";
    case "Cancelled": return "bg-slate-100 text-slate-500 ring-1 ring-slate-200/60";
    default:          return "bg-slate-100 text-slate-500";
  }
}

export function jnsKontrolChipCls(jnsKontrol: "1" | "2"): string {
  return jnsKontrol === "1"
    ? "bg-sky-100 text-sky-700 ring-1 ring-sky-200/60"
    : "bg-violet-100 text-violet-700 ring-1 ring-violet-200/60";
}

export function jnsKontrolLabel(jnsKontrol: "1" | "2"): string {
  return jnsKontrol === "1" ? "SPRI" : "Kontrol";
}

export function terbitSEPChipCls(terbit: string): string {
  return terbit === "Sudah"
    ? "bg-emerald-100 text-emerald-600 ring-1 ring-emerald-200/60"
    : "bg-amber-100 text-amber-600 ring-1 ring-amber-200/60";
}

// ── Sample data ────────────────────────────────────────

export const SAMPLE_SEP_NOS = [
  "SEP-2026-0510-00033",
  "SEP-2026-0415-00995",
  "SEP-2026-0512-00040",
];

export const SAMPLE_SURAT_NOS = [
  "RK/2026/05/0012",
  "RK/2026/05/0023",
  "SPRI/2026/05/0011",
];

export const SAMPLE_KARTU_RK = ["0001234567891", "0001234567892"];

// ── PRB field metadata ─────────────────────────────────

export const PRB_FIELDS_BY_KODE: Record<PRBKodeStatus, (keyof PRBFormData)[]> = {
  "01": ["HBA1C", "GDP", "GD2JPP", "eGFR", "TD_Sistolik", "TD_Diastolik", "LDL"],
  "02": ["eGFR", "Rata_TD_Sistolik", "Rata_TD_Diastolik", "JantungKoroner", "Stroke", "VaskularPerifer", "Aritmia", "AtrialFibrilasi"],
  "03": ["Terkontrol", "Gejala2xMinggu", "BangunMalam", "KeterbatasanFisik", "FungsiParu"],
  "04": ["NadiIstirahat", "Rata_TD_Sistolik", "Rata_TD_Diastolik", "Aritmia", "SesakNapas3Bulan", "NyeriDada3Bulan", "SesakNapasAktivitas", "NyeriDadaAktivitas"],
  "05": ["SkorMMRC", "Eksaserbasi1Tahun", "MampuAktivitas"],
  "06": ["Remisi", "TerapiRumatan", "Usia"],
  "07": ["GDP", "TD_Sistolik", "TD_Diastolik", "LDL", "AsamUrat"],
  "08": ["Epileptik6Bulan", "EfekSampingOAB", "HamilMenyusui"],
  "09": ["RemisiSLE", "Hamil"],
};

export const PRB_FIELD_LABELS: Record<keyof PRBFormData, string> = {
  HBA1C: "HbA1c (%)",
  GDP: "Gula Darah Puasa (mg/dL)",
  GD2JPP: "GD 2 Jam PP (mg/dL)",
  eGFR: "eGFR (mL/min/1.73m²)",
  TD_Sistolik: "TD Sistolik (mmHg)",
  TD_Diastolik: "TD Diastolik (mmHg)",
  LDL: "LDL (mg/dL)",
  Rata_TD_Sistolik: "Rata-rata TD Sistolik (mmHg)",
  Rata_TD_Diastolik: "Rata-rata TD Diastolik (mmHg)",
  JantungKoroner: "Jantung Koroner",
  Stroke: "Riwayat Stroke",
  VaskularPerifer: "Vaskular Perifer",
  Aritmia: "Aritmia",
  AtrialFibrilasi: "Atrial Fibrilasi",
  NadiIstirahat: "Nadi Istirahat (bpm)",
  SesakNapas3Bulan: "Sesak Napas 3 Bulan",
  NyeriDada3Bulan: "Nyeri Dada 3 Bulan",
  SesakNapasAktivitas: "Sesak Napas Aktivitas",
  NyeriDadaAktivitas: "Nyeri Dada Aktivitas",
  Terkontrol: "Asma Terkontrol",
  Gejala2xMinggu: "Gejala >2×/Minggu",
  BangunMalam: "Bangun Malam",
  KeterbatasanFisik: "Keterbatasan Fisik",
  FungsiParu: "Fungsi Paru (% prediksi)",
  SkorMMRC: "Skor mMRC",
  Eksaserbasi1Tahun: "Eksaserbasi 1 Tahun",
  MampuAktivitas: "Mampu Aktivitas",
  Epileptik6Bulan: "Bebas Serangan 6 Bulan",
  EfekSampingOAB: "Efek Samping OAE",
  HamilMenyusui: "Hamil / Menyusui",
  Remisi: "Remisi Skizofrenia (%)",
  TerapiRumatan: "Terapi Rumatan",
  Usia: "Usia (tahun)",
  AsamUrat: "Asam Urat (mg/dL)",
  RemisiSLE: "Remisi SLE (%)",
  Hamil: "Sedang Hamil",
};

export const PRB_FIELD_RANGES: Partial<Record<keyof PRBFormData, { min: number; max: number; step?: number }>> = {
  HBA1C: { min: 0.1, max: 15, step: 0.1 },
  GDP: { min: 10, max: 500 },
  GD2JPP: { min: 10, max: 500 },
  eGFR: { min: 5, max: 150 },
  TD_Sistolik: { min: 20, max: 200 },
  TD_Diastolik: { min: 20, max: 200 },
  LDL: { min: 20, max: 500 },
  Rata_TD_Sistolik: { min: 20, max: 200 },
  Rata_TD_Diastolik: { min: 20, max: 200 },
  NadiIstirahat: { min: 20, max: 200 },
  FungsiParu: { min: 0, max: 100 },
  SkorMMRC: { min: 0, max: 40 },
  Remisi: { min: 0, max: 100 },
  Usia: { min: 1, max: 100 },
  AsamUrat: { min: 0.1, max: 20, step: 0.1 },
  RemisiSLE: { min: 0, max: 100 },
};

export const PRB_FLAG_FIELDS = new Set<keyof PRBFormData>([
  "JantungKoroner","Stroke","VaskularPerifer","Aritmia","AtrialFibrilasi",
  "Terkontrol","Gejala2xMinggu","BangunMalam","KeterbatasanFisik",
  "SesakNapas3Bulan","NyeriDada3Bulan","SesakNapasAktivitas","NyeriDadaAktivitas",
  "Eksaserbasi1Tahun","MampuAktivitas","TerapiRumatan",
  "Epileptik6Bulan","EfekSampingOAB","HamilMenyusui","Hamil",
]);

// ── Static poli + dokter reference ────────────────────

export const POLI_RK_OPTIONS = [
  { kode: "004", nama: "Alergi-Immunologi Klinik" },
  { kode: "005", nama: "Gastroenterologi-Hepatologi" },
  { kode: "008", nama: "Hematologi - Onkologi Medik" },
  { kode: "013", nama: "Reumatologi" },
  { kode: "015", nama: "Kardiovaskular" },
  { kode: "023", nama: "Obstetri Ginekologi Sosial" },
  { kode: "INT", nama: "Penyakit Dalam" },
  { kode: "BED", nama: "Bedah" },
  { kode: "MAT", nama: "Mata" },
  { kode: "JAN", nama: "Jantung" },
  { kode: "PAR", nama: "Paru" },
  { kode: "ORT", nama: "Ortopedi" },
];

export const DOKTER_RK_OPTIONS = [
  { kode: "DR-001", nama: "dr. Budi Santoso, Sp.PD" },
  { kode: "DR-003", nama: "dr. Andi Wijaya, Sp.JP" },
  { kode: "DR-005", nama: "dr. Surya Adi, Sp.B" },
  { kode: "DR-007", nama: "dr. Rini Kusumawati, Sp.P" },
  { kode: "DR-008", nama: "dr. Dewi Anggraini, Sp.M" },
  { kode: "DR-011", nama: "dr. Hendra Wijaya, Sp.OT" },
  { kode: "DR-014", nama: "dr. Sri Wahyuni, Sp.OG" },
];

// ── CSV export ─────────────────────────────────────────

export function exportCsv(rows: string[][], filename: string): void {
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const csv = "﻿" + rows.map((r) => r.map(escape).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
