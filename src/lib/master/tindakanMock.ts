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
  /** Status KPTL aktif. Bila true → `nomorKptl` & `kompleksitas` relevan. Default false. */
  kptlAktif?: boolean;
  /** Nomor KPTL — hanya diisi saat `kptlAktif`. */
  nomorKptl?: string | null;
  /** Tingkat kompleksitas — OPSIONAL (bagian dari status KPTL), default null saat KPTL non-aktif. */
  kompleksitas?: TingkatKompleksitas | null;
  /** Spesialisasi yang umumnya berwenang lakukan (untuk auto-credentialing default) */
  spesialisDefault: SpesialisCode[];
  /** Unit yang umumnya bisa lakukan (untuk auto-layanan unit default) */
  unitDefault: string[];
  /** Deskripsi singkat prosedur / indikasi umum */
  deskripsi?: string;
  /** Status aktif di katalog RS */
  status?: "Aktif" | "NonAktif";
}

let _idCounter = 200;
export function emptyTindakanRecord(): TindakanRecord {
  return {
    id: `tnd-${++_idCounter}`,
    kode: "",
    nama: "",
    kategori: "Konsultasi",
    kptlAktif: false,
    nomorKptl: "",
    kompleksitas: null,
    spesialisDefault: [],
    unitDefault: [],
    deskripsi: "",
    status: "Aktif",
  };
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
// Mock dihapus — katalog tindakan kini diisi manual lewat form (akan di-swap ke DB).
// Konsumen lain (Mapping Hub: Kewenangan/Layanan/Tarif) menampilkan empty-state saat kosong.

export const TINDAKAN_MOCK: TindakanRecord[] = [];

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
