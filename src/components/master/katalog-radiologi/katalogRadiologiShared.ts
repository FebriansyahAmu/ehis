/**
 * UI helpers + tab registry untuk halaman master Katalog Radiologi.
 * Data source-of-truth: `@/lib/master/radCatalogMock.ts`.
 * Standard: PMK 1014/2008 · PMK 24/2020 · BAPETEN No. 2/2018 · IAEA HH-19 · ACR
 */

import {
  IdCard, ShieldAlert, FileText,
  Radiation, Scan, Activity, Sparkles, Zap, RadioTower, Bone, Atom,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type {
  RadCatalogRecord, RadModalitas, RadRegion, RadJenisKontras, RadStatus,
} from "@/lib/master/radCatalogMock";

// ── Tab Registry ─────────────────────────────────────────

export type RadTabKey = "identitas" | "persiapan" | "template";

export interface RadTabConfig {
  key: RadTabKey;
  label: string;
  icon: LucideIcon;
  desc: string;
  accent: { bg: string; text: string; ring: string };
}

export const RAD_TABS: RadTabConfig[] = [
  {
    key: "identitas",
    label: "Identitas",
    icon: IdCard,
    desc: "Kode, modalitas, region, TAT",
    accent: { bg: "bg-rose-50", text: "text-rose-700", ring: "ring-rose-200" },
  },
  {
    key: "persiapan",
    label: "Persiapan & DRL",
    icon: ShieldAlert,
    desc: "Protap, kontras, Diagnostic Reference Level",
    accent: { bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-200" },
  },
  {
    key: "template",
    label: "Reporting Template",
    icon: FileText,
    desc: "Struktur laporan terstandar per pemeriksaan",
    accent: { bg: "bg-sky-50", text: "text-sky-700", ring: "ring-sky-200" },
  },
];

// ── Modalitas Config (method FHIR SatuSehat — urutan + icon + warna chip) ──────

export const MODALITAS_ORDER: RadModalitas[] = ["XR", "CT", "MR", "RF", "US", "MG", "DXA", "NM"];

/** Label lengkap method (untuk dropdown/tooltip). */
export const MODALITAS_LABEL: Record<RadModalitas, string> = {
  XR:  "Radiografi (X-Ray)",
  CT:  "CT Scan",
  MR:  "MRI",
  RF:  "Radiofluoroskopi",
  US:  "Ultrasonografi (USG)",
  MG:  "Mammografi",
  DXA: "Densitometri (DXA)",
  NM:  "Kedokteran Nuklir",
};

export const MODALITAS_CFG: Record<RadModalitas, {
  short: string; icon: LucideIcon; bg: string; text: string; dot: string;
}> = {
  XR:  { short: "XR",  icon: Radiation,  bg: "bg-slate-100",  text: "text-slate-700",  dot: "bg-slate-500"  },
  CT:  { short: "CT",  icon: Scan,       bg: "bg-rose-50",    text: "text-rose-700",   dot: "bg-rose-500"   },
  MR:  { short: "MR",  icon: Sparkles,   bg: "bg-violet-50",  text: "text-violet-700", dot: "bg-violet-500" },
  RF:  { short: "RF",  icon: Zap,        bg: "bg-amber-50",   text: "text-amber-700",  dot: "bg-amber-500"  },
  US:  { short: "US",  icon: Activity,   bg: "bg-emerald-50", text: "text-emerald-700",dot: "bg-emerald-500"},
  MG:  { short: "MG",  icon: RadioTower, bg: "bg-pink-50",    text: "text-pink-700",   dot: "bg-pink-500"   },
  DXA: { short: "DXA", icon: Bone,       bg: "bg-teal-50",    text: "text-teal-700",   dot: "bg-teal-500"   },
  NM:  { short: "NM",  icon: Atom,       bg: "bg-indigo-50",  text: "text-indigo-700", dot: "bg-indigo-500" },
};

/** Subtype method FHIR per modalitas (opsional di form). */
export const MODALITAS_SUBTYPE: Record<RadModalitas, string[]> = {
  XR:  ["XR.tomography", "XR.portable", "XR.slot radiography"],
  CT:  ["CT.angio", "CT.scanogram", "CT.densitometry", "CT.perfusion", "CT.portable", "CT.cone beam"],
  MR:  ["MR.angio", "MR.functional", "MR.spectroscopy", "MR.perfusion", "MR.tractography"],
  RF:  ["RF.angio", "RF.video", "RF.portable"],
  US:  ["US.densitometry", "US.Doppler", "US.portable", "US.A-scan", "US.elastography"],
  MG:  ["MG.tomosynthesis", "MG.stereotactic"],
  DXA: ["DXA.densitometry"],
  NM:  ["NM.dosimetry", "NM.SPECT", "NM.SPECT+CT"],
};

// ── Region ─────────────────────────────────────────────

export const REGION_LABEL: Record<RadRegion, string> = {
  Kepala_Leher:      "Kepala & Leher",
  Thorax:            "Thorax",
  Abdomen:           "Abdomen",
  Pelvis:            "Pelvis",
  Ekstremitas_Atas:  "Ekstremitas Atas",
  Ekstremitas_Bawah: "Ekstremitas Bawah",
  Tulang_Belakang:   "Tulang Belakang",
  Mammae:            "Mammae",
  Ginekologi:        "Ginekologi",
  Vaskular:          "Vaskular",
  Whole_Body:        "Whole Body",
  Lainnya:           "Lainnya",
};

export const REGION_ORDER: RadRegion[] = [
  "Kepala_Leher", "Thorax", "Abdomen", "Pelvis",
  "Ekstremitas_Atas", "Ekstremitas_Bawah", "Tulang_Belakang",
  "Mammae", "Ginekologi", "Vaskular", "Whole_Body", "Lainnya",
];

// ── Kontras ────────────────────────────────────────────

export const KONTRAS_LABEL: Record<RadJenisKontras, string> = {
  Tanpa:        "Tanpa Kontras",
  IV_Iodinasi:  "IV Iodinasi",
  Oral:         "Oral",
  Rektal:       "Rektal",
  Gadolinium:   "Gadolinium",
  Kombinasi:    "Kombinasi (IV + Oral)",
};

export const KONTRAS_ORDER: RadJenisKontras[] = [
  "Tanpa", "IV_Iodinasi", "Oral", "Rektal", "Gadolinium", "Kombinasi",
];

// ── Status ─────────────────────────────────────────────

export function getRadStatusCfg(status: RadStatus) {
  if (status === "Non_Aktif") {
    return { label: "Non-Aktif", bg: "bg-slate-100", text: "text-slate-500", dot: "bg-slate-400" };
  }
  return { label: "Aktif", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" };
}

// ── Validators ─────────────────────────────────────────

export function isRadCatalogValid(item: RadCatalogRecord, isNew = false): boolean {
  // Kode auto-gen server → tak wajib di klien. Cukup nama + estimasi valid.
  if (isNew) return !!item.nama.trim();
  return !!(item.nama.trim() && item.estimasiWaktuMenit > 0);
}

export function hasDRLConfig(item: RadCatalogRecord): boolean {
  const d = item.drlReferensi;
  if (!d) return false;
  return [d.ctdiVol, d.dlp, d.dap, d.waktuFluoroMenit, d.entranceDose].some((v) => v !== undefined && v !== null);
}

export function usesKontras(item: RadCatalogRecord): boolean {
  return item.kontras.jenis !== "Tanpa";
}

// ── UI Helpers ─────────────────────────────────────────

export function radItemInitials(item: RadCatalogRecord): string {
  const parts = (item.nama || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function fmtTatRange(item: RadCatalogRecord): string {
  const { cito, semiCito, rutin } = item.tatTargetMenit;
  return `${cito}/${semiCito}/${rutin} mnt`;
}

/** Apakah DRL applicable — hanya modalitas berdosis radiasi pengion (US & MR non-ionizing). */
export function isDRLApplicable(modalitas: RadModalitas): boolean {
  return ["XR", "CT", "RF", "MG", "DXA", "NM"].includes(modalitas);
}
