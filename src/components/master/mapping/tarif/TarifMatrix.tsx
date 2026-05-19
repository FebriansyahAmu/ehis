"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Pencil, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type TindakanRecord, type TindakanKategori,
  KATEGORI_CFG, KATEGORI_ORDER, KOMPLEKSITAS_CFG,
  groupByKategori,
} from "@/lib/master/tindakanMock";
import { KELAS_LIST, fmtRupiahShort, type KelasRawat } from "@/lib/master/penjaminMock";
import { type TarifMap, getTarif } from "./tarifShared";

interface TarifMatrixProps {
  tindakan: TindakanRecord[];
  map: TarifMap;
  penjaminId: string;
  visibleKategori: Set<TindakanKategori>;
  onEdit: (tindakanId: string, kelasId: KelasRawat, value: number) => void;
}

export default function TarifMatrix({
  tindakan, map, penjaminId, visibleKategori, onEdit,
}: TarifMatrixProps) {
  const grouped = groupByKategori(tindakan);

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-20">
            <tr>
              <th className="sticky left-0 z-30 min-w-[260px] border-b border-r border-slate-200 bg-white px-3 py-2 text-left">
                <span className="m-mini font-semibold uppercase tracking-wide text-slate-500">
                  Tindakan
                </span>
              </th>
              {KELAS_LIST.map((k) => (
                <th
                  key={k.id}
                  className="min-w-[96px] border-b border-r border-slate-200 bg-amber-50 px-2 py-2 text-center"
                >
                  <p className="m-mini font-bold uppercase tracking-wide text-amber-700">
                    {k.short}
                  </p>
                  <p className="m-mini text-amber-600/70">{k.label}</p>
                </th>
              ))}
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
                  map={map}
                  penjaminId={penjaminId}
                  onEdit={onEdit}
                />
              );
            })}
            {Array.from(visibleKategori).length === 0 && (
              <tr>
                <td colSpan={KELAS_LIST.length + 1} className="px-4 py-10 text-center m-xs text-slate-400">
                  Pilih minimal 1 kategori di toolbar untuk melihat matrix
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="shrink-0 border-t border-slate-100 bg-slate-50/60 px-4 py-2">
        <p className="m-mini text-slate-500">
          <span className="font-semibold uppercase tracking-wide">Tip:</span>{" "}
          Klik sel harga untuk inline-edit. Kelas Rawat Jalan otomatis lebih rendah.
        </p>
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────

interface KategoriBlockProps {
  kategori: TindakanKategori;
  items: TindakanRecord[];
  catCfg: typeof KATEGORI_CFG[TindakanKategori];
  map: TarifMap;
  penjaminId: string;
  onEdit: (tindakanId: string, kelasId: KelasRawat, value: number) => void;
}

function KategoriBlock({
  kategori, items, catCfg, map, penjaminId, onEdit,
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
            <span className={cn("m-mini opacity-70", catCfg.text)}>· {items.length} tindakan</span>
          </div>
        </td>
      </tr>
      {items.map((t, i) => (
        <TindakanRow
          key={t.id}
          tindakan={t}
          map={map}
          penjaminId={penjaminId}
          rowIndex={i}
          onEdit={onEdit}
        />
      ))}
    </>
  );
}

function TindakanRow({
  tindakan, map, penjaminId, rowIndex, onEdit,
}: {
  tindakan: TindakanRecord;
  map: TarifMap;
  penjaminId: string;
  rowIndex: number;
  onEdit: (tindakanId: string, kelasId: KelasRawat, value: number) => void;
}) {
  const kCfg = KOMPLEKSITAS_CFG[tindakan.kompleksitas];

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, delay: Math.min(rowIndex * 0.01, 0.2) }}
      className="group hover:bg-slate-50/60"
    >
      <td className="sticky left-0 z-10 min-w-[260px] border-b border-r border-slate-200 bg-white px-3 py-1.5 group-hover:bg-slate-50/60">
        <div className="flex w-full flex-col items-start">
          <span className="truncate m-xs font-semibold text-slate-800">{tindakan.nama}</span>
          <div className="mt-0.5 flex items-center gap-1.5">
            <span className="font-mono m-mini text-slate-400">{tindakan.kode}</span>
            <span className={cn("rounded px-1 py-0 m-mini font-bold", kCfg.bg, kCfg.text)}>
              {kCfg.label}
            </span>
          </div>
        </div>
      </td>
      {KELAS_LIST.map((k) => {
        const value = getTarif(map, penjaminId, tindakan.id, k.id);
        return (
          <td
            key={k.id}
            className="border-b border-r border-slate-200 p-1 text-center"
          >
            <TarifCell
              value={value}
              onSave={(v) => onEdit(tindakan.id, k.id, v)}
            />
          </td>
        );
      })}
    </motion.tr>
  );
}

function TarifCell({
  value, onSave,
}: {
  value: number;
  onSave: (v: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value.toString());

  const start = () => {
    setDraft(value.toString());
    setEditing(true);
  };

  const commit = () => {
    const n = Number(draft.replace(/[^\d]/g, ""));
    onSave(Number.isFinite(n) ? n : 0);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-0.5">
        <input
          type="text"
          inputMode="numeric"
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") setEditing(false);
          }}
          className="w-full rounded border border-amber-300 bg-amber-50 px-1 py-0.5 m-mini font-mono text-slate-800 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-200"
        />
        <button
          type="button"
          onClick={commit}
          className="flex h-5 w-5 items-center justify-center rounded text-emerald-600 hover:bg-emerald-50"
          title="Simpan (Enter)"
        >
          <Check size={11} />
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="flex h-5 w-5 items-center justify-center rounded text-slate-400 hover:bg-slate-100"
          title="Batal (Esc)"
        >
          <X size={11} />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={start}
      className="group/cell mx-auto flex w-full items-center justify-center gap-1 rounded px-1.5 py-1 m-mini font-mono font-semibold text-slate-700 transition hover:bg-amber-50 hover:text-amber-800"
      title={value ? `Rp ${value.toLocaleString("id-ID")}` : "Belum diisi"}
    >
      <span>{fmtRupiahShort(value)}</span>
      <Pencil size={9} className="opacity-0 transition group-hover/cell:opacity-60" />
    </button>
  );
}
