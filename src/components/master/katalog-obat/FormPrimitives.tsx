"use client";

import { cn } from "@/lib/utils";

// ── Form primitives — reusable input components ──────────
// Hindari font-color terang di field, max-width agar form tidak terlalu lebar.

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
      <span className="m-mini font-semibold uppercase tracking-wide text-slate-500">
        {label}
        {required && <span className="ml-0.5 text-rose-500">*</span>}
      </span>
      {children}
      {hint && !error && <span className="m-mini text-slate-400">{hint}</span>}
      {error && <span className="m-mini text-rose-600">{error}</span>}
    </label>
  );
}

const inputBase =
  "w-full rounded-lg border bg-white px-2.5 py-1.5 m-xs text-slate-800 placeholder:text-slate-400 outline-none transition";
const inputIdle = "border-slate-200 hover:border-slate-300";
const inputFocus = "focus:border-violet-400 focus:ring-2 focus:ring-violet-100";

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
  value, onChange, placeholder, min = 0, max, step = 1, className, maxW = "max-w-[220px]",
}: {
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  maxW?: string;
}) {
  return (
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
        inputBase, inputIdle, inputFocus, maxW, "font-mono tabular-nums", className,
      )}
    />
  );
}

export function TextArea({
  value, onChange, placeholder, rows = 3, className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={cn(inputBase, inputIdle, inputFocus, "resize-none leading-relaxed", className)}
    />
  );
}

export function Select<T extends string>({
  value, onChange, options, placeholder, className, maxW = "max-w-[300px]",
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
        inputBase, inputIdle, inputFocus, maxW, "appearance-none bg-white pr-8",
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

export function ToggleSwitch({
  checked, onChange, label, desc, accent = "violet",
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  desc?: string;
  accent?: "violet" | "rose" | "amber" | "emerald" | "sky";
}) {
  const accentMap: Record<string, { on: string; offRing: string }> = {
    violet:  { on: "bg-violet-600",  offRing: "ring-violet-200" },
    rose:    { on: "bg-rose-600",    offRing: "ring-rose-200" },
    amber:   { on: "bg-amber-500",   offRing: "ring-amber-200" },
    emerald: { on: "bg-emerald-600", offRing: "ring-emerald-200" },
    sky:     { on: "bg-sky-600",     offRing: "ring-sky-200" },
  };
  const a = accentMap[accent];
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "group flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left transition",
        checked
          ? "border-transparent bg-slate-50 ring-1 " + a.offRing
          : "border-slate-200 bg-white hover:bg-slate-50",
      )}
    >
      <div className="min-w-0">
        <p className="m-xs font-semibold text-slate-800">{label}</p>
        {desc && <p className="m-mini text-slate-500">{desc}</p>}
      </div>
      <span
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
          checked ? a.on : "bg-slate-200",
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-4" : "translate-x-0.5",
          )}
        />
      </span>
    </button>
  );
}

export function SectionGroup({
  title, desc, children, accent,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
  accent?: { bg: string; text: string };
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <header className={cn("border-b border-slate-100 px-3 py-2", accent?.bg ?? "bg-slate-50/60")}>
        <p className={cn("m-xs font-bold", accent?.text ?? "text-slate-700")}>{title}</p>
        {desc && <p className={cn("mt-0.5 m-mini", accent?.text ? "opacity-70" : "text-slate-400")}>{desc}</p>}
      </header>
      <div className="p-3">{children}</div>
    </div>
  );
}
