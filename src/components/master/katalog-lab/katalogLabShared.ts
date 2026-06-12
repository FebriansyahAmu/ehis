/**
 * UI helpers + tab registry untuk halaman master Katalog Laboratorium (model Tes → Parameter).
 * Tipe & seed: @/lib/master/labTestCatalog.ts + labTestSeed.ts. Warna/ikon FE di sini.
 */

import { FlaskConical, Beaker } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { LabTestRecord, LabKategori } from "@/lib/master/labTestCatalog";
import { LAB_KATEGORI_ORDER, testHasCritical } from "@/lib/master/labTestCatalog";

export { LAB_KATEGORI_ORDER, testHasCritical };

// ── Tab Registry ─────────────────────────────────────────
export type LabTabKey = "identitas" | "parameter";

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
    desc: "Nama, kategori, spesimen, metode",
    accent: { bg: "bg-sky-50", text: "text-sky-700", ring: "ring-sky-200" },
  },
  {
    key: "parameter",
    label: "Parameter",
    icon: Beaker,
    desc: "Analit, satuan, nilai rujukan, nilai kritis",
    accent: { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200" },
  },
];

// ── Kategori Config (10 kategori katalog) ─────────────────
export const KATEGORI_CFG: Record<LabKategori, { short: string; bg: string; text: string; dot: string }> = {
  "Hematologi":        { short: "Hem", bg: "bg-rose-50",    text: "text-rose-700",    dot: "bg-rose-400"    },
  "Kimia Klinik":      { short: "Kim", bg: "bg-sky-50",     text: "text-sky-700",     dot: "bg-sky-400"     },
  "Koagulasi":         { short: "Koa", bg: "bg-orange-50",  text: "text-orange-700",  dot: "bg-orange-400"  },
  "Urinalisis":        { short: "Uri", bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-400"   },
  "Feses":             { short: "Fes", bg: "bg-lime-50",    text: "text-lime-700",    dot: "bg-lime-500"    },
  "Serologi":          { short: "Ser", bg: "bg-violet-50",  text: "text-violet-700",  dot: "bg-violet-400"  },
  "Imunologi":         { short: "Imu", bg: "bg-indigo-50",  text: "text-indigo-700",  dot: "bg-indigo-400"  },
  "Mikrobiologi":      { short: "Mik", bg: "bg-green-50",   text: "text-green-700",   dot: "bg-green-400"   },
  "Toksikologi":       { short: "Tok", bg: "bg-red-50",     text: "text-red-700",     dot: "bg-red-400"     },
  "Analisa Gas Darah": { short: "AGD", bg: "bg-teal-50",    text: "text-teal-700",    dot: "bg-teal-400"    },
};

// ── Validation ────────────────────────────────────────────
export function isLabTestValid(test: LabTestRecord, isNew = false): boolean {
  if (!test.nama.trim()) return false;
  if (isNew) return true;
  // Edit: minimal 1 parameter & semua parameter punya nama.
  return test.parameters.length > 0 && test.parameters.every((p) => p.nama.trim().length > 0);
}

export function labTestInvalidReason(test: LabTestRecord): string | null {
  if (!test.nama.trim()) return "Nama tes wajib diisi.";
  if (test.parameters.length === 0) return "Tambahkan minimal satu parameter.";
  if (test.parameters.some((p) => !p.nama.trim())) return "Setiap parameter wajib punya nama.";
  return null;
}

// ── Helpers ───────────────────────────────────────────────
export function labTestInitials(test: LabTestRecord): string {
  const parts = (test.nama || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function getLabStatusCfg(status: LabTestRecord["status"]) {
  if (status === "NonAktif") {
    return { label: "Non-Aktif", bg: "bg-slate-100", text: "text-slate-500", dot: "bg-slate-400" };
  }
  return { label: "Aktif", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" };
}

/** Hitung jumlah parameter yang punya nilai kritis (untuk badge & stats). */
export function countCriticalParams(test: LabTestRecord): number {
  return test.parameters.filter((p) => p.criticalLow !== undefined || p.criticalHigh !== undefined).length;
}
