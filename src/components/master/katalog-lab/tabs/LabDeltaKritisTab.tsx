"use client";

import { AlertOctagon, TrendingUp, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LabKatalogItem } from "@/lib/master/labCatalogMock";

const numInput =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 " +
  "placeholder:text-slate-400 outline-none transition hover:border-slate-300 " +
  "focus:border-sky-400 focus:ring-2 focus:ring-sky-100 " +
  "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

interface Props {
  draft: LabKatalogItem;
  onPatch: (p: Partial<LabKatalogItem>) => void;
}

function NumField({
  label, value, onChange, placeholder, unit, hint,
}: {
  label: string;
  value?: number;
  onChange: (v: number | undefined) => void;
  placeholder?: string;
  unit?: string;
  hint?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="number"
          step="any"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
          placeholder={placeholder ?? "—"}
          className={cn(numInput, "max-w-[140px]")}
        />
        {unit && <span className="shrink-0 text-xs text-slate-400">{unit}</span>}
      </div>
      {hint && <span className="text-[11px] text-slate-400">{hint}</span>}
    </label>
  );
}

export default function LabDeltaKritisTab({ draft, onPatch }: Props) {
  const hasCritical = draft.criticalLow !== undefined || draft.criticalHigh !== undefined;
  const hasDelta    = draft.deltaAbsolute !== undefined || draft.deltaPercent !== undefined;

  return (
    <div className="space-y-5">
      {/* ── Critical Values ───────────────────────────────── */}
      <div className={cn(
        "rounded-xl border p-4 transition",
        hasCritical ? "border-rose-200 bg-rose-50/60" : "border-slate-200 bg-slate-50/60",
      )}>
        <div className="mb-4 flex items-center gap-2">
          <div className={cn(
            "flex h-7 w-7 items-center justify-center rounded-lg",
            hasCritical ? "bg-rose-100 text-rose-600" : "bg-slate-100 text-slate-400",
          )}>
            <AlertOctagon size={14} />
          </div>
          <div>
            <p className={cn("text-sm font-semibold", hasCritical ? "text-rose-700" : "text-slate-600")}>
              Nilai Kritis (Panic Value)
            </p>
            <p className="text-[11px] text-slate-500">
              Nilai di luar batas ini → flag <strong>C</strong> + laporan wajib ke dokter ≤15 menit.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <NumField
            label="Critical Low"
            value={draft.criticalLow}
            onChange={(v) => onPatch({ criticalLow: v })}
            placeholder="Kosong = tidak ada"
            unit={draft.satuan || undefined}
            hint="Nilai di bawah ini → KRITIS"
          />
          <NumField
            label="Critical High"
            value={draft.criticalHigh}
            onChange={(v) => onPatch({ criticalHigh: v })}
            placeholder="Kosong = tidak ada"
            unit={draft.satuan || undefined}
            hint="Nilai di atas ini → KRITIS"
          />
        </div>

        {/* Visual bar */}
        {hasCritical && (
          <div className="mt-4 rounded-lg border border-rose-100 bg-white px-3 py-2.5">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Visualisasi Range</p>
            <div className="flex items-center gap-2 text-[11px]">
              {draft.criticalLow !== undefined && (
                <span className="rounded bg-rose-100 px-2 py-0.5 font-mono text-rose-700">
                  ← Kritis &lt; {draft.criticalLow}
                </span>
              )}
              <span className="flex-1 rounded bg-emerald-50 px-2 py-0.5 text-center text-emerald-700">
                Normal
              </span>
              {draft.criticalHigh !== undefined && (
                <span className="rounded bg-rose-100 px-2 py-0.5 font-mono text-rose-700">
                  Kritis &gt; {draft.criticalHigh} →
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Delta Check ───────────────────────────────────── */}
      <div className={cn(
        "rounded-xl border p-4 transition",
        hasDelta ? "border-amber-200 bg-amber-50/60" : "border-slate-200 bg-slate-50/60",
      )}>
        <div className="mb-4 flex items-center gap-2">
          <div className={cn(
            "flex h-7 w-7 items-center justify-center rounded-lg",
            hasDelta ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-400",
          )}>
            <TrendingUp size={14} />
          </div>
          <div>
            <p className={cn("text-sm font-semibold", hasDelta ? "text-amber-700" : "text-slate-600")}>
              Delta Check
            </p>
            <p className="text-[11px] text-slate-500">
              Perubahan signifikan antar kunjungan → banner peringatan di HasilPane. Isi salah satu atau keduanya.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <NumField
            label="Delta Absolut"
            value={draft.deltaAbsolute}
            onChange={(v) => onPatch({ deltaAbsolute: v })}
            placeholder="Kosong = nonaktif"
            unit={draft.satuan || undefined}
            hint={`mis. Hb berubah > 2 ${draft.satuan || ""}`}
          />
          <NumField
            label="Delta Persen"
            value={draft.deltaPercent}
            onChange={(v) => onPatch({ deltaPercent: v })}
            placeholder="Kosong = nonaktif"
            unit="%"
            hint="mis. Leukosit berubah > 50%"
          />
        </div>

        {hasDelta && (
          <div className="mt-3 flex gap-2 rounded-lg border border-amber-100 bg-white px-3 py-2.5">
            <Info size={13} className="mt-0.5 shrink-0 text-amber-500" />
            <p className="text-[11px] text-slate-600">
              {draft.deltaAbsolute !== undefined && (
                <span>
                  Jika <strong>{draft.nama || "parameter ini"}</strong> berubah lebih dari{" "}
                  <strong>{draft.deltaAbsolute} {draft.satuan}</strong> antar kunjungan → delta check terpicu.{" "}
                </span>
              )}
              {draft.deltaPercent !== undefined && (
                <span>
                  Jika berubah lebih dari <strong>{draft.deltaPercent}%</strong> → delta check terpicu.
                </span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* SNARS info */}
      <div className="flex gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
        <Info size={12} className="mt-0.5 shrink-0 text-slate-400" />
        <p className="text-[11px] text-slate-500">
          Konfigurasi ini digunakan oleh modul <strong>Lab → HasilPane</strong> (autoFlag C) dan{" "}
          <strong>Trend & Delta</strong> (warning banner). Standar: ISO 15189:2022 §5.6.2 · SNARS AP 5.9.
        </p>
      </div>
    </div>
  );
}
