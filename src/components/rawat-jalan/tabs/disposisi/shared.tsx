"use client";

// Primitif bersama untuk form Disposisi Rawat Jalan (Rujuk Eksternal + Admisi RI).
// Diekstrak dari DisposisiRJTab agar tiap file < 800 baris.

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const inputCls =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 shadow-xs outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300 transition";
export const textareaCls =
  "w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 shadow-xs outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300 transition";
export const selectCls =
  "w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 shadow-xs outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300 transition disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

export function SectionHeader({
  icon: Icon,
  title,
  right,
}: {
  icon: LucideIcon;
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/60 px-4 py-2.5">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500">
        <Icon size={12} />
      </span>
      <p className="text-xs font-semibold text-slate-700">{title}</p>
      {right && <span className="ml-auto">{right}</span>}
    </div>
  );
}

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
        {required && <span className="font-bold text-rose-400">*</span>}
      </label>
      {children}
      {hint && <p className="text-[10px] text-slate-400">{hint}</p>}
    </div>
  );
}

export function PreviewRow({
  label,
  value,
  mono,
  highlight,
}: {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
}) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p
        className={cn(
          "text-xs font-medium text-slate-800",
          mono && "font-mono",
          highlight && "font-semibold text-indigo-700",
        )}
      >
        {value}
      </p>
    </div>
  );
}

/** Checklist kelengkapan form (dipakai kolom kanan kedua form). */
export function Checklist({ items }: { items: { label: string; done: boolean }[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-slate-50/60 px-4 py-2.5">
        <p className="text-xs font-semibold text-slate-700">Kelengkapan Form</p>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 p-4">
        {items.map(({ label, done }) => (
          <div key={label} className="flex items-center gap-2">
            <span
              className={cn(
                "flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition",
                done ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-300",
              )}
            >
              {done ? (
                <CheckMini />
              ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
              )}
            </span>
            <span className={cn("text-[11px] transition", done ? "text-slate-700" : "text-slate-400")}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CheckMini() {
  return (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
