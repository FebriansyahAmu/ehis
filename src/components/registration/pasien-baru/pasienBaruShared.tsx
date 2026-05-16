"use client";

import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";
import type { FormState } from "./pasienBaruTypes";

export type Ch = (field: keyof FormState, value: string | string[]) => void;

// ── Error message ─────────────────────────────────────────────────────────────
export function ErrMsg({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium text-red-500">
      <AlertCircle size={10} className="shrink-0" /> {msg}
    </p>
  );
}

// ── Field wrapper ─────────────────────────────────────────────────────────────
export function FField({ label, required, error, hint, className, children }: {
  label: string; required?: boolean; error?: string;
  hint?: string; className?: string; children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <div className="mb-1.5 flex items-baseline gap-1.5">
        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          {label}{required && <span className="ml-0.5 text-red-400">*</span>}
        </label>
        {hint && <span className="text-[10px] text-slate-300">{hint}</span>}
      </div>
      {children}
      <ErrMsg msg={error} />
    </div>
  );
}

// ── Input class helper ────────────────────────────────────────────────────────
export const iCls = (err?: string) => cn(
  "w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-800",
  "placeholder:text-slate-300 outline-none transition-all duration-200",
  err
    ? "border-red-300 bg-red-50/30 focus:border-red-400 focus:ring-2 focus:ring-red-100"
    : "border-slate-200 hover:border-sky-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-100",
);

// ── Text input ────────────────────────────────────────────────────────────────
export function TInput({ name, value, onChange, placeholder, error, type = "text", maxLength, onlyDigits }: {
  name: keyof FormState; value: string; onChange: Ch; placeholder?: string;
  error?: string; type?: string; maxLength?: number; onlyDigits?: boolean;
}) {
  return (
    <input
      type={type} value={value} maxLength={maxLength} placeholder={placeholder}
      onChange={(e) => onChange(name, onlyDigits ? e.target.value.replace(/\D/g, "") : e.target.value)}
      className={iCls(error)}
    />
  );
}

// ── Select input ──────────────────────────────────────────────────────────────
export function SInput({ name, value, onChange, opts, placeholder, error }: {
  name: keyof FormState; value: string; onChange: Ch;
  opts: string[]; placeholder?: string; error?: string;
}) {
  return (
    <select value={value} onChange={(e) => onChange(name, e.target.value)}
      className={cn(iCls(error), "cursor-pointer")}>
      <option value="">{placeholder ?? "Pilih…"}</option>
      {opts.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

// ── Section card ──────────────────────────────────────────────────────────────
type Accent = "indigo" | "slate" | "emerald" | "sky" | "rose" | "amber";

const ACCENT_MAP: Record<Accent, { icon: string; border: string }> = {
  indigo:  { icon: "bg-indigo-100  text-indigo-600",  border: "border-indigo-100/70"  },
  slate:   { icon: "bg-slate-100   text-slate-500",   border: "border-slate-150"       },
  emerald: { icon: "bg-emerald-100 text-emerald-600", border: "border-emerald-100/70" },
  sky:     { icon: "bg-sky-100     text-sky-600",     border: "border-sky-100/70"     },
  rose:    { icon: "bg-rose-100    text-rose-600",    border: "border-rose-100/70"    },
  amber:   { icon: "bg-amber-100   text-amber-600",   border: "border-amber-100/70"   },
};

export function SCard({ title, icon: Icon, accent = "sky", children }: {
  title: string; icon: React.ElementType; accent?: Accent; children: React.ReactNode;
}) {
  const a = ACCENT_MAP[accent];
  return (
    <div className={cn("rounded-2xl border bg-white p-4 shadow-sm", a.border)}>
      <div className="mb-4 flex items-center gap-2.5">
        <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-xl", a.icon)}>
          <Icon size={13} />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{title}</p>
      </div>
      <div className="space-y-3.5">{children}</div>
    </div>
  );
}
