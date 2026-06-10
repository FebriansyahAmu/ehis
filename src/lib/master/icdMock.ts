/**
 * Master ICD-10 & ICD-9-CM — tipe & helper UI.
 *
 * Data REAL berasal dari backend (`master.IcdCode`, di-seed via Import unduhan
 * SatuSehat Kemenkes). Mock data sengaja DIKOSONGKAN — katalog ICD terlalu besar
 * (ICD-10 ±15.000+ kode) untuk di-hardcode; lihat `lib/api/icd.ts` + endpoint
 * `/api/v1/master/icd`. File ini hanya menyimpan kontrak tipe & helper presentasi
 * yang dipakai komponen `components/master/icd/*`.
 *
 * Standar: ICD-10 / ICD-9-CM (CodeSystem SatuSehat) · inti = CODE · DISPLAY · VERSION.
 */

// ── Types ────────────────────────────────────────────────

export type IcdJenis = "ICD-10" | "ICD-9";

export type IcdStatus = "Aktif" | "Non_Aktif";

export interface IcdItem {
  id: string;
  jenis: IcdJenis;
  // ── 3 inti (sumber: unduhan SatuSehat Kemenkes) ──
  kode: string;          // CODE   — kode ICD (A09, I21.0, 89.52)
  nama: string;          // DISPLAY — teks tampilan resmi dari SatuSehat
  version: string;       // VERSION — versi CodeSystem (mis. "2010")
  // ── atribut tambahan (opsional, untuk pengkayaan lokal) ──
  namaInggris?: string;  // nama alternatif (mis. terjemahan)
  chapter?: string;      // chapter/group label (mis. "IX. Sirkulasi") — opsional
  blok?: string;         // sub-blok dalam chapter
  inaCbg?: string;       // INA-CBG group code (untuk ICD-10)
  status: IcdStatus;
}

// Versi default CodeSystem SatuSehat per jenis (dipakai factory + fallback import bila
// kolom VERSION kosong; data impor membawa versi asli dari kolom VERSION).
export const DEFAULT_ICD_VERSION: Record<IcdJenis, string> = {
  "ICD-10": "2010",
  "ICD-9": "2010",
};

export const defaultIcdVersion = (jenis: IcdJenis): string => DEFAULT_ICD_VERSION[jenis];

// ── Empty factory ────────────────────────────────────────

export function emptyIcdItem(jenis: IcdJenis = "ICD-10"): IcdItem {
  return {
    id: `icd-${Date.now().toString(36)}`,
    jenis,
    kode: "",
    nama: "",
    version: defaultIcdVersion(jenis),
    namaInggris: "",
    chapter: "",
    blok: "",
    inaCbg: "",
    status: "Aktif",
  };
}

// Katalog ICD = backend-backed; tak ada seed mock. Komponen yang masih memakai
// `initial` pakai array kosong sampai di-wire ke API (lihat lib/api/icd.ts).
export const ICD_MOCK: IcdItem[] = [];

// ── Validators ───────────────────────────────────────────

export function isIcdValid(item: IcdItem, isNew = false): boolean {
  if (isNew) return !!item.nama.trim();
  // Inti wajib = CODE · DISPLAY · VERSION. Atribut lain (chapter dst.) opsional.
  return !!(item.kode.trim() && item.nama.trim() && item.version.trim());
}

// ── UI helpers ───────────────────────────────────────────

export function icdInitials(item: IcdItem): string {
  return item.kode.replace(/[^A-Za-z0-9]/g, "").slice(0, 4).toUpperCase() || "??";
}

export function getIcdStatusCfg(status: IcdStatus) {
  if (status === "Non_Aktif") {
    return { label: "Non-Aktif", bg: "bg-slate-100", text: "text-slate-500", dot: "bg-slate-400" };
  }
  return { label: "Aktif", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" };
}

/** Daftar chapter unik per jenis (untuk filter dropdown). */
export function getChaptersByJenis(items: IcdItem[], jenis: IcdJenis): string[] {
  const set = new Set<string>();
  items.forEach((i) => { if (i.jenis === jenis && i.chapter) set.add(i.chapter); });
  return Array.from(set).sort();
}
