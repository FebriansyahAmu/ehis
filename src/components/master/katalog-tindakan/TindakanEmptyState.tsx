"use client";

import { motion } from "framer-motion";
import { Plus, Zap } from "lucide-react";

interface TindakanEmptyStateProps {
  totalTindakan: number;
  onAddNew: () => void;
}

export default function TindakanEmptyState({ totalTindakan, onAddNew }: TindakanEmptyStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-8 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.35, type: "spring", stiffness: 200 }}
        className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200"
      >
        <Zap size={28} className="text-teal-500" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="mt-4"
      >
        <p className="text-sm font-bold text-slate-800">Pilih Tindakan</p>
        <p className="mt-1 text-xs text-slate-500">
          Klik item di panel kiri untuk melihat & mengedit detail,
          atau tambah tindakan baru ke katalog.
        </p>
        <p className="mt-1 text-[11px] text-slate-400">
          {totalTindakan} tindakan terdaftar
        </p>
      </motion.div>

      <motion.button
        type="button"
        onClick={onAddNew}
        whileTap={{ scale: 0.97 }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="mt-5 inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-white px-3 py-1.5 text-xs font-semibold text-teal-700 shadow-sm transition hover:bg-teal-50"
      >
        <Plus size={12} strokeWidth={2.5} />
        Tambah Tindakan Baru
      </motion.button>
    </div>
  );
}
