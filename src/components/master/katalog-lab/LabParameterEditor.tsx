"use client";

// Editor satu PARAMETER (analit) dalam sebuah tes. Tipe hasil Numerik → satuan + rentang
// rujukan (per gender/usia) + nilai kritis + delta; Kualitatif → nilai normal teks. Parent
// (LabParameterTab) mengelola array parameter; komponen ini mem-patch satu parameter.

import { motion } from "framer-motion";
import { Plus, Trash2, ChevronUp, ChevronDown, GripVertical, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type LabParameterRow, type LabRujukanRow, emptyLabRujukan,
} from "@/lib/master/labTestCatalog";
import SatuanCombobox from "./SatuanCombobox";

const cellInput =
  "w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-800 " +
  "placeholder:text-slate-400 outline-none transition hover:border-slate-300 " +
  "focus:border-sky-400 focus:ring-1 focus:ring-sky-100";

interface Props {
  param: LabParameterRow;
  index: number;
  total: number;
  onPatch: (patch: Partial<LabParameterRow>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}

const GENDERS = [
  { value: "LP", label: "Semua" },
  { value: "L", label: "L" },
  { value: "P", label: "P" },
] as const;

function patchRow(rows: LabRujukanRow[], id: string, patch: Partial<LabRujukanRow>): LabRujukanRow[] {
  return rows.map((r) => (r.id === id ? { ...r, ...patch } : r));
}

function numOrUndef(v: string): number | undefined {
  return v === "" ? undefined : Number(v);
}

export default function LabParameterEditor({ param, index, total, onPatch, onRemove, onMove }: Props) {
  const numerik = param.tipeHasil === "Numerik";
  const rows = param.rujukan;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-slate-200 bg-white shadow-sm"
    >
      {/* Header: urutan + nama + reorder + hapus */}
      <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[10px] font-bold text-slate-500">
          {index + 1}
        </span>
        <GripVertical size={13} className="hidden shrink-0 text-slate-300 sm:block" />
        <input
          type="text"
          value={param.nama}
          onChange={(e) => onPatch({ nama: e.target.value })}
          placeholder="Nama parameter (mis. Hemoglobin)…"
          className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-semibold text-slate-800 placeholder:font-normal placeholder:text-slate-400 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
        />
        <div className="flex shrink-0 items-center">
          <button
            type="button"
            onClick={() => onMove(-1)}
            disabled={index === 0}
            aria-label="Naikkan parameter"
            className="rounded p-1 text-slate-300 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronUp size={14} />
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            aria-label="Turunkan parameter"
            className="rounded p-1 text-slate-300 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronDown size={14} />
          </button>
          <button
            type="button"
            onClick={onRemove}
            aria-label="Hapus parameter"
            className="rounded p-1 text-slate-300 transition hover:bg-rose-50 hover:text-rose-500"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="space-y-3 p-3">
        {/* Tipe hasil + Satuan */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Tipe Hasil</span>
            <div className="flex gap-0.5 rounded-lg border border-slate-200 bg-slate-50 p-0.5">
              {(["Numerik", "Kualitatif"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => onPatch({ tipeHasil: t })}
                  className={cn(
                    "rounded-md px-3 py-1 text-xs font-semibold transition",
                    param.tipeHasil === t ? "bg-sky-600 text-white shadow-sm" : "text-slate-500 hover:bg-white",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {numerik ? (
            <div className="flex w-40 flex-col gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Satuan</span>
              <SatuanCombobox value={param.satuan} onChange={(v) => onPatch({ satuan: v })} />
            </div>
          ) : (
            <label className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Nilai Normal</span>
              <input
                type="text"
                value={param.nilaiNormalText ?? ""}
                onChange={(e) => onPatch({ nilaiNormalText: e.target.value })}
                placeholder='mis. "Negatif", "A / B / AB / O", "< 1/160"'
                className={cn(cellInput, "py-2")}
              />
            </label>
          )}

          <label className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Metode (opsional)</span>
            <input
              type="text"
              value={param.metode ?? ""}
              onChange={(e) => onPatch({ metode: e.target.value || undefined })}
              placeholder="Override metode tes…"
              className={cn(cellInput, "py-2")}
            />
          </label>
        </div>

        {/* Numerik: rentang rujukan + kritis + delta */}
        {numerik && (
          <>
            <div className="overflow-auto rounded-lg border border-slate-200">
              <table className="w-full min-w-[520px] text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-left text-slate-500">
                    <th className="px-2 py-1.5 font-semibold">Gender</th>
                    <th className="px-2 py-1.5 font-semibold">Usia min</th>
                    <th className="px-2 py-1.5 font-semibold">Usia maks</th>
                    <th className="px-2 py-1.5 font-semibold">Batas bawah</th>
                    <th className="px-2 py-1.5 font-semibold">Batas atas</th>
                    <th className="px-2 py-1.5 font-semibold">Keterangan</th>
                    <th className="w-7 px-1 py-1.5" />
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-3 py-3 text-center text-[11px] text-slate-400">
                        Belum ada rentang rujukan — klik “+ Rentang”.
                      </td>
                    </tr>
                  )}
                  {rows.map((row) => (
                    <tr key={row.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                      <td className="px-1.5 py-1">
                        <div className="flex gap-0.5 rounded border border-slate-200 bg-slate-50 p-0.5">
                          {GENDERS.map(({ value, label }) => (
                            <button
                              key={value}
                              type="button"
                              title={value === "LP" ? "Laki-laki & Perempuan" : value === "L" ? "Laki-laki" : "Perempuan"}
                              onClick={() => onPatch({ rujukan: patchRow(rows, row.id, { gender: value }) })}
                              className={cn(
                                "flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold transition",
                                row.gender === value ? "bg-sky-600 text-white shadow-sm" : "text-slate-500 hover:bg-white",
                              )}
                            >
                              {value === "LP" && <Users size={9} />}
                              {label}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="px-1.5 py-1">
                        <input
                          type="number" min={0}
                          value={row.usiaMin ?? ""}
                          onChange={(e) => onPatch({ rujukan: patchRow(rows, row.id, { usiaMin: numOrUndef(e.target.value) }) })}
                          placeholder="—" className={cn(cellInput, "w-16")}
                        />
                      </td>
                      <td className="px-1.5 py-1">
                        <input
                          type="number" min={0}
                          value={row.usiaMax ?? ""}
                          onChange={(e) => onPatch({ rujukan: patchRow(rows, row.id, { usiaMax: numOrUndef(e.target.value) }) })}
                          placeholder="—" className={cn(cellInput, "w-16")}
                        />
                      </td>
                      <td className="px-1.5 py-1">
                        <input
                          type="number" step="any"
                          value={row.low}
                          onChange={(e) => onPatch({ rujukan: patchRow(rows, row.id, { low: Number(e.target.value) }) })}
                          className={cn(cellInput, "w-20")}
                        />
                      </td>
                      <td className="px-1.5 py-1">
                        <input
                          type="number" step="any"
                          value={row.high}
                          onChange={(e) => onPatch({ rujukan: patchRow(rows, row.id, { high: Number(e.target.value) }) })}
                          className={cn(cellInput, "w-20")}
                        />
                      </td>
                      <td className="px-1.5 py-1">
                        <input
                          type="text"
                          value={row.keterangan ?? ""}
                          onChange={(e) => onPatch({ rujukan: patchRow(rows, row.id, { keterangan: e.target.value || undefined }) })}
                          placeholder="Opsional…" className={cellInput}
                        />
                      </td>
                      <td className="px-1 py-1 text-right">
                        <button
                          type="button"
                          onClick={() => onPatch({ rujukan: rows.filter((r) => r.id !== row.id) })}
                          aria-label="Hapus rentang"
                          className="rounded p-1 text-slate-300 transition hover:bg-rose-50 hover:text-rose-500"
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              onClick={() => onPatch({ rujukan: [...rows, emptyLabRujukan()] })}
              className="flex w-fit items-center gap-1.5 rounded-lg border border-dashed border-emerald-300 px-3 py-1.5 text-xs font-medium text-emerald-600 transition hover:border-emerald-400 hover:bg-emerald-50"
            >
              <Plus size={12} /> Rentang
            </button>

            {/* Nilai kritis + delta */}
            <div className="grid grid-cols-2 gap-3 rounded-lg border border-amber-100 bg-amber-50/40 p-2.5 sm:grid-cols-4">
              <CritField label="Kritis bawah" value={param.criticalLow} onChange={(v) => onPatch({ criticalLow: v })} />
              <CritField label="Kritis atas" value={param.criticalHigh} onChange={(v) => onPatch({ criticalHigh: v })} />
              <CritField label="Delta absolut" value={param.deltaAbsolute} onChange={(v) => onPatch({ deltaAbsolute: v })} />
              <CritField label="Delta %" value={param.deltaPercent} onChange={(v) => onPatch({ deltaPercent: v })} />
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

function CritField({
  label, value, onChange,
}: {
  label: string; value: number | undefined; onChange: (v: number | undefined) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-700/80">{label}</span>
      <input
        type="number" step="any"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
        placeholder="—"
        className="w-full rounded border border-amber-200 bg-white px-2 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-amber-400 focus:ring-1 focus:ring-amber-100"
      />
    </label>
  );
}
