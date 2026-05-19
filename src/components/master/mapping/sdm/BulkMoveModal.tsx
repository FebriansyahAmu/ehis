"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, Users, CheckCircle2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UnitItem, SDMItem } from "./sdmShared";

interface BulkMoveModalProps {
  open: boolean;
  /** Unit asal (sumber pemindahan) */
  fromUnit: UnitItem;
  /** Daftar SDM yang dipilih untuk dipindah */
  selectedSDMs: SDMItem[];
  /** Daftar unit tujuan yang bisa dipilih (exclude fromUnit) */
  availableUnits: UnitItem[];
  onClose: () => void;
  onConfirm: (toUnitKode: string, alsoRemoveFromSource: boolean) => void;
}

export default function BulkMoveModal({
  open, fromUnit, selectedSDMs, availableUnits, onClose, onConfirm,
}: BulkMoveModalProps) {
  const [toKode, setToKode] = useState<string | null>(null);
  const [removeFromSource, setRemoveFromSource] = useState(true);
  const [search, setSearch] = useState("");

  const filteredUnits = useMemo(() => {
    const units = availableUnits.filter((u) => u.kode !== fromUnit.kode);
    if (!search.trim()) return units;
    const q = search.toLowerCase();
    return units.filter((u) =>
      u.nama.toLowerCase().includes(q) || u.kode.toLowerCase().includes(q),
    );
  }, [availableUnits, fromUnit.kode, search]);

  const handleConfirm = () => {
    if (!toKode) return;
    onConfirm(toKode, removeFromSource);
    setToKode(null);
    setSearch("");
  };

  const handleClose = () => {
    setToKode(null);
    setSearch("");
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={handleClose}
            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm"
            aria-hidden="true"
          />
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 4 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="bulk-move-title"
            className="fixed left-1/2 top-1/2 z-50 flex max-h-[85vh] w-[92vw] max-w-xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-3.5">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 ring-2 ring-teal-100">
                  <Users size={16} className="text-teal-600" />
                </span>
                <div>
                  <p id="bulk-move-title" className="m-base font-bold text-slate-900">
                    Pindahkan {selectedSDMs.length} SDM
                  </p>
                  <p className="m-tiny text-slate-500">
                    Dari <span className="font-semibold text-slate-700">{fromUnit.nama}</span> ke unit lain
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Tutup"
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="flex min-h-0 flex-1 flex-col">
              {/* SDM preview */}
              <div className="shrink-0 border-b border-slate-100 px-5 py-3">
                <p className="mb-1.5 m-mini font-semibold uppercase tracking-wide text-slate-400">
                  SDM yang Dipindah
                </p>
                <div className="flex max-h-16 flex-wrap gap-1 overflow-y-auto">
                  {selectedSDMs.slice(0, 6).map((s) => (
                    <span
                      key={s.id}
                      className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 m-tiny text-slate-700"
                    >
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-300 m-mini font-black text-white">
                        {s.initials}
                      </span>
                      <span className="font-semibold">{s.nama.replace(/^dr\.\s+/i, "").split(",")[0]}</span>
                    </span>
                  ))}
                  {selectedSDMs.length > 6 && (
                    <span className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 m-tiny font-bold text-slate-600">
                      +{selectedSDMs.length - 6} lagi
                    </span>
                  )}
                </div>
              </div>

              {/* Arrow + Search destination */}
              <div className="shrink-0 px-5 pb-2 pt-3">
                <div className="mb-2 flex items-center gap-2 m-tiny font-semibold text-slate-500">
                  <span className="font-mono text-slate-700">{fromUnit.nama}</span>
                  <ArrowRight size={11} className="text-teal-500" />
                  <span>Pilih unit tujuan</span>
                </div>
                <div className="relative">
                  <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari unit tujuan..."
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-7 pr-3 m-xs text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100"
                  />
                </div>
              </div>

              {/* Unit list */}
              <div className="flex-1 overflow-y-auto px-3 pb-3">
                {filteredUnits.length === 0 ? (
                  <p className="px-3 py-6 text-center m-xs text-slate-400">
                    Tidak ada unit cocok
                  </p>
                ) : (
                  <div className="flex flex-col gap-0.5">
                    {filteredUnits.map((u) => {
                      const active = toKode === u.kode;
                      return (
                        <button
                          key={u.kode}
                          type="button"
                          onClick={() => setToKode(u.kode)}
                          className={cn(
                            "flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-left transition",
                            active
                              ? "bg-teal-50 ring-1 ring-teal-200"
                              : "hover:bg-slate-50",
                          )}
                        >
                          <div className="min-w-0 flex-1">
                            <p className={cn(
                              "truncate m-xs font-semibold",
                              active ? "text-teal-800" : "text-slate-800",
                            )}>
                              {u.nama}
                            </p>
                            <p className="font-mono m-mini text-slate-400">{u.kode}</p>
                          </div>
                          {active && <CheckCircle2 size={13} className="shrink-0 text-teal-600" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Option toggle */}
              <div className="shrink-0 border-t border-slate-100 px-5 py-3">
                <label className="flex cursor-pointer items-start gap-2 rounded-lg bg-slate-50/60 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={removeFromSource}
                    onChange={(e) => setRemoveFromSource(e.target.checked)}
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-slate-300 text-teal-600 focus:ring-1 focus:ring-teal-200"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="m-xs font-semibold text-slate-700">
                      Hapus dari {fromUnit.nama}
                    </p>
                    <p className="mt-0.5 m-tiny text-slate-500">
                      Jika tidak dicentang, SDM akan ditugaskan ke <span className="font-semibold">dua unit</span> sekaligus.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 m-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!toKode}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3.5 py-2 m-sm font-semibold shadow-sm transition",
                  toKode
                    ? "bg-teal-600 text-white hover:bg-teal-700 active:scale-[0.98]"
                    : "cursor-not-allowed bg-slate-200 text-slate-400",
                )}
              >
                <CheckCircle2 size={12} />
                Pindahkan {selectedSDMs.length} SDM
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
