"use client";

import { motion } from "framer-motion";
import { Check, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type TindakanRecord, type TindakanKategori,
  KATEGORI_CFG, KATEGORI_ORDER, KOMPLEKSITAS_CFG, CLINICAL_UNITS_FOR_LAYANAN,
  groupByKategori,
} from "@/lib/master/tindakanMock";
import type { LayananMap } from "./layananShared";
import { hasLayanan, countUnitPerTindakan, countTindakanPerUnit } from "./layananShared";

interface LayananUnitMatrixProps {
  tindakan: TindakanRecord[];
  map: LayananMap;
  visibleKategori: Set<TindakanKategori>;
  onToggle: (tindakanId: string, unitKode: string) => void;
  onToggleRow: (tindakanId: string, granted: boolean) => void;
  onToggleColumn: (unitKode: string, granted: boolean) => void;
}

const UNIT_CATEGORY_CFG: Record<
  "Klinis" | "Poli" | "Penunjang",
  { bg: string; text: string; border: string }
> = {
  Klinis:    { bg: "bg-rose-50",    text: "text-rose-700",   border: "border-rose-200" },
  Poli:      { bg: "bg-sky-50",     text: "text-sky-700",    border: "border-sky-200" },
  Penunjang: { bg: "bg-violet-50",  text: "text-violet-700", border: "border-violet-200" },
};

export default function LayananUnitMatrix({
  tindakan, map, visibleKategori, onToggle, onToggleRow, onToggleColumn,
}: LayananUnitMatrixProps) {
  const grouped = groupByKategori(tindakan);
  const units = CLINICAL_UNITS_FOR_LAYANAN;

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Scrollable matrix container */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          {/* Sticky header row */}
          <thead className="sticky top-0 z-20">
            <tr>
              <th className="sticky left-0 z-30 min-w-[260px] border-b border-r border-slate-200 bg-white px-3 py-2 text-left">
                <span className="m-mini font-semibold uppercase tracking-wide text-slate-500">
                  Tindakan
                </span>
              </th>
              {units.map((u) => {
                const cfg = UNIT_CATEGORY_CFG[u.category];
                const count = countTindakanPerUnit(map, u.kode);
                return (
                  <th
                    key={u.kode}
                    className={cn(
                      "min-w-[56px] border-b border-r border-slate-200 px-1 py-2 text-center",
                      cfg.bg,
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => onToggleColumn(u.kode, count < tindakan.length)}
                      title={`${u.nama} — klik untuk toggle semua tindakan visible`}
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
            {KATEGORI_ORDER.map((cat) => {
              const items = grouped.get(cat) ?? [];
              if (items.length === 0) return null;
              if (!visibleKategori.has(cat)) return null;
              const catCfg = KATEGORI_CFG[cat];
              return (
                <KategoriBlock
                  key={cat}
                  kategori={cat}
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
  kategori: TindakanKategori;
  items: TindakanRecord[];
  catCfg: typeof KATEGORI_CFG[TindakanKategori];
  units: typeof CLINICAL_UNITS_FOR_LAYANAN;
  map: LayananMap;
  onToggle: (tindakanId: string, unitKode: string) => void;
  onToggleRow: (tindakanId: string, granted: boolean) => void;
}

function KategoriBlock({
  kategori, items, catCfg, units, map, onToggle, onToggleRow,
}: KategoriBlockProps) {
  return (
    <>
      <tr>
        <td
          colSpan={units.length + 1}
          className={cn("sticky left-0 border-b border-slate-200 px-3 py-1.5", catCfg.bg)}
        >
          <div className="flex items-center gap-1.5">
            <span className={cn("h-2 w-2 rounded-full", catCfg.dot)} />
            <span className={cn("m-mini font-bold uppercase tracking-wide", catCfg.text)}>
              {catCfg.label}
            </span>
            <span className={cn("m-mini opacity-70", catCfg.text)}>· {items.length} tindakan</span>
          </div>
        </td>
      </tr>
      {items.map((t, i) => (
        <TindakanRow
          key={t.id}
          tindakan={t}
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

function TindakanRow({
  tindakan, units, map, rowIndex, onToggle, onToggleRow,
}: {
  tindakan: TindakanRecord;
  units: typeof CLINICAL_UNITS_FOR_LAYANAN;
  map: LayananMap;
  rowIndex: number;
  onToggle: (tindakanId: string, unitKode: string) => void;
  onToggleRow: (tindakanId: string, granted: boolean) => void;
}) {
  const kCfg = KOMPLEKSITAS_CFG[tindakan.kompleksitas];
  const count = countUnitPerTindakan(map, tindakan.id);
  const allGranted = count === units.length;

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, delay: Math.min(rowIndex * 0.01, 0.2) }}
      className="group hover:bg-slate-50/60"
    >
      <td className="sticky left-0 z-10 min-w-[260px] border-b border-r border-slate-200 bg-white px-3 py-1.5 group-hover:bg-slate-50/60">
        <button
          type="button"
          onClick={() => onToggleRow(tindakan.id, !allGranted)}
          className="flex w-full flex-col items-start text-left"
          title="Klik untuk toggle semua unit"
        >
          <span className="truncate m-xs font-semibold text-slate-800">{tindakan.nama}</span>
          <div className="mt-0.5 flex items-center gap-1.5">
            <span className="font-mono m-mini text-slate-400">{tindakan.kode}</span>
            <span className={cn("rounded px-1 py-0 m-mini font-bold", kCfg.bg, kCfg.text)}>
              {kCfg.label}
            </span>
            <span className="ml-auto inline-flex items-center gap-0.5 m-mini font-bold text-teal-700">
              {count}
            </span>
          </div>
        </button>
      </td>
      {units.map((u) => {
        const granted = hasLayanan(map, tindakan.id, u.kode);
        return (
          <td
            key={u.kode}
            className="border-b border-r border-slate-200 p-1 text-center"
          >
            <button
              type="button"
              onClick={() => onToggle(tindakan.id, u.kode)}
              aria-label={`${tindakan.nama} di ${u.nama}: ${granted ? "boleh" : "tidak boleh"}`}
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
