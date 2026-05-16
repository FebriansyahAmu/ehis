"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { SEP_STEPS } from "./sepTypes";

// ─── SepField ─────────────────────────────────────────────────

export function SepField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">{label}</p>
      {children}
    </div>
  );
}

// ─── Chips ────────────────────────────────────────────────────

export function Chips({
  options, value, onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex h-10 gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
      {options.map(o => (
        <button key={o.value} type="button" onClick={() => onChange(o.value)}
          className={cn(
            "flex-1 rounded-lg text-[11px] font-bold transition-all duration-150 active:scale-[0.97]",
            value === o.value
              ? "bg-white text-sky-600 shadow-sm ring-1 ring-slate-200"
              : "text-slate-500 hover:text-slate-700",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ─── StepIndicator (compact, for UpdateSEPForm) ───────────────

export function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-start px-1">
      {SEP_STEPS.map((s, i) => {
        const done   = s.id < current;
        const active = s.id === current;
        return (
          <div key={s.id} className="flex flex-1 flex-col items-center">
            <div className="relative flex w-full items-center">
              {i > 0 && (
                <div className={cn("h-0.5 flex-1 transition-colors duration-300",
                  done || active ? "bg-emerald-500" : "bg-slate-200")} />
              )}
              <div className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold transition-all duration-300",
                done    ? "border-emerald-500 bg-emerald-500 text-white"
                : active ? "border-emerald-500 bg-white text-emerald-600"
                :          "border-slate-200 bg-white text-slate-300",
              )}>
                {done ? <Check size={10} /> : s.id}
              </div>
              {i < SEP_STEPS.length - 1 && (
                <div className={cn("h-0.5 flex-1 transition-colors duration-300",
                  done ? "bg-emerald-500" : "bg-slate-200")} />
              )}
            </div>
            <p className={cn(
              "mt-1 text-center text-[8px] font-semibold transition-colors duration-200",
              active ? "text-emerald-600" : done ? "text-emerald-400" : "text-slate-300",
            )}>
              {s.label}
            </p>
          </div>
        );
      })}
    </div>
  );
}

// ─── SEPProgressBar ───────────────────────────────────────────

export function SEPProgressBar({ current, total }: { current: number; total: number }) {
  const pct = Math.round(((current - 1) / (total - 1)) * 100);
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
      <motion.div
        className="h-full rounded-full bg-emerald-400"
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}

// ─── SEPStepper (animated circles, for InlineSEPCard) ────────

export function SEPStepper({ current }: { current: number }) {
  return (
    <div className="space-y-3">
      <div className="flex items-start">
        {SEP_STEPS.map((s, i) => {
          const done   = s.id < current;
          const active = s.id === current;
          return (
            <div key={s.id} className="flex flex-1 flex-col items-center">
              <div className="relative flex w-full items-center">
                {i > 0 && (
                  <div className={cn(
                    "h-0.5 flex-1 rounded-full transition-colors duration-500",
                    done ? "bg-emerald-400" : active ? "bg-emerald-200" : "bg-slate-200",
                  )} />
                )}
                <motion.div
                  animate={{
                    scale: active ? 1.18 : 1,
                    backgroundColor: done ? "#10b981" : active ? "#ffffff" : "#f8fafc",
                    borderColor: done || active ? "#10b981" : "#e2e8f0",
                    boxShadow: active
                      ? "0 0 0 6px rgba(16,185,129,0.15), 0 0 0 3px rgba(16,185,129,0.1)"
                      : "none",
                  }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2"
                >
                  {done ? (
                    <Check size={12} className="text-white" />
                  ) : (
                    <span className={cn("text-[11px] font-bold",
                      active ? "text-emerald-600" : "text-slate-300")}>
                      {s.id}
                    </span>
                  )}
                </motion.div>
                {i < SEP_STEPS.length - 1 && (
                  <div className={cn(
                    "h-0.5 flex-1 rounded-full transition-colors duration-500",
                    done ? "bg-emerald-400" : "bg-slate-200",
                  )} />
                )}
              </div>
              <motion.p
                animate={{ color: active ? "#059669" : done ? "#34d399" : "#cbd5e1" }}
                transition={{ duration: 0.25 }}
                className="mt-2 text-center text-[9px] font-bold uppercase tracking-wider"
              >
                {s.label}
              </motion.p>
            </div>
          );
        })}
      </div>
      <SEPProgressBar current={current} total={SEP_STEPS.length} />
    </div>
  );
}

// ─── Review section primitives ────────────────────────────────

export function RvItem({
  label, value, mono, fullWidth,
}: {
  label: string;
  value?: string;
  mono?: boolean;
  fullWidth?: boolean;
}) {
  if (!value) return null;
  return (
    <div className={cn("space-y-1.5", fullWidth && "col-span-2")}>
      <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-400">{label}</p>
      <div className="flex h-10 items-center rounded-xl bg-slate-100 px-3">
        <span className={cn("text-[12px] font-semibold text-slate-700", mono && "font-mono tracking-wider")}>
          {value}
        </span>
      </div>
    </div>
  );
}

export function RvSection2({
  title, accent, icon, children,
}: {
  title: string;
  accent: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2.5 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
        <div className={cn("h-4 w-1 rounded-full", accent)} />
        {icon}
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">{title}</p>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
