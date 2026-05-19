/**
 * UI helpers + tab registry untuk halaman master Katalog Laboratorium.
 * Data source-of-truth ada di `@/lib/master/labCatalogMock.ts`.
 */

import { FlaskConical, Target, AlertTriangle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { LabKatalogItem } from "@/lib/master/labCatalogMock";
import type { KategoriLab } from "@/components/lab/labShared";

// ── Tab Registry ─────────────────────────────────────────

export type LabTabKey = "identitas" | "rujukan" | "delta";

export interface LabTabConfig {
  key: LabTabKey;
  label: string;
  icon: LucideIcon;
  desc: string;
  accent: { bg: string; text: string; ring: string };
}

export const LAB_TABS: LabTabConfig[] = [
  {
    key: "identitas",
    label: "Identitas",
    icon: FlaskConical,
    desc: "Kode, nama, kategori, satuan",
    accent: { bg: "bg-sky-50", text: "text-sky-700", ring: "ring-sky-200" },
  },
  {
    key: "rujukan",
    label: "Nilai Rujukan",
    icon: Target,
    desc: "Range normal per gender & usia",
    accent: { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200" },
  },
  {
    key: "delta",
    label: "Delta & Kritis",
    icon: AlertTriangle,
    desc: "Critical values & delta check threshold",
    accent: { bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-200" },
  },
];

// ── Kategori Config ───────────────────────────────────────

export const KATEGORI_LAB_ORDER: KategoriLab[] = [
  "Hematologi", "Kimia Klinik", "Koagulasi",
  "Urinalisis", "Serologi", "Mikrobiologi", "Analisa Gas Darah",
];

export const KATEGORI_CFG: Record<KategoriLab, { short: string; bg: string; text: string; dot: string }> = {
  "Hematologi":        { short: "Hem",  bg: "bg-rose-50",    text: "text-rose-700",    dot: "bg-rose-400"    },
  "Kimia Klinik":      { short: "Kim",  bg: "bg-sky-50",     text: "text-sky-700",     dot: "bg-sky-400"     },
  "Urinalisis":        { short: "Uri",  bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-400"   },
  "Mikrobiologi":      { short: "Mik",  bg: "bg-green-50",   text: "text-green-700",   dot: "bg-green-400"   },
  "Serologi":          { short: "Ser",  bg: "bg-violet-50",  text: "text-violet-700",  dot: "bg-violet-400"  },
  "Koagulasi":         { short: "Koa",  bg: "bg-orange-50",  text: "text-orange-700",  dot: "bg-orange-400"  },
  "Analisa Gas Darah": { short: "AGD",  bg: "bg-teal-50",    text: "text-teal-700",    dot: "bg-teal-400"    },
};

// ── Validation ────────────────────────────────────────────

export function isLabItemValid(item: LabKatalogItem, isNew = false): boolean {
  if (isNew) return !!item.nama.trim();
  return !!(item.kode.trim() && item.nama.trim() && item.satuan.trim());
}

// ── Helpers ───────────────────────────────────────────────

export function labItemInitials(item: LabKatalogItem): string {
  const parts = (item.nama || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function getLabStatusCfg(status: LabKatalogItem["status"]) {
  if (status === "NonAktif") {
    return { label: "Non-Aktif", bg: "bg-slate-100", text: "text-slate-500", dot: "bg-slate-400" };
  }
  return { label: "Aktif", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" };
}

export function hasCriticalConfig(item: LabKatalogItem): boolean {
  return item.criticalLow !== undefined || item.criticalHigh !== undefined;
}

export function hasDeltaConfig(item: LabKatalogItem): boolean {
  return item.deltaAbsolute !== undefined || item.deltaPercent !== undefined;
}

export function fmtRujukanRange(low: number, high: number, satuan: string): string {
  if (low === 0 && high === 0) return "Negatif";
  return `${low} – ${high}${satuan ? " " + satuan : ""}`;
}
