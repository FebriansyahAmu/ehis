"use client";

import { motion } from "framer-motion";
import { Radiation, Plus, MousePointer2 } from "lucide-react";

export default function RadiologiEmptyState({
  totalItem, onAddNew,
}: {
  totalItem: number;
  onAddNew: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex h-full flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-slate-200 bg-gradient-to-br from-rose-50/50 via-white to-amber-50/40 p-10 text-center"
    >
      <motion.span
        initial={{ rotate: -8, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm ring-4 ring-rose-100"
      >
        <Radiation size={28} className="text-rose-500" />
      </motion.span>

      <div className="max-w-sm">
        <p className="flex items-center justify-center gap-1.5 text-sm font-bold text-slate-800">
          <MousePointer2 size={13} className="text-slate-400" />
          Pilih pemeriksaan di kiri
        </p>
        <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
          Atau tambah pemeriksaan radiologi baru — lengkapi modalitas, protap persiapan,
          Diagnostic Reference Level (DRL) sesuai PMK 1014/2008, dan reporting template per modalitas.
        </p>
      </div>

      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[10px] font-semibold text-slate-500">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
        {totalItem} pemeriksaan tersedia
      </span>

      <button
        type="button"
        onClick={onAddNew}
        className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-700 active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-rose-300 focus-visible:ring-offset-2"
      >
        <Plus size={12} />
        Tambah Pemeriksaan Baru
      </button>
    </motion.div>
  );
}
