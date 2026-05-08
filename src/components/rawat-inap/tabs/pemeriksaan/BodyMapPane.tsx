"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ───────────────────────────────────────────────────

export interface BodyMarking { region: string; label: string; catatan: string }

interface Props {
  value: BodyMarking[];
  onChange: (v: BodyMarking[]) => void;
}

// ── Constants ───────────────────────────────────────────────

interface BodyRegion { id: string; label: string; col: number; row: number }

const BODY_REGIONS: BodyRegion[] = [
  { id: "kepala",          label: "Kepala",          col: 2, row: 1 },
  { id: "leher",           label: "Leher",           col: 2, row: 2 },
  { id: "bahu_kiri",       label: "Bahu Ki",         col: 0, row: 3 },
  { id: "dada_kiri",       label: "Dada Ki",         col: 1, row: 3 },
  { id: "dada_kanan",      label: "Dada Ka",         col: 3, row: 3 },
  { id: "bahu_kanan",      label: "Bahu Ka",         col: 4, row: 3 },
  { id: "lengan_kiri",     label: "Lengan Ki",       col: 0, row: 4 },
  { id: "abdomen_kiri",    label: "Abd Ki",          col: 1, row: 4 },
  { id: "abdomen_kanan",   label: "Abd Ka",          col: 3, row: 4 },
  { id: "lengan_kanan",    label: "Lengan Ka",       col: 4, row: 4 },
  { id: "tangan_kiri",     label: "Tangan Ki",       col: 0, row: 5 },
  { id: "punggung_bawah",  label: "Pinggang",        col: 2, row: 5 },
  { id: "tangan_kanan",    label: "Tangan Ka",       col: 4, row: 5 },
  { id: "panggul",         label: "Panggul",         col: 2, row: 6 },
  { id: "paha_kiri",       label: "Paha Ki",         col: 1, row: 7 },
  { id: "paha_kanan",      label: "Paha Ka",         col: 3, row: 7 },
  { id: "lutut_kiri",      label: "Lutut Ki",        col: 1, row: 8 },
  { id: "lutut_kanan",     label: "Lutut Ka",        col: 3, row: 8 },
  { id: "kaki_kiri",       label: "Kaki Ki",         col: 1, row: 9 },
  { id: "kaki_kanan",      label: "Kaki Ka",         col: 3, row: 9 },
];

const GRID_COLS = 5;
const GRID_ROWS = 9;

const MARKING_COLORS = [
  { bg: "bg-rose-500",   text: "text-rose-700",   label: "Luka / Trauma" },
  { bg: "bg-amber-400",  text: "text-amber-700",  label: "Edema" },
  { bg: "bg-sky-500",    text: "text-sky-700",     label: "Lesi / Rash" },
  { bg: "bg-violet-500", text: "text-violet-700",  label: "Dekubitus" },
];

// ── Main ────────────────────────────────────────────────────

export default function BodyMapPane({ value, onChange }: Props) {
  const [selectedColor, setSelectedColor] = useState(0);
  const [editingRegion, setEditingRegion] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const selectedIds = new Set(value.map((m) => m.region));

  function toggleRegion(id: string, label: string) {
    if (selectedIds.has(id)) {
      onChange(value.filter((m) => m.region !== id));
      if (editingRegion === id) setEditingRegion(null);
    } else {
      onChange([...value, { region: id, label, catatan: "" }]);
      setEditingRegion(id);
      setEditText("");
    }
  }

  function saveNote(region: string) {
    onChange(value.map((m) => m.region === region ? { ...m, catatan: editText } : m));
    setEditingRegion(null);
  }

  const grid: (BodyRegion | null)[][] = Array.from({ length: GRID_ROWS }, (_, r) =>
    Array.from({ length: GRID_COLS }, (_, c) =>
      BODY_REGIONS.find((b) => b.row === r + 1 && b.col === c) ?? null
    )
  );

  const colorCfg = MARKING_COLORS[selectedColor];

  return (
    <div className="flex flex-col gap-4">

      {/* Legend/color picker */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mr-1">Jenis Temuan:</span>
        {MARKING_COLORS.map((c, i) => (
          <button key={i} type="button" onClick={() => setSelectedColor(i)}
            className={cn(
              "flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 transition-all",
              selectedColor === i
                ? `${c.bg} text-white ring-transparent`
                : "bg-white text-slate-600 ring-slate-200 hover:ring-slate-300",
            )}>
            <span className={cn("h-2 w-2 rounded-full", c.bg)} />
            {c.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        {/* Body grid */}
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs md:w-60 md:shrink-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Klik area untuk menandai
          </p>
          <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
            {grid.flat().map((region, idx) =>
              region ? (
                <button
                  key={region.id}
                  type="button"
                  onClick={() => toggleRegion(region.id, region.label)}
                  title={region.label}
                  className={cn(
                    "cursor-pointer rounded px-0.5 py-1.5 text-[8px] font-semibold leading-tight transition-colors",
                    selectedIds.has(region.id)
                      ? `${colorCfg.bg} text-white`
                      : "bg-slate-100 text-slate-500 hover:bg-indigo-100 hover:text-indigo-700",
                  )}
                >
                  {region.label.split(" ").map((w) => w.slice(0, 3)).join(" ")}
                </button>
              ) : (
                <div key={idx} />
              )
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 border-t border-slate-100 pt-2">
            {MARKING_COLORS.map((c, i) => (
              <span key={i} className="flex items-center gap-1 text-[9px] text-slate-500">
                <span className={cn("inline-block h-2 w-2 rounded-sm", c.bg)} />
                {c.label}
              </span>
            ))}
          </div>
        </div>

        {/* Notes panel */}
        <div className="flex flex-1 flex-col gap-2">
          <p className="text-xs font-semibold text-slate-700">
            Area Bertanda
            <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
              {value.length}
            </span>
          </p>

          {value.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center text-xs text-slate-400 shadow-xs">
              <p className="font-medium">Belum ada area yang ditandai</p>
              <p className="mt-1">Klik area tubuh di kiri untuk menandai temuan</p>
            </div>
          ) : (
            value.map((marking) => (
              <div key={marking.region} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className={cn("h-2.5 w-2.5 rounded-full", colorCfg.bg)} />
                    <span className="text-xs font-semibold text-slate-800">{marking.label}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleRegion(marking.region, marking.label)}
                    className="cursor-pointer text-slate-300 transition hover:text-rose-500">
                    <Trash2 size={12} />
                  </button>
                </div>
                <div className="px-3 py-2">
                  {editingRegion === marking.region ? (
                    <div className="flex gap-2">
                      <input
                        autoFocus
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && saveNote(marking.region)}
                        placeholder="Deskripsi temuan (tekan Enter untuk simpan)..."
                        className="flex-1 border-b border-slate-200 bg-transparent py-1 text-xs text-slate-700 placeholder:text-slate-400 outline-none focus:border-indigo-400"
                      />
                      <button
                        type="button"
                        onClick={() => saveNote(marking.region)}
                        className="cursor-pointer rounded-md bg-indigo-600 px-2.5 py-1 text-[11px] font-medium text-white transition hover:bg-indigo-700">
                        Simpan
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setEditingRegion(marking.region); setEditText(marking.catatan); }}
                      className="w-full cursor-pointer text-left text-[11px] text-slate-500 transition hover:text-indigo-600">
                      {marking.catatan || <span className="italic text-slate-300">Klik untuk tambah catatan temuan...</span>}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
