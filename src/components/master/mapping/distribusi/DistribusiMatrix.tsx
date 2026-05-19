"use client";

import { motion } from "framer-motion";
import { Package, Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type ObatRecord, type ObatKategori,
  OBAT_KATEGORI_CFG, KATEGORI_OBAT_ORDER,
  groupObatByKategori,
} from "@/lib/master/obatMock";
import { type DepoRecord, DEPO_TIPE_CFG } from "@/lib/master/depoMock";
import {
  type DistribusiMap, getCell, getStokStatus, STOK_STATUS_CFG,
} from "./distribusiShared";

interface DistribusiMatrixProps {
  obat: ObatRecord[];
  depo: DepoRecord[];
  map: DistribusiMap;
  visibleKategori: Set<ObatKategori>;
  onToggleStock: (obatId: string, depoId: string) => void;
}

export default function DistribusiMatrix({
  obat, depo, map, visibleKategori, onToggleStock,
}: DistribusiMatrixProps) {
  const grouped = groupObatByKategori(obat);

  const depoCounts = depo.map((d) =>
    obat.filter((o) => visibleKategori.has(o.kategori) && getCell(map, d.id, o.id)).length,
  );

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-20">
            <tr>
              <th className="sticky left-0 z-30 min-w-[280px] border-b border-r border-slate-200 bg-white px-3 py-2 text-left">
                <span className="m-mini font-semibold uppercase tracking-wide text-slate-500">
                  Obat
                </span>
              </th>
              {depo.map((d, i) => {
                const cfg = DEPO_TIPE_CFG[d.tipe];
                return (
                  <th
                    key={d.id}
                    className={cn("min-w-[110px] border-b border-r border-slate-200 px-1.5 py-2 text-center", cfg.bg)}
                  >
                    <div className={cn("flex w-full flex-col items-center gap-0.5", cfg.text)}>
                      <Package size={11} />
                      <span className="m-mini font-bold leading-tight">{d.kode}</span>
                      <span className="m-mini font-mono opacity-70">{depoCounts[i]} item</span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {KATEGORI_OBAT_ORDER.map((cat) => {
              const items = grouped.get(cat) ?? [];
              if (items.length === 0) return null;
              if (!visibleKategori.has(cat)) return null;
              const catCfg = OBAT_KATEGORI_CFG[cat];
              return (
                <KategoriBlock
                  key={cat}
                  kategori={cat}
                  items={items}
                  catCfg={catCfg}
                  depo={depo}
                  map={map}
                  onToggleStock={onToggleStock}
                />
              );
            })}
            {Array.from(visibleKategori).length === 0 && (
              <tr>
                <td colSpan={depo.length + 1} className="px-4 py-10 text-center m-xs text-slate-400">
                  Pilih minimal 1 kategori obat
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="shrink-0 border-t border-slate-100 bg-slate-50/60 px-4 py-2">
        <div className="flex flex-wrap items-center gap-2 m-mini text-slate-500">
          <span className="font-semibold uppercase tracking-wide">Status:</span>
          <Legend status="Aman" />
          <Legend status="Penuh" />
          <Legend status="Rendah" />
          <Legend status="Kritis" />
          <Legend status="Habis" />
          <Legend status="TidakStock" />
          <span className="ml-auto italic">Klik sel kosong → tambah ke depo; klik chip stok → hapus dari depo</span>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────

function Legend({ status }: { status: keyof typeof STOK_STATUS_CFG }) {
  const cfg = STOK_STATUS_CFG[status];
  return (
    <span className="inline-flex items-center gap-1">
      <span className={cn("h-2.5 w-2.5 rounded-full", cfg.dot)} />
      <span className={cfg.text}>{cfg.label}</span>
    </span>
  );
}

interface KategoriBlockProps {
  kategori: ObatKategori;
  items: ObatRecord[];
  catCfg: typeof OBAT_KATEGORI_CFG[ObatKategori];
  depo: DepoRecord[];
  map: DistribusiMap;
  onToggleStock: (obatId: string, depoId: string) => void;
}

function KategoriBlock({
  kategori, items, catCfg, depo, map, onToggleStock,
}: KategoriBlockProps) {
  return (
    <>
      <tr>
        <td
          colSpan={depo.length + 1}
          className={cn("sticky left-0 border-b border-slate-200 px-3 py-1.5", catCfg.bg)}
        >
          <div className="flex items-center gap-1.5">
            <span className={cn("h-2 w-2 rounded-full", catCfg.dot)} />
            <span className={cn("m-mini font-bold uppercase tracking-wide", catCfg.text)}>
              {catCfg.label}
            </span>
            <span className={cn("m-mini opacity-70", catCfg.text)}>· {items.length} obat</span>
          </div>
        </td>
      </tr>
      {items.map((o, i) => (
        <ObatRow
          key={o.id}
          obat={o}
          depo={depo}
          map={map}
          rowIndex={i}
          onToggleStock={onToggleStock}
        />
      ))}
    </>
  );
}

function ObatRow({
  obat, depo, map, rowIndex, onToggleStock,
}: {
  obat: ObatRecord;
  depo: DepoRecord[];
  map: DistribusiMap;
  rowIndex: number;
  onToggleStock: (obatId: string, depoId: string) => void;
}) {
  const stockedCount = depo.filter((d) => !!getCell(map, d.id, obat.id)).length;

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, delay: Math.min(rowIndex * 0.01, 0.2) }}
      className="group hover:bg-slate-50/60"
    >
      <td className="sticky left-0 z-10 min-w-[280px] border-b border-r border-slate-200 bg-white px-3 py-1.5 group-hover:bg-slate-50/60">
        <div className="flex w-full flex-col items-start">
          <div className="flex items-center gap-1.5">
            <span className="truncate m-xs font-semibold text-slate-800">{obat.namaGenerik}</span>
            {obat.isHAM && (
              <span className="rounded px-1 py-0 m-mini font-bold bg-rose-100 text-rose-700">HAM</span>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5">
            <span className="font-mono m-mini text-slate-400">{obat.kode}</span>
            <span className="m-mini text-slate-500">· {obat.bentuk} {obat.kekuatan}</span>
            <span className="ml-auto inline-flex items-center gap-0.5 m-mini font-bold text-rose-700">
              {stockedCount}/{depo.length}
            </span>
          </div>
        </div>
      </td>
      {depo.map((d) => {
        const cell = getCell(map, d.id, obat.id);
        const status = getStokStatus(cell);
        const cfg = STOK_STATUS_CFG[status];

        if (!cell) {
          return (
            <td key={d.id} className="border-b border-r border-slate-200 p-1 text-center">
              <button
                type="button"
                onClick={() => onToggleStock(obat.id, d.id)}
                title="Tambah ke depo"
                className="mx-auto flex h-7 w-full max-w-[90px] items-center justify-center gap-0.5 rounded-md border border-dashed border-slate-200 text-slate-400 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
              >
                <Plus size={11} />
                <span className="m-mini font-semibold">Stock</span>
              </button>
            </td>
          );
        }

        const pct = Math.min(100, Math.round((cell.stok / cell.max) * 100));
        return (
          <td key={d.id} className="border-b border-r border-slate-200 p-1 text-center">
            <div className="mx-auto w-full max-w-[100px]">
              <button
                type="button"
                onClick={() => onToggleStock(obat.id, d.id)}
                title={`Stok ${cell.stok}/${cell.max} (min ${cell.min}) · klik untuk hapus`}
                className={cn(
                  "group/cell relative flex w-full flex-col items-center gap-0.5 rounded-md border px-1 py-1 transition",
                  cfg.bg, cfg.text,
                  "hover:ring-1", cfg.ring,
                )}
              >
                <div className="flex w-full items-center justify-between gap-1">
                  <span className="m-mini font-mono font-bold">{cell.stok}</span>
                  <span className="m-mini opacity-60">/ {cell.max}</span>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-white/60">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.4 }}
                    className={cn("h-full rounded-full", cfg.dot)}
                  />
                </div>
                <Minus size={9} className="absolute right-1 top-1 opacity-0 transition group-hover/cell:opacity-60" />
              </button>
            </div>
          </td>
        );
      })}
    </motion.tr>
  );
}
