/**
 * Mock Katalog Tindakan — placeholder sebelum Tier 3 (Tarif & Paket Layanan)
 * dibangun. Dipakai oleh sub-page Mapping Hub: Kewenangan Klinis, Layanan Unit,
 * Tarif Matrix (T3+).
 *
 * Kode menggunakan ICD-9-CM Procedure Code (mock representative).
 */

import type { SpesialisCode } from "@/components/master/dokter/dokterShared";

// ── Types ─────────────────────────────────────────────────

export type TindakanKategori =
  | "Konsultasi"
  | "Tindakan_Medis"
  | "Diagnostik"
  | "Bedah_Minor"
  | "Bedah_Mayor"
  | "Bedah_Khusus"
  | "Obstetri"
  | "Pediatrik"
  | "Resusitasi"
  | "Anestesi"
  | "Spesialistik";

export type TingkatKompleksitas = "Sederhana" | "Sedang" | "Khusus" | "Canggih";

export interface TindakanRecord {
  id: string;
  kode: string;
  nama: string;
  kategori: TindakanKategori;
  kompleksitas: TingkatKompleksitas;
  /** Spesialisasi yang umumnya berwenang lakukan (untuk auto-credentialing default) */
  spesialisDefault: SpesialisCode[];
  /** Unit yang umumnya bisa lakukan (untuk auto-layanan unit default) */
  unitDefault: string[];
}

// ── Config Maps ───────────────────────────────────────────

export const KATEGORI_CFG: Record<
  TindakanKategori,
  { label: string; short: string; bg: string; text: string; dot: string; ring: string }
> = {
  Konsultasi:     { label: "Konsultasi",          short: "Konsul",  bg: "bg-sky-50",     text: "text-sky-700",     dot: "bg-sky-500",     ring: "ring-sky-200" },
  Tindakan_Medis: { label: "Tindakan Medis Umum", short: "Tind.",   bg: "bg-teal-50",    text: "text-teal-700",    dot: "bg-teal-500",    ring: "ring-teal-200" },
  Diagnostik:     { label: "Diagnostik",          short: "Diag.",   bg: "bg-violet-50",  text: "text-violet-700",  dot: "bg-violet-500",  ring: "ring-violet-200" },
  Bedah_Minor:    { label: "Bedah Minor",         short: "B.Mn",    bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-500",   ring: "ring-amber-200" },
  Bedah_Mayor:    { label: "Bedah Mayor",         short: "B.My",    bg: "bg-orange-50",  text: "text-orange-700",  dot: "bg-orange-500",  ring: "ring-orange-200" },
  Bedah_Khusus:   { label: "Bedah Khusus",        short: "B.Ks",    bg: "bg-rose-50",    text: "text-rose-700",    dot: "bg-rose-500",    ring: "ring-rose-200" },
  Obstetri:       { label: "Obstetri & Ginekologi", short: "OBGYN", bg: "bg-pink-50",    text: "text-pink-700",    dot: "bg-pink-500",    ring: "ring-pink-200" },
  Pediatrik:      { label: "Pediatrik",           short: "Anak",    bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", ring: "ring-emerald-200" },
  Resusitasi:     { label: "Resusitasi",          short: "Resus",   bg: "bg-red-50",     text: "text-red-700",     dot: "bg-red-500",     ring: "ring-red-200" },
  Anestesi:       { label: "Anestesi",            short: "Anest.",  bg: "bg-cyan-50",    text: "text-cyan-700",    dot: "bg-cyan-500",    ring: "ring-cyan-200" },
  Spesialistik:   { label: "Spesialistik (THT/Mata)", short: "Spes.", bg: "bg-yellow-50", text: "text-yellow-800",  dot: "bg-yellow-500",  ring: "ring-yellow-200" },
};

export const KOMPLEKSITAS_CFG: Record<
  TingkatKompleksitas,
  { label: string; bg: string; text: string }
> = {
  Sederhana: { label: "Sederhana", bg: "bg-slate-100", text: "text-slate-600" },
  Sedang:    { label: "Sedang",    bg: "bg-sky-100",   text: "text-sky-700" },
  Khusus:    { label: "Khusus",    bg: "bg-amber-100", text: "text-amber-800" },
  Canggih:   { label: "Canggih",   bg: "bg-rose-100",  text: "text-rose-800" },
};

export const KATEGORI_ORDER: TindakanKategori[] = [
  "Konsultasi",
  "Tindakan_Medis",
  "Diagnostik",
  "Pediatrik",
  "Obstetri",
  "Bedah_Minor",
  "Bedah_Mayor",
  "Bedah_Khusus",
  "Spesialistik",
  "Resusitasi",
  "Anestesi",
];

// ── Mock Data ─────────────────────────────────────────────

export const TINDAKAN_MOCK: TindakanRecord[] = [
  // Konsultasi
  { id: "tnd-001", kode: "89.00", nama: "Konsultasi Dokter Umum",      kategori: "Konsultasi", kompleksitas: "Sederhana", spesialisDefault: ["Umum"], unitDefault: ["POLI-UMUM","IGD"] },
  { id: "tnd-002", kode: "89.06", nama: "Konsultasi Dokter Spesialis", kategori: "Konsultasi", kompleksitas: "Sederhana", spesialisDefault: ["SpJP","SpPD","SpA","SpOG","SpB","SpS","SpM","SpKK","SpKJ","SpRad","SpTHT","SpU"], unitDefault: ["POLI-JTG","POLI-PD","POLI-ANAK","POLI-OBGYN","POLI-BEDAH","POLI-SARAF","POLI-MATA","IGD","RI"] },

  // Tindakan Medis Umum
  { id: "tnd-010", kode: "93.94", nama: "Nebulisasi",                  kategori: "Tindakan_Medis", kompleksitas: "Sederhana", spesialisDefault: ["Umum","SpA","SpPD","SpEM"], unitDefault: ["IGD","RJ","RI","ICU"] },
  { id: "tnd-011", kode: "38.93", nama: "Pemasangan Infus IV",         kategori: "Tindakan_Medis", kompleksitas: "Sederhana", spesialisDefault: ["Umum","SpEM","SpA","SpPD","SpB","SpAn"], unitDefault: ["IGD","RI","ICU","RJ"] },
  { id: "tnd-012", kode: "86.59", nama: "Hecting Luka < 5 cm",         kategori: "Tindakan_Medis", kompleksitas: "Sederhana", spesialisDefault: ["Umum","SpB","SpEM"], unitDefault: ["IGD","RJ"] },
  { id: "tnd-013", kode: "57.94", nama: "Pemasangan Kateter Urin",     kategori: "Tindakan_Medis", kompleksitas: "Sederhana", spesialisDefault: ["Umum","SpU","SpEM","SpB"], unitDefault: ["IGD","RI","ICU"] },
  { id: "tnd-014", kode: "96.07", nama: "Pemasangan NGT",              kategori: "Tindakan_Medis", kompleksitas: "Sederhana", spesialisDefault: ["Umum","SpPD","SpEM","SpA"], unitDefault: ["IGD","RI","ICU"] },
  { id: "tnd-015", kode: "99.21", nama: "Injeksi Intramuskular",       kategori: "Tindakan_Medis", kompleksitas: "Sederhana", spesialisDefault: ["Umum","SpA","SpPD","SpB"], unitDefault: ["IGD","RJ","RI","POLI-UMUM"] },

  // Diagnostik
  { id: "tnd-020", kode: "89.52", nama: "EKG 12 Lead",                 kategori: "Diagnostik", kompleksitas: "Sederhana", spesialisDefault: ["Umum","SpJP","SpPD","SpEM","SpAn"], unitDefault: ["IGD","RI","ICU","POLI-JTG","POLI-PD"] },
  { id: "tnd-021", kode: "89.37", nama: "Spirometri",                  kategori: "Diagnostik", kompleksitas: "Sedang",    spesialisDefault: ["SpPD"], unitDefault: ["POLI-PD"] },
  { id: "tnd-022", kode: "88.71", nama: "USG Abdomen",                 kategori: "Diagnostik", kompleksitas: "Sedang",    spesialisDefault: ["SpRad","SpPD","SpOG"], unitDefault: ["RAD","POLI-PD","POLI-OBGYN"] },
  { id: "tnd-023", kode: "88.72", nama: "Echocardiography",            kategori: "Diagnostik", kompleksitas: "Khusus",    spesialisDefault: ["SpJP"], unitDefault: ["POLI-JTG","ICU"] },
  { id: "tnd-024", kode: "45.13", nama: "Endoscopy Saluran Cerna Atas", kategori: "Diagnostik", kompleksitas: "Khusus",   spesialisDefault: ["SpPD","SpB"], unitDefault: ["POLI-PD","OK"] },

  // Pediatrik
  { id: "tnd-030", kode: "99.39", nama: "Imunisasi Anak",              kategori: "Pediatrik", kompleksitas: "Sederhana", spesialisDefault: ["SpA","Umum"], unitDefault: ["POLI-ANAK"] },
  { id: "tnd-031", kode: "93.92", nama: "Fototerapi Bayi (Bilirubin)", kategori: "Pediatrik", kompleksitas: "Sedang",    spesialisDefault: ["SpA"], unitDefault: ["RI","ICU"] },
  { id: "tnd-032", kode: "99.83", nama: "Stabilisasi Neonatus",        kategori: "Pediatrik", kompleksitas: "Khusus",    spesialisDefault: ["SpA"], unitDefault: ["RI","ICU"] },

  // Obstetri
  { id: "tnd-040", kode: "73.59", nama: "Partus Normal",               kategori: "Obstetri", kompleksitas: "Sedang",   spesialisDefault: ["SpOG","Umum"], unitDefault: ["RI","POLI-OBGYN"] },
  { id: "tnd-041", kode: "74.1",  nama: "Sectio Caesarea",             kategori: "Obstetri", kompleksitas: "Khusus",   spesialisDefault: ["SpOG"], unitDefault: ["OK"] },
  { id: "tnd-042", kode: "75.4",  nama: "Curettage",                   kategori: "Obstetri", kompleksitas: "Sedang",   spesialisDefault: ["SpOG"], unitDefault: ["OK","POLI-OBGYN"] },
  { id: "tnd-043", kode: "75.34", nama: "ANC (Antenatal Care)",        kategori: "Obstetri", kompleksitas: "Sederhana", spesialisDefault: ["SpOG","Umum"], unitDefault: ["POLI-OBGYN"] },

  // Bedah Minor
  { id: "tnd-050", kode: "86.21", nama: "Eksisi Tumor Jinak Kulit",    kategori: "Bedah_Minor", kompleksitas: "Sedang", spesialisDefault: ["SpB","SpKK","Umum"], unitDefault: ["OK","POLI-BEDAH"] },
  { id: "tnd-051", kode: "64.0",  nama: "Sirkumsisi",                  kategori: "Bedah_Minor", kompleksitas: "Sedang", spesialisDefault: ["SpB","SpU","Umum"], unitDefault: ["OK","POLI-BEDAH"] },
  { id: "tnd-052", kode: "06.39", nama: "Eksisi Lipoma",               kategori: "Bedah_Minor", kompleksitas: "Sedang", spesialisDefault: ["SpB"], unitDefault: ["OK","POLI-BEDAH"] },

  // Bedah Mayor
  { id: "tnd-060", kode: "47.09", nama: "Appendectomy",                kategori: "Bedah_Mayor", kompleksitas: "Khusus", spesialisDefault: ["SpB"], unitDefault: ["OK"] },
  { id: "tnd-061", kode: "51.23", nama: "Cholecystectomy Laparoskopik", kategori: "Bedah_Mayor", kompleksitas: "Canggih", spesialisDefault: ["SpB"], unitDefault: ["OK"] },
  { id: "tnd-062", kode: "53.41", nama: "Hernia Repair",               kategori: "Bedah_Mayor", kompleksitas: "Khusus",  spesialisDefault: ["SpB"], unitDefault: ["OK"] },
  { id: "tnd-063", kode: "82.01", nama: "Open Reduction Fraktur",      kategori: "Bedah_Mayor", kompleksitas: "Khusus",  spesialisDefault: ["SpB"], unitDefault: ["OK"] },

  // Bedah Khusus
  { id: "tnd-070", kode: "36.10", nama: "Coronary Artery Bypass Graft (CABG)", kategori: "Bedah_Khusus", kompleksitas: "Canggih", spesialisDefault: [], unitDefault: ["OK"] },
  { id: "tnd-071", kode: "01.24", nama: "Craniotomy",                  kategori: "Bedah_Khusus", kompleksitas: "Canggih", spesialisDefault: ["SpS"], unitDefault: ["OK"] },

  // Resusitasi
  { id: "tnd-080", kode: "99.60", nama: "RJP (Resusitasi Jantung Paru)", kategori: "Resusitasi", kompleksitas: "Sedang", spesialisDefault: ["Umum","SpEM","SpAn","SpJP","SpA","SpPD"], unitDefault: ["IGD","ICU","HCU","RI"] },
  { id: "tnd-081", kode: "96.04", nama: "Intubasi Endotrakeal",        kategori: "Resusitasi", kompleksitas: "Khusus", spesialisDefault: ["SpAn","SpEM","SpJP"], unitDefault: ["IGD","ICU","OK"] },

  // Anestesi
  { id: "tnd-090", kode: "00.99", nama: "Anestesi Umum",               kategori: "Anestesi", kompleksitas: "Khusus", spesialisDefault: ["SpAn"], unitDefault: ["OK"] },
  { id: "tnd-091", kode: "03.91", nama: "Anestesi Spinal",             kategori: "Anestesi", kompleksitas: "Khusus", spesialisDefault: ["SpAn"], unitDefault: ["OK"] },

  // Spesialistik (THT/Mata)
  { id: "tnd-100", kode: "20.0",  nama: "Pengeluaran Cerumen",         kategori: "Spesialistik", kompleksitas: "Sederhana", spesialisDefault: ["SpTHT","Umum"], unitDefault: ["POLI-UMUM"] },
  { id: "tnd-101", kode: "13.41", nama: "Phacoemulsifikasi (Operasi Katarak)", kategori: "Spesialistik", kompleksitas: "Canggih", spesialisDefault: ["SpM"], unitDefault: ["OK"] },
];

// ── Helpers ───────────────────────────────────────────────

export function groupByKategori(tindakan: TindakanRecord[]): Map<TindakanKategori, TindakanRecord[]> {
  const map = new Map<TindakanKategori, TindakanRecord[]>();
  for (const cat of KATEGORI_ORDER) map.set(cat, []);
  for (const t of tindakan) {
    const arr = map.get(t.kategori) ?? [];
    arr.push(t);
    map.set(t.kategori, arr);
  }
  return map;
}

export function getTindakanById(id: string): TindakanRecord | undefined {
  return TINDAKAN_MOCK.find((t) => t.id === id);
}

/** Clinical units (untuk Layanan Unit) — include OK + HCU yang ga ada di POLI/UNIT_LIST */
export const CLINICAL_UNITS_FOR_LAYANAN: { kode: string; nama: string; short: string; category: "Klinis" | "Poli" | "Penunjang" }[] = [
  { kode: "IGD",         nama: "IGD",                short: "IGD",   category: "Klinis" },
  { kode: "ICU",         nama: "ICU",                short: "ICU",   category: "Klinis" },
  { kode: "HCU",         nama: "HCU",                short: "HCU",   category: "Klinis" },
  { kode: "OK",          nama: "OK / Kamar Operasi", short: "OK",    category: "Klinis" },
  { kode: "RI",          nama: "Rawat Inap",         short: "RI",    category: "Klinis" },
  { kode: "RJ",          nama: "Rawat Jalan",        short: "RJ",    category: "Klinis" },
  { kode: "POLI-UMUM",   nama: "Poli Umum",          short: "P.UMUM", category: "Poli" },
  { kode: "POLI-JTG",    nama: "Poli Jantung",       short: "P.JTG", category: "Poli" },
  { kode: "POLI-PD",     nama: "Poli Penyakit Dalam", short: "P.PD",  category: "Poli" },
  { kode: "POLI-ANAK",   nama: "Poli Anak",          short: "P.ANAK", category: "Poli" },
  { kode: "POLI-OBGYN",  nama: "Poli OBGYN",         short: "P.OBG",  category: "Poli" },
  { kode: "POLI-BEDAH",  nama: "Poli Bedah",         short: "P.BDH",  category: "Poli" },
  { kode: "RAD",         nama: "Radiologi",          short: "RAD",   category: "Penunjang" },
  { kode: "LAB",         nama: "Laboratorium",       short: "LAB",   category: "Penunjang" },
];
