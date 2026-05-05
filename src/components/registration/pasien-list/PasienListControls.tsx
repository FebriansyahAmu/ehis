"use client";

import { Search, X, UserPlus, Users, Activity, Shield, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FilterPenjamin, FilterStatus } from "./PasienListPage";

interface Stats {
  total: number;
  aktif: number;
  bpjs:  number;
  umum:  number;
}

interface PasienListControlsProps {
  stats:           Stats;
  query:           string;
  onQuery:         (v: string) => void;
  filterPenjamin:  FilterPenjamin;
  filterStatus:    FilterStatus;
  onFilterPenjamin:(v: FilterPenjamin) => void;
  onFilterStatus:  (v: FilterStatus) => void;
}

const PENJAMIN_FILTERS: { value: FilterPenjamin; label: string }[] = [
  { value: "Semua",        label: "Semua"       },
  { value: "BPJS_Non_PBI", label: "BPJS Non-PBI"},
  { value: "BPJS_PBI",     label: "BPJS PBI"   },
  { value: "Umum",         label: "Umum"        },
  { value: "Asuransi",     label: "Asuransi"    },
  { value: "Jamkesda",     label: "Jamkesda"    },
];

const STATUS_FILTERS: { value: FilterStatus; label: string; active?: boolean }[] = [
  { value: "Semua",   label: "Semua Status" },
  { value: "Aktif",   label: "Ada Aktif",   active: true  },
  { value: "Selesai", label: "Tanpa Aktif", active: false },
];

export function PasienListControls({
  stats, query, onQuery,
  filterPenjamin, filterStatus,
  onFilterPenjamin, onFilterStatus,
}: PasienListControlsProps) {
  return (
    <div className="shrink-0 border-b border-slate-200 bg-white px-5 py-4 space-y-3.5">

      {/* ── Row 1: title + action ── */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-sm font-bold text-slate-900">Daftar Pasien</h1>
          <p className="text-[11px] text-slate-400">Semua pasien terdaftar · diurutkan berdasarkan kunjungan terbaru</p>
        </div>
        <button className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-700 active:scale-[0.98]">
          <UserPlus size={12} />
          Pasien Baru
        </button>
      </div>

      {/* ── Row 2: stat chips ── */}
      <div className="flex flex-wrap gap-2">
        {[
          { icon: Users,    label: "Total Pasien",  value: stats.total, cls: "bg-indigo-50 text-indigo-700 ring-indigo-200/80" },
          { icon: Activity, label: "Aktif Sekarang", value: stats.aktif, cls: "bg-emerald-50 text-emerald-700 ring-emerald-200/80" },
          { icon: Shield,   label: "BPJS",           value: stats.bpjs,  cls: "bg-sky-50 text-sky-700 ring-sky-200/80" },
          { icon: Wallet,   label: "Umum / Mandiri", value: stats.umum,  cls: "bg-slate-50 text-slate-600 ring-slate-200/80" },
        ].map(({ icon: Icon, label, value, cls }) => (
          <div key={label} className={cn("flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs ring-1", cls)}>
            <Icon size={11} className="shrink-0 opacity-60" />
            <span className="text-[10px] opacity-70">{label}</span>
            <span className="font-black">{value}</span>
          </div>
        ))}
      </div>

      {/* ── Row 3: search + filters ── */}
      <div className="flex flex-wrap items-center gap-2">

        {/* Search input */}
        <div className="relative min-w-52 flex-1">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Cari nama, No. RM, atau NIK…"
            className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2 pl-8 pr-8 text-xs text-slate-700 placeholder-slate-400 outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
          />
          {query && (
            <button
              onClick={() => onQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer text-slate-300 hover:text-slate-500"
            >
              <X size={11} />
            </button>
          )}
        </div>

        {/* Penjamin filter chips */}
        <div className="flex flex-wrap items-center gap-1">
          {PENJAMIN_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => onFilterPenjamin(f.value)}
              className={cn(
                "rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition cursor-pointer whitespace-nowrap",
                filterPenjamin === f.value
                  ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                  : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="h-5 w-px shrink-0 bg-slate-200" />

        {/* Status filter */}
        <div className="flex items-center gap-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => onFilterStatus(f.value)}
              className={cn(
                "rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition cursor-pointer whitespace-nowrap",
                filterStatus === f.value
                  ? f.value === "Aktif"
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                    : "border-indigo-300 bg-indigo-50 text-indigo-700"
                  : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
