/**
 * Master Katalog Keperawatan — TIPE + helper UI (data sudah di DB `master.sdki`).
 *
 * Data otoritatif pindah ke DB (di-seed dari `@/lib/master/sdkiSeed.ts`). Halaman
 * master baca via API (`@/lib/api/master/sdki`) — lihat KatalogKeperawatanPage.
 * File ini hanya menyimpan TIPE FE + factory + helper tampilan (zero-refactor: DTO
 * server mirror `SdkiItem`).
 *
 * Standar: PPNI SDKI (2017) · SLKI (2018) · SIKI (2018) edisi 1.
 */

// ── Types ────────────────────────────────────────────────

export type SdkiKategori =
  | "Fisiologis"
  | "Psikologis"
  | "Perilaku"
  | "Relasional"
  | "Lingkungan";

export type SdkiJenis = "Aktual" | "Risiko" | "Promosi_Kesehatan";

export type SdkiStatus = "Aktif" | "Non_Aktif";

export interface SdkiData {
  subjektif: string[];
  objektif: string[];
}

export interface SdkiIntervensi {
  observasi:  string[];
  terapeutik: string[];
  edukasi:    string[];
  kolaborasi: string[];
}

export interface SdkiItem {
  id: string;
  kode: string;           // D.NNNN — auto-gen server (kosong utk draft baru)
  nama: string;
  kategori: SdkiKategori;
  subKategori: string;    // mis. "Respirasi", "Sirkulasi", "Nutrisi/Cairan"
  jenis: SdkiJenis;
  penyebabUmum: string;
  faktorResiko?: string;  // untuk jenis "Risiko"
  dataMayor: SdkiData;
  dataMinor: SdkiData;
  kriteriaHasil: string[]; // SLKI
  intervensi: SdkiIntervensi; // SIKI
  status: SdkiStatus;
}

// ── Empty factory ────────────────────────────────────────

export function emptySdkiItem(): SdkiItem {
  return {
    id: `sdki-${Date.now().toString(36)}`,
    kode: "", // auto-gen `D.NNNN` di server saat simpan
    nama: "",
    kategori: "Fisiologis",
    subKategori: "",
    jenis: "Aktual",
    penyebabUmum: "",
    dataMayor: { subjektif: [], objektif: [] },
    dataMinor: { subjektif: [], objektif: [] },
    kriteriaHasil: [],
    intervensi: { observasi: [], terapeutik: [], edukasi: [], kolaborasi: [] },
    status: "Aktif",
  };
}

// ── Validators ───────────────────────────────────────────

// Kode TIDAK divalidasi di sini — di-generate server (D.NNNN). Wajib: nama + kategori,
// dan minimal 1 kriteria hasil (SLKI) untuk entri yang sudah tersimpan.
export function isSdkiValid(item: SdkiItem, isNew = false): boolean {
  if (isNew) return !!item.nama.trim();
  return !!(item.nama.trim() && item.kategori && item.kriteriaHasil.length > 0);
}

// ── UI helpers ───────────────────────────────────────────

export function sdkiInitials(item: SdkiItem): string {
  return item.kode.replace(/[^A-Za-z0-9]/g, "").slice(0, 4).toUpperCase() || "??";
}

export function getSdkiStatusCfg(status: SdkiStatus) {
  if (status === "Non_Aktif") {
    return { label: "Non-Aktif", bg: "bg-slate-100", text: "text-slate-500", dot: "bg-slate-400" };
  }
  return { label: "Aktif", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" };
}

export function countSdkiIntervensi(item: SdkiItem): number {
  return (
    item.intervensi.observasi.length +
    item.intervensi.terapeutik.length +
    item.intervensi.edukasi.length +
    item.intervensi.kolaborasi.length
  );
}
