/**
 * Katalog Obat (Tier 2 Master) — TIPE + CONFIG (bukan data).
 *
 * Data obat kini di DB `master.obat` (diakses via `@/lib/api/master/obat`); seed
 * awalnya di `@/lib/master/obatSeed.ts`. File ini hanya menyimpan tipe (`ObatRecord`,
 * `KfaMapping`, union enum), config map (kategori/bentuk/rute/golongan), dan helper
 * murni (`groupObatByKategori`, `emptyObatRecord`) yang dikonsumsi UI form + tabel.
 *
 * `ObatDTO` (response API) = `ObatRecord` → zero-refactor saat wiring.
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

// ── KFA Mapping (SatuSehat / FHIR) ───────────────────────

/** Satu baris zat aktif termapping (BZA + dosis). */
export interface KfaMappedIngredient {
  /** Kode BZA (KFA 91xxxxxx) */
  kode: string;
  /** Display nama zat aktif */
  display: string;
  /** Dosis / kekuatan numerik per satuan */
  dosis?: number;
  /** Satuan KFA / UCUM (mis. "mg", "mcg", "IU") */
  satuan?: string;
  /** Dosis per satuan, mis "500 mg / 1 tablet" */
  dosisPerSatuan?: string;
}

/**
 * Pemetaan obat RS → KFA (Kamus Farmasi & Alkes Kemenkes) untuk
 * interoperabilitas FHIR SatuSehat (resource `Medication`). Opsional —
 * obat tetap valid tanpa mapping; mapping menyiapkan data kirim ke SatuSehat.
 */
export interface KfaMapping {
  // ── Grup 1: Produk ──
  /** Produk Obat/Barang Aktual (POA) — kfa_code produk ber-NIE */
  poaKode?: string;
  poaNama?: string;
  /** Nomor Izin Edar BPOM (NIE) */
  nie?: string;
  /** Produk Obat/Barang Virtual (POV) — template 92xxxxxx */
  povKode?: string;
  povNama?: string;
  /** Rute pemberian (KFA) */
  ruteKode?: string;
  ruteNama?: string;
  /** Bentuk sediaan (KFA dosage_form) */
  bentukKode?: string;
  bentukNama?: string;
  // ── Grup 2: Zat Aktif & Dosis (BZA) ──
  zatAktif: KfaMappedIngredient[];
  // ── Meta ──
  /** Sumber pemetaan: dari pencarian KFA atau input manual */
  sumber?: "KFA_API" | "Manual";
  /** ISO timestamp pemetaan terakhir */
  mappedAt?: string;
}

export function emptyKfaMapping(): KfaMapping {
  return { zatAktif: [], sumber: "Manual" };
}

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

  // ── Tab 5: Mapping KFA (SatuSehat / FHIR) ───────────
  /** Pemetaan ke Kamus Farmasi & Alkes untuk interoperabilitas FHIR SatuSehat */
  kfa?: KfaMapping;

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

/** Urutan rute klinis preferred (Oral dulu). Dipakai untuk dropdown form. */
export const RUTE_ORDER: RutePemberian[] = [
  "PO", "IV", "IM", "SC", "Sublingual", "Topikal", "Inhalasi", "Rektal",
  "Vaginal", "Mata", "Telinga",
];

/**
 * Label rute siap-pakai untuk dropdown form `<option>`. Single source of
 * truth — dipakai oleh asesmenShared.RUTE_OBAT.
 */
export const RUTE_LABELS: string[] = RUTE_ORDER.map((r) => RUTE_CFG[r].label);

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
