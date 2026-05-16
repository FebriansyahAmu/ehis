"use client";

import { cn } from "@/lib/utils";
import type { UnitKunjungan, KunjunganRecord } from "@/lib/data";

// ─── Unit config ──────────────────────────────────────────────

export const UNIT_CFG: Record<UnitKunjungan, { bg: string; text: string; accent: string }> = {
  IGD:           { bg: "bg-rose-100",    text: "text-rose-700",    accent: "bg-rose-500"    },
  "Rawat Jalan": { bg: "bg-sky-100",     text: "text-sky-700",     accent: "bg-sky-500"     },
  "Rawat Inap":  { bg: "bg-emerald-100", text: "text-emerald-700", accent: "bg-emerald-500" },
  Laboratorium:  { bg: "bg-teal-100",    text: "text-teal-700",    accent: "bg-teal-500"    },
  Radiologi:     { bg: "bg-orange-100",  text: "text-orange-700",  accent: "bg-orange-500"  },
  Farmasi:       { bg: "bg-cyan-100",    text: "text-cyan-700",    accent: "bg-cyan-500"    },
};

// ─── Status badge ─────────────────────────────────────────────

export function StatusBadge({ status }: { status: KunjunganRecord["status"] }) {
  const cfg = {
    Aktif:      { cls: "bg-sky-500 text-white shadow-sm shadow-sky-200",          dot: true  },
    Selesai:    { cls: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200", dot: false },
    Dibatalkan: { cls: "bg-slate-100 text-slate-500 ring-1 ring-slate-200",       dot: false },
  }[status];

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold", cfg.cls)}>
      {cfg.dot && <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-white/80" />}
      {status}
    </span>
  );
}

// ─── Form primitives ──────────────────────────────────────────

export const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-300 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 transition";

export const selectCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 transition cursor-pointer";

export function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </label>
      {children}
    </div>
  );
}

export function BtnPrimary({ label, danger }: { label: string; danger?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        "w-full rounded-xl px-4 py-2.5 text-[12px] font-bold transition active:scale-[0.98]",
        danger
          ? "bg-rose-600 text-white hover:bg-rose-700"
          : "bg-sky-600 text-white hover:bg-sky-700",
      )}
    >
      {label}
    </button>
  );
}
