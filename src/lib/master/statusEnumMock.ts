/**
 * Master Status Enum — katalog enum kecil lintas modul.
 *
 * Multi-enum dalam satu page (sidebar nav per enum). Tiap enum punya
 * struktur identik: kode (unique key) + label + deskripsi + tone + urutan.
 * Tujuan: hapus hardcoded constants di pasienPulang/discharge/dst, jadi single source.
 */

import {
  Activity, Bed, Heart, ArrowRightCircle, ShieldAlert, HeartOff, Home,
  Stethoscope, AlertCircle, CheckCircle2, AlertTriangle, Skull,
  Eye, EyeOff, Brain, Moon, Sun, MoonStar,
  Users, User2, Crown, GitBranch,
  Building2, Hospital, Star, Sparkles,
  Pill, Syringe, Droplet, Wind, Hand,
  type LucideIcon,
} from "lucide-react";
import { STATUS_ENUM_SEED, formatEnumKode } from "./statusEnumSeed";

// ── Enum keys ─────────────────────────────────────────────

// Lingkup 3 grup (revisi 2026-06-17) — 6 grup lama dihapus (otoritas lain/typed-union).
// Lihat docs/BACKEND-MASTER-TEMPLATE&ENUM.md §2.3.
export type StatusEnumKey =
  | "kondisi-transfer"
  | "mode-transport"
  | "hubungan-keluarga";

export type EnumTone =
  | "emerald" | "sky" | "teal" | "amber" | "orange"
  | "rose" | "violet" | "slate" | "indigo";

export interface EnumEntry {
  id: string;
  kode: string;
  label: string;
  deskripsi?: string;
  tone: EnumTone;
  urutan: number;
  status: "Aktif" | "NonAktif";
  icon?: string;
}

export interface EnumGroup {
  key: StatusEnumKey;
  label: string;
  deskripsi: string;
  icon: LucideIcon;
  konsumen: string[];
  entries: EnumEntry[];
}

// ── Tone config ───────────────────────────────────────────

export const TONE_CFG: Record<EnumTone, { label: string; chip: string; dot: string; ring: string }> = {
  emerald: { label: "Emerald", chip: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500", ring: "ring-emerald-200" },
  sky:     { label: "Sky",     chip: "bg-sky-100 text-sky-700",         dot: "bg-sky-500",     ring: "ring-sky-200" },
  teal:    { label: "Teal",    chip: "bg-teal-100 text-teal-700",       dot: "bg-teal-500",    ring: "ring-teal-200" },
  amber:   { label: "Amber",   chip: "bg-amber-100 text-amber-700",     dot: "bg-amber-500",   ring: "ring-amber-200" },
  orange:  { label: "Orange",  chip: "bg-orange-100 text-orange-700",   dot: "bg-orange-500",  ring: "ring-orange-200" },
  rose:    { label: "Rose",    chip: "bg-rose-100 text-rose-700",       dot: "bg-rose-500",    ring: "ring-rose-200" },
  violet:  { label: "Violet",  chip: "bg-violet-100 text-violet-700",   dot: "bg-violet-500",  ring: "ring-violet-200" },
  slate:   { label: "Slate",   chip: "bg-slate-100 text-slate-700",     dot: "bg-slate-500",   ring: "ring-slate-200" },
  indigo:  { label: "Indigo",  chip: "bg-indigo-100 text-indigo-700",   dot: "bg-indigo-500",  ring: "ring-indigo-200" },
};

export const TONE_LIST: EnumTone[] = [
  "emerald", "teal", "sky", "indigo", "violet", "rose", "orange", "amber", "slate",
];

// ── Icon registry (key → LucideIcon, dipakai render saja) ─

export const ICON_REGISTRY: Record<string, LucideIcon> = {
  Activity, Bed, Heart, ArrowRightCircle, ShieldAlert, HeartOff, Home,
  Stethoscope, AlertCircle, CheckCircle2, AlertTriangle, Skull,
  Eye, EyeOff, Brain, Moon, Sun, MoonStar,
  Users, User2, Crown, GitBranch,
  Building2, Hospital, Star, Sparkles,
  Pill, Syringe, Droplet, Wind, Hand,
};

export const ICON_KEYS = Object.keys(ICON_REGISTRY);

// ── Data — 9 enum groups (compose dari statusEnumSeed; kode auto `<PREFIX>-NNN`) ──
// Single source data di statusEnumSeed.ts (Node-loadable, dipakai seed DB). Di sini di-compose
// jadi EnumGroup: ikon string → komponen lucide (ICON_REGISTRY) + kode generated (formula sama
// dgn seed DB → FE & DB konsisten). Setelah swap SSR, page baca DB; grup-meta tetap di sini.

export const STATUS_ENUM_GROUPS: EnumGroup[] = STATUS_ENUM_SEED.map((g) => ({
  key: g.key as StatusEnumKey,
  label: g.label,
  deskripsi: g.deskripsi,
  icon: ICON_REGISTRY[g.iconKey] ?? Activity,
  konsumen: g.konsumen,
  entries: g.entries.map((e, i) => ({
    id: `${g.key}-${i + 1}`,
    kode: formatEnumKode(g.prefix, i + 1),
    label: e.label,
    deskripsi: e.deskripsi ?? "",
    tone: e.tone as EnumTone,
    urutan: e.urutan,
    status: e.status,
    icon: e.icon,
  })),
}));

// ── Helpers ───────────────────────────────────────────────

export function getGroupByKey(key: StatusEnumKey): EnumGroup | undefined {
  return STATUS_ENUM_GROUPS.find((g) => g.key === key);
}

export function emptyEnumEntry(maxUrutan = 0): EnumEntry {
  return {
    id: `e-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    kode: "",
    label: "",
    deskripsi: "",
    tone: "slate",
    urutan: maxUrutan + 1,
    status: "Aktif",
  };
}

export function isEnumEntryValid(e: EnumEntry): boolean {
  return e.kode.trim() !== "" && e.label.trim() !== "";
}

export function countActiveEntries(group: EnumGroup): number {
  return group.entries.filter((e) => e.status === "Aktif").length;
}
