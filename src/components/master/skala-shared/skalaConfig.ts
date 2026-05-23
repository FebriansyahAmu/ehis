/**
 * Konfigurasi shared untuk halaman master skala (Risiko/Umum/Penyakit).
 *
 * Berisi:
 *   - Tab registry default
 *   - Tone palette (untuk interpretasi badge)
 *   - Modul konsumen config
 *   - Status config + validators + UI helpers
 *
 * Konsumen: SkalaList · SkalaDetail · IdentitasTab · ItemsTab · InterpretasiTab
 * Branding per master via prop `accent` (MasterAccent), bukan via constant di sini.
 */

import { IdCard, ListChecks, Gauge } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type {
  SkalaRecord, SkalaTone, SkalaStatus,
} from "@/lib/master/skalaCommon";

// ── Tab Registry ─────────────────────────────────────────

export type SkalaTabKey = "identitas" | "items" | "interpretasi";

export interface SkalaTabConfig {
  key: SkalaTabKey;
  label: string;
  icon: LucideIcon;
  desc: string;
  accentText: string;
}

export const SKALA_TABS: SkalaTabConfig[] = [
  { key: "identitas",    label: "Identitas",    icon: IdCard,     desc: "Kode, nama, deskripsi, konsumen modul", accentText: "text-teal-700" },
  { key: "items",        label: "Item Skor",    icon: ListChecks, desc: "Daftar item penilaian + opsi skor",     accentText: "text-emerald-700" },
  { key: "interpretasi", label: "Interpretasi", icon: Gauge,      desc: "Threshold + tindak lanjut klinis",      accentText: "text-amber-700" },
];

// ── Tone palette (untuk interpretasi range badge) ────────

export interface ToneClasses {
  bg:   string;
  text: string;
  ring: string;
  bar:  string;
  dot:  string;
}

export const TONE_CFG: Record<SkalaTone, ToneClasses> = {
  emerald: { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200", bar: "bg-emerald-500", dot: "bg-emerald-500" },
  yellow:  { bg: "bg-yellow-50",  text: "text-yellow-700",  ring: "ring-yellow-200",  bar: "bg-yellow-500",  dot: "bg-yellow-500"  },
  amber:   { bg: "bg-amber-50",   text: "text-amber-700",   ring: "ring-amber-200",   bar: "bg-amber-500",   dot: "bg-amber-500"   },
  orange:  { bg: "bg-orange-50",  text: "text-orange-700",  ring: "ring-orange-200",  bar: "bg-orange-500",  dot: "bg-orange-500"  },
  rose:    { bg: "bg-rose-50",    text: "text-rose-700",    ring: "ring-rose-200",    bar: "bg-rose-500",    dot: "bg-rose-500"    },
  red:     { bg: "bg-red-50",     text: "text-red-700",     ring: "ring-red-300",     bar: "bg-red-600",     dot: "bg-red-600"     },
  sky:     { bg: "bg-sky-50",     text: "text-sky-700",     ring: "ring-sky-200",     bar: "bg-sky-500",     dot: "bg-sky-500"     },
};

// ── Module konsumen ──────────────────────────────────────

export const MODUL_CFG = {
  IGD: { label: "IGD", bg: "bg-rose-50",    text: "text-rose-700",    dot: "bg-rose-500"    },
  RI:  { label: "RI",  bg: "bg-sky-50",     text: "text-sky-700",     dot: "bg-sky-500"     },
  RJ:  { label: "RJ",  bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  ICU: { label: "ICU", bg: "bg-violet-50",  text: "text-violet-700",  dot: "bg-violet-500"  },
} as const;

// ── Status ───────────────────────────────────────────────

export function getSkalaStatusCfg(status: SkalaStatus) {
  if (status === "Non_Aktif") {
    return { label: "Non-Aktif", bg: "bg-slate-100", text: "text-slate-500", dot: "bg-slate-400" };
  }
  return { label: "Aktif", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" };
}

// ── Validators ───────────────────────────────────────────

export function isSkalaValid(item: SkalaRecord, isNew = false): boolean {
  if (isNew) return !!item.nama.trim();
  return !!(
    item.kode.trim() &&
    item.nama.trim() &&
    item.items.length > 0 &&
    item.interpretasi.length > 0
  );
}

// ── UI helpers ───────────────────────────────────────────

export function skalaInitials(item: SkalaRecord): string {
  const src = item.kode || item.nama || "";
  const cleaned = src.replace(/[^A-Za-z0-9]/g, "");
  return cleaned.slice(0, 3).toUpperCase() || "??";
}

export function fmtModulList(modul: SkalaRecord["konsumenModul"]): string {
  return modul.length === 0 ? "—" : modul.join(" · ");
}

// ── Re-export common helpers (single point) ─────────────

export {
  deriveTotalMax, findInterpretasi, detectRangeIssues,
  MODUL_LIST_ALL, TONE_OPTIONS,
  type RangeIssue,
} from "@/lib/master/skalaCommon";
