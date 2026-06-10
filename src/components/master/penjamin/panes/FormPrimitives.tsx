"use client";

import { cn } from "@/lib/utils";

// ── Shared input styles ───────────────────────────────────
//
// Form inputs untuk halaman Penjamin. Sengaja pakai text-slate-800 (bukan
// text-slate-400) sesuai feedback user — hindari font-color terang di
// form field.

const inputBase =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] text-slate-800 " +
  "placeholder:text-slate-400 outline-none transition hover:border-slate-300 " +
  "focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100";

// ── Field wrapper ─────────────────────────────────────────

export function Field({
  label, hint, required, children, className,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
        {required && <span className="text-rose-500">*</span>}
        {hint && <span className="font-normal normal-case text-[10px] text-slate-400">· {hint}</span>}
      </span>
      {children}
    </label>
  );
}

// ── Text / Number input ───────────────────────────────────

export function TextInput({
  value, onChange, placeholder, maxLength, mono, type = "text", className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  mono?: boolean;
  type?: "text" | "email" | "tel";
  className?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      className={cn(inputBase, mono && "font-mono", className)}
    />
  );
}

export function NumberInput({
  value, onChange, placeholder, prefix, suffix,
}: {
  value: number;
  onChange: (v: number) => void;
  placeholder?: string;
  prefix?: string;
  suffix?: string;
}) {
  return (
    <div className="relative">
      {prefix && (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-slate-400">
          {prefix}
        </span>
      )}
      <input
        type="number"
        value={value || ""}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        placeholder={placeholder}
        className={cn(
          inputBase, "font-mono",
          prefix && "pl-10",
          suffix && "pr-12",
        )}
      />
      {suffix && (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-slate-400">
          {suffix}
        </span>
      )}
    </div>
  );
}

// ── TextArea ──────────────────────────────────────────────

export function TextArea({
  value, onChange, placeholder, rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={cn(inputBase, "resize-none leading-relaxed")}
    />
  );
}

// ── Select ────────────────────────────────────────────────

export function Select<T extends string>({
  value, onChange, options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className={cn(inputBase, "appearance-none pr-8")}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <svg
        viewBox="0 0 12 12"
        className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400"
      >
        <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" fill="none" />
      </svg>
    </div>
  );
}

// ── Segmented button (single-select) ──────────────────────

export function Segmented<T extends string>({
  value, onChange, options, accent = "emerald",
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; tone?: "default" | "warn" | "danger" }[];
  accent?: "emerald" | "sky" | "amber";
}) {
  const activeCls = {
    emerald: "border-emerald-300 bg-emerald-600 text-white",
    sky:     "border-sky-300 bg-sky-600 text-white",
    amber:   "border-amber-300 bg-amber-500 text-white",
  }[accent];

  return (
    <div className="flex flex-wrap gap-1">
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              "rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition",
              active ? activeCls : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// ── SectionGroup ──────────────────────────────────────────

export function SectionGroup({
  title, icon: Icon, accent, children, action,
}: {
  title: string;
  icon: IconComponent;
  accent?: { bg: string; text: string };
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-3.5 py-2">
        <div className="flex items-center gap-2">
          <div className={cn(
            "flex h-6 w-6 items-center justify-center rounded-md",
            accent?.bg ?? "bg-slate-100",
          )}>
            <Icon size={12} className={cn(accent?.text ?? "text-slate-500")} />
          </div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-700">{title}</p>
        </div>
        {action}
      </div>
      <div className="p-3.5">{children}</div>
    </section>
  );
}

// ── Checkbox / Toggle row ─────────────────────────────────

export function CheckRow({
  checked, onChange, label, desc, icon: Icon, accent = "emerald",
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  desc?: string;
  icon?: IconComponent;
  accent?: "emerald" | "sky";
}) {
  const accCls = {
    emerald: { ring: "ring-emerald-200", bg: "bg-emerald-50", text: "text-emerald-700", check: "bg-emerald-600" },
    sky:     { ring: "ring-sky-200",     bg: "bg-sky-50",     text: "text-sky-700",     check: "bg-sky-600"     },
  }[accent];

  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition",
        checked
          ? cn(accCls.bg, "border-transparent ring-1", accCls.ring)
          : "border-slate-200 bg-white hover:bg-slate-50",
      )}
    >
      <div className={cn(
        "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition",
        checked ? cn(accCls.check, "border-transparent") : "border-slate-300 bg-white",
      )}>
        {checked && (
          <svg viewBox="0 0 12 12" className="h-3 w-3 text-white">
            <path d="M2.5 6L5 8.5 9.5 4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      {Icon && (
        <Icon size={13} className={cn(checked ? accCls.text : "text-slate-400")} />
      )}
      <div className="min-w-0 flex-1">
        <p className={cn(
          "text-[11px] font-semibold",
          checked ? accCls.text : "text-slate-700",
        )}>
          {label}
        </p>
        {desc && (
          <p className="mt-0.5 text-[10px] text-slate-500">{desc}</p>
        )}
      </div>
    </button>
  );
}
