"use client";

import type { LucideIcon } from "lucide-react";
import {
  Home, Activity, Bed, ArrowRightCircle,
  ShieldAlert, HeartOff, ClipboardCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────

export type StatusPulang =
  | "Sembuh"
  | "Membaik"
  | "APS"
  | "Rawat_Inap"
  | "Dirujuk"
  | "Meninggal";

export type KondisiUmum = "Baik" | "Sedang" | "Buruk" | "Kritis";
export type JenisKematian = "Wajar" | "Tidak Wajar" | "Belum Ditentukan";

export interface StatusDef {
  id: StatusPulang;
  label: string;
  sublabel: string;
  icon: LucideIcon;
  selected: string;
  idle: string;
  dot: string;
}

// ── Constants ──────────────────────────────────────────────────

export const STATUS_OPTIONS: StatusDef[] = [
  {
    id: "Sembuh",
    label: "Sembuh",
    sublabel: "Pulang ke rumah — kondisi baik",
    icon: Home,
    selected: "border-emerald-400 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200",
    idle: "border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50/40",
    dot: "bg-emerald-500",
  },
  {
    id: "Membaik",
    label: "Membaik",
    sublabel: "Pulang ke rumah — perbaikan",
    icon: Activity,
    selected: "border-teal-400 bg-teal-50 text-teal-800 ring-1 ring-teal-200",
    idle: "border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:bg-teal-50/40",
    dot: "bg-teal-500",
  },
  {
    id: "Rawat_Inap",
    label: "Rawat Inap",
    sublabel: "Transfer ke bangsal via SBAR",
    icon: Bed,
    selected: "border-violet-400 bg-violet-50 text-violet-800 ring-1 ring-violet-200",
    idle: "border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:bg-violet-50/40",
    dot: "bg-violet-500",
  },
  {
    id: "Dirujuk",
    label: "Dirujuk",
    sublabel: "Transfer ke RS lain",
    icon: ArrowRightCircle,
    selected: "border-sky-400 bg-sky-50 text-sky-800 ring-1 ring-sky-200",
    idle: "border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:bg-sky-50/40",
    dot: "bg-sky-500",
  },
  {
    id: "APS",
    label: "APS",
    sublabel: "Pulang atas permintaan sendiri",
    icon: ShieldAlert,
    selected: "border-amber-400 bg-amber-50 text-amber-800 ring-1 ring-amber-200",
    idle: "border-slate-200 bg-white text-slate-600 hover:border-amber-300 hover:bg-amber-50/40",
    dot: "bg-amber-500",
  },
  {
    id: "Meninggal",
    label: "Meninggal",
    sublabel: "Pasien meninggal dunia",
    icon: HeartOff,
    selected: "border-slate-600 bg-slate-800 text-white ring-1 ring-slate-700",
    idle: "border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:bg-slate-50",
    dot: "bg-slate-700",
  },
];

export const KONDISI_OPTIONS: KondisiUmum[] = ["Baik", "Sedang", "Buruk", "Kritis"];

export const KONDISI_CLS: Record<KondisiUmum, string> = {
  Baik:   "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  Sedang: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  Buruk:  "bg-orange-50 text-orange-700 ring-1 ring-orange-200",
  Kritis: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
};

export const inputCls =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 shadow-xs outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300";

export const textareaCls =
  "w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 shadow-xs outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300";

// ── Shared components ──────────────────────────────────────────

export function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
        {required && <span className="font-bold text-rose-400 normal-case">*</span>}
      </label>
      {children}
      {hint && <p className="text-[10px] text-slate-400">{hint}</p>}
    </div>
  );
}

export function SectionHeader({
  icon: Icon,
  title,
  badge,
  dark,
}: {
  icon: LucideIcon;
  title: string;
  badge?: string;
  dark?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 border-b px-4 py-2.5",
        dark ? "border-slate-700 bg-slate-900" : "border-slate-100 bg-white",
      )}
    >
      <span
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-md",
          dark ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-500",
        )}
      >
        <Icon size={12} />
      </span>
      <p className={cn("text-xs font-semibold", dark ? "text-slate-100" : "text-slate-700")}>
        {title}
      </p>
      {badge && (
        <span
          className={cn(
            "rounded-md px-2 py-0.5 text-[10px] font-bold",
            dark
              ? "bg-rose-900/60 text-rose-300 ring-1 ring-rose-700"
              : "bg-rose-50 text-rose-600 ring-1 ring-rose-200",
          )}
        >
          {badge}
        </span>
      )}
    </div>
  );
}

export function SelectStatusPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-16 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-300">
        <ClipboardCheck size={18} />
      </span>
      <p className="text-xs text-slate-400">Pilih status pemulangan untuk melanjutkan</p>
    </div>
  );
}
