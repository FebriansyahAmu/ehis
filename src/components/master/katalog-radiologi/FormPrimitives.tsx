"use client";

import { cn } from "@/lib/utils";

// ── Form primitives untuk Katalog Radiologi (rose accent) ──
// Pola identik dengan katalog-obat/FormPrimitives.tsx, beda di focus accent.
// Hindari font-color terang di field; max-width agar form tidak terlalu lebar.

export function Field({
  label, hint, error, required, children, className,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("flex flex-col gap-1", className)}>
      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
        {required && <span className="ml-0.5 text-rose-500">*</span>}
      </span>
      {children}
      {hint && !error && <span className="text-[10px] text-slate-400">{hint}</span>}
      {error && <span className="text-[10px] text-rose-600">{error}</span>}
    </label>
  );
}

const inputBase =
  "w-full rounded-lg border bg-white px-2.5 py-1.5 text-[12px] text-slate-800 placeholder:text-slate-400 outline-none transition";
const inputIdle = "border-slate-200 hover:border-slate-300";
const inputFocus = "focus:border-rose-400 focus:ring-2 focus:ring-rose-100";

export function TextInput({
  value, onChange, placeholder, type = "text", className, maxW = "max-w-[420px]", ...rest
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: "text" | "email" | "tel" | "search";
  className?: string;
  maxW?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type">) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(inputBase, inputIdle, inputFocus, maxW, className)}
      {...rest}
    />
  );
}

export function NumberInput({
  value, onChange, placeholder, min = 0, max, step = 1, className, maxW = "max-w-[180px]", suffix,
}: {
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  maxW?: string;
  suffix?: string;
}) {
  return (
    <div className={cn("relative", maxW)}>
      <input
        type="number"
        value={value ?? ""}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "") onChange(undefined);
          else onChange(Number(v));
        }}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        className={cn(
          inputBase, inputIdle, inputFocus, "font-mono tabular-nums",
          suffix ? "pr-10" : undefined,
          className,
        )}
      />
      {suffix && (
        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400">
          {suffix}
        </span>
      )}
    </div>
  );
}

export function TextArea({
  value, onChange, placeholder, rows = 3, className, monospace,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  monospace?: boolean;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={cn(
        inputBase, inputIdle, inputFocus,
        "resize-none leading-relaxed",
        monospace && "font-mono text-[11px]",
        className,
      )}
    />
  );
}

export function Select<T extends string>({
  value, onChange, options, placeholder, className, maxW = "max-w-[260px]",
}: {
  value: T | undefined;
  onChange: (v: T | undefined) => void;
  options: { value: T; label: string }[];
  placeholder?: string;
  className?: string;
  maxW?: string;
}) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => {
        const v = e.target.value;
        onChange(v === "" ? undefined : (v as T));
      }}
      className={cn(
        inputBase, inputIdle, inputFocus, maxW, "appearance-none bg-white pr-8 cursor-pointer",
        "bg-[url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'><polyline points='6 9 12 15 18 9'/></svg>\")] bg-[length:14px] bg-[right_8px_center] bg-no-repeat",
        className,
      )}
    >
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

export function SectionGroup({
  title, desc, icon, children, accent, action,
}: {
  title: string;
  desc?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  accent?: { bg: string; text: string };
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <header className={cn(
        "flex items-start justify-between gap-2 border-b border-slate-100 px-3 py-2",
        accent?.bg ?? "bg-slate-50/60",
      )}>
        <div className="flex items-start gap-2 min-w-0">
          {icon && (
            <span className={cn(
              "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md",
              accent?.bg ? "bg-white/60" : "bg-white",
              accent?.text ?? "text-slate-500",
            )}>
              {icon}
            </span>
          )}
          <div className="min-w-0">
            <p className={cn("text-[11px] font-bold uppercase tracking-wide", accent?.text ?? "text-slate-700")}>
              {title}
            </p>
            {desc && (
              <p className={cn(
                "mt-0.5 text-[10px] leading-snug",
                accent?.text ? "opacity-70" : "text-slate-400",
              )}>
                {desc}
              </p>
            )}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>
      <div className="p-3">{children}</div>
    </div>
  );
}

export function ChipToggle<T extends string>({
  options, value, onChange, accent = "rose",
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  accent?: "rose" | "amber" | "sky" | "emerald" | "violet";
}) {
  const accentMap: Record<string, { active: string; ring: string }> = {
    rose:    { active: "bg-rose-50 text-rose-700 border-rose-200",        ring: "ring-rose-300"    },
    amber:   { active: "bg-amber-50 text-amber-700 border-amber-200",     ring: "ring-amber-300"   },
    sky:     { active: "bg-sky-50 text-sky-700 border-sky-200",           ring: "ring-sky-300"     },
    emerald: { active: "bg-emerald-50 text-emerald-700 border-emerald-200", ring: "ring-emerald-300" },
    violet:  { active: "bg-violet-50 text-violet-700 border-violet-200",  ring: "ring-violet-300"  },
  };
  const a = accentMap[accent];
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              "rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
              a.ring,
              active
                ? a.active
                : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
