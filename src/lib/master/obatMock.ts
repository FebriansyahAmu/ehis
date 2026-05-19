/**
 * Mock Katalog Obat (Tier 2 Master) — single source of truth untuk:
 * - Halaman master `/ehis-master/katalog-obat` (input lengkap per obat)
 * - Mapping Hub: Formularium Penjamin, Distribusi Obat (subset field)
 * - (future) Resep & Farmasi workflow (lookup harga, HAM, LASA, golongan)
 *
 * Schema sengaja flat + optional field supaya UI form bisa progressively
 * di-isi tanpa wajib kompleksitas full. Mapping pages hanya pakai field
 * yang relevan; halaman master menampilkan semua field.
 */

// ── Enum / Union Types ────────────────────────────────────

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

export type SediaanBentuk =
  | "Tablet" | "Kapsul" | "Sirup" | "Injeksi" | "Salep" | "Inhaler" | "Cairan"
  | "Suppositoria" | "Drops" | "Patch" | "Spray";

export type SatuanTerkecil =
  | "Tablet" | "Kapsul" | "Botol" | "Vial" | "Ampul" | "Sachet"
  | "Tube" | "Strip" | "Pcs" | "ml";

export type RutePemberian =
  | "PO" | "IV" | "IM" | "SC" | "Topikal" | "Inhalasi"
  | "Rektal" | "Sublingual" | "Vaginal" | "Mata" | "Telinga";

/**
 * Golongan obat menurut UU 35/2009 + PMK 3/2015 + PMK 3/2017.
 * Penting untuk legal compliance & register.
 */
export type GolonganObat =
  | "Narkotika_I"      // Tidak untuk terapi (Heroin, Ganja, dst)
  | "Narkotika_II"     // Morfin, Fentanil, Petidin
  | "Narkotika_III"    // Kodein, Buprenorfin
  | "Psikotropika_I"   // MDMA, LSD (tidak terapi)
  | "Psikotropika_II"  // Amfetamin, Metilfenidat
  | "Psikotropika_III" // Pentobarbital, Flunitrazepam
  | "Psikotropika_IV"  // Diazepam, Lorazepam, Alprazolam
  | "OOT"              // Obat-Obat Tertentu (Tramadol, Triheksifenidil, dst)
  | "Keras_G"          // Obat Keras kode G (sebagian besar resep)
  | "Bebas_Terbatas"   // P-1 s/d P-6 (OBT)
  | "Bebas";           // Obat Bebas (OTC)

export type StatusObat = "Aktif" | "Non_Aktif" | "Discontinued";

// ── Master Record ────────────────────────────────────────

export interface ObatRecord {
  // ── Tab 1: Identitas ────────────────────────────────
  id: string;
  /** Kode internal RS atau kode ATC (anatomical-therapeutic-chemical) */
  kode: string;
  /** Nama generik / INN (wajib sesuai Fornas) */
  namaGenerik: string;
  /** Nama dagang utama */
  namaDagang: string;
  /** Pabrik / Produsen */
  pabrik?: string;
  kategori: ObatKategori;
  bentuk: SediaanBentuk;
  /** Kekuatan, mis "500 mg", "10 mg/ml", "100 IU/ml" */
  kekuatan: string;
  satuanTerkecil?: SatuanTerkecil;
  rute?: RutePemberian;

  // ── Tab 2: Klasifikasi ──────────────────────────────
  /** Formularium nasional / RS */
  isFormularium: boolean;
  /** High-Alert Medication */
  isHAM: boolean;
  /** Look-Alike Sound-Alike */
  isLASA?: boolean;
  /** Pasangan LASA — array of obatId */
  lasaPairIds?: string[];
  /** Golongan legal */
  golongan?: GolonganObat;
  /** Butuh penyimpanan rantai dingin (2-8°C) */
  isColdChain?: boolean;
  /** Restricted — perlu approval DPJP/SpFK */
  isRestricted?: boolean;

  // ── Tab 3: Klinis ───────────────────────────────────
  indikasi?: string;
  kontraindikasi?: string;
  /** Dosis lazim dewasa */
  dosisDewasa?: string;
  /** Dosis lazim anak / pediatrik */
  dosisAnak?: string;
  efekSamping?: string;
  /** Interaksi obat yang penting (free text, satu per baris) */
  interaksiObat?: string;
  catatanKhusus?: string;

  // ── Tab 4: Harga & Coverage ─────────────────────────
  /** Harga jual ke pasien per satuan terkecil */
  hargaSatuan: number;
  /** Harga Pokok Penjualan (untuk margin internal) */
  hpp?: number;
  /** Harga Eceran Tertinggi BPOM */
  het?: number;
  /** Kode Fornas BPJS */
  kodeFornas?: string;
  /** Coverage BPJS Kesehatan */
  bpjsCoverage?: boolean;
  /** Batas resep per kunjungan (qty terkecil) */
  batasResepPerKunjungan?: number;

  // ── Meta ────────────────────────────────────────────
  status?: StatusObat;
}

// ── Config Maps ──────────────────────────────────────────

export const OBAT_KATEGORI_CFG: Record<
  ObatKategori,
  { label: string; short: string; bg: string; text: string; dot: string }
> = {
  Antibiotik:      { label: "Antibiotik",            short: "AB",   bg: "bg-rose-50",     text: "text-rose-700",     dot: "bg-rose-500" },
  Analgesik:       { label: "Analgesik / NSAID",     short: "Ang",  bg: "bg-amber-50",    text: "text-amber-700",    dot: "bg-amber-500" },
  Antihipertensi:  { label: "Antihipertensi",        short: "HTN",  bg: "bg-sky-50",      text: "text-sky-700",      dot: "bg-sky-500" },
  Kardiovaskular:  { label: "Kardiovaskular",        short: "CV",   bg: "bg-red-50",      text: "text-red-700",      dot: "bg-red-500" },
  Antidiabetik:    { label: "Antidiabetik",          short: "DM",   bg: "bg-emerald-50",  text: "text-emerald-700",  dot: "bg-emerald-500" },
  Saluran_Cerna:   { label: "Saluran Cerna",         short: "GI",   bg: "bg-orange-50",   text: "text-orange-700",   dot: "bg-orange-500" },
  Saluran_Nafas:   { label: "Saluran Nafas",         short: "Pulm", bg: "bg-cyan-50",     text: "text-cyan-700",     dot: "bg-cyan-500" },
  Neurologi:       { label: "Neurologi & Psikiatri", short: "Neu",  bg: "bg-violet-50",   text: "text-violet-700",   dot: "bg-violet-500" },
  Vitamin_Cairan:  { label: "Vitamin & Cairan",      short: "Vit",  bg: "bg-teal-50",     text: "text-teal-700",     dot: "bg-teal-500" },
  Lainnya:         { label: "Lainnya",               short: "Etc",  bg: "bg-slate-100",   text: "text-slate-600",    dot: "bg-slate-400" },
};

export const BENTUK_CFG: Record<SediaanBentuk, { label: string; short: string }> = {
  Tablet:       { label: "Tablet",       short: "TAB" },
  Kapsul:       { label: "Kapsul",       short: "KAP" },
  Sirup:        { label: "Sirup",        short: "SYR" },
  Injeksi:      { label: "Injeksi",      short: "INJ" },
  Salep:        { label: "Salep / Krim", short: "TOP" },
  Inhaler:      { label: "Inhaler",      short: "INH" },
  Cairan:       { label: "Cairan / Infus", short: "LIQ" },
  Suppositoria: { label: "Suppositoria", short: "SUP" },
  Drops:        { label: "Drops",        short: "DRP" },
  Patch:        { label: "Patch / Plester", short: "PCH" },
  Spray:        { label: "Spray",        short: "SPR" },
};

export const RUTE_CFG: Record<RutePemberian, { label: string; short: string }> = {
  PO:         { label: "Oral",            short: "PO" },
  IV:         { label: "Intravena",       short: "IV" },
  IM:         { label: "Intramuskular",   short: "IM" },
  SC:         { label: "Subkutan",        short: "SC" },
  Topikal:    { label: "Topikal",         short: "TOP" },
  Inhalasi:   { label: "Inhalasi",        short: "INH" },
  Rektal:     { label: "Rektal",          short: "PR" },
  Sublingual: { label: "Sublingual",      short: "SL" },
  Vaginal:    { label: "Vaginal",         short: "PV" },
  Mata:       { label: "Tetes Mata",      short: "OD" },
  Telinga:    { label: "Tetes Telinga",   short: "AS" },
};

export const SATUAN_LIST: SatuanTerkecil[] = [
  "Tablet", "Kapsul", "Botol", "Vial", "Ampul", "Sachet", "Tube", "Strip", "Pcs", "ml",
];

export const GOLONGAN_CFG: Record<
  GolonganObat,
  { label: string; short: string; bg: string; text: string; dot: string; ring: string; severity: 0 | 1 | 2 | 3 }
> = {
  Narkotika_I:      { label: "Narkotika Gol. I",     short: "N-I",   bg: "bg-rose-100",   text: "text-rose-800",   dot: "bg-rose-700",   ring: "ring-rose-300",   severity: 3 },
  Narkotika_II:     { label: "Narkotika Gol. II",    short: "N-II",  bg: "bg-rose-100",   text: "text-rose-800",   dot: "bg-rose-600",   ring: "ring-rose-300",   severity: 3 },
  Narkotika_III:    { label: "Narkotika Gol. III",   short: "N-III", bg: "bg-rose-50",    text: "text-rose-700",   dot: "bg-rose-500",   ring: "ring-rose-200",   severity: 3 },
  Psikotropika_I:   { label: "Psikotropika Gol. I",  short: "P-I",   bg: "bg-pink-100",   text: "text-pink-800",   dot: "bg-pink-700",   ring: "ring-pink-300",   severity: 3 },
  Psikotropika_II:  { label: "Psikotropika Gol. II", short: "P-II",  bg: "bg-pink-100",   text: "text-pink-800",   dot: "bg-pink-600",   ring: "ring-pink-300",   severity: 3 },
  Psikotropika_III: { label: "Psikotropika Gol. III",short: "P-III", bg: "bg-pink-50",    text: "text-pink-700",   dot: "bg-pink-500",   ring: "ring-pink-200",   severity: 2 },
  Psikotropika_IV:  { label: "Psikotropika Gol. IV", short: "P-IV",  bg: "bg-pink-50",    text: "text-pink-700",   dot: "bg-pink-400",   ring: "ring-pink-200",   severity: 2 },
  OOT:              { label: "Obat-Obat Tertentu",   short: "OOT",   bg: "bg-amber-50",   text: "text-amber-700",  dot: "bg-amber-500",  ring: "ring-amber-200",  severity: 2 },
  Keras_G:          { label: "Obat Keras (G)",       short: "G",     bg: "bg-slate-100",  text: "text-slate-700",  dot: "bg-slate-500",  ring: "ring-slate-200",  severity: 1 },
  Bebas_Terbatas:   { label: "Bebas Terbatas (P)",   short: "P",     bg: "bg-sky-50",     text: "text-sky-700",    dot: "bg-sky-500",    ring: "ring-sky-200",    severity: 1 },
  Bebas:            { label: "Obat Bebas",           short: "B",     bg: "bg-emerald-50", text: "text-emerald-700",dot: "bg-emerald-500",ring: "ring-emerald-200",severity: 0 },
};

export const STATUS_OBAT_CFG: Record<
  StatusObat,
  { label: string; bg: string; text: string; dot: string }
> = {
  Aktif:        { label: "Aktif",        bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  Non_Aktif:    { label: "Non-Aktif",    bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-500" },
  Discontinued: { label: "Discontinued", bg: "bg-rose-50",    text: "text-rose-700",    dot: "bg-rose-500" },
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
  { id: "obt-001", kode: "J01CR02", namaGenerik: "Amoxicillin-Clavulanic Acid", namaDagang: "Augmentin",   pabrik: "GSK",       kategori: "Antibiotik", bentuk: "Tablet",  kekuatan: "625 mg",      satuanTerkecil: "Tablet", rute: "PO",   isFormularium: true,  isHAM: false, golongan: "Keras_G", hargaSatuan: 8500,  het: 11000, kodeFornas: "J01CR02", bpjsCoverage: true,  batasResepPerKunjungan: 21, status: "Aktif",
    indikasi: "Infeksi saluran nafas atas/bawah, infeksi saluran kemih, infeksi kulit & jaringan lunak.",
    kontraindikasi: "Hipersensitif terhadap penisilin/sefalosporin. Riwayat jaundice akibat amoxicillin-clavulanic.",
    dosisDewasa: "1 tablet 625mg setiap 8 jam selama 5-7 hari.",
    dosisAnak: "25-45 mg/kgBB/hari dibagi 2-3 dosis.",
    efekSamping: "Diare, mual, ruam kulit, kandidiasis.",
  },
  { id: "obt-002", kode: "J01DD04", namaGenerik: "Ceftriaxone",                 namaDagang: "Cefriex",     pabrik: "Sanbe",     kategori: "Antibiotik", bentuk: "Injeksi", kekuatan: "1 g",         satuanTerkecil: "Vial",   rute: "IV",   isFormularium: true,  isHAM: false, golongan: "Keras_G", isColdChain: false, hargaSatuan: 38000, het: 45000, kodeFornas: "J01DD04", bpjsCoverage: true, status: "Aktif",
    indikasi: "Infeksi berat (sepsis, meningitis, pneumonia, infeksi intraabdomen).",
    dosisDewasa: "1-2 g IV/IM sekali sehari (atau 2× sehari pada infeksi berat).",
  },
  { id: "obt-003", kode: "J01FA10", namaGenerik: "Azithromycin",                namaDagang: "Zithromax",   pabrik: "Pfizer",    kategori: "Antibiotik", bentuk: "Tablet",  kekuatan: "500 mg",      satuanTerkecil: "Tablet", rute: "PO",   isFormularium: true,  isHAM: false, golongan: "Keras_G", hargaSatuan: 18500, kodeFornas: "J01FA10", bpjsCoverage: true, status: "Aktif" },
  { id: "obt-004", kode: "J01MA02", namaGenerik: "Ciprofloxacin",               namaDagang: "Ciproxin",    pabrik: "Bayer",     kategori: "Antibiotik", bentuk: "Tablet",  kekuatan: "500 mg",      satuanTerkecil: "Tablet", rute: "PO",   isFormularium: true,  isHAM: false, golongan: "Keras_G", hargaSatuan: 6500,  kodeFornas: "J01MA02", bpjsCoverage: true, status: "Aktif" },

  // Analgesik
  { id: "obt-010", kode: "N02BE01", namaGenerik: "Paracetamol",                 namaDagang: "Sanmol",      pabrik: "Sanbe",     kategori: "Analgesik", bentuk: "Tablet",  kekuatan: "500 mg",      satuanTerkecil: "Tablet", rute: "PO",   isFormularium: true,  isHAM: false, golongan: "Bebas",   hargaSatuan: 850,  het: 1200,  kodeFornas: "N02BE01", bpjsCoverage: true, status: "Aktif",
    indikasi: "Nyeri ringan-sedang, demam.",
    dosisDewasa: "500 mg-1 g setiap 4-6 jam (max 4 g/hari).",
    dosisAnak: "10-15 mg/kgBB setiap 4-6 jam.",
  },
  { id: "obt-011", kode: "M01AE01", namaGenerik: "Ibuprofen",                   namaDagang: "Proris",      pabrik: "Pharos",    kategori: "Analgesik", bentuk: "Tablet",  kekuatan: "400 mg",      satuanTerkecil: "Tablet", rute: "PO",   isFormularium: true,  isHAM: false, golongan: "Bebas_Terbatas", hargaSatuan: 1200, kodeFornas: "M01AE01", bpjsCoverage: true, status: "Aktif" },
  { id: "obt-012", kode: "N02AA01", namaGenerik: "Morfin Sulfat",               namaDagang: "MST",         pabrik: "Kimia Farma", kategori: "Analgesik", bentuk: "Injeksi", kekuatan: "10 mg/ml",    satuanTerkecil: "Ampul",  rute: "IV",   isFormularium: true,  isHAM: true,  golongan: "Narkotika_II", isRestricted: true, hargaSatuan: 65000, kodeFornas: "N02AA01", bpjsCoverage: true, status: "Aktif",
    indikasi: "Nyeri berat (kanker, post-operasi mayor, MI akut).",
    kontraindikasi: "Depresi nafas, asma akut, ileus paralitik, peningkatan TIK.",
    dosisDewasa: "2.5-10 mg IV/IM/SC setiap 4 jam, titrasi.",
    catatanKhusus: "WAJIB double-check 2 perawat sebelum administer. Catat di register narkotika.",
  },
  { id: "obt-013", kode: "N02AB03", namaGenerik: "Fentanil",                    namaDagang: "Durogesic",   pabrik: "Janssen",   kategori: "Analgesik", bentuk: "Injeksi", kekuatan: "50 mcg/ml",   satuanTerkecil: "Ampul",  rute: "IV",   isFormularium: true,  isHAM: true,  golongan: "Narkotika_II", isRestricted: true, hargaSatuan: 85000, kodeFornas: "N02AB03", bpjsCoverage: true, status: "Aktif" },

  // Antihipertensi
  { id: "obt-020", kode: "C09AA02", namaGenerik: "Captopril",                   namaDagang: "Capoten",     pabrik: "Indofarma", kategori: "Antihipertensi", bentuk: "Tablet", kekuatan: "25 mg",    satuanTerkecil: "Tablet", rute: "PO",   isFormularium: true, isHAM: false, golongan: "Keras_G", hargaSatuan: 750,  kodeFornas: "C09AA02", bpjsCoverage: true, status: "Aktif" },
  { id: "obt-021", kode: "C09CA01", namaGenerik: "Losartan",                    namaDagang: "Cozaar",      pabrik: "MSD",       kategori: "Antihipertensi", bentuk: "Tablet", kekuatan: "50 mg",    satuanTerkecil: "Tablet", rute: "PO",   isFormularium: true, isHAM: false, golongan: "Keras_G", hargaSatuan: 3200, kodeFornas: "C09CA01", bpjsCoverage: true, status: "Aktif" },
  { id: "obt-022", kode: "C08CA01", namaGenerik: "Amlodipine",                  namaDagang: "Norvask",     pabrik: "Pfizer",    kategori: "Antihipertensi", bentuk: "Tablet", kekuatan: "10 mg",    satuanTerkecil: "Tablet", rute: "PO",   isFormularium: true, isHAM: false, golongan: "Keras_G", hargaSatuan: 2100, kodeFornas: "C08CA01", bpjsCoverage: true, status: "Aktif" },

  // Kardiovaskular
  { id: "obt-030", kode: "B01AC06", namaGenerik: "Asam Asetilsalisilat (Aspilet)", namaDagang: "Aspilet",  pabrik: "Medifarma", kategori: "Kardiovaskular", bentuk: "Tablet", kekuatan: "80 mg",    satuanTerkecil: "Tablet", rute: "PO",   isFormularium: true, isHAM: false, golongan: "Bebas_Terbatas", hargaSatuan: 1500, kodeFornas: "B01AC06", bpjsCoverage: true, status: "Aktif" },
  { id: "obt-031", kode: "C07AB07", namaGenerik: "Bisoprolol",                  namaDagang: "Concor",      pabrik: "Merck",     kategori: "Kardiovaskular", bentuk: "Tablet", kekuatan: "5 mg",     satuanTerkecil: "Tablet", rute: "PO",   isFormularium: true, isHAM: false, golongan: "Keras_G", hargaSatuan: 4200, kodeFornas: "C07AB07", bpjsCoverage: true, status: "Aktif" },
  { id: "obt-032", kode: "B01AB05", namaGenerik: "Enoxaparin",                  namaDagang: "Lovenox",     pabrik: "Sanofi",    kategori: "Kardiovaskular", bentuk: "Injeksi", kekuatan: "60 mg/0.6ml", satuanTerkecil: "Ampul", rute: "SC", isFormularium: true, isHAM: true, isColdChain: true, golongan: "Keras_G", hargaSatuan: 145000, kodeFornas: "B01AB05", bpjsCoverage: true, status: "Aktif",
    indikasi: "Profilaksis & terapi DVT/PE, sindrom koroner akut.",
    catatanKhusus: "Simpan 2-8°C. WAJIB cek dosis berdasarkan BB & fungsi ginjal.",
  },
  { id: "obt-033", kode: "C03CA01", namaGenerik: "Furosemide",                  namaDagang: "Lasix",       pabrik: "Sanofi",    kategori: "Kardiovaskular", bentuk: "Tablet", kekuatan: "40 mg",    satuanTerkecil: "Tablet", rute: "PO",   isFormularium: true, isHAM: false, golongan: "Keras_G", hargaSatuan: 950, kodeFornas: "C03CA01", bpjsCoverage: true, status: "Aktif" },

  // Antidiabetik
  { id: "obt-040", kode: "A10BA02", namaGenerik: "Metformin",                   namaDagang: "Glucophage",  pabrik: "Merck",     kategori: "Antidiabetik", bentuk: "Tablet",  kekuatan: "500 mg",    satuanTerkecil: "Tablet", rute: "PO", isFormularium: true,  isHAM: false, golongan: "Keras_G", hargaSatuan: 1100, kodeFornas: "A10BA02", bpjsCoverage: true, status: "Aktif" },
  { id: "obt-041", kode: "A10AB01", namaGenerik: "Insulin Reguler (Actrapid)",  namaDagang: "Actrapid",    pabrik: "Novo Nordisk", kategori: "Antidiabetik", bentuk: "Injeksi", kekuatan: "100 IU/ml", satuanTerkecil: "Vial",  rute: "SC", isFormularium: true,  isHAM: true, isColdChain: true, golongan: "Keras_G", hargaSatuan: 175000, kodeFornas: "A10AB01", bpjsCoverage: true, status: "Aktif",
    catatanKhusus: "Simpan 2-8°C. HAM — double-check dosis & kecepatan drip.",
  },
  { id: "obt-042", kode: "A10AE05", namaGenerik: "Insulin Glargine",            namaDagang: "Lantus",      pabrik: "Sanofi",    kategori: "Antidiabetik", bentuk: "Injeksi", kekuatan: "100 IU/ml", satuanTerkecil: "Vial",  rute: "SC", isFormularium: false, isHAM: true, isColdChain: true, golongan: "Keras_G", hargaSatuan: 285000, bpjsCoverage: false, status: "Aktif" },

  // Saluran Cerna
  { id: "obt-050", kode: "A02BC01", namaGenerik: "Omeprazole",                  namaDagang: "Losec",       pabrik: "AstraZeneca", kategori: "Saluran_Cerna", bentuk: "Kapsul",  kekuatan: "20 mg",     satuanTerkecil: "Kapsul", rute: "PO", isFormularium: true,  isHAM: false, golongan: "Keras_G", hargaSatuan: 1850, kodeFornas: "A02BC01", bpjsCoverage: true, status: "Aktif" },
  { id: "obt-051", kode: "A03FA01", namaGenerik: "Metoclopramide",              namaDagang: "Primperan",   pabrik: "Sanofi",    kategori: "Saluran_Cerna", bentuk: "Tablet",  kekuatan: "10 mg",     satuanTerkecil: "Tablet", rute: "PO", isFormularium: true,  isHAM: false, golongan: "Keras_G", hargaSatuan: 1450, kodeFornas: "A03FA01", bpjsCoverage: true, status: "Aktif" },
  { id: "obt-052", kode: "A04AA01", namaGenerik: "Ondansetron",                 namaDagang: "Zofran",      pabrik: "Novartis",  kategori: "Saluran_Cerna", bentuk: "Injeksi", kekuatan: "4 mg/2ml",  satuanTerkecil: "Ampul",  rute: "IV", isFormularium: true,  isHAM: false, golongan: "Keras_G", hargaSatuan: 9500, kodeFornas: "A04AA01", bpjsCoverage: true, status: "Aktif" },

  // Saluran Nafas
  { id: "obt-060", kode: "R03AC02", namaGenerik: "Salbutamol",                  namaDagang: "Ventolin",    pabrik: "GSK",       kategori: "Saluran_Nafas", bentuk: "Inhaler", kekuatan: "100 mcg/dosis", satuanTerkecil: "Pcs", rute: "Inhalasi", isFormularium: true, isHAM: false, golongan: "Keras_G", hargaSatuan: 55000, kodeFornas: "R03AC02", bpjsCoverage: true, status: "Aktif" },
  { id: "obt-061", kode: "R03BB04", namaGenerik: "Ipratropium Bromide",         namaDagang: "Atrovent",    pabrik: "Boehringer Ingelheim", kategori: "Saluran_Nafas", bentuk: "Cairan", kekuatan: "250 mcg/ml", satuanTerkecil: "Botol", rute: "Inhalasi", isFormularium: true, isHAM: false, golongan: "Keras_G", hargaSatuan: 28500, kodeFornas: "R03BB04", bpjsCoverage: true, status: "Aktif" },

  // Neurologi
  { id: "obt-070", kode: "N03AB02", namaGenerik: "Fenitoin",                    namaDagang: "Dilantin",    pabrik: "Pfizer",    kategori: "Neurologi", bentuk: "Tablet",  kekuatan: "100 mg",        satuanTerkecil: "Tablet", rute: "PO", isFormularium: true,  isHAM: false, golongan: "Keras_G", hargaSatuan: 2150, kodeFornas: "N03AB02", bpjsCoverage: true, status: "Aktif" },
  { id: "obt-071", kode: "N03AE01", namaGenerik: "Diazepam",                    namaDagang: "Valium",      pabrik: "Roche",     kategori: "Neurologi", bentuk: "Injeksi", kekuatan: "10 mg/2ml",     satuanTerkecil: "Ampul",  rute: "IV", isFormularium: true,  isHAM: true, isRestricted: true, golongan: "Psikotropika_IV", hargaSatuan: 12500, kodeFornas: "N03AE01", bpjsCoverage: true, status: "Aktif",
    catatanKhusus: "Psikotropika — catat di register. Sediakan resusitasi karena risiko depresi nafas.",
  },

  // Vitamin & Cairan
  { id: "obt-080", kode: "B05BB01", namaGenerik: "NaCl 0.9%",                   namaDagang: "Otsuka NaCl", pabrik: "Otsuka",    kategori: "Vitamin_Cairan", bentuk: "Cairan", kekuatan: "500 ml",      satuanTerkecil: "Botol", rute: "IV", isFormularium: true, isHAM: false, golongan: "Bebas", hargaSatuan: 15000, kodeFornas: "B05BB01", bpjsCoverage: true, status: "Aktif" },
  { id: "obt-081", kode: "B05BA03", namaGenerik: "Ringer Laktat",               namaDagang: "Otsuka RL",   pabrik: "Otsuka",    kategori: "Vitamin_Cairan", bentuk: "Cairan", kekuatan: "500 ml",      satuanTerkecil: "Botol", rute: "IV", isFormularium: true, isHAM: false, golongan: "Bebas", hargaSatuan: 16500, kodeFornas: "B05BA03", bpjsCoverage: true, status: "Aktif" },
  { id: "obt-082", kode: "A11GA01", namaGenerik: "Vitamin C",                   namaDagang: "Cernevit",    pabrik: "Baxter",    kategori: "Vitamin_Cairan", bentuk: "Tablet", kekuatan: "500 mg",      satuanTerkecil: "Tablet", rute: "PO", isFormularium: false, isHAM: false, golongan: "Bebas", hargaSatuan: 850, bpjsCoverage: false, status: "Aktif" },
];

// Patch LASA pairs after array constructed (avoid forward-ref issues)
const LASA_PATCHES: Array<[string, string[]]> = [
  ["obt-041", ["obt-042"]], // Actrapid ↔ Lantus
  ["obt-042", ["obt-041"]],
  ["obt-012", ["obt-013"]], // Morfin ↔ Fentanil
  ["obt-013", ["obt-012"]],
];
for (const [id, pairs] of LASA_PATCHES) {
  const target = OBAT_MOCK.find((o) => o.id === id);
  if (target) {
    target.isLASA = true;
    target.lasaPairIds = pairs;
  }
}

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

export function newObatId(): string {
  return `obt-${Math.random().toString(36).slice(2, 8)}`;
}

export function emptyObatRecord(): ObatRecord {
  return {
    id: newObatId(),
    kode: "",
    namaGenerik: "",
    namaDagang: "",
    kategori: "Lainnya",
    bentuk: "Tablet",
    kekuatan: "",
    isFormularium: false,
    isHAM: false,
    hargaSatuan: 0,
    status: "Aktif",
  };
}
