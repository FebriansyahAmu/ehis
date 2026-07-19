import type { LucideIcon } from "lucide-react";
import {
  Stethoscope, BedDouble, Activity, FlaskConical, ScanLine, Pill,
  CircleDot, FileText, CheckCircle2, Clock, AlertTriangle,
  Send, ShieldCheck, XCircle, Undo2, Ban, Lock, PencilLine,
} from "lucide-react";

// ── Filter State ────────────────────────────────────────

export type UnitFilter   = "IGD" | "RJ" | "RI" | "LAB" | "RAD" | "FAR";
export type KelasFilter  = "VIP" | "K1" | "K2" | "K3" | "ICU" | "HCU" | "RJ";
export type PenjaminFilter = "all" | "umum" | "bpjs" | "asuransi" | "jamkesda";
export type StatusFilter =
  | "Draft" | "Final" | "Lunas" | "Lunas Sebagian" | "Belum Lunas"
  | "Proses Klaim" | "Klaim Disetujui" | "Klaim Ditolak" | "Refund" | "Void";

export type QuickTab    = "semua" | "draft" | "belum-lunas" | "klaim-pending" | "hari-ini";
export type Density     = "compact" | "comfortable" | "cozy";
export type PeriodePreset = "hari-ini" | "7hari" | "30hari" | "bulan-ini" | "custom";

export interface TagihanFilterState {
  search: string;
  periodePreset: PeriodePreset;
  periodeFrom: string;       // ISO date "YYYY-MM-DD"
  periodeTo:   string;
  units:    UnitFilter[];
  kelas:    KelasFilter[];
  penjamin: PenjaminFilter;
  status:   StatusFilter[];
  quickTab: QuickTab;
  density:  Density;
}

export function defaultFilters(): TagihanFilterState {
  const today = todayISO();
  return {
    search: "",
    periodePreset: "hari-ini",
    periodeFrom: today,
    periodeTo: today,
    units: [],
    kelas: [],
    penjamin: "all",
    status: [],
    quickTab: "semua",
    density: "comfortable",
  };
}

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

export function countActiveFilters(f: TagihanFilterState): number {
  let n = 0;
  if (f.search.trim()) n++;
  if (f.periodePreset !== "hari-ini") n++;
  if (f.units.length) n++;
  if (f.kelas.length) n++;
  if (f.penjamin !== "all") n++;
  if (f.status.length) n++;
  if (f.quickTab !== "semua") n++;
  return n;
}

// ── Display Config ──────────────────────────────────────

interface ChipCfg {
  label: string;
  short?: string;
  icon?: LucideIcon;
  bg: string;          // active bg
  text: string;        // active text
  ring: string;        // active ring
  dot: string;         // dot
}

export const UNIT_CFG: Record<UnitFilter, ChipCfg> = {
  IGD: { label: "IGD",          icon: Activity,     bg: "bg-rose-50",    text: "text-rose-700",    ring: "ring-rose-300",    dot: "bg-rose-500" },
  RJ:  { label: "Rawat Jalan",  icon: Stethoscope,  bg: "bg-sky-50",     text: "text-sky-700",     ring: "ring-sky-300",     dot: "bg-sky-500" },
  RI:  { label: "Rawat Inap",   icon: BedDouble,    bg: "bg-teal-50",    text: "text-teal-700",    ring: "ring-teal-300",    dot: "bg-teal-500" },
  LAB: { label: "Laboratorium", icon: FlaskConical, bg: "bg-amber-50",   text: "text-amber-700",   ring: "ring-amber-300",   dot: "bg-amber-500" },
  RAD: { label: "Radiologi",    icon: ScanLine,     bg: "bg-pink-50",    text: "text-pink-700",    ring: "ring-pink-300",    dot: "bg-pink-500" },
  FAR: { label: "Farmasi",      icon: Pill,         bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-300", dot: "bg-emerald-500" },
};

export const KELAS_CFG: Record<KelasFilter, { label: string; short: string }> = {
  VIP: { label: "VIP",        short: "VIP"  },
  K1:  { label: "Kelas 1",    short: "K1"   },
  K2:  { label: "Kelas 2",    short: "K2"   },
  K3:  { label: "Kelas 3",    short: "K3"   },
  ICU: { label: "ICU",        short: "ICU"  },
  HCU: { label: "HCU",        short: "HCU"  },
  RJ:  { label: "Rawat Jalan",short: "RJ"   },
};

export const STATUS_CFG: Record<StatusFilter, ChipCfg> = {
  "Draft":           { label: "Draft",           icon: FileText,      bg: "bg-slate-100",  text: "text-slate-700",   ring: "ring-slate-300",   dot: "bg-slate-400" },
  "Final":           { label: "Final",           icon: CircleDot,     bg: "bg-amber-50",   text: "text-amber-700",   ring: "ring-amber-300",   dot: "bg-amber-500" },
  "Lunas":           { label: "Lunas",           icon: CheckCircle2,  bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-300", dot: "bg-emerald-500" },
  "Lunas Sebagian":  { label: "Lunas Sebagian",  icon: Clock,         bg: "bg-amber-50",   text: "text-amber-700",   ring: "ring-amber-300",   dot: "bg-amber-500" },
  "Belum Lunas":     { label: "Belum Lunas",     icon: AlertTriangle, bg: "bg-rose-50",    text: "text-rose-700",    ring: "ring-rose-300",    dot: "bg-rose-500" },
  "Proses Klaim":    { label: "Proses Klaim",    icon: Send,          bg: "bg-sky-50",     text: "text-sky-700",     ring: "ring-sky-300",     dot: "bg-sky-500" },
  "Klaim Disetujui": { label: "Klaim Disetujui", icon: ShieldCheck,   bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-300", dot: "bg-emerald-500" },
  "Klaim Ditolak":   { label: "Klaim Ditolak",   icon: XCircle,       bg: "bg-rose-50",    text: "text-rose-700",    ring: "ring-rose-300",    dot: "bg-rose-500" },
  "Refund":          { label: "Refund",          icon: Undo2,         bg: "bg-orange-50",  text: "text-orange-700",  ring: "ring-orange-300",  dot: "bg-orange-500" },
  "Void":            { label: "Void",            icon: Ban,           bg: "bg-slate-100",  text: "text-slate-500",   ring: "ring-slate-300",   dot: "bg-slate-400" },
};

// Status finalisasi tagihan (lifecycle) — beku (Final) vs proyeksi hidup (Draft).
export type LifecycleStatus = "Draft" | "Final";
export const LIFECYCLE_CFG: Record<LifecycleStatus, ChipCfg> = {
  "Draft": { label: "Draft", icon: PencilLine, bg: "bg-slate-100",  text: "text-slate-500",   ring: "ring-slate-200",   dot: "bg-slate-400" },
  "Final": { label: "Final", icon: Lock,       bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-300", dot: "bg-emerald-500" },
};

export const PENJAMIN_OPTIONS: { value: PenjaminFilter; label: string }[] = [
  { value: "all",       label: "Semua Penjamin" },
  { value: "umum",      label: "Umum / Pribadi" },
  { value: "bpjs",      label: "BPJS Kesehatan" },
  { value: "asuransi",  label: "Asuransi Swasta" },
  { value: "jamkesda",  label: "Jamkesda / Daerah" },
];

export const PERIODE_PRESETS: { value: PeriodePreset; label: string }[] = [
  { value: "hari-ini",  label: "Hari Ini"   },
  { value: "7hari",     label: "7 Hari"     },
  { value: "30hari",    label: "30 Hari"    },
  { value: "bulan-ini", label: "Bulan Ini"  },
  { value: "custom",    label: "Kustom"     },
];

/** Quick-tab definitions — count dihitung dinamis di workspace (computeQuickTabCounts). */
export const QUICK_TABS: { value: QuickTab; label: string }[] = [
  { value: "semua",         label: "Semua"         },
  { value: "draft",         label: "Draft"         },
  { value: "belum-lunas",   label: "Belum Lunas"   },
  { value: "klaim-pending", label: "Klaim Pending" },
  { value: "hari-ini",      label: "Hari Ini"      },
];

// ── KPI Mock (placeholder until BL0 mock seed ready) ────

export interface KPIData {
  id: string;
  label: string;
  value: string;
  sub?: string;
  trend?: { sign: "up" | "down" | "flat"; text: string };
  tone: "amber" | "rose" | "sky" | "emerald";
  icon: LucideIcon;
}

import { Receipt, ReceiptText, Send as SendIcon, Wallet } from "lucide-react";

export const KPI_MOCK: KPIData[] = [
  {
    id: "today", label: "Tagihan Hari Ini", value: "18", sub: "Rp 12,4 jt",
    trend: { sign: "up", text: "+3 dari kemarin" }, tone: "amber", icon: Receipt,
  },
  {
    id: "outstanding", label: "Outstanding", value: "Rp 47,8 jt", sub: "12 tagihan",
    trend: { sign: "up", text: "4 > 7 hari" }, tone: "rose", icon: ReceiptText,
  },
  {
    id: "klaim", label: "Klaim Pending", value: "9", sub: "Rp 23,1 jt menunggu",
    trend: { sign: "flat", text: "BPJS V-Claim" }, tone: "sky", icon: SendIcon,
  },
  {
    id: "income", label: "Pendapatan Hari Ini", value: "Rp 8,7 jt", sub: "Dari 14 transaksi",
    trend: { sign: "up", text: "+12% vs avg" }, tone: "emerald", icon: Wallet,
  },
];

// ── Tone System (KPI cards) ─────────────────────────────

export const KPI_TONE: Record<
  KPIData["tone"],
  { ringIdle: string; ringHover: string; iconBg: string; iconText: string; barFrom: string; valueText: string; trendUp: string; trendDown: string; trendFlat: string }
> = {
  amber: {
    ringIdle: "ring-amber-100",  ringHover: "hover:ring-amber-200",
    iconBg: "bg-amber-50",       iconText: "text-amber-600",
    barFrom: "from-amber-400/80",
    valueText: "text-amber-900",
    trendUp: "text-amber-700",   trendDown: "text-amber-700", trendFlat: "text-amber-700",
  },
  rose: {
    ringIdle: "ring-rose-100",   ringHover: "hover:ring-rose-200",
    iconBg: "bg-rose-50",        iconText: "text-rose-600",
    barFrom: "from-rose-400/80",
    valueText: "text-rose-900",
    trendUp: "text-rose-700",    trendDown: "text-rose-700",  trendFlat: "text-rose-700",
  },
  sky: {
    ringIdle: "ring-sky-100",    ringHover: "hover:ring-sky-200",
    iconBg: "bg-sky-50",         iconText: "text-sky-600",
    barFrom: "from-sky-400/80",
    valueText: "text-sky-900",
    trendUp: "text-sky-700",     trendDown: "text-sky-700",   trendFlat: "text-sky-700",
  },
  emerald: {
    ringIdle: "ring-emerald-100", ringHover: "hover:ring-emerald-200",
    iconBg: "bg-emerald-50",      iconText: "text-emerald-600",
    barFrom: "from-emerald-400/80",
    valueText: "text-emerald-900",
    trendUp: "text-emerald-700",  trendDown: "text-emerald-700", trendFlat: "text-emerald-700",
  },
};

// ── Format helpers (re-export from penjaminMock for consistency) ─

export { fmtRupiah, fmtRupiahShort } from "@/lib/master/penjaminMock";
