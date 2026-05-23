"use client";

import { useMemo } from "react";
import { ArrowRight, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type ParsedFile, type ColumnMapping, type IcdField,
  ICD_FIELDS,
} from "./importHelpers";

interface Props {
  parsed: ParsedFile;
  mapping: ColumnMapping;
  onMappingChange: (m: ColumnMapping) => void;
}

const PREVIEW_ROW_COUNT = 5;

export default function StepMapping({ parsed, mapping, onMappingChange }: Props) {
  const previewRows = useMemo(
    () => parsed.rows.slice(0, PREVIEW_ROW_COUNT),
    [parsed.rows],
  );

  // Untuk highlight kolom yang sudah dipakai oleh field tertentu
  const fieldToColIdx = useMemo(() => {
    const map = new Map<IcdField, number>();
    Object.entries(mapping).forEach(([idx, field]) => {
      if (field) map.set(field, Number(idx));
    });
    return map;
  }, [mapping]);

  const requiredMissing = ICD_FIELDS.filter((f) => f.required && !fieldToColIdx.has(f.key));

  const setColumn = (colIdx: number, field: IcdField | null) => {
    onMappingChange({ ...mapping, [colIdx]: field });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* File info */}
      <div className="flex items-center justify-between rounded-lg border border-sky-200 bg-sky-50/60 px-3 py-2 text-[11px]">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={13} className="text-sky-600" />
          <span className="font-semibold text-sky-800">{parsed.fileName}</span>
          <span className="text-slate-500">
            · {parsed.headers.length} kolom · {parsed.totalRows} baris
            {parsed.truncated && (
              <span className="ml-1 text-amber-700">(truncated, preview {parsed.rows.length})</span>
            )}
          </span>
        </div>
      </div>

      {/* Required status */}
      <div className={cn(
        "flex items-start gap-2 rounded-lg border px-3 py-2",
        requiredMissing.length === 0
          ? "border-emerald-200 bg-emerald-50/60"
          : "border-amber-200 bg-amber-50/60",
      )}>
        {requiredMissing.length === 0 ? (
          <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-600" />
        ) : (
          <AlertTriangle size={13} className="mt-0.5 shrink-0 text-amber-600" />
        )}
        <div className="flex-1 text-[11px]">
          <p className={cn(
            "font-semibold",
            requiredMissing.length === 0 ? "text-emerald-800" : "text-amber-800",
          )}>
            {requiredMissing.length === 0
              ? "Semua kolom wajib sudah ter-map"
              : `${requiredMissing.length} kolom wajib belum ter-map`}
          </p>
          {requiredMissing.length > 0 && (
            <p className="mt-0.5 text-amber-700">
              Wajib: {requiredMissing.map((f) => f.label).join(", ")}
            </p>
          )}
        </div>
      </div>

      {/* Mapping table */}
      <section>
        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-600">
          Pemetaan Kolom
        </p>
        <p className="mb-2 text-[10.5px] text-slate-500">
          Setiap kolom file dapat di-map ke satu field target. Auto-detect sudah dijalankan dari nama header — sesuaikan bila perlu.
        </p>

        <div className="overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr className="bg-slate-50">
                <th className="w-12 border-r border-slate-200 px-2 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  #
                </th>
                <th className="border-r border-slate-200 px-2 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Kolom File
                </th>
                <th className="border-r border-slate-200 px-2 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Map ke Field
                </th>
                <th className="px-2 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Sample Data
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {parsed.headers.map((header, idx) => {
                const currentField = mapping[idx];
                const sampleValues = previewRows
                  .map((r) => r[idx] ?? "")
                  .filter(Boolean)
                  .slice(0, 3)
                  .join(" · ");
                return (
                  <tr key={idx} className="hover:bg-slate-50/60">
                    <td className="border-r border-slate-100 px-2 py-1.5 text-center font-mono text-[10px] text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="border-r border-slate-100 px-2 py-1.5">
                      <p className="font-semibold text-slate-700">{header}</p>
                    </td>
                    <td className="border-r border-slate-100 px-2 py-1.5">
                      <FieldSelect
                        value={currentField ?? null}
                        onChange={(v) => setColumn(idx, v)}
                        takenByOther={(f) => {
                          const taken = fieldToColIdx.get(f);
                          return taken !== undefined && taken !== idx;
                        }}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <p className="line-clamp-2 text-[10.5px] italic text-slate-500" title={sampleValues}>
                        {sampleValues || <span className="text-slate-300">—</span>}
                      </p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Preview rows */}
      <section>
        <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-600">
          <ArrowRight size={11} className="text-sky-500" />
          Preview {Math.min(PREVIEW_ROW_COUNT, parsed.rows.length)} Baris Pertama
        </p>
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-[10.5px]">
            <thead className="bg-slate-50">
              <tr>
                {parsed.headers.map((h, i) => {
                  const field = mapping[i];
                  return (
                    <th key={i} className="border-r border-slate-100 px-2 py-1 text-left">
                      <p className="text-[9px] font-semibold uppercase text-slate-400">{h}</p>
                      {field && (
                        <p className="text-[9px] font-bold text-sky-700">
                          → {ICD_FIELDS.find((f) => f.key === field)?.label}
                        </p>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {previewRows.map((row, ri) => (
                <tr key={ri} className="hover:bg-slate-50/60">
                  {parsed.headers.map((_, ci) => (
                    <td key={ci} className="border-r border-slate-100 px-2 py-1 text-slate-700">
                      {row[ci] || <span className="text-slate-300">—</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Footer hint */}
      <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2">
        <Info size={13} className="mt-0.5 shrink-0 text-slate-500" />
        <p className="text-[10.5px] text-slate-600">
          Pastikan kolom <strong>Kode · Nama (ID) · Chapter</strong> sudah ter-map sebelum lanjut ke preview validasi.
        </p>
      </div>
    </div>
  );
}

// ── Field select dropdown ────────────────────────────────

function FieldSelect({
  value, onChange, takenByOther,
}: {
  value: IcdField | null;
  onChange: (v: IcdField | null) => void;
  takenByOther: (f: IcdField) => boolean;
}) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => {
        const v = e.target.value;
        onChange(v === "" ? null : (v as IcdField));
      }}
      className={cn(
        "w-full rounded border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700 outline-none",
        "focus:border-sky-400 focus:ring-2 focus:ring-sky-100",
      )}
    >
      <option value="">— Skip kolom ini —</option>
      {ICD_FIELDS.map((f) => {
        const taken = takenByOther(f.key);
        return (
          <option key={f.key} value={f.key} disabled={taken}>
            {f.label}{f.required ? " *" : ""}{taken ? " (sudah dipakai)" : ""}
          </option>
        );
      })}
    </select>
  );
}
