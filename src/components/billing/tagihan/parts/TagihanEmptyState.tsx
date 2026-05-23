"use client";

import { motion } from "framer-motion";
import { SearchX, RotateCcw } from "lucide-react";

interface Props {
  hasActiveFilters: boolean;
  onReset: () => void;
}

export default function TagihanEmptyState({ hasActiveFilters, onReset }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: "easeOut" }}
      className="mx-auto flex max-w-md flex-col items-center justify-center py-10 text-center"
    >
      <motion.span
        initial={{ scale: 0.85, rotate: -8 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 18 }}
        className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 ring-4 ring-amber-100/60 dark:bg-amber-900/30 dark:ring-amber-900/40"
      >
        <SearchX size={22} className="text-amber-600 dark:text-amber-400" />
      </motion.span>

      <h3 className="mt-3.5 text-[14px] font-semibold text-slate-800 dark:text-slate-100">
        {hasActiveFilters ? "Tidak ada tagihan cocok" : "Belum ada tagihan"}
      </h3>
      <p className="mt-1 max-w-sm text-[12.5px] text-slate-500 dark:text-slate-400">
        {hasActiveFilters
          ? "Coba longgarkan filter periode, unit, atau status untuk memperluas hasil."
          : "Tagihan baru akan tampil di sini saat order klinis mulai selesai diproses."}
      </p>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={onReset}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-[12px] font-medium text-amber-700 transition-colors hover:bg-amber-100 hover:border-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
        >
          <RotateCcw size={12} />
          Reset semua filter
        </button>
      )}
    </motion.div>
  );
}
