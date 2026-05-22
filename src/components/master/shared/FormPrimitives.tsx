"use client";

/**
 * Centralized form primitives untuk halaman master.
 *
 * Semua input menerima prop `accent?: MasterAccent` untuk warna focus & ring,
 * default `rose`. Pola visual mengikuti katalog-radiologi & katalog-obat:
 *   - Field: label kecil uppercase + hint/error slot
 *   - Input idle: border-slate-200, hover-slate-300
 *   - Input focus: border-{accent}-400 + ring-{accent}-100
 *   - Text: slate-800 (hindari font terang)
 *   - max-w cap default untuk menghindari form terlalu lebar
 *
 * Diorganisir untuk diimpor selektif:
 *   import { Field, TextInput, Select } from "@/components/master/shared/FormPrimitives";
 */

import { cn } from "@/lib/utils";
import { getAccent, type MasterAccent } from "./masterAccent";

// ── Base input classes ──────────────────────────────────

const inputBase =
  "w-full rounded-lg border bg-white px-2.5 py-1.5 text-[12px] text-slate-800 placeholder:text-slate-400 outline-none transition";
const inputIdle = "border-slate-200 hover:border-slate-300";

/** Bangun class focus dari accent dengan typed map (Tailwind purge-safe). */
const FOCUS_BY_ACCENT: Record<MasterAccent, string> = {
  rose:    "focus:border-rose-400 focus:ring-2 focus:ring-rose-100",
  sky:     "focus:border-sky-400 focus:ring-2 focus:ring-sky-100",
  teal:    "focus:border-teal-400 focus:ring-2 focus:ring-teal-100",
  violet:  "focus:border-violet-400 focus:ring-2 focus:ring-violet-100",
  emerald: "focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100",
  amber:   "focus:border-amber-400 focus:ring-2 focus:ring-amber-100",
  slate:   "focus:border-slate-400 focus:ring-2 focus:ring-slate-100",
  pink:    "focus:border-pink-400 focus:ring-2 focus:ring-pink-100",
};

function focusCls(accent: MasterAccent = "rose"): string {
  return FOCUS_BY_ACCENT[accent];
}

// ── Field ───────────────────────────────────────────────

export interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function Field({
  label, hint, error, required, children, className,
}: FieldProps) {
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

// ── TextInput ───────────────────────────────────────────

export interface TextInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: "text" | "email" | "tel" | "search" | "url";
  className?: string;
  maxW?: string;
  accent?: MasterAccent;
}

export function TextInput({
  value, onChange, placeholder, type = "text",
  className, maxW = "max-w-[420px]", accent = "rose", ...rest
}: TextInputProps) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(inputBase, inputIdle, focusCls(accent), maxW, className)}
      {...rest}
    />
  );
}

// ── NumberInput ─────────────────────────────────────────

export interface NumberInputProps {
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  maxW?: string;
  suffix?: string;
  accent?: MasterAccent;
}

export function NumberInput({
  value, onChange, placeholder, min = 0, max, step = 1,
  className, maxW = "max-w-[180px]", suffix, accent = "rose",
}: NumberInputProps) {
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
          inputBase, inputIdle, focusCls(accent), "font-mono tabular-nums",
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

// ── TextArea ────────────────────────────────────────────

export interface TextAreaProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  monospace?: boolean;
  accent?: MasterAccent;
}

export function TextArea({
  value, onChange, placeholder, rows = 3, className,
  monospace, accent = "rose",
}: TextAreaProps) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={cn(
        inputBase, inputIdle, focusCls(accent),
        "resize-none leading-relaxed",
        monospace && "font-mono text-[11px]",
        className,
      )}
    />
  );
}

// ── Select ──────────────────────────────────────────────

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

export interface SelectProps<T extends string> {
  value: T | undefined;
  onChange: (v: T | undefined) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  className?: string;
  maxW?: string;
  accent?: MasterAccent;
}

// Inline SVG chevron — di-encode untuk background-image, dipisah konstanta agar tidak duplikasi.
const SELECT_CHEVRON_BG =
  "bg-[url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'><polyline points='6 9 12 15 18 9'/></svg>\")] bg-[length:14px] bg-[right_8px_center] bg-no-repeat";

export function Select<T extends string>({
  value, onChange, options, placeholder,
  className, maxW = "max-w-[260px]", accent = "rose",
}: SelectProps<T>) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => {
        const v = e.target.value;
        onChange(v === "" ? undefined : (v as T));
      }}
      className={cn(
        inputBase, inputIdle, focusCls(accent), maxW,
        "appearance-none bg-white pr-8 cursor-pointer",
        SELECT_CHEVRON_BG,
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

// ── ToggleSwitch ────────────────────────────────────────

const TOGGLE_TRACK_ON: Record<MasterAccent, string> = {
  rose:    "bg-rose-500",
  sky:     "bg-sky-500",
  teal:    "bg-teal-500",
  violet:  "bg-violet-500",
  emerald: "bg-emerald-500",
  amber:   "bg-amber-500",
  slate:   "bg-slate-500",
  pink:    "bg-pink-500",
};

export interface ToggleSwitchProps {
  value: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  desc?: string;
  accent?: MasterAccent;
  disabled?: boolean;
}

export function ToggleSwitch({
  value, onChange, label, desc, accent = "rose", disabled,
}: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      disabled={disabled}
      onClick={() => !disabled && onChange(!value)}
      className={cn(
        "flex w-full items-center justify-between gap-3 rounded-lg border bg-white px-3 py-2 text-left transition outline-none focus-visible:ring-2",
        "border-slate-200 hover:border-slate-300",
        getAccent(accent).ringFocus,
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <span className="min-w-0">
        {label && (
          <span className="block text-[11px] font-semibold text-slate-700">{label}</span>
        )}
        {desc && (
          <span className="mt-0.5 block text-[10px] leading-snug text-slate-500">{desc}</span>
        )}
      </span>
      <span
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
          value ? TOGGLE_TRACK_ON[accent] : "bg-slate-200",
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
            value ? "translate-x-4" : "translate-x-0.5",
          )}
        />
      </span>
    </button>
  );
}

// ── ChipToggle ──────────────────────────────────────────

export interface ChipToggleProps<T extends string> {
  options: SelectOption<T>[];
  value: T;
  onChange: (v: T) => void;
  accent?: MasterAccent;
  size?: "sm" | "md";
}

const CHIP_ACTIVE_BY_ACCENT: Record<MasterAccent, string> = {
  rose:    "bg-rose-50 text-rose-700 border-rose-200",
  sky:     "bg-sky-50 text-sky-700 border-sky-200",
  teal:    "bg-teal-50 text-teal-700 border-teal-200",
  violet:  "bg-violet-50 text-violet-700 border-violet-200",
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
  amber:   "bg-amber-50 text-amber-700 border-amber-200",
  slate:   "bg-slate-100 text-slate-800 border-slate-300",
  pink:    "bg-pink-50 text-pink-700 border-pink-200",
};

export function ChipToggle<T extends string>({
  options, value, onChange, accent = "rose", size = "md",
}: ChipToggleProps<T>) {
  const a = getAccent(accent);
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
              "rounded-lg border font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
              size === "sm" ? "px-2 py-1 text-[10px]" : "px-2.5 py-1.5 text-[11px]",
              a.ringFocus,
              active
                ? CHIP_ACTIVE_BY_ACCENT[accent]
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

// ── SectionGroup ────────────────────────────────────────

export interface SectionGroupProps {
  title: string;
  desc?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  /** Override header accent (jika tidak disediakan, pakai slate netral). */
  accent?: { bg: string; text: string };
  action?: React.ReactNode;
  className?: string;
}

export function SectionGroup({
  title, desc, icon, children, accent, action, className,
}: SectionGroupProps) {
  return (
    <div className={cn("rounded-xl border border-slate-200 bg-white", className)}>
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
            <p className={cn(
              "text-[11px] font-bold uppercase tracking-wide",
              accent?.text ?? "text-slate-700",
            )}>
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
