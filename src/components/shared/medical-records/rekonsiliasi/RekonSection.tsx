"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Plus, Check, ChevronRight, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  emptyEntry,
  type ObatEntry, type RekonData, type RekonPhaseDef,
} from "./rekonsiliasiShared";
import ObatEntryRow from "./ObatEntryRow";

// ── Props ──────────────────────────────────────────────────

interface Props {
  phase:    RekonPhaseDef;
  data:     RekonData;
  onChange: (d: RekonData) => void;
  isOpen:   boolean;
  onToggle: () => void;
}

// ── Component ──────────────────────────────────────────────

export default function RekonSection({ phase, data, onChange, isOpen, onToggle }: Props) {
  const up = (patch: Partial<RekonData>) => onChange({ ...data, ...patch });

  const { Icon, iconColor, accentBorder, accentBg, label, desc } = phase;

  function addObat() {
    up({ obatList: [...data.obatList, emptyEntry()] });
  }

  function updateObat(idx: number, updated: ObatEntry) {
    up({ obatList: data.obatList.map((o, i) => (i === idx ? updated : o)) });
  }

  function removeObat(idx: number) {
    up({ obatList: data.obatList.filter((_, i) => i !== idx) });
  }

  const hamCount = data.obatList.filter((o) => o.isHAM).length;

  return (
    <div className="overflow-hidden">

      {/* ── Accordion header ── */}
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "flex w-full cursor-pointer items-center gap-3 border-l-[3px] px-4 py-3.5 text-left transition-colors duration-150 hover:bg-slate-50/80",
          accentBorder,
          isOpen && accentBg,
        )}
      >
        <Icon size={15} className={cn("shrink-0", iconColor)} aria-hidden />

        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-slate-800">{label}</p>
          <p className="text-[11px] text-slate-400">{desc}</p>
        </div>

        {/* Badges */}
        <div className="flex shrink-0 items-center gap-1.5">
          {hamCount > 0 && (
            <span className="flex items-center gap-0.5 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">
              <AlertTriangle size={8} />{hamCount} HAM
            </span>
          )}
          {data.obatList.length > 0 && (
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-600">
              {data.obatList.length} obat
            </span>
          )}
          <AnimatePresence>
            {data.selesai && (
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 28 }}
                className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"
              >
                <Check size={10} />
              </motion.span>
            )}
          </AnimatePresence>
          <motion.span
            animate={{ rotate: isOpen ? 90 : 0 }}
            transition={{ duration: 0.18 }}
          >
            <ChevronRight size={14} className="text-slate-400" />
          </motion.span>
        </div>
      </button>

      {/* ── Expanded panel ── */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.04, 0.62, 0.23, 0.98] }}
            style={{ overflow: "hidden" }}
          >
            <div className="flex flex-col gap-4 border-t border-slate-100 bg-slate-50/30 px-4 py-4">

              {/* Meta: tanggal + petugas */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Tanggal & Waktu
                  </p>
                  <input
                    type="datetime-local"
                    value={data.tanggal}
                    onChange={(e) => up({ tanggal: e.target.value })}
                    className="w-full border-b border-slate-200 bg-transparent py-1.5 text-xs text-slate-800 outline-none focus:border-indigo-400"
                  />
                </div>
                <div>
                  <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Petugas / Apoteker
                  </p>
                  <input
                    value={data.petugas}
                    onChange={(e) => up({ petugas: e.target.value })}
                    placeholder="Nama petugas..."
                    className="w-full border-b border-slate-200 bg-transparent py-1.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-400"
                  />
                </div>
              </div>

              {/* Obat list */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Daftar Obat
                    {data.obatList.length > 0 && (
                      <span className="ml-1.5 rounded-full bg-indigo-100 px-1.5 py-0.5 font-bold text-indigo-600">
                        {data.obatList.length}
                      </span>
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={addObat}
                    className="flex cursor-pointer items-center gap-1 rounded-md bg-indigo-50 px-2.5 py-1 text-[11px] font-medium text-indigo-600 transition hover:bg-indigo-100"
                  >
                    <Plus size={11} />Tambah Obat
                  </button>
                </div>

                {data.obatList.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="rounded-lg border border-dashed border-slate-200 py-7 text-center text-[11px] text-slate-400"
                  >
                    Belum ada obat — klik "Tambah Obat" untuk mulai
                  </motion.div>
                ) : (
                  <motion.div layout className="flex flex-col gap-1.5">
                    <AnimatePresence>
                      {data.obatList.map((o, idx) => (
                        <ObatEntryRow
                          key={o.id}
                          entry={o}
                          index={idx}
                          onChange={(updated) => updateObat(idx, updated)}
                          onRemove={() => removeObat(idx)}
                        />
                      ))}
                    </AnimatePresence>
                  </motion.div>
                )}
              </div>

              {/* Catatan */}
              <div>
                <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Catatan Rekonsiliasi
                </p>
                <textarea
                  rows={2}
                  value={data.catatan}
                  onChange={(e) => up({ catatan: e.target.value })}
                  placeholder="Catatan tambahan rekonsiliasi..."
                  className="w-full resize-none border-b border-slate-200 bg-transparent py-1 text-xs text-slate-700 placeholder:text-slate-400 outline-none focus:border-indigo-400"
                />
              </div>

              {/* Footer: selesai checkbox + simpan */}
              <div className="flex items-center justify-between">
                <label className="flex cursor-pointer select-none items-center gap-2 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={data.selesai}
                    onChange={(e) => up({ selesai: e.target.checked })}
                    className="h-3.5 w-3.5 rounded accent-indigo-600"
                  />
                  Rekonsiliasi selesai
                </label>
                <button
                  type="button"
                  className="cursor-pointer rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-700"
                >
                  Simpan
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
