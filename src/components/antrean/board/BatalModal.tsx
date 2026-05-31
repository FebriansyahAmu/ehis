"use client";

// ANT2.3 — Modal pembatalan antrean → task 99 + alasan. Pilih Batal / Tidak Hadir.

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AntreanRecord } from "@/lib/antrean/types";

export type BatalMode = "Batal" | "TidakHadir";

const ALASAN_PRESET: Record<BatalMode, string[]> = {
  Batal: ["Pasien membatalkan", "Salah pilih poli/dokter", "Antrean ganda", "Permintaan petugas"],
  TidakHadir: ["Tidak hadir saat dipanggil", "Melebihi batas waktu tunggu", "Pasien pulang"],
};

export function BatalModal({
  record,
  onConfirm,
  onClose,
}: {
  record: AntreanRecord;
  onConfirm: (mode: BatalMode, alasan: string) => void;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<BatalMode>("Batal");
  const [alasan, setAlasan] = useState("");

  const handleConfirm = () => {
    const final = alasan.trim() || ALASAN_PRESET[mode][0];
    onConfirm(mode, final);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
        >
          <div className="flex items-start gap-3 border-b border-slate-100 bg-rose-50/60 px-5 py-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="m-base font-bold text-slate-800">Batalkan Antrean</h3>
              <p className="m-xs text-slate-500">
                {record.nomorAntrean} · {record.pasien.nama} — akan dikirim <span className="font-semibold">task 99</span> ke BPJS.
              </p>
            </div>
            <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex flex-col gap-4 px-5 py-4">
            <div>
              <p className="mb-2 m-xs font-semibold uppercase tracking-wide text-slate-400">Jenis Pembatalan</p>
              <div className="grid grid-cols-2 gap-2">
                <ModeButton active={mode === "Batal"} onClick={() => { setMode("Batal"); setAlasan(""); }} label="Batal" desc="Dibatalkan" />
                <ModeButton active={mode === "TidakHadir"} onClick={() => { setMode("TidakHadir"); setAlasan(""); }} label="Tidak Hadir" desc="No-show" />
              </div>
            </div>

            <div>
              <p className="mb-2 m-xs font-semibold uppercase tracking-wide text-slate-400">Alasan</p>
              <div className="mb-2 flex flex-wrap gap-1.5">
                {ALASAN_PRESET[mode].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAlasan(preset)}
                    className={cn(
                      "rounded-full px-2.5 py-1 m-tiny font-medium ring-1 transition",
                      alasan === preset
                        ? "bg-sky-50 text-sky-700 ring-sky-200"
                        : "bg-white text-slate-500 ring-slate-200 hover:bg-slate-50",
                    )}
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <textarea
                value={alasan}
                onChange={(e) => setAlasan(e.target.value)}
                rows={2}
                placeholder="Tulis alasan…"
                className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 m-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 m-sm font-semibold text-slate-500 transition hover:bg-slate-100"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2 m-sm font-bold text-white shadow-sm transition hover:bg-rose-700 active:bg-rose-800"
            >
              Konfirmasi Pembatalan
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function ModeButton({ active, onClick, label, desc }: { active: boolean; onClick: () => void; label: string; desc: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-start rounded-xl border px-3 py-2.5 text-left transition",
        active ? "border-rose-400 bg-rose-50 ring-2 ring-rose-100" : "border-slate-200 hover:bg-slate-50",
      )}
    >
      <span className={cn("m-sm font-bold", active ? "text-rose-700" : "text-slate-700")}>{label}</span>
      <span className="m-tiny text-slate-400">{desc}</span>
    </button>
  );
}
