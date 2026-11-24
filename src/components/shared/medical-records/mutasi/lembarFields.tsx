"use client";

// Primitif form lembar transfer: baris bagian (judul kiri · isian kanan), pilihan tunggal (radio
// pil), pilihan ganda (checkbox pil), isian angka TTV dengan penanda "di luar normal", GCS + total.
// Input radio/checkbox native disembunyikan visual (sr-only) di dalam <label relative> — fokus
// keyboard tampil sebagai cincin di pil; status terpilih = ikon centang + teks (bukan warna saja).

import { useId, type ReactNode } from "react";
import { AlertTriangle, Check, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/ui/utils";

export const INPUT = cn(
  "h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900 transition sm:text-sm",
  "placeholder:text-slate-400 hover:border-slate-400",
  "focus-visible:border-sky-500 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-sky-500/15",
);
export const TEXTAREA = cn(INPUT, "h-auto min-h-[calc(2lh+1rem)] max-h-60 py-2 leading-relaxed");

/**
 * Satu bagian form: judul + keterangan (+aksi) di kiri, isian di kanan; bertumpuk di layar kecil.
 * `scroll-mt-28` ≈ tinggi kepala + navigasi bagian yang menempel (lompat bagian tak tertutup).
 */
export function FormSection({ id, title, desc, done, action, children }: {
  id: string;
  title: string;
  desc?: string;
  done?: boolean;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-t`}
      className="grid scroll-mt-28 gap-3 border-t border-slate-100 px-4 py-5 sm:px-5 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-8"
    >
      <div className="flex items-start justify-between gap-3 lg:flex-col lg:justify-start">
        <div>
          <h4 id={`${id}-t`} className="flex items-center gap-1.5 m-sm font-semibold text-slate-900">
            {title}
            {done && <CheckCircle2 className="size-3.5 text-emerald-600" role="img" aria-label="terisi" />}
          </h4>
          {desc && <p className="mt-0.5 m-tiny leading-snug text-slate-500">{desc}</p>}
        </div>
        {action}
      </div>
      <div className="flex min-w-0 flex-col gap-4">{children}</div>
    </section>
  );
}

export function Field({ id, label, hint, children, className }: {
  id: string; label: string; hint?: ReactNode; children: ReactNode; className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <label htmlFor={id} className="m-xs font-medium text-slate-700">{label}</label>
      {children}
      {hint}
    </div>
  );
}

type Tone = "sky" | "emerald" | "amber" | "rose" | "teal" | "slate";
const ON: Record<Tone, string> = {
  sky: "border-sky-500 bg-sky-50 text-sky-900",
  emerald: "border-emerald-500 bg-emerald-50 text-emerald-900",
  amber: "border-amber-500 bg-amber-50 text-amber-950",
  rose: "border-rose-500 bg-rose-50 text-rose-900",
  teal: "border-teal-500 bg-teal-50 text-teal-900",
  slate: "border-slate-500 bg-slate-100 text-slate-900",
};
const PILL = cn(
  "relative inline-flex min-h-8 cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 m-xs font-medium transition",
  "has-focus-visible:ring-2 has-focus-visible:ring-sky-600 has-focus-visible:ring-offset-1",
);
const OFF = "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-800";

/** Pilihan tunggal (radio). `tone` boleh per-opsi (mis. Kritis = rose). */
export function ChoicePills<T extends string>({ legend, options, value, onChange, tone }: {
  legend: string;
  options: readonly T[];
  value: T | undefined;
  onChange: (v: T | undefined) => void;
  tone?: (o: T) => Tone;
}) {
  const name = useId();
  return (
    <fieldset className="min-w-0">
      <legend className="mb-1.5 m-xs font-medium text-slate-700">{legend}</legend>
      <div className="flex flex-wrap items-center gap-1.5">
        {options.map((o) => {
          const on = value === o;
          return (
            <label key={o} className={cn(PILL, on ? ON[tone?.(o) ?? "sky"] : OFF)}>
              <input type="radio" name={name} value={o} checked={on} onChange={() => onChange(o)} className="sr-only" />
              {on && <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />}
              {o}
            </label>
          );
        })}
        {value && (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            aria-label={`Kosongkan ${legend.toLowerCase()}`}
            className="inline-flex size-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-sky-600"
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        )}
      </div>
    </fieldset>
  );
}

/** Pilihan ganda (checkbox). */
export function ToggleChips<T extends string>({ legend, options, values, onChange, tone = "teal" }: {
  legend: string;
  options: readonly T[];
  values: T[];
  onChange: (v: T[]) => void;
  tone?: Tone;
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-1.5 flex items-center gap-2 m-xs font-medium text-slate-700">
        {legend}
        {values.length > 0 && (
          <span className="rounded-full bg-slate-100 px-1.5 m-tiny font-semibold tabular-nums text-slate-600">{values.length}</span>
        )}
      </legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const on = values.includes(o);
          return (
            <label key={o} className={cn(PILL, on ? ON[tone] : OFF)}>
              <input
                type="checkbox"
                checked={on}
                onChange={(e) => onChange(e.target.checked ? [...values, o] : values.filter((x) => x !== o))}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className={cn(
                  "flex size-4 items-center justify-center rounded-full border transition",
                  on ? "border-transparent bg-current" : "border-slate-300",
                )}
              >
                {on && <Check className="size-2.5 text-white" strokeWidth={3.5} />}
              </span>
              {o}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Angka TTV: input teks numerik + satuan di dalam; di luar batas normal → penanda amber + teks. */
export function VitalInput({ id, label, unit, value, onChange, decimal, abnormal, abnormalText = "Di luar normal" }: {
  id: string;
  label: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
  decimal?: boolean;
  abnormal?: boolean;
  abnormalText?: string;
}) {
  return (
    <Field
      id={id}
      label={label}
      hint={abnormal ? (
        <p id={`${id}-flag`} className="flex items-center gap-1 m-tiny font-medium text-amber-800">
          <AlertTriangle className="size-3" aria-hidden="true" /> {abnormalText}
        </p>
      ) : null}
    >
      <div className="relative">
        <input
          id={id}
          type="text"
          inputMode={decimal ? "decimal" : "numeric"}
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(decimal ? /[^\d.,]/g : /\D/g, "").slice(0, 5))}
          aria-describedby={abnormal ? `${id}-flag` : undefined}
          className={cn(INPUT, "pr-14 tabular-nums", abnormal && "border-amber-400 bg-amber-50/50")}
        />
        <span aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 m-tiny text-slate-400">{unit}</span>
      </div>
    </Field>
  );
}

/** Interpretasi total GCS (cedera kepala). */
export function gcsInfo(total: number): { label: string; cls: string } | null {
  if (total < 3) return null;
  if (total === 15) return { label: "Normal", cls: "bg-emerald-50 text-emerald-800 ring-emerald-200" };
  if (total >= 13) return { label: "Ringan", cls: "bg-amber-50 text-amber-900 ring-amber-200" };
  if (total >= 9) return { label: "Sedang", cls: "bg-orange-50 text-orange-900 ring-orange-200" };
  return { label: "Berat", cls: "bg-rose-50 text-rose-800 ring-rose-200" };
}
