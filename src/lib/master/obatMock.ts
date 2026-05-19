/**
 * Mock Katalog Obat — placeholder sebelum Tier 2 (Katalog Obat) dibangun.
 * Dipakai oleh sub-page Mapping Hub: Formularium Penjamin, Distribusi Obat.
 *
 * Kode menggunakan format ATC class (mock representative).
 */

// ── Types ─────────────────────────────────────────────────

export type ObatKategori =
  | "Antibiotik"
  | "Analgesik"
  | "Antihipertensi"
  | "Kardiovaskular"
  | "Antidiabetik"
  | "Saluran_Cerna"
  | "Saluran_Nafas"
  | "Neurologi"
  | "Vitamin_Cairan"
  | "Lainnya";

export type SediaanBentuk = "Tablet" | "Kapsul" | "Sirup" | "Injeksi" | "Salep" | "Inhaler" | "Cairan";

export interface ObatRecord {
  id: string;
  kode: string;            // mock ATC code
  namaGenerik: string;
  namaDagang: string;
  kategori: ObatKategori;
  bentuk: SediaanBentuk;
  kekuatan: string;        // e.g. "500 mg", "10 mg/ml"
  isFormularium: boolean;  // formularium nasional default
  isHAM: boolean;          // high-alert
  hargaSatuan: number;     // IDR per sediaan
}

// ── Config ───────────────────────────────────────────────

export const OBAT_KATEGORI_CFG: Record<
  ObatKategori,
  { label: string; short: string; bg: string; text: string; dot: string }
> = {
  Antibiotik:      { label: "Antibiotik",         short: "AB",   bg: "bg-rose-50",     text: "text-rose-700",     dot: "bg-rose-500" },
  Analgesik:       { label: "Analgesik / NSAID",  short: "Ang",  bg: "bg-amber-50",    text: "text-amber-700",    dot: "bg-amber-500" },
  Antihipertensi:  { label: "Antihipertensi",     short: "HTN",  bg: "bg-sky-50",      text: "text-sky-700",      dot: "bg-sky-500" },
  Kardiovaskular:  { label: "Kardiovaskular",     short: "CV",   bg: "bg-red-50",      text: "text-red-700",      dot: "bg-red-500" },
  Antidiabetik:    { label: "Antidiabetik",       short: "DM",   bg: "bg-emerald-50",  text: "text-emerald-700",  dot: "bg-emerald-500" },
  Saluran_Cerna:   { label: "Saluran Cerna",      short: "GI",   bg: "bg-orange-50",   text: "text-orange-700",   dot: "bg-orange-500" },
  Saluran_Nafas:   { label: "Saluran Nafas",      short: "Pulm", bg: "bg-cyan-50",     text: "text-cyan-700",     dot: "bg-cyan-500" },
  Neurologi:       { label: "Neurologi & Psikiatri", short: "Neu", bg: "bg-violet-50", text: "text-violet-700",   dot: "bg-violet-500" },
  Vitamin_Cairan:  { label: "Vitamin & Cairan",   short: "Vit",  bg: "bg-teal-50",     text: "text-teal-700",     dot: "bg-teal-500" },
  Lainnya:         { label: "Lainnya",            short: "Etc",  bg: "bg-slate-100",   text: "text-slate-600",    dot: "bg-slate-400" },
};

export const KATEGORI_OBAT_ORDER: ObatKategori[] = [
  "Antibiotik",
  "Analgesik",
  "Antihipertensi",
  "Kardiovaskular",
  "Antidiabetik",
  "Saluran_Cerna",
  "Saluran_Nafas",
  "Neurologi",
  "Vitamin_Cairan",
  "Lainnya",
];

// ── Mock Data ─────────────────────────────────────────────

export const OBAT_MOCK: ObatRecord[] = [
  // Antibiotik
  { id: "obt-001", kode: "J01CR02", namaGenerik: "Amoxicillin-Clavulanic Acid", namaDagang: "Augmentin",   kategori: "Antibiotik", bentuk: "Tablet",  kekuatan: "625 mg",      isFormularium: true,  isHAM: false, hargaSatuan: 8500 },
  { id: "obt-002", kode: "J01DD04", namaGenerik: "Ceftriaxone",                 namaDagang: "Cefriex",     kategori: "Antibiotik", bentuk: "Injeksi", kekuatan: "1 g",         isFormularium: true,  isHAM: false, hargaSatuan: 38000 },
  { id: "obt-003", kode: "J01FA10", namaGenerik: "Azithromycin",                namaDagang: "Zithromax",   kategori: "Antibiotik", bentuk: "Tablet",  kekuatan: "500 mg",      isFormularium: true,  isHAM: false, hargaSatuan: 18500 },
  { id: "obt-004", kode: "J01MA02", namaGenerik: "Ciprofloxacin",               namaDagang: "Ciproxin",    kategori: "Antibiotik", bentuk: "Tablet",  kekuatan: "500 mg",      isFormularium: true,  isHAM: false, hargaSatuan: 6500 },

  // Analgesik
  { id: "obt-010", kode: "N02BE01", namaGenerik: "Paracetamol",                 namaDagang: "Sanmol",      kategori: "Analgesik", bentuk: "Tablet",  kekuatan: "500 mg",      isFormularium: true,  isHAM: false, hargaSatuan: 850 },
  { id: "obt-011", kode: "M01AE01", namaGenerik: "Ibuprofen",                   namaDagang: "Proris",      kategori: "Analgesik", bentuk: "Tablet",  kekuatan: "400 mg",      isFormularium: true,  isHAM: false, hargaSatuan: 1200 },
  { id: "obt-012", kode: "N02AA01", namaGenerik: "Morfin Sulfat",               namaDagang: "MST",         kategori: "Analgesik", bentuk: "Injeksi", kekuatan: "10 mg/ml",    isFormularium: true,  isHAM: true,  hargaSatuan: 65000 },
  { id: "obt-013", kode: "N02AB03", namaGenerik: "Fentanil",                    namaDagang: "Durogesic",   kategori: "Analgesik", bentuk: "Injeksi", kekuatan: "50 mcg/ml",   isFormularium: true,  isHAM: true,  hargaSatuan: 85000 },

  // Antihipertensi
  { id: "obt-020", kode: "C09AA02", namaGenerik: "Captopril",                   namaDagang: "Capoten",     kategori: "Antihipertensi", bentuk: "Tablet", kekuatan: "25 mg",    isFormularium: true,  isHAM: false, hargaSatuan: 750 },
  { id: "obt-021", kode: "C09CA01", namaGenerik: "Losartan",                    namaDagang: "Cozaar",      kategori: "Antihipertensi", bentuk: "Tablet", kekuatan: "50 mg",    isFormularium: true,  isHAM: false, hargaSatuan: 3200 },
  { id: "obt-022", kode: "C08CA01", namaGenerik: "Amlodipine",                  namaDagang: "Norvask",     kategori: "Antihipertensi", bentuk: "Tablet", kekuatan: "10 mg",    isFormularium: true,  isHAM: false, hargaSatuan: 2100 },

  // Kardiovaskular
  { id: "obt-030", kode: "B01AC06", namaGenerik: "Asam Asetilsalisilat (Aspilet)", namaDagang: "Aspilet",  kategori: "Kardiovaskular", bentuk: "Tablet", kekuatan: "80 mg",    isFormularium: true,  isHAM: false, hargaSatuan: 1500 },
  { id: "obt-031", kode: "C07AB07", namaGenerik: "Bisoprolol",                  namaDagang: "Concor",      kategori: "Kardiovaskular", bentuk: "Tablet", kekuatan: "5 mg",     isFormularium: true,  isHAM: false, hargaSatuan: 4200 },
  { id: "obt-032", kode: "B01AB05", namaGenerik: "Enoxaparin",                  namaDagang: "Lovenox",     kategori: "Kardiovaskular", bentuk: "Injeksi", kekuatan: "60 mg/0.6ml", isFormularium: true, isHAM: true, hargaSatuan: 145000 },
  { id: "obt-033", kode: "C03CA01", namaGenerik: "Furosemide",                  namaDagang: "Lasix",       kategori: "Kardiovaskular", bentuk: "Tablet", kekuatan: "40 mg",    isFormularium: true,  isHAM: false, hargaSatuan: 950 },

  // Antidiabetik
  { id: "obt-040", kode: "A10BA02", namaGenerik: "Metformin",                   namaDagang: "Glucophage",  kategori: "Antidiabetik", bentuk: "Tablet",  kekuatan: "500 mg",    isFormularium: true,  isHAM: false, hargaSatuan: 1100 },
  { id: "obt-041", kode: "A10AB01", namaGenerik: "Insulin Reguler (Actrapid)",  namaDagang: "Actrapid",    kategori: "Antidiabetik", bentuk: "Injeksi", kekuatan: "100 IU/ml", isFormularium: true,  isHAM: true,  hargaSatuan: 175000 },
  { id: "obt-042", kode: "A10AE05", namaGenerik: "Insulin Glargine",            namaDagang: "Lantus",      kategori: "Antidiabetik", bentuk: "Injeksi", kekuatan: "100 IU/ml", isFormularium: false, isHAM: true,  hargaSatuan: 285000 },

  // Saluran Cerna
  { id: "obt-050", kode: "A02BC01", namaGenerik: "Omeprazole",                  namaDagang: "Losec",       kategori: "Saluran_Cerna", bentuk: "Kapsul",  kekuatan: "20 mg",    isFormularium: true,  isHAM: false, hargaSatuan: 1850 },
  { id: "obt-051", kode: "A03FA01", namaGenerik: "Metoclopramide",              namaDagang: "Primperan",   kategori: "Saluran_Cerna", bentuk: "Tablet",  kekuatan: "10 mg",    isFormularium: true,  isHAM: false, hargaSatuan: 1450 },
  { id: "obt-052", kode: "A04AA01", namaGenerik: "Ondansetron",                 namaDagang: "Zofran",      kategori: "Saluran_Cerna", bentuk: "Injeksi", kekuatan: "4 mg/2ml", isFormularium: true,  isHAM: false, hargaSatuan: 9500 },

  // Saluran Nafas
  { id: "obt-060", kode: "R03AC02", namaGenerik: "Salbutamol",                  namaDagang: "Ventolin",    kategori: "Saluran_Nafas", bentuk: "Inhaler", kekuatan: "100 mcg/dosis", isFormularium: true, isHAM: false, hargaSatuan: 55000 },
  { id: "obt-061", kode: "R03BB04", namaGenerik: "Ipratropium Bromide",         namaDagang: "Atrovent",    kategori: "Saluran_Nafas", bentuk: "Cairan",  kekuatan: "250 mcg/ml", isFormularium: true, isHAM: false, hargaSatuan: 28500 },

  // Neurologi
  { id: "obt-070", kode: "N03AB02", namaGenerik: "Fenitoin",                    namaDagang: "Dilantin",    kategori: "Neurologi", bentuk: "Tablet",  kekuatan: "100 mg",        isFormularium: true,  isHAM: false, hargaSatuan: 2150 },
  { id: "obt-071", kode: "N03AE01", namaGenerik: "Diazepam",                    namaDagang: "Valium",      kategori: "Neurologi", bentuk: "Injeksi", kekuatan: "10 mg/2ml",     isFormularium: true,  isHAM: true,  hargaSatuan: 12500 },

  // Vitamin & Cairan
  { id: "obt-080", kode: "B05BB01", namaGenerik: "NaCl 0.9%",                   namaDagang: "Otsuka",      kategori: "Vitamin_Cairan", bentuk: "Cairan",  kekuatan: "500 ml",     isFormularium: true, isHAM: false, hargaSatuan: 15000 },
  { id: "obt-081", kode: "B05BA03", namaGenerik: "Ringer Laktat",               namaDagang: "Otsuka",      kategori: "Vitamin_Cairan", bentuk: "Cairan",  kekuatan: "500 ml",     isFormularium: true, isHAM: false, hargaSatuan: 16500 },
  { id: "obt-082", kode: "A11GA01", namaGenerik: "Vitamin C",                   namaDagang: "Cernevit",    kategori: "Vitamin_Cairan", bentuk: "Tablet",  kekuatan: "500 mg",     isFormularium: false, isHAM: false, hargaSatuan: 850 },
];

// ── Helpers ───────────────────────────────────────────────

export function groupObatByKategori(obat: ObatRecord[]): Map<ObatKategori, ObatRecord[]> {
  const map = new Map<ObatKategori, ObatRecord[]>();
  for (const cat of KATEGORI_OBAT_ORDER) map.set(cat, []);
  for (const o of obat) {
    const arr = map.get(o.kategori) ?? [];
    arr.push(o);
    map.set(o.kategori, arr);
  }
  return map;
}

export function getObatById(id: string): ObatRecord | undefined {
  return OBAT_MOCK.find((o) => o.id === id);
}
