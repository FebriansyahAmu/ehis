"use client";

import { motion } from "framer-motion";
import { Check, Building2, FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type LayananMap, type LayananUnit, type LayananRow, type RowKategori,
  ROW_KATEGORI_CFG, ROW_KATEGORI_ORDER, groupRowsByKategori,
  hasLayanan, countUnitPerRow, countRowsPerUnit, UNIT_CATEGORY_CFG,
} from "./layananShared";

interface LayananUnitMatrixProps {
  rows: LayananRow[];
  units: LayananUnit[];
  map: LayananMap;
  visibleKategori: Set<RowKategori>;
  onToggle: (rowId: string, unitKode: string) => void;
  onToggleRow: (rowId: string, granted: boolean) => void;
  onToggleColumn: (unitKode: string, granted: boolean) => void;
}

export default function LayananUnitMatrix({
  rows, units, map, visibleKategori, onToggle, onToggleRow, onToggleColumn,
}: LayananUnitMatrixProps) {
  const grouped = groupRowsByKategori(rows);

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Scrollable matrix container */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          {/* Sticky header row */}
          <thead className="sticky top-0 z-20">
            <tr>
              <th className="sticky left-0 z-30 min-w-65 border-b border-r border-slate-200 bg-white px-3 py-2 text-left">
                <span className="m-mini font-semibold uppercase tracking-wide text-slate-500">
                  Tindakan &amp; Tes Lab
                </span>
              </th>
              {units.map((u) => {
                const cfg = UNIT_CATEGORY_CFG[u.category];
                const count = countRowsPerUnit(map, u.kode);
                return (
                  <th
                    key={u.kode}
                    className={cn(
                      "min-w-14 border-b border-r border-slate-200 px-1 py-2 text-center",
                      cfg.bg,
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => onToggleColumn(u.kode, count < rows.length)}
                      title={`${u.nama} — klik untuk toggle semua baris visible`}
                      className={cn("flex w-full flex-col items-center gap-0.5", cfg.text)}
                    >
                      <Building2 size={11} />
                      <span className="m-mini font-bold leading-none">{u.short}</span>
                      <span className="m-mini font-mono opacity-70 leading-none">{count}</span>
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {ROW_KATEGORI_ORDER.map((cat) => {
              const items = grouped.get(cat) ?? [];
              if (items.length === 0) return null;
              if (!visibleKategori.has(cat)) return null;
              const catCfg = ROW_KATEGORI_CFG[cat];
              return (
                <KategoriBlock
                  key={cat}
                  cat={cat}
                  items={items}
                  catCfg={catCfg}
                  units={units}
                  map={map}
                  onToggle={onToggle}
                  onToggleRow={onToggleRow}
                />
              );
            })}
            {Array.from(visibleKategori).length === 0 && (
              <tr>
                <td colSpan={units.length + 1} className="px-4 py-10 text-center m-xs text-slate-400">
                  Pilih minimal 1 kategori di toolbar untuk melihat matrix
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Legend footer */}
      <div className="shrink-0 border-t border-slate-100 bg-slate-50/60 px-4 py-2">
        <div className="flex flex-wrap items-center gap-3 m-mini text-slate-500">
          <span className="font-semibold uppercase tracking-wide">Legenda:</span>
          <Legend bg="bg-teal-600" label="Boleh dilakukan" />
          <Legend bg="bg-white border border-slate-300" label="Tidak boleh" />
          <span className="inline-flex items-center gap-1">
            <FlaskConical size={11} className="text-cyan-600" /> Tes laboratorium
          </span>
          <span className="ml-auto italic">Klik judul kolom / baris untuk toggle massal</span>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────

function Legend({ bg, label }: { bg: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={cn("h-3 w-3 rounded", bg)} />
      {label}
    </span>
  );
}

interface KategoriBlockProps {
  cat: RowKategori;
  items: LayananRow[];
  catCfg: typeof ROW_KATEGORI_CFG[RowKategori];
  units: LayananUnit[];
  map: LayananMap;
  onToggle: (rowId: string, unitKode: string) => void;
  onToggleRow: (rowId: string, granted: boolean) => void;
}

function KategoriBlock({
  cat, items, catCfg, units, map, onToggle, onToggleRow,
}: KategoriBlockProps) {
  const noun = cat === "Laboratorium" ? "tes" : "tindakan";
  return (
    <>
      <tr>
        <td
          colSpan={units.length + 1}
          className={cn("sticky left-0 border-b border-slate-200 px-3 py-1.5", catCfg.bg)}
        >
          <div className="flex items-center gap-1.5">
            {cat === "Laboratorium" ? (
              <FlaskConical size={11} className={catCfg.text} />
            ) : (
              <span className={cn("h-2 w-2 rounded-full", catCfg.dot)} />
            )}
            <span className={cn("m-mini font-bold uppercase tracking-wide", catCfg.text)}>
              {catCfg.label}
            </span>
            <span className={cn("m-mini opacity-70", catCfg.text)}>· {items.length} {noun}</span>
          </div>
        </td>
      </tr>
      {items.map((row, i) => (
        <LayananRowItem
          key={row.id}
          row={row}
          units={units}
          map={map}
          rowIndex={i}
          onToggle={onToggle}
          onToggleRow={onToggleRow}
        />
      ))}
    </>
  );
}

function LayananRowItem({
  row, units, map, rowIndex, onToggle, onToggleRow,
}: {
  row: LayananRow;
  units: LayananUnit[];
  map: LayananMap;
  rowIndex: number;
  onToggle: (rowId: string, unitKode: string) => void;
  onToggleRow: (rowId: string, granted: boolean) => void;
}) {
  const count = countUnitPerRow(map, row.id);
  // "Toggle baris" hanya menyangkut kolom yang sedang tampak (unit tersembunyi tak diutak-atik).
  const allGranted = units.length > 0 && units.every((u) => hasLayanan(map, row.id, u.kode));

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, delay: Math.min(rowIndex * 0.01, 0.2) }}
      className="group hover:bg-slate-50/60"
    >
      <td className="sticky left-0 z-10 min-w-65 border-b border-r border-slate-200 bg-white px-3 py-1.5 group-hover:bg-slate-50/60">
        <button
          type="button"
          onClick={() => onToggleRow(row.id, !allGranted)}
          className="flex w-full flex-col items-start text-left"
          title="Klik untuk toggle semua unit"
        >
          <span className="flex items-center gap-1 truncate m-xs font-semibold text-slate-800">
            {row.kind === "lab" && <FlaskConical size={11} className="shrink-0 text-cyan-600" />}
            {row.nama}
          </span>
          <div className="mt-0.5 flex w-full items-center gap-1.5">
            <span className="font-mono m-mini text-slate-400">{row.subLabel}</span>
            {row.chip && (
              <span className={cn("rounded px-1 py-0 m-mini font-bold", row.chip.bg, row.chip.text)}>
                {row.chip.label}
              </span>
            )}
            <span className="ml-auto inline-flex items-center gap-0.5 m-mini font-bold text-teal-700">
              {count}
            </span>
          </div>
        </button>
      </td>
      {units.map((u) => {
        const granted = hasLayanan(map, row.id, u.kode);
        return (
          <td
            key={u.kode}
            className="border-b border-r border-slate-200 p-1 text-center"
          >
            <button
              type="button"
              onClick={() => onToggle(row.id, u.kode)}
              aria-label={`${row.nama} di ${u.nama}: ${granted ? "boleh" : "tidak boleh"}`}
              className={cn(
                "mx-auto flex h-6 w-6 items-center justify-center rounded-md border-2 transition",
                granted
                  ? "border-teal-600 bg-teal-600 text-white hover:bg-teal-700"
                  : "border-slate-200 bg-white hover:border-teal-400 hover:bg-teal-50",
              )}
            >
              {granted && <Check size={11} strokeWidth={3} />}
            </button>
          </td>
        );
      })}
    </motion.tr>
  );
}
