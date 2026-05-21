/**
 * BPJS Kode Ruangan / SMF (Staf Medis Fungsional)
 *
 * Kode standar 3 huruf yang dipakai BPJS Kesehatan di sistem V-Claim / SEP
 * untuk identifikasi unit pelayanan saat klaim INA-CBG. Kode ini juga umum
 * dipakai sebagai referensi SMF di RS akreditasi SNARS.
 *
 * Referensi:
 *   - BPJS Kesehatan V-Claim API (field `ruang`)
 *   - SK Dirjen Yankes terkait penamaan poli standar
 *   - PMK 56/2014 tentang Klasifikasi dan Perijinan RS
 *   - Praktik umum HIS/SIMRS Indonesia
 *
 * Catatan: kode-kode di bawah adalah konvensi de-facto industri kesehatan
 * Indonesia. Beberapa RS mungkin memakai varian (ANK vs ANA, BDH vs BED).
 */

export type KategoriRuanganBPJS =
  | "Spesialis_Dasar"
  | "Spesialis_Lain"
  | "Bedah"
  | "Khusus"
  | "Penunjang"
  | "Ruangan";

export interface BPJSRuanganItem {
  kode: string;
  nama: string;
  kategori: KategoriRuanganBPJS;
  deskripsi?: string;
}

export const KATEGORI_RUANGAN_CFG: Record<
  KategoriRuanganBPJS,
  { label: string; bg: string; text: string; dot: string }
> = {
  Spesialis_Dasar: { label: "Spesialis Dasar",  bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  Spesialis_Lain:  { label: "Spesialis Lain",   bg: "bg-sky-50",     text: "text-sky-700",     dot: "bg-sky-500"     },
  Bedah:           { label: "Bedah",            bg: "bg-rose-50",    text: "text-rose-700",    dot: "bg-rose-500"    },
  Khusus:          { label: "Khusus / Penunjang Klinis", bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  Penunjang:       { label: "Penunjang",        bg: "bg-violet-50",  text: "text-violet-700",  dot: "bg-violet-500"  },
  Ruangan:         { label: "Ruangan Pelayanan", bg: "bg-teal-50",   text: "text-teal-700",    dot: "bg-teal-500"    },
};

export const BPJS_RUANGAN_CATALOG: BPJSRuanganItem[] = [
  // ── Spesialis Dasar (4 spesialis dasar wajib RS Tipe C/B) ──
  { kode: "INT", nama: "Penyakit Dalam",              kategori: "Spesialis_Dasar", deskripsi: "Interna" },
  { kode: "ANA", nama: "Anak",                        kategori: "Spesialis_Dasar", deskripsi: "Pediatri" },
  { kode: "BED", nama: "Bedah Umum",                  kategori: "Spesialis_Dasar" },
  { kode: "OBG", nama: "Obstetri & Ginekologi",       kategori: "Spesialis_Dasar", deskripsi: "Kebidanan & Kandungan" },

  // ── Spesialis Lain ──
  { kode: "MAT", nama: "Mata",                        kategori: "Spesialis_Lain", deskripsi: "Oftalmologi" },
  { kode: "THT", nama: "THT-KL",                      kategori: "Spesialis_Lain", deskripsi: "Telinga Hidung Tenggorok – Kepala Leher" },
  { kode: "SAR", nama: "Saraf",                       kategori: "Spesialis_Lain", deskripsi: "Neurologi" },
  { kode: "JAN", nama: "Jantung & Pembuluh Darah",    kategori: "Spesialis_Lain", deskripsi: "Kardiologi" },
  { kode: "PAR", nama: "Paru",                        kategori: "Spesialis_Lain", deskripsi: "Pulmonologi" },
  { kode: "KUL", nama: "Kulit & Kelamin",             kategori: "Spesialis_Lain", deskripsi: "Dermato-Venereologi" },
  { kode: "JIW", nama: "Kesehatan Jiwa",              kategori: "Spesialis_Lain", deskripsi: "Psikiatri" },
  { kode: "GIG", nama: "Gigi & Mulut",                kategori: "Spesialis_Lain", deskripsi: "Dental & Oral Surgery" },
  { kode: "URO", nama: "Urologi",                     kategori: "Spesialis_Lain" },
  { kode: "GER", nama: "Geriatri",                    kategori: "Spesialis_Lain", deskripsi: "Kesehatan lansia" },

  // ── Bedah Sub-spesialis ──
  { kode: "BDA", nama: "Bedah Anak",                  kategori: "Bedah" },
  { kode: "BDM", nama: "Bedah Mulut",                 kategori: "Bedah" },
  { kode: "BDP", nama: "Bedah Plastik",               kategori: "Bedah", deskripsi: "Plastik Rekonstruksi & Estetik" },
  { kode: "BDS", nama: "Bedah Saraf",                 kategori: "Bedah" },
  { kode: "BDT", nama: "Bedah Thorax & Kardiovaskular", kategori: "Bedah" },
  { kode: "BDU", nama: "Bedah Urologi",               kategori: "Bedah" },
  { kode: "ORT", nama: "Orthopedi & Traumatologi",    kategori: "Bedah" },

  // ── Khusus & Penunjang Klinis ──
  { kode: "ANE", nama: "Anestesi",                    kategori: "Khusus" },
  { kode: "RHB", nama: "Rehabilitasi Medik",          kategori: "Khusus", deskripsi: "Fisioterapi & Rehab" },
  { kode: "GZK", nama: "Gizi Klinik",                 kategori: "Khusus" },
  { kode: "AKU", nama: "Akupuntur Medik",             kategori: "Khusus" },
  { kode: "ONK", nama: "Onkologi",                    kategori: "Khusus", deskripsi: "Kemoterapi / kanker" },
  { kode: "HEM", nama: "Hemodialisa",                 kategori: "Khusus", deskripsi: "Cuci darah" },
  { kode: "VCT", nama: "VCT / Klinik HIV-AIDS",       kategori: "Khusus", deskripsi: "Voluntary Counseling & Testing" },
  { kode: "TBC", nama: "Klinik TB / DOTS",            kategori: "Khusus" },

  // ── Penunjang ──
  { kode: "RAD", nama: "Radiologi",                   kategori: "Penunjang", deskripsi: "Rontgen, CT, MRI, USG" },
  { kode: "LAB", nama: "Laboratorium PK",             kategori: "Penunjang", deskripsi: "Patologi Klinik" },
  { kode: "PAT", nama: "Patologi Anatomi",            kategori: "Penunjang" },
  { kode: "FAR", nama: "Farmasi",                     kategori: "Penunjang" },

  // ── Ruangan Pelayanan ──
  { kode: "IGD",  nama: "Instalasi Gawat Darurat",    kategori: "Ruangan" },
  { kode: "IRJ",  nama: "Instalasi Rawat Jalan",      kategori: "Ruangan", deskripsi: "Poliklinik umum & spesialis" },
  { kode: "IRI",  nama: "Instalasi Rawat Inap",       kategori: "Ruangan" },
  { kode: "ICU",  nama: "Intensive Care Unit",        kategori: "Ruangan" },
  { kode: "ICCU", nama: "Intensive Cardiac Care Unit", kategori: "Ruangan" },
  { kode: "NICU", nama: "Neonatal ICU",               kategori: "Ruangan" },
  { kode: "PICU", nama: "Pediatric ICU",              kategori: "Ruangan" },
  { kode: "HCU",  nama: "High Care Unit",             kategori: "Ruangan" },
  { kode: "OK",   nama: "Kamar Operasi",              kategori: "Ruangan", deskripsi: "Bedah Sentral" },
  { kode: "VK",   nama: "Kamar Bersalin",             kategori: "Ruangan", deskripsi: "Verlos Kamer / VK" },
  { kode: "ISO",  nama: "Ruang Isolasi",              kategori: "Ruangan", deskripsi: "Contact / Droplet / Airborne" },
];

// ── Helpers ───────────────────────────────────────────────

export function getBPJSRuanganByKode(kode: string): BPJSRuanganItem | undefined {
  return BPJS_RUANGAN_CATALOG.find((r) => r.kode === kode);
}

export function getRuanganByKategori(kategori: KategoriRuanganBPJS): BPJSRuanganItem[] {
  return BPJS_RUANGAN_CATALOG.filter((r) => r.kategori === kategori);
}

export const KATEGORI_ORDER: KategoriRuanganBPJS[] = [
  "Spesialis_Dasar", "Spesialis_Lain", "Bedah", "Khusus", "Penunjang", "Ruangan",
];
