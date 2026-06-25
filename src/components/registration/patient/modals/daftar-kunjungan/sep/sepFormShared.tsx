"use client";

// Primitif SaaS untuk form SEP (wizard Pendaftaran Kunjungan Baru). Toggle/boolean diganti
// CheckCard (checklist), multi-opsi pakai Segmented berwarna, seksi dibungkus SectionCard
// ber-aksen. Khusus wizard daftar-kunjungan (tidak menyentuh SepSteps shared lain).

import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type Accent = "sky" | "indigo" | "cyan" | "teal" | "amber" | "emerald" | "slate" | "rose";

interface AccentToken {
  bar: string;     // garis aksen header
  chip: string;    // tile ikon header
  ring: string;    // ring kartu aktif
  cardOn: string;  // bg+border kartu tercentang
  box: string;     // kotak checkbox tercentang
  segOn: string;   // pill segmented terpilih
  soft: string;    // bg lembut
  text: string;    // teks aksen
}

export const ACCENT: Record<Accent, AccentToken> = {
  sky:     { bar: "bg-sky-500",     chip: "bg-sky-100 text-sky-600",         ring: "ring-sky-100",     cardOn: "border-sky-300 bg-sky-50",         box: "border-sky-500 bg-sky-500",         segOn: "bg-sky-500 text-white shadow-sm",     soft: "bg-sky-50",     text: "text-sky-700" },
  indigo:  { bar: "bg-indigo-500",  chip: "bg-indigo-100 text-indigo-600",   ring: "ring-indigo-100",  cardOn: "border-indigo-300 bg-indigo-50",   box: "border-indigo-500 bg-indigo-500",   segOn: "bg-indigo-500 text-white shadow-sm",  soft: "bg-indigo-50",  text: "text-indigo-700" },
  cyan:    { bar: "bg-cyan-500",    chip: "bg-cyan-100 text-cyan-600",       ring: "ring-cyan-100",    cardOn: "border-cyan-300 bg-cyan-50",       box: "border-cyan-500 bg-cyan-500",       segOn: "bg-cyan-500 text-white shadow-sm",    soft: "bg-cyan-50",    text: "text-cyan-700" },
  teal:    { bar: "bg-teal-500",    chip: "bg-teal-100 text-teal-600",       ring: "ring-teal-100",    cardOn: "border-teal-300 bg-teal-50",       box: "border-teal-500 bg-teal-500",       segOn: "bg-teal-500 text-white shadow-sm",    soft: "bg-teal-50",    text: "text-teal-700" },
  amber:   { bar: "bg-amber-500",   chip: "bg-amber-100 text-amber-600",     ring: "ring-amber-100",   cardOn: "border-amber-300 bg-amber-50",     box: "border-amber-500 bg-amber-500",     segOn: "bg-amber-500 text-white shadow-sm",   soft: "bg-amber-50",   text: "text-amber-700" },
  emerald: { bar: "bg-emerald-500", chip: "bg-emerald-100 text-emerald-600", ring: "ring-emerald-100", cardOn: "border-emerald-300 bg-emerald-50", box: "border-emerald-500 bg-emerald-500", segOn: "bg-emerald-500 text-white shadow-sm", soft: "bg-emerald-50", text: "text-emerald-700" },
  slate:   { bar: "bg-slate-400",   chip: "bg-slate-100 text-slate-500",     ring: "ring-slate-100",   cardOn: "border-slate-300 bg-slate-50",     box: "border-slate-500 bg-slate-500",     segOn: "bg-slate-600 text-white shadow-sm",   soft: "bg-slate-50",   text: "text-slate-600" },
  rose:    { bar: "bg-rose-500",    chip: "bg-rose-100 text-rose-600",       ring: "ring-rose-100",    cardOn: "border-rose-300 bg-rose-50",       box: "border-rose-500 bg-rose-500",       segOn: "bg-rose-500 text-white shadow-sm",    soft: "bg-rose-50",    text: "text-rose-700" },
};

/** Input filled (SaaS) — fokus → ring sky. */
export const fieldInput =
  "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-[13px] text-slate-800 placeholder:text-slate-300 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100";

// ── Field wrapper ────────────────────────────────────────────────────────────
export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
        {hint && <span className="text-[9px] font-medium text-slate-400">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

// ── Segmented (multi-opsi non-boolean) ───────────────────────────────────────
export function Segmented({
  options, value, onChange, accent = "sky",
}: {
  options: readonly { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  accent?: Accent;
}) {
  const t = ACCENT[accent];
  return (
    <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              "flex-1 rounded-lg px-2 py-1.5 text-[11px] font-bold transition-all duration-150 active:scale-[0.97]",
              on ? t.segOn : "text-slate-500 hover:bg-white/70 hover:text-slate-700",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// ── CheckCard (pengganti toggle boolean) ─────────────────────────────────────
export function CheckCard({
  checked, onChange, icon: Icon, label, desc, accent = "emerald",
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  icon?: LucideIcon;
  label: string;
  desc?: string;
  accent?: Accent;
}) {
  const t = ACCENT[accent];
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "group flex w-full items-center gap-2.5 rounded-xl border p-2.5 text-left transition active:scale-[0.99]",
        checked ? cn(t.cardOn, "ring-1", t.ring) : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60",
      )}
    >
      <span
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition",
          checked ? t.box : "border-slate-300 bg-white group-hover:border-slate-400",
        )}
      >
        <Check size={13} className={cn("text-white transition", checked ? "scale-100" : "scale-0")} />
      </span>
      {Icon && (
        <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition", checked ? t.chip : "bg-slate-100 text-slate-400")}>
          <Icon size={14} />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className={cn("text-[12px] font-bold leading-tight transition", checked ? t.text : "text-slate-700")}>{label}</p>
        {desc && <p className="mt-0.5 text-[10px] leading-tight text-slate-400">{desc}</p>}
      </div>
    </button>
  );
}

// ── SectionCard (seksi ber-aksen) ────────────────────────────────────────────
export function SectionCard({
  title, desc, icon: Icon, accent, badge, children,
}: {
  title: string;
  desc?: string;
  icon: LucideIcon;
  accent: Accent;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  const t = ACCENT[accent];
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2.5 border-b border-slate-100 px-4 py-2.5">
        <div className={cn("h-7 w-1 rounded-full", t.bar)} />
        <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", t.chip)}>
          <Icon size={15} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-bold text-slate-800">{title}</p>
          {desc && <p className="truncate text-[10px] text-slate-400">{desc}</p>}
        </div>
        {badge}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

// ── Reveal (height animate) ──────────────────────────────────────────────────
export function Reveal({ open, children }: { open: boolean; children: React.ReactNode }) {
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
