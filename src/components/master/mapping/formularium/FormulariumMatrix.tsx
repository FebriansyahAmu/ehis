"use client";

import { motion } from "framer-motion";
import { Check, Minus, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type ObatRecord, type ObatKategori,
  OBAT_KATEGORI_CFG, KATEGORI_OBAT_ORDER,
  groupObatByKategori,
} from "@/lib/master/obatMock";
import { KELAS_LIST, type KelasRawat } from "@/lib/master/penjaminMock";
import { type FormulariumMap, getCell } from "./formulariumShared";

interface FormulariumMatrixProps {
  obat: ObatRecord[];
  map: FormulariumMap;
  penjaminId: string;
  visibleKategori: Set<ObatKategori>;
  onToggle: (obatId: string, kelasId: KelasRawat) => void;
  onToggleRow: (obatId: string, allowed: boolean) => void;
  onToggleColumn: (kelasId: KelasRawat, allowed: boolean) => void;
}

export default function FormulariumMatrix({
  obat, map, penjaminId, visibleKategori,
  onToggle, onToggleRow, onToggleColumn,
}: FormulariumMatrixProps) {
  const grouped = groupObatByKategori(obat);

  const colCounts = KELAS_LIST.map((k) => {
    let granted = 0;
    for (const o of obat) {
      if (!visibleKategori.has(o.kategori)) continue;
      if (getCell(map, penjaminId, o.id, k.id).allowed) granted++;
    }
    return granted;
  });

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
              {KELAS_LIST.map((k, i) => {
                const totalVisible = obat.filter((o) => visibleKategori.has(o.kategori)).length;
                return (
                  <th
                    key={k.id}
                    className="min-w-[64px] border-b border-r border-slate-200 bg-violet-50 px-1 py-2 text-center"
                  >
                    <button
                      type="button"
                      onClick={() => onToggleColumn(k.id, colCounts[i] < totalVisible)}
                      title={`${k.label} — klik toggle semua obat visible`}
                      className="flex w-full flex-col items-center gap-0.5 text-violet-700"
                    >
                      <span className="m-mini font-bold leading-none">{k.short}</span>
                      <span className="m-mini font-mono opacity-70 leading-none">{colCounts[i]}</span>
                    </button>
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
                  map={map}
                  penjaminId={penjaminId}
                  onToggle={onToggle}
                  onToggleRow={onToggleRow}
                />
              );
            })}
            {Array.from(visibleKategori).length === 0 && (
              <tr>
                <td colSpan={KELAS_LIST.length + 1} className="px-4 py-10 text-center m-xs text-slate-400">
                  Pilih minimal 1 kategori obat di toolbar
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="shrink-0 border-t border-slate-100 bg-slate-50/60 px-4 py-2">
        <div className="flex flex-wrap items-center gap-3 m-mini text-slate-500">
          <span className="font-semibold uppercase tracking-wide">Legenda:</span>
          <Legend icon={Check}  bg="bg-violet-600 text-white" label="Dijamin" />
          <Legend icon={Minus}  bg="bg-white border border-slate-300 text-slate-400" label="Tidak dijamin" />
          <Legend icon={AlertCircle} bg="bg-amber-100 text-amber-700" label="Ada alasan substitusi" />
          <span className="ml-auto italic">Klik judul kolom/baris untuk bulk toggle</span>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────

function Legend({
  icon: Icon, bg, label,
}: {
  icon: React.ElementType;
  bg: string;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={cn("flex h-4 w-4 items-center justify-center rounded", bg)}>
        <Icon size={9} />
      </span>
      {label}
    </span>
  );
}

interface KategoriBlockProps {
  kategori: ObatKategori;
  items: ObatRecord[];
  catCfg: typeof OBAT_KATEGORI_CFG[ObatKategori];
  map: FormulariumMap;
  penjaminId: string;
  onToggle: (obatId: string, kelasId: KelasRawat) => void;
  onToggleRow: (obatId: string, allowed: boolean) => void;
}

function KategoriBlock({
  kategori, items, catCfg, map, penjaminId, onToggle, onToggleRow,
}: KategoriBlockProps) {
  return (
    <>
      <tr>
        <td
          colSpan={KELAS_LIST.length + 1}
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
          map={map}
          penjaminId={penjaminId}
          rowIndex={i}
          onToggle={onToggle}
          onToggleRow={onToggleRow}
        />
      ))}
    </>
  );
}

function ObatRow({
  obat, map, penjaminId, rowIndex, onToggle, onToggleRow,
}: {
  obat: ObatRecord;
  map: FormulariumMap;
  penjaminId: string;
  rowIndex: number;
  onToggle: (obatId: string, kelasId: KelasRawat) => void;
  onToggleRow: (obatId: string, allowed: boolean) => void;
}) {
  const grantedCount = KELAS_LIST.filter((k) => getCell(map, penjaminId, obat.id, k.id).allowed).length;
  const allGranted = grantedCount === KELAS_LIST.length;

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, delay: Math.min(rowIndex * 0.01, 0.2) }}
      className="group hover:bg-slate-50/60"
    >
      <td className="sticky left-0 z-10 min-w-[280px] border-b border-r border-slate-200 bg-white px-3 py-1.5 group-hover:bg-slate-50/60">
        <button
          type="button"
          onClick={() => onToggleRow(obat.id, !allGranted)}
          className="flex w-full flex-col items-start text-left"
          title="Klik toggle semua kelas"
        >
          <div className="flex items-center gap-1.5">
            <span className="truncate m-xs font-semibold text-slate-800">{obat.namaGenerik}</span>
            {obat.isHAM && (
              <span className="rounded px-1 py-0 m-mini font-bold bg-rose-100 text-rose-700">HAM</span>
            )}
            {!obat.isFormularium && (
              <span className="rounded px-1 py-0 m-mini font-bold bg-slate-100 text-slate-500">NF</span>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5">
            <span className="font-mono m-mini text-slate-400">{obat.kode}</span>
            <span className="m-mini text-slate-500">· {obat.bentuk} {obat.kekuatan}</span>
            <span className="ml-auto inline-flex items-center gap-0.5 m-mini font-bold text-violet-700">
              {grantedCount}/{KELAS_LIST.length}
            </span>
          </div>
        </button>
      </td>
      {KELAS_LIST.map((k) => {
        const cell = getCell(map, penjaminId, obat.id, k.id);
        const hasReason = !cell.allowed && !!cell.alasan;
        return (
          <td
            key={k.id}
            className="border-b border-r border-slate-200 p-1 text-center"
          >
            <button
              type="button"
              onClick={() => onToggle(obat.id, k.id)}
              aria-label={`${obat.namaGenerik} di ${k.label}: ${cell.allowed ? "dijamin" : "tidak dijamin"}`}
              title={cell.allowed ? "Dijamin" : (cell.alasan ?? "Tidak dijamin")}
              className={cn(
                "mx-auto flex h-6 w-6 items-center justify-center rounded-md border-2 transition",
                cell.allowed
                  ? "border-violet-600 bg-violet-600 text-white hover:bg-violet-700"
                  : hasReason
                    ? "border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-400"
                    : "border-slate-200 bg-white hover:border-violet-400 hover:bg-violet-50",
              )}
            >
              {cell.allowed ? <Check size={11} strokeWidth={3} /> : hasReason ? <AlertCircle size={11} /> : null}
            </button>
          </td>
        );
      })}
    </motion.tr>
  );
}
