"use client";

import { cn } from "@/lib/utils";
import type { PRBFormData, PRBKodeStatus } from "@/lib/bpjs/bpjsShared";
import { PRB_LABELS } from "@/lib/bpjs/bpjsShared";
import {
  PRB_FIELDS_BY_KODE,
  PRB_FIELD_LABELS,
  PRB_FIELD_RANGES,
  PRB_FLAG_FIELDS,
} from "./rencanaKontrolShared";

// ── Types ──────────────────────────────────────────────

interface Props {
  kode: PRBKodeStatus;
  data: PRBFormData;
  onKodeChange: (k: PRBKodeStatus) => void;
  onFieldChange: (field: keyof PRBFormData, value: number | null) => void;
  readOnly?: boolean;
}

const KODE_LIST: PRBKodeStatus[] = ["01","02","03","04","05","06","07","08","09"];

// ── Flag toggle ────────────────────────────────────────

function FlagToggle({
  label,
  value,
  onChange,
  readOnly,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-semibold text-slate-500">{label}</p>
      <div className="flex gap-0.5 rounded-xl bg-slate-100 p-0.5">
        {([null, 1, 0] as const).map((opt) => (
          <button
            key={String(opt)}
            type="button"
            disabled={readOnly}
            onClick={() => !readOnly && onChange(opt)}
            className={cn(
              "flex-1 rounded-lg px-2 py-1 text-[10px] font-bold transition-all disabled:cursor-default",
              value === opt
                ? opt === 1
                  ? "bg-violet-500 text-white shadow-sm"
                  : opt === 0
                  ? "bg-white text-slate-700 shadow-sm"
                  : "bg-white text-slate-700 shadow-sm"
                : "text-slate-400 hover:text-slate-600",
            )}
          >
            {opt === null ? "—" : opt === 1 ? "Ya" : "Tidak"}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Numeric input ──────────────────────────────────────

function NumericField({
  label,
  field,
  value,
  onChange,
  readOnly,
}: {
  label: string;
  field: keyof PRBFormData;
  value: number | null;
  onChange: (v: number | null) => void;
  readOnly?: boolean;
}) {
  const range = PRB_FIELD_RANGES[field];
  const raw = value === null ? "" : String(value);

  const validate = (n: number) => {
    if (!range) return null;
    if (n < range.min || n > range.max) return `${range.min}–${range.max}`;
    return null;
  };

  const err = value !== null ? validate(value) : null;

  return (
    <div className="space-y-1">
      <p className="text-[10px] font-semibold text-slate-500">{label}</p>
      <input
        type="number"
        readOnly={readOnly}
        step={range?.step ?? 1}
        min={range?.min}
        max={range?.max}
        value={raw}
        onChange={(e) => {
          const s = e.target.value;
          if (s === "") { onChange(null); return; }
          const n = parseFloat(s);
          if (!isNaN(n)) onChange(n);
        }}
        placeholder={range ? `${range.min}–${range.max}` : ""}
        className={cn(
          "w-full rounded-xl border bg-white px-2.5 py-1.5 text-xs text-slate-700 transition focus:outline-none focus:ring-2 read-only:bg-slate-50",
          err
            ? "border-rose-300 focus:border-rose-300 focus:ring-rose-100"
            : "border-slate-200 focus:border-violet-300 focus:ring-violet-100",
        )}
      />
      {err && <p className="text-[9px] text-rose-500">Range: {err}</p>}
    </div>
  );
}

// ── Main component ─────────────────────────────────────

export default function PRBFormFields({ kode, data, onKodeChange, onFieldChange, readOnly }: Props) {
  const fields = PRB_FIELDS_BY_KODE[kode];

  return (
    <div className="space-y-4">
      {/* Penyakit selector */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Program Rujuk Balik (PRB)
        </p>
        <div className="flex flex-wrap gap-1">
          {KODE_LIST.map((k) => (
            <button
              key={k}
              type="button"
              disabled={readOnly}
              onClick={() => !readOnly && onKodeChange(k)}
              className={cn(
                "rounded-lg px-2.5 py-1 text-[10px] font-bold transition-all disabled:cursor-default",
                kode === k
                  ? "bg-violet-500 text-white shadow-sm"
                  : "bg-slate-100 text-slate-500 hover:bg-violet-50 hover:text-violet-600",
              )}
            >
              {k} · {PRB_LABELS[k]}
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic fields */}
      <div className="rounded-xl border border-violet-100 bg-violet-50/30 p-3">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-violet-600">
          {PRB_LABELS[kode]} — Data Klinis
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {fields.map((f) =>
            PRB_FLAG_FIELDS.has(f) ? (
              <FlagToggle
                key={f}
                label={PRB_FIELD_LABELS[f]}
                value={data[f]}
                onChange={(v) => onFieldChange(f, v)}
                readOnly={readOnly}
              />
            ) : (
              <NumericField
                key={f}
                label={PRB_FIELD_LABELS[f]}
                field={f}
                value={data[f]}
                onChange={(v) => onFieldChange(f, v)}
                readOnly={readOnly}
              />
            ),
          )}
        </div>
      </div>
    </div>
  );
}

// ── PRB Display (read-only grid) ───────────────────────

export function PRBDisplay({
  kode,
  data,
}: {
  kode: PRBKodeStatus | null;
  data: PRBFormData;
}) {
  if (!kode) return (
    <p className="text-[11px] text-slate-400">Tidak ada data PRB.</p>
  );

  const fields = PRB_FIELDS_BY_KODE[kode];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-[10px] font-bold text-violet-700">
          {kode}
        </span>
        <span className="text-xs font-semibold text-slate-700">{PRB_LABELS[kode]}</span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3">
        {fields.map((f) => {
          const v = data[f];
          let display = "—";
          if (v !== null) {
            if (PRB_FLAG_FIELDS.has(f)) display = v === 1 ? "Ya" : "Tidak";
            else display = String(v);
          }
          return (
            <div key={f} className="flex items-start justify-between gap-1">
              <p className="text-[10px] text-slate-400">{PRB_FIELD_LABELS[f]}</p>
              <p className={cn("text-[10px] font-semibold", v === null ? "text-slate-300" : "text-slate-700")}>
                {display}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
