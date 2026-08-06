"use client";

// Primitif UI bersama panel Data Kecelakaan (KLL + Kecelakaan Kerja). Menghindari duplikasi
// SectionCard / ChipRow / KendaraanCard antar KLLPanel & KKPanel.

import { motion } from "framer-motion";
import { X, Car } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select } from "@/components/shared/inputs/Select";
import type { KendaraanItem } from "./kecelakaanTypes";
import { JENIS_KENDARAAN } from "./kecelakaanTypes";

// ─── Field styles ─────────────────────────────────────────────
export const lbl = "mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400";
export const inp = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] text-slate-800 placeholder:text-slate-300 transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100";

// ─── SectionCard ──────────────────────────────────────────────
type Accent = "slate" | "amber" | "emerald" | "sky";
const ACCENT_ICON: Record<Accent, string> = {
  slate:   "bg-slate-100 text-slate-400",
  amber:   "bg-amber-50 text-amber-500",
  emerald: "bg-emerald-50 text-emerald-600",
  sky:     "bg-sky-50 text-sky-600",
};

export function SectionCard({
  icon: Icon, title, accent = "slate", right, children,
}: {
  icon: IconComponent;
  title: string;
  accent?: Accent;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <div className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-lg", ACCENT_ICON[accent])}>
          <Icon size={12} />
        </div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600">{title}</p>
        {right && <div className="ml-auto">{right}</div>}
      </div>
      {children}
    </div>
  );
}

// ─── ChipRow (status pilih tunggal) ───────────────────────────
export function ChipRow<T extends string>({
  options, config, value, onChange,
}: {
  options:  T[];
  config:   Record<T, { label: string; chipCls: string; dot: string }>;
  value:    T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((s) => {
        const cfg = config[s];
        const isActive = value === s;
        return (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10.5px] font-semibold transition active:scale-95",
              isActive ? cfg.chipCls : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50",
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", isActive ? cfg.dot : "bg-slate-300")} />
            {cfg.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── KendaraanCard (dipakai KLL + KK PP/dinas berunsur lalu lintas → KLL_KK) ──
export const PERAN_BADGE: Record<KendaraanItem["peran"], string> = {
  Korban:       "bg-rose-50 text-rose-600 ring-rose-200",
  Pelaku:       "bg-amber-50 text-amber-600 ring-amber-200",
  Keterlibatan: "bg-slate-100 text-slate-500 ring-slate-200",
};

const PERAN_OPTS = [
  { value: "Korban",       label: "Korban" },
  { value: "Pelaku",       label: "Pelaku" },
  { value: "Keterlibatan", label: "Keterlibatan" },
];

export function KendaraanCard({
  item, index, onUpdate, onRemove,
}: {
  item:     KendaraanItem;
  index:    number;
  onUpdate: (i: number, patch: Partial<KendaraanItem>) => void;
  onRemove: (i: number) => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.98 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
    >
      <div className="mb-2.5 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-100 text-[10px] font-bold text-amber-700">
          {index + 1}
        </span>
        <p className="text-[10.5px] font-bold text-slate-600">Kendaraan {index + 1}</p>
        <span className={cn("rounded-full px-2 py-0.5 text-[8.5px] font-bold uppercase tracking-wide ring-1", PERAN_BADGE[item.peran])}>
          {item.peran}
        </span>
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="ml-auto flex h-7 w-7 items-center justify-center rounded-lg border border-rose-200 text-rose-400 transition hover:bg-rose-50 hover:text-rose-600 active:scale-95"
          aria-label="Hapus kendaraan"
        >
          <X size={12} />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-[1fr_auto_9rem]">
        <div className="min-w-0">
          <p className={lbl}>Jenis Kendaraan</p>
          <Select
            value={item.jenis}
            onChange={(v) => onUpdate(index, { jenis: v })}
            options={[...JENIS_KENDARAAN]}
            icon={Car}
            placeholder="Pilih jenis…"
          />
        </div>
        <div className="sm:w-32">
          <p className={lbl}>No. Polisi</p>
          <input
            className="w-full rounded-lg border-2 border-slate-300 bg-slate-50 px-2 py-2 text-center font-mono text-[13px] font-bold uppercase tracking-widest text-slate-800 transition placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-300 focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-100"
            placeholder="B 1234 ABC"
            value={item.noPol}
            onChange={(e) => onUpdate(index, { noPol: e.target.value.toUpperCase() })}
          />
        </div>
        <div>
          <p className={lbl}>Peran</p>
          <Select
            value={item.peran}
            onChange={(v) => onUpdate(index, { peran: v as KendaraanItem["peran"] })}
            options={PERAN_OPTS}
            placeholder="Peran…"
          />
        </div>
      </div>
    </motion.div>
  );
}
