/**
 * Katalog BMHP / BHP (Tier 2 Master) — TIPE + CONFIG (bukan data).
 *
 * BMHP = Bahan Medis Habis Pakai (⊇ BHP). Katalog TERPISAH dari Obat — beda field set,
 * konsumen, dan regulasi (lihat docs/BACKEND-MASTER-KATALOG-BMHP.md §0). Mirror struktur
 * `obatMock.ts`: tipe (`BmhpRecord` + union enum), config map (kategori/satuan/kelas-risiko/
 * status), dan helper murni. Data BMHP kini di DB `master.bmhp` (diakses via
 * `@/lib/api/master/bmhp`); seed awal di `@/lib/master/bmhpSeed.ts`.
 *
 * `BmhpDTO` (response API) = `BmhpRecord` → zero-refactor saat wiring.
 */

// ── Enum / Union Types ────────────────────────────────────

export type BmhpKategori =
  | "Alat Suntik & Infus"
  | "Sarung Tangan"
  | "Kasa & Pembalut"
  | "Kateter & Selang"
  | "Jarum & Benang Bedah"
  | "Antiseptik & Desinfektan"
  | "APD"
  | "Alat Diagnostik Habis Pakai"
  | "Lainnya";

export type BmhpSatuan =
  | "Pcs" | "Set" | "Box" | "Pasang" | "Rol" | "Lembar"
  | "Vial" | "Sachet" | "Ampul" | "Botol";

/** Kelas risiko alkes menurut Permenkes 62/2017 (A=risiko rendah … D=risiko tinggi). */
export type KelasRisiko = "A" | "B" | "C" | "D";

export type StatusBmhp = "Aktif" | "Non_Aktif" | "Discontinued";

// ── Master Record ────────────────────────────────────────

export interface BmhpRecord {
  // ── Tab 1: Identitas ────────────────────────────────
  id: string;
  /** Kode internal RS — auto BHP-<YYMM><NNN> (di-set server, immutable) */
  kode: string;
  /** Nama barang, mis "Spuit 3 cc", "Kasa Steril 16x16" */
  nama: string;
  /** Merek / nama dagang */
  merek?: string;
  /** Pabrik / produsen / distributor */
  pabrik?: string;
  kategori: BmhpKategori;
  /** Ukuran / size, mis "3 cc", "No. 7", "Fr 16", "16x16 cm" */
  ukuran?: string;
  satuan: BmhpSatuan;
  /** Isi per kemasan (box/pak), opsional */
  isiPerKemasan?: number;

  // ── Tab 2: Klasifikasi ──────────────────────────────
  /** Steril (perlu penanganan aseptik) */
  isSteril: boolean;
  /** Sekali pakai (single-use, tidak boleh di-reuse) */
  isSingleUse: boolean;
  /** Implan — butuh tracking serial/UDI per-unit (di luar katalog) */
  isImplan: boolean;
  /** Kelas risiko alkes (A–D) */
  kelasRisiko?: KelasRisiko;
  /** Masuk formularium / e-katalog RS */
  isFormularium: boolean;

  // ── Regulasi ────────────────────────────────────────
  /** No. Izin Edar — AKL (dalam negeri) / AKD (impor) */
  nomorIzinEdar?: string;
  /** Kode e-Katalog LKPP */
  kodeEKatalog?: string;

  // ── Tab 3: Harga & Coverage ─────────────────────────
  /** Harga jual ke pasien per satuan */
  hargaSatuan: number;
  /** Harga pokok penjualan (margin internal) */
  hpp?: number;
  /** Harga eceran tertinggi */
  het?: number;
  /** Tertanggung BPJS (umumnya include paket INA-CBG) */
  bpjsCoverage?: boolean;

  // ── Meta ────────────────────────────────────────────
  catatan?: string;
  status?: StatusBmhp;
}

// ── Config Maps ──────────────────────────────────────────

export const BMHP_KATEGORI_CFG: Record<
  BmhpKategori,
  { label: string; short: string; bg: string; text: string; dot: string }
> = {
  "Alat Suntik & Infus":         { label: "Alat Suntik & Infus",      short: "Injeksi", bg: "bg-sky-50",     text: "text-sky-700",     dot: "bg-sky-500" },
  "Sarung Tangan":               { label: "Sarung Tangan",            short: "Glove",   bg: "bg-violet-50",  text: "text-violet-700",  dot: "bg-violet-500" },
  "Kasa & Pembalut":             { label: "Kasa & Pembalut",          short: "Kasa",    bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-500" },
  "Kateter & Selang":            { label: "Kateter & Selang",         short: "Kateter", bg: "bg-teal-50",    text: "text-teal-700",    dot: "bg-teal-500" },
  "Jarum & Benang Bedah":        { label: "Jarum & Benang Bedah",     short: "Bedah",   bg: "bg-rose-50",    text: "text-rose-700",    dot: "bg-rose-500" },
  "Antiseptik & Desinfektan":    { label: "Antiseptik & Desinfektan", short: "Antisep", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  "APD":                         { label: "APD",                      short: "APD",     bg: "bg-cyan-50",    text: "text-cyan-700",    dot: "bg-cyan-500" },
  "Alat Diagnostik Habis Pakai": { label: "Diagnostik Habis Pakai",   short: "Diag",    bg: "bg-indigo-50",  text: "text-indigo-700",  dot: "bg-indigo-500" },
  "Lainnya":                     { label: "Lainnya",                  short: "Etc",     bg: "bg-slate-100",  text: "text-slate-600",   dot: "bg-slate-400" },
};

export const KATEGORI_BMHP_ORDER: BmhpKategori[] = [
  "Alat Suntik & Infus",
  "Sarung Tangan",
  "Kasa & Pembalut",
  "Kateter & Selang",
  "Jarum & Benang Bedah",
  "Antiseptik & Desinfektan",
  "APD",
  "Alat Diagnostik Habis Pakai",
  "Lainnya",
];

export const SATUAN_BMHP_LIST: BmhpSatuan[] = [
  "Pcs", "Set", "Box", "Pasang", "Rol", "Lembar", "Vial", "Sachet", "Ampul", "Botol",
];

export const KELAS_RISIKO_CFG: Record<
  KelasRisiko,
  { label: string; desc: string; bg: string; text: string; severity: 0 | 1 | 2 | 3 }
> = {
  A: { label: "Kelas A", desc: "Risiko rendah (mis. kasa, plester, sarung tangan non-steril)",            bg: "bg-emerald-50", text: "text-emerald-700", severity: 0 },
  B: { label: "Kelas B", desc: "Risiko rendah–sedang (mis. spuit, kateter urin, jarum)",                  bg: "bg-sky-50",     text: "text-sky-700",     severity: 1 },
  C: { label: "Kelas C", desc: "Risiko sedang–tinggi (mis. IV catheter, blood set, kontak darah)",        bg: "bg-amber-50",   text: "text-amber-700",   severity: 2 },
  D: { label: "Kelas D", desc: "Risiko tinggi (mis. implan, alat penopang hidup) — tracking ketat",       bg: "bg-rose-50",    text: "text-rose-700",    severity: 3 },
};

export const STATUS_BMHP_CFG: Record<
  StatusBmhp,
  { label: string; bg: string; text: string; dot: string }
> = {
  Aktif:        { label: "Aktif",        bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  Non_Aktif:    { label: "Non-Aktif",    bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-500" },
  Discontinued: { label: "Discontinued", bg: "bg-rose-50",    text: "text-rose-700",    dot: "bg-rose-500" },
};

// ── Helpers ───────────────────────────────────────────────

export function groupBmhpByKategori(items: BmhpRecord[]): Map<BmhpKategori, BmhpRecord[]> {
  const map = new Map<BmhpKategori, BmhpRecord[]>();
  for (const cat of KATEGORI_BMHP_ORDER) map.set(cat, []);
  for (const b of items) {
    const arr = map.get(b.kategori) ?? [];
    arr.push(b);
    map.set(b.kategori, arr);
  }
  return map;
}

export function newBmhpId(): string {
  return `bhp-${Math.random().toString(36).slice(2, 8)}`;
}

export function emptyBmhpRecord(): BmhpRecord {
  return {
    id: newBmhpId(),
    kode: "",
    nama: "",
    kategori: "Lainnya",
    satuan: "Pcs",
    isSteril: false,
    isSingleUse: true,
    isImplan: false,
    isFormularium: false,
    hargaSatuan: 0,
    status: "Aktif",
  };
}
