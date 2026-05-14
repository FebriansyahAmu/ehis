"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import ObatSearch from "@/components/shared/resep/ObatSearch";
import { HAM_BADGE, type ObatCatalog } from "@/components/shared/resep/resepShared";
import {
  KEPUTUSAN_CFG, KEPUTUSAN_OPTS, SUMBER_OPTS, RUTE_OPTS,
  type ObatEntry, type Keputusan,
} from "./rekonsiliasiShared";

// ── Props ──────────────────────────────────────────────────

interface Props {
  entry:    ObatEntry;
  index:    number;
  onChange: (updated: ObatEntry) => void;
  onRemove: () => void;
}

// ── Component ──────────────────────────────────────────────

export default function ObatEntryRow({ entry, index, onChange, onRemove }: Props) {
  const [expanded, setExpanded] = useState(false);

  const set = <K extends keyof ObatEntry>(k: K, v: ObatEntry[K]) =>
    onChange({ ...entry, [k]: v });

  function selectFromCatalog(obat: ObatCatalog) {
    onChange({
      ...entry,
      namaObat: obat.nama,
      dosis:    entry.dosis || `${obat.dosis} ${obat.satuan}`,
      isHAM:    obat.isHAM ?? false,
    });
  }

  const cfg = KEPUTUSAN_CFG[entry.keputusan];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -16, transition: { duration: 0.15 } }}
      transition={{ duration: 0.2, delay: index * 0.04 }}
      className={cn(
        "rounded-lg border transition-colors duration-200",
        entry.isHAM
          ? "border-red-200 bg-red-50/30"
          : "border-slate-100 bg-white",
      )}
    >
      {/* ── Main compact row ── */}
      <div className="grid grid-cols-[1fr_80px_auto_auto_auto] items-center gap-2 px-3 py-2">

        {/* Drug search + HAM badge */}
        <div className="min-w-0">
          <ObatSearch
            value={entry.namaObat}
            onSelect={selectFromCatalog}
            onChange={(text) => set("namaObat", text)}
            placeholder="Cari nama obat..."
            inputCls="w-full border-b border-slate-200 bg-transparent py-1 pl-7 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-400"
          />
          <AnimatePresence>
            {entry.isHAM && (
              <motion.span
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ type: "spring", stiffness: 420, damping: 22 }}
                className={cn("mt-0.5 inline-block", HAM_BADGE)}
              >
                ⚠ HAM
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Dosis */}
        <input
          value={entry.dosis}
          onChange={(e) => set("dosis", e.target.value)}
          placeholder="Dosis..."
          className="w-full border-b border-slate-200 bg-transparent py-1 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-400"
        />

        {/* Keputusan select */}
        <select
          value={entry.keputusan}
          onChange={(e) => set("keputusan", e.target.value as Keputusan)}
          className={cn(
            "shrink-0 cursor-pointer rounded-md px-2 py-0.5 text-[11px] font-semibold outline-none transition-colors",
            cfg.cls,
          )}
        >
          {KEPUTUSAN_OPTS.map((k) => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>

        {/* Expand toggle */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-label="Detail obat"
          className="shrink-0 rounded p-0.5 text-slate-300 transition-colors hover:bg-slate-100 hover:text-slate-500"
        >
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.18 }}>
            <ChevronDown size={13} />
          </motion.div>
        </button>

        {/* Remove */}
        <button
          type="button"
          onClick={onRemove}
          aria-label="Hapus obat"
          className="shrink-0 text-slate-200 transition-colors hover:text-rose-500"
        >
          <Trash2 size={12} />
        </button>
      </div>

      {/* ── Expanded detail panel ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.04, 0.62, 0.23, 0.98] }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-2 border-t border-slate-100 bg-slate-50/60 px-3 pb-3 pt-2.5 sm:grid-cols-4">

              {/* Rute */}
              <div>
                <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Rute</p>
                <select
                  value={entry.rute}
                  onChange={(e) => set("rute", e.target.value)}
                  className="h-7 w-full rounded border border-slate-200 bg-white px-1.5 text-[11px] text-slate-700 outline-none focus:border-indigo-400"
                >
                  {RUTE_OPTS.map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>

              {/* Frekuensi */}
              <div>
                <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Frekuensi</p>
                <input
                  value={entry.frekuensi}
                  onChange={(e) => set("frekuensi", e.target.value)}
                  placeholder="3×1, PRN..."
                  className="h-7 w-full rounded border border-slate-200 bg-white px-1.5 text-[11px] text-slate-800 outline-none focus:border-indigo-400"
                />
              </div>

              {/* Sumber */}
              <div>
                <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Sumber Obat</p>
                <select
                  value={entry.sumber}
                  onChange={(e) => set("sumber", e.target.value)}
                  className="h-7 w-full rounded border border-slate-200 bg-white px-1.5 text-[11px] text-slate-700 outline-none focus:border-indigo-400"
                >
                  {SUMBER_OPTS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>

              {/* Ganti dengan — conditional */}
              {entry.keputusan === "Sesuaikan" && (
                <div>
                  <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Ganti Dengan</p>
                  <input
                    value={entry.gantiDengan ?? ""}
                    onChange={(e) => set("gantiDengan", e.target.value)}
                    placeholder="Obat / dosis / rute pengganti..."
                    className="h-7 w-full rounded border border-slate-200 bg-white px-1.5 text-[11px] text-slate-800 outline-none focus:border-indigo-400"
                  />
                </div>
              )}

              {/* Alasan klinis — full width */}
              <div className={cn("col-span-2", entry.keputusan === "Sesuaikan" ? "sm:col-span-4" : "sm:col-span-4")}>
                <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Alasan Klinis</p>
                <input
                  value={entry.alasan ?? ""}
                  onChange={(e) => set("alasan", e.target.value)}
                  placeholder="Alasan klinis keputusan (opsional)..."
                  className="h-7 w-full rounded border border-slate-200 bg-white px-1.5 text-[11px] text-slate-800 outline-none focus:border-indigo-400"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
