/**
 * Klaim Board — shared types · filter state · display config · KPI palette.
 *
 * Reference: TODO-EKLAIM.md § EK2.1 + EK2.3.
 *
 * Design tokens (selaras dengan Beranda E-Klaim):
 * - Accent module: **teal** (primary), pendukung amber · rose · emerald · sky · slate.
 * - **No indigo / violet** per user preference.
 * - Font scale ≥ 12px untuk semua label/value, hindari `text-xs` (10px).
 *
 * Filter state pure JSON-serializable — siap di-persist ke URLSearchParams atau localStorage.
 */

import type { LucideIcon } from "lucide-react";
import {
  FileText,
  Edit3,
  Send,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Undo2,
  Scale,
  Wallet,
  Ban,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  BedDouble,
  Stethoscope,
  Sun,
} from "lucide-react";

import type { ClaimStatus, TipePelayanan, TipePenjamin, KelasRawat } from "@/lib/eklaim/eklaimShared";

// ── Tone palette (mirror Beranda — same 6-tone system) ─

export type KlaimTone = "teal" | "amber" | "rose" | "emerald" | "sky" | "slate";

export interface TonePalette {
  /** chip bg subtle (e.g. `bg-teal-50`) */
  chipBg: string;
  /** chip text strong (e.g. `text-teal-700`) */
  chipText: string;
  /** chip ring subtle (e.g. `ring-teal-200`) */
  chipRing: string;
  /** dot indicator (e.g. `bg-teal-500`) */
  dot: string;
  /** value text dark variant (e.g. `text-teal-900`) */
  valueText: string;
  /** icon background tile (e.g. `bg-teal-50`) */
  iconBg: string;
  /** icon foreground (e.g. `text-teal-600`) */
  iconText: string;
  /** accent bar gradient start (e.g. `from-teal-400/80`) */
  barFrom: string;
  /** ring idle (e.g. `ring-teal-100`) */
  ringIdle: string;
  /** ring hover (e.g. `hover:ring-teal-200`) */
  ringHover: string;
}

export const KLAIM_TONE: Record<KlaimTone, TonePalette> = {
  teal: {
    chipBg: "bg-teal-50", chipText: "text-teal-700", chipRing: "ring-teal-200",
    dot: "bg-teal-500", valueText: "text-teal-900",
    iconBg: "bg-teal-50", iconText: "text-teal-600",
    barFrom: "from-teal-400/80",
    ringIdle: "ring-teal-100", ringHover: "hover:ring-teal-200",
  },
  amber: {
    chipBg: "bg-amber-50", chipText: "text-amber-700", chipRing: "ring-amber-200",
    dot: "bg-amber-500", valueText: "text-amber-900",
    iconBg: "bg-amber-50", iconText: "text-amber-600",
    barFrom: "from-amber-400/80",
    ringIdle: "ring-amber-100", ringHover: "hover:ring-amber-200",
  },
  rose: {
    chipBg: "bg-rose-50", chipText: "text-rose-700", chipRing: "ring-rose-200",
    dot: "bg-rose-500", valueText: "text-rose-900",
    iconBg: "bg-rose-50", iconText: "text-rose-600",
    barFrom: "from-rose-400/80",
    ringIdle: "ring-rose-100", ringHover: "hover:ring-rose-200",
  },
  emerald: {
    chipBg: "bg-emerald-50", chipText: "text-emerald-700", chipRing: "ring-emerald-200",
    dot: "bg-emerald-500", valueText: "text-emerald-900",
    iconBg: "bg-emerald-50", iconText: "text-emerald-600",
    barFrom: "from-emerald-400/80",
    ringIdle: "ring-emerald-100", ringHover: "hover:ring-emerald-200",
  },
  sky: {
    chipBg: "bg-sky-50", chipText: "text-sky-700", chipRing: "ring-sky-200",
    dot: "bg-sky-500", valueText: "text-sky-900",
    iconBg: "bg-sky-50", iconText: "text-sky-600",
    barFrom: "from-sky-400/80",
    ringIdle: "ring-sky-100", ringHover: "hover:ring-sky-200",
  },
  slate: {
    chipBg: "bg-slate-100", chipText: "text-slate-700", chipRing: "ring-slate-200",
    dot: "bg-slate-400", valueText: "text-slate-900",
    iconBg: "bg-slate-100", iconText: "text-slate-600",
    barFrom: "from-slate-400/80",
    ringIdle: "ring-slate-100", ringHover: "hover:ring-slate-200",
  },
};

// ── Filter state ───────────────────────────────────────

export type UnitFilter = TipePelayanan; // "RI" | "RJ" | "SameDay"
export type KelasFilter = KelasRawat;
export type PenjaminFilter = "all" | TipePenjamin;
export type EraFilter = "all" | "iDRG" | "INA_CBG_Legacy";

export type QuickTab =
  | "semua"
  | "belum-submit"
  | "pending-verif"
  | "rejected"
  | "paid";

export type Density = "compact" | "comfortable" | "cozy";

export type PeriodePreset =
  | "hari-ini"
  | "7hari"
  | "30hari"
  | "bulan-ini"
  | "custom";

export interface KlaimFilterState {
  search: string;
  periodePreset: PeriodePreset;
  periodeFrom: string; // ISO "YYYY-MM-DD"
  periodeTo: string;
  units: UnitFilter[];
  kelas: KelasFilter[];
  penjamin: PenjaminFilter;
  /** Nama penjamin spesifik (free text dari dropdown, "" = semua). */
  penjaminNama: string;
  status: ClaimStatus[];
  era: EraFilter;
  quickTab: QuickTab;
  density: Density;
}

export function defaultFilters(): KlaimFilterState {
  const to = todayISO();
  const from = shiftDays(to, -29); // default 30 hari (lebih helpful daripada hari ini saja)
  return {
    search: "",
    periodePreset: "30hari",
    periodeFrom: from,
    periodeTo: to,
    units: [],
    kelas: [],
    penjamin: "all",
    penjaminNama: "",
    status: [],
    era: "all",
    quickTab: "semua",
    density: "comfortable",
  };
}

// ── Date helpers ───────────────────────────────────────

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function shiftDays(iso: string, delta: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

export function firstOfMonthISO(): string {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}

export function applyPeriodePreset(preset: PeriodePreset): { from: string; to: string } {
  const today = todayISO();
  switch (preset) {
    case "hari-ini":  return { from: today, to: today };
    case "7hari":     return { from: shiftDays(today, -6), to: today };
    case "30hari":    return { from: shiftDays(today, -29), to: today };
    case "bulan-ini": return { from: firstOfMonthISO(), to: today };
    case "custom":    return { from: today, to: today };
  }
}

/**
 * Hitung jumlah filter aktif (untuk badge di header panel).
 * Periode "30hari" = default, jadi tidak dianggap aktif.
 */
export function countActiveFilters(f: KlaimFilterState): number {
  let n = 0;
  if (f.search.trim()) n++;
  if (f.periodePreset !== "30hari") n++;
  if (f.units.length) n++;
  if (f.kelas.length) n++;
  if (f.penjamin !== "all") n++;
  if (f.penjaminNama.trim()) n++;
  if (f.status.length) n++;
  if (f.era !== "all") n++;
  if (f.quickTab !== "semua") n++;
  return n;
}

// ── Display Config ─────────────────────────────────────

export interface ChipCfg {
  label: string;
  short?: string;
  icon?: LucideIcon;
  tone: KlaimTone;
}

/** Unit Pelayanan — RI/RJ/SameDay (SameDay = day care / IGD same-day). */
export const UNIT_CFG: Record<UnitFilter, ChipCfg> = {
  RI:      { label: "Rawat Inap",  short: "RI",  icon: BedDouble,   tone: "teal" },
  RJ:      { label: "Rawat Jalan", short: "RJ",  icon: Stethoscope, tone: "sky" },
  SameDay: { label: "Same Day",    short: "SD",  icon: Sun,         tone: "amber" },
};

/** Kelas pasien — KRIS (post-Okt 2025) + legacy + ICU/HCU/Isolasi. */
export const KELAS_CFG: Record<KelasFilter, { label: string; short: string; tone: KlaimTone }> = {
  KRIS:    { label: "KRIS",       short: "KRIS", tone: "teal" },
  VIP:     { label: "VIP",        short: "VIP",  tone: "amber" },
  Kelas_1: { label: "Kelas 1",    short: "K1",   tone: "slate" },
  Kelas_2: { label: "Kelas 2",    short: "K2",   tone: "slate" },
  Kelas_3: { label: "Kelas 3",    short: "K3",   tone: "slate" },
  ICU:     { label: "ICU",        short: "ICU",  tone: "rose" },
  HCU:     { label: "HCU",        short: "HCU",  tone: "rose" },
  Isolasi: { label: "Isolasi",    short: "ISO",  tone: "emerald" },
};

/** Status klaim — 13 status dengan tone semantically meaningful. */
export const STATUS_CFG: Record<ClaimStatus, ChipCfg> = {
  "Draft Coding":       { label: "Draft Koding",          icon: Edit3,        tone: "slate" },
  "Belum Submit":       { label: "Belum Submit",          icon: FileText,     tone: "amber" },
  "Submitted":          { label: "Submitted",             icon: Send,         tone: "sky" },
  "Pending Verifikasi": { label: "Pending Verifikasi",    icon: Clock,        tone: "sky" },
  "Susulan Required":   { label: "Butuh Susulan",         icon: AlertCircle,  tone: "amber" },
  "Approved":           { label: "Disetujui",             icon: ShieldCheck,  tone: "emerald" },
  "Rejected":           { label: "Ditolak",               icon: XCircle,      tone: "rose" },
  "Banding Submitted":  { label: "Banding Diajukan",      icon: Undo2,        tone: "sky" },
  "Banding Approved":   { label: "Banding Disetujui",     icon: ShieldCheck,  tone: "emerald" },
  "Banding Rejected":   { label: "Banding Ditolak",       icon: ShieldX,      tone: "rose" },
  "Sengketa":           { label: "Sengketa",              icon: ShieldAlert,  tone: "amber" },
  "Paid":               { label: "Dibayar",               icon: Wallet,       tone: "emerald" },
  "Write-off":          { label: "Write-off",             icon: Ban,          tone: "slate" },
};

/** Status order untuk display di filter (urutan natural workflow). */
export const STATUS_ORDER: ClaimStatus[] = [
  "Draft Coding",
  "Belum Submit",
  "Submitted",
  "Pending Verifikasi",
  "Susulan Required",
  "Approved",
  "Rejected",
  "Banding Submitted",
  "Banding Approved",
  "Banding Rejected",
  "Sengketa",
  "Paid",
  "Write-off",
];

export const PENJAMIN_OPTIONS: { value: PenjaminFilter; label: string }[] = [
  { value: "all",      label: "Semua Penjamin" },
  { value: "bpjs",     label: "BPJS Kesehatan" },
  { value: "asuransi", label: "Asuransi Swasta" },
  { value: "jamkesda", label: "Jamkesda / Daerah" },
];

export const ERA_OPTIONS: { value: EraFilter; label: string; hint: string }[] = [
  { value: "all",            label: "Semua Era",        hint: "iDRG + INA-CBG" },
  { value: "iDRG",           label: "iDRG",             hint: "Post-Okt 2025 (primary)" },
  { value: "INA_CBG_Legacy", label: "INA-CBG (Legacy)", hint: "Pre-Okt 2025 (transition)" },
];

export const PERIODE_PRESETS: { value: PeriodePreset; label: string }[] = [
  { value: "hari-ini",  label: "Hari Ini"  },
  { value: "7hari",     label: "7 Hari"    },
  { value: "30hari",    label: "30 Hari"   },
  { value: "bulan-ini", label: "Bulan Ini" },
  { value: "custom",    label: "Kustom"    },
];

/** Quick-tab definitions — count dinamis (computeQuickTabCounts). */
export const QUICK_TABS: { value: QuickTab; label: string; tone: KlaimTone }[] = [
  { value: "semua",         label: "Semua",             tone: "slate"   },
  { value: "belum-submit",  label: "Belum Submit",      tone: "amber"   },
  { value: "pending-verif", label: "Pending Verifikasi",tone: "sky"     },
  { value: "rejected",      label: "Perlu Banding",     tone: "rose"    },
  { value: "paid",          label: "Dibayar",           tone: "emerald" },
];

// ── KPI cards (4 — header strip) ──────────────────────

export interface KPICfg {
  id: string;
  label: string;
  tone: KlaimTone;
  icon: LucideIcon;
}

import { Inbox, ShieldQuestion, Activity, BadgeCheck } from "lucide-react";

export const KPI_DEFS: KPICfg[] = [
  { id: "today",     label: "Klaim Hari Ini",       tone: "teal",    icon: Inbox          },
  { id: "pending",   label: "Pending Verifikasi",   tone: "sky",     icon: ShieldQuestion },
  { id: "rejected",  label: "Rejected Bulan Ini",   tone: "rose",    icon: Scale          },
  { id: "approval",  label: "Approval Rate",        tone: "emerald", icon: BadgeCheck     },
];

// ── Penjamin nama mock (dropdown spesifik per tipe) ───

/**
 * Daftar penjamin nama spesifik untuk dropdown filter sekunder.
 * Diturunkan dari `CLAIM_BOARD_MOCK` saat runtime (lihat klaimBoardLogic.ts).
 * Konstanta ini hanya fallback list saat mock kosong.
 */
export const PENJAMIN_NAMA_FALLBACK: ReadonlyArray<string> = [
  "BPJS Non-PBI",
  "BPJS PBI",
  "Mandiri Inhealth",
  "Prudential",
  "Allianz Care",
  "AXA Mandiri",
  "Jamkesda Jakarta",
];

// ── Helpers (re-export selektif) ───────────────────────

export { fmtRupiahKpi, fmtRupiahFull } from "@/components/eklaim/beranda/berandaEklaimShared";

export { type ClaimStatus, type TipePenjamin } from "@/lib/eklaim/eklaimShared";

export { Activity }; // used by hero badge
