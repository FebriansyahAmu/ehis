"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { type PenjaminTipe, PENJAMIN_TIPE_CFG } from "@/lib/master/penjaminMock";

interface BulkAdjustModalProps {
  open: boolean;
  /** Hanya butuh nama+tipe (Tarif pakai TarifPenjamin, bukan PenjaminRecord penuh). */
  penjamin: { nama: string; tipe: PenjaminTipe };
  affectedCount: number;
  onClose: () => void;
  onConfirm: (percent: number) => void;
}

const PRESETS = [-10, -5, 5, 10, 15];

export default function BulkAdjustModal({
  open, penjamin, affectedCount, onClose, onConfirm,
}: BulkAdjustModalProps) {
  const [percent, setPercent] = useState(5);

  const handleConfirm = () => {
    onConfirm(percent);
    onClose();
  };

  const isUp = percent > 0;
  const isDown = percent < 0;
  const cfg = PENJAMIN_TIPE_CFG[penjamin.tipe];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div>
                <h3 className="m-sm font-bold text-slate-900">Bulk Update Tarif</h3>
                <p className="mt-0.5 m-mini text-slate-500">
                  Sesuaikan tarif visible di matrix dengan persentase
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={14} />
              </button>
            </div>

            <div className="px-4 py-3">
              <div className={cn("rounded-lg border px-3 py-2", cfg.bg, "border-transparent")}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={cn("m-mini font-medium uppercase tracking-wide opacity-70", cfg.text)}>
                      Penjamin Aktif
                    </p>
                    <p className={cn("m-sm font-bold", cfg.text)}>{penjamin.nama}</p>
                  </div>
                  <span className={cn("rounded px-1.5 py-0.5 m-mini font-semibold", "bg-white/60", cfg.text)}>
                    {affectedCount} tindakan
                  </span>
                </div>
              </div>

              <div className="mt-3">
                <label className="m-mini font-semibold uppercase tracking-wide text-slate-500">
                  Persentase Perubahan
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPercent((p) => p - 1)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
                  >
                    −
                  </button>
                  <div className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    {isUp && <TrendingUp size={14} className="text-emerald-600" />}
                    {isDown && <TrendingDown size={14} className="text-rose-600" />}
                    <input
                      type="number"
                      value={percent}
                      onChange={(e) => setPercent(Number(e.target.value) || 0)}
                      className={cn(
                        "w-16 bg-transparent text-center m-base font-black tabular-nums outline-none",
                        isUp && "text-emerald-700",
                        isDown && "text-rose-700",
                        !isUp && !isDown && "text-slate-700",
                      )}
                    />
                    <span className="m-sm font-bold text-slate-500">%</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPercent((p) => p + 1)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
                  >
                    +
                  </button>
                </div>

                <div className="mt-2 flex flex-wrap gap-1">
                  {PRESETS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPercent(p)}
                      className={cn(
                        "rounded-md border px-2 py-0.5 m-mini font-semibold transition",
                        percent === p
                          ? "border-amber-300 bg-amber-100 text-amber-800"
                          : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
                      )}
                    >
                      {p > 0 ? `+${p}%` : `${p}%`}
                    </button>
                  ))}
                </div>
              </div>

              <p className="mt-3 rounded-lg bg-slate-50 px-2.5 py-2 m-mini text-slate-500">
                Pembulatan otomatis ke kelipatan Rp 500. Hanya tarif visible (kategori yang difilter)
                yang akan ter-update. Aksi dapat di-rollback dengan tombol Reset.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-4 py-2.5">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 m-xs font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={percent === 0}
                className={cn(
                  "rounded-lg px-3 py-1.5 m-xs font-semibold text-white transition",
                  percent === 0
                    ? "cursor-not-allowed bg-slate-300"
                    : isUp
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-rose-600 hover:bg-rose-700",
                )}
              >
                {isUp ? "Naikkan" : "Turunkan"} {Math.abs(percent)}%
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
