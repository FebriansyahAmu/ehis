// Formulir Program Rujuk Balik (PRB) pada Rencana Kontrol V2 (`formPRB`): 9 penyakit kronik,
// tiap penyakit memakai sebagian dari 36 kolom data klinis. Kolom angka punya rentang sah per
// spesifikasi V-Claim; kolom "flag" bernilai 1 (Ya) / 0 (Tidak) / null (tidak diisi).

import { PRB_LABELS, type PRBFormData, type PRBKodeStatus } from "@/lib/bpjs/bpjsShared";

export const KODE_PRB = ["01", "02", "03", "04", "05", "06", "07", "08", "09"] as const satisfies readonly PRBKodeStatus[];

export { PRB_LABELS };

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
  HBA1C: "HbA1c",
  GDP: "Gula darah puasa",
  GD2JPP: "Gula darah 2 jam PP",
  eGFR: "eGFR",
  TD_Sistolik: "TD sistolik",
  TD_Diastolik: "TD diastolik",
  LDL: "LDL",
  Rata_TD_Sistolik: "Rata-rata TD sistolik",
  Rata_TD_Diastolik: "Rata-rata TD diastolik",
  JantungKoroner: "Penyakit jantung koroner",
  Stroke: "Riwayat stroke",
  VaskularPerifer: "Penyakit vaskular perifer",
  Aritmia: "Aritmia",
  AtrialFibrilasi: "Atrial fibrilasi",
  NadiIstirahat: "Nadi istirahat",
  SesakNapas3Bulan: "Sesak napas 3 bulan terakhir",
  NyeriDada3Bulan: "Nyeri dada 3 bulan terakhir",
  SesakNapasAktivitas: "Sesak napas saat aktivitas",
  NyeriDadaAktivitas: "Nyeri dada saat aktivitas",
  Terkontrol: "Asma terkontrol",
  Gejala2xMinggu: "Gejala lebih dari 2× seminggu",
  BangunMalam: "Terbangun malam karena gejala",
  KeterbatasanFisik: "Keterbatasan aktivitas fisik",
  FungsiParu: "Fungsi paru",
  SkorMMRC: "Skor mMRC",
  Eksaserbasi1Tahun: "Eksaserbasi 1 tahun terakhir",
  MampuAktivitas: "Masih mampu beraktivitas",
  Epileptik6Bulan: "Kejang 6 bulan terakhir",
  EfekSampingOAB: "Efek samping obat antiepilepsi",
  HamilMenyusui: "Hamil atau menyusui",
  Remisi: "Remisi",
  TerapiRumatan: "Terapi rumatan",
  Usia: "Usia",
  AsamUrat: "Asam urat",
  RemisiSLE: "Remisi SLE",
  Hamil: "Sedang hamil",
};

/** Satuan kolom angka (ditampilkan di samping isian, bukan di label). */
export const PRB_SATUAN: Partial<Record<keyof PRBFormData, string>> = {
  HBA1C: "%",
  GDP: "mg/dL",
  GD2JPP: "mg/dL",
  eGFR: "mL/menit",
  TD_Sistolik: "mmHg",
  TD_Diastolik: "mmHg",
  LDL: "mg/dL",
  Rata_TD_Sistolik: "mmHg",
  Rata_TD_Diastolik: "mmHg",
  NadiIstirahat: "/menit",
  FungsiParu: "% prediksi",
  Remisi: "%",
  Usia: "tahun",
  AsamUrat: "mg/dL",
  RemisiSLE: "%",
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

export const PRB_FLAG_FIELDS: ReadonlySet<keyof PRBFormData> = new Set<keyof PRBFormData>([
  "JantungKoroner", "Stroke", "VaskularPerifer", "Aritmia", "AtrialFibrilasi",
  "Terkontrol", "Gejala2xMinggu", "BangunMalam", "KeterbatasanFisik",
  "SesakNapas3Bulan", "NyeriDada3Bulan", "SesakNapasAktivitas", "NyeriDadaAktivitas",
  "Eksaserbasi1Tahun", "MampuAktivitas", "TerapiRumatan",
  "Epileptik6Bulan", "EfekSampingOAB", "HamilMenyusui", "Hamil",
]);

/** Galat rentang satu kolom angka; null bila kosong atau sah. */
export function galatNilaiPRB(field: keyof PRBFormData, v: number | null): string | null {
  const r = PRB_FIELD_RANGES[field];
  if (v === null || !r) return null;
  if (v < r.min || v > r.max) return `${PRB_FIELD_LABELS[field]} harus ${r.min}–${r.max}${PRB_SATUAN[field] ? ` ${PRB_SATUAN[field]}` : ""}`;
  return null;
}

/** Kolom pertama penyakit terpilih yang nilainya di luar rentang (untuk fokus saat simpan). */
export function kolomPRBSalah(kode: PRBKodeStatus, data: PRBFormData): keyof PRBFormData | null {
  return PRB_FIELDS_BY_KODE[kode].find((f) => galatNilaiPRB(f, data[f]) !== null) ?? null;
}

export function terisiPRB(kode: PRBKodeStatus, data: PRBFormData): { terisi: number; total: number } {
  const f = PRB_FIELDS_BY_KODE[kode];
  return { terisi: f.filter((k) => data[k] !== null).length, total: f.length };
}

/** Tampilan nilai PRB (flag → Ya/Tidak, angka + satuan). */
export function nilaiPRB(field: keyof PRBFormData, v: number | null): string {
  if (v === null) return "—";
  if (PRB_FLAG_FIELDS.has(field)) return v === 1 ? "Ya" : "Tidak";
  const s = PRB_SATUAN[field];
  return s ? `${v.toLocaleString("id-ID")} ${s}` : v.toLocaleString("id-ID");
}
