/**
 * GrouperTab shared — helpers, mock breakdown, margin calc, style tokens.
 */

import type { Rupiah, TingkatKompetensiRS, KelasRawat, InaCbgLegacyResult } from "@/lib/eklaim/eklaimShared";
export { formatRupiah } from "@/lib/eklaim/money";

// ── Cost Breakdown ─────────────────────────────────────

export type KategoriBreakdown =
  | "Akomodasi"
  | "Tindakan"
  | "Laboratorium"
  | "Radiologi"
  | "Obat & BHP"
  | "Jasa Dokter";

export interface BreakdownItem {
  kategori: KategoriBreakdown;
  tarifRS: Rupiah;
  colorClass: string;
  bgLight: string;
}

/** Distribusi proporsional biaya RS — aproximasi pola umum BPJS RI */
const SPLITS: ReadonlyArray<[KategoriBreakdown, number, string, string]> = [
  ["Akomodasi",    0.25, "bg-teal-500",    "bg-teal-50"],
  ["Tindakan",     0.20, "bg-sky-500",     "bg-sky-50"],
  ["Laboratorium", 0.15, "bg-emerald-500", "bg-emerald-50"],
  ["Radiologi",    0.10, "bg-amber-500",   "bg-amber-50"],
  ["Obat & BHP",   0.20, "bg-rose-400",    "bg-rose-50"],
  ["Jasa Dokter",  0.10, "bg-slate-400",   "bg-slate-50"],
];

export function mockBreakdown(tarifRS: Rupiah): BreakdownItem[] {
  return SPLITS.map(([kategori, ratio, colorClass, bgLight]) => ({
    kategori,
    tarifRS: BigInt(Math.round(Number(tarifRS) * ratio)),
    colorClass,
    bgLight,
  }));
}

// ── Margin ─────────────────────────────────────────────

export interface MarginInfo {
  /** Positif = RS untung (iDRG > tarifRS), negatif = RS rugi */
  selisih: Rupiah;
  persen: number;
  untung: boolean;
}

export function computeMargin(tarifRS: Rupiah, tarifIDRG: Rupiah): MarginInfo {
  const selisih = tarifIDRG - tarifRS;
  const persen =
    tarifRS === 0n
      ? 0
      : Math.abs(Math.round((Number(selisih) / Number(tarifRS)) * 1000) / 10);
  return { selisih, persen, untung: selisih >= 0n };
}

// ── Severity Style Tokens ──────────────────────────────

export const SEVERITY_STYLE = {
  1: {
    bg: "bg-emerald-100",
    border: "border-emerald-200",
    text: "text-emerald-800",
    ring: "ring-emerald-300",
    dot: "bg-emerald-500",
    badge: "bg-emerald-600",
  },
  2: {
    bg: "bg-amber-100",
    border: "border-amber-200",
    text: "text-amber-800",
    ring: "ring-amber-300",
    dot: "bg-amber-500",
    badge: "bg-amber-600",
  },
  3: {
    bg: "bg-rose-100",
    border: "border-rose-200",
    text: "text-rose-800",
    ring: "ring-rose-300",
    dot: "bg-rose-500",
    badge: "bg-rose-600",
  },
} as const;

// ── Tingkat RS Labels ──────────────────────────────────

export const TINGKAT_LABEL: Record<TingkatKompetensiRS, string> = {
  dasar:        "Dasar",
  menengah:     "Menengah",
  utama:        "Utama",
  komprehensif: "Komprehensif",
};

export const TINGKAT_ORDER: ReadonlyArray<TingkatKompetensiRS> = [
  "dasar",
  "menengah",
  "utama",
  "komprehensif",
];

// ── INA-CBG Tarif Helper ───────────────────────────────

/** Pilih tarif INA-CBG yang relevan berdasarkan kelas rawat pasien. */
export function getInaCbgTarifForKelas(
  tarif: InaCbgLegacyResult["tarif"],
  kelas: KelasRawat,
): bigint {
  if (kelas === "Kelas_3") return tarif.kelas3;
  if (kelas === "Kelas_2") return tarif.kelas2;
  if (kelas === "VIP") return tarif.vip;
  return tarif.kelas1; // KRIS, Kelas_1, ICU, HCU, Isolasi → kelas1
}

/** Label tarif INA-CBG berdasarkan kelas rawat. */
export function kelasTarifLabel(kelas: KelasRawat): string {
  if (kelas === "Kelas_3") return "Kelas III";
  if (kelas === "Kelas_2") return "Kelas II";
  if (kelas === "Kelas_1") return "Kelas I";
  if (kelas === "KRIS") return "Kelas I (KRIS)";
  if (kelas === "VIP") return "VIP";
  return `${kelas} → Kelas I`;
}
