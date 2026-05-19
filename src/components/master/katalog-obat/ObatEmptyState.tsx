"use client";

import { motion } from "framer-motion";
import { Pill, Plus } from "lucide-react";

interface ObatEmptyStateProps {
  totalObat: number;
  onAddNew: () => void;
}

export default function ObatEmptyState({ totalObat, onAddNew }: ObatEmptyStateProps) {
  return (
    <section className="flex h-full min-w-0 flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="max-w-md px-6 text-center">
        <motion.span
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-violet-50"
        >
          <Pill size={26} className="text-violet-600" />
        </motion.span>

        <motion.h3
          initial={{ y: 6, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.25, delay: 0.1 }}
          className="mt-4 m-base font-bold text-slate-900"
        >
          Pilih obat di sebelah kiri
        </motion.h3>
        <motion.p
          initial={{ y: 6, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.25, delay: 0.15 }}
          className="mt-1 m-xs text-slate-500"
        >
          Atau tambah obat baru untuk mengelola identitas, klasifikasi (HAM/LASA/Golongan),
          informasi klinis, dan harga.
        </motion.p>

        <motion.div
          initial={{ y: 6, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.25, delay: 0.2 }}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5 ring-1 ring-slate-200"
        >
          <span className="m-mini font-semibold text-slate-500">
            Total katalog
          </span>
          <span className="m-sm font-black text-slate-800">{totalObat}</span>
          <span className="m-mini text-slate-400">obat aktif</span>
        </motion.div>

        <motion.button
          type="button"
          onClick={onAddNew}
          initial={{ y: 6, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.25, delay: 0.25 }}
          whileTap={{ scale: 0.97 }}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 m-xs font-semibold text-white shadow-sm transition hover:bg-violet-700"
        >
          <Plus size={12} />
          Tambah Obat Baru
        </motion.button>
      </div>
    </section>
  );
}
