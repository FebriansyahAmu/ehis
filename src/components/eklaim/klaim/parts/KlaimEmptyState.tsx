"use client";

/**
 * KlaimEmptyState — saat filter tidak match 1 klaim pun.
 *
 * Teal-themed (selaras dengan modul aksen) · CTA reset filter.
 */

import { motion } from "framer-motion";
import { Inbox, ArrowRight } from "lucide-react";

interface Props {
  onResetFilters: () => void;
}

export default function KlaimEmptyState({ onResetFilters }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="flex h-full flex-col items-center justify-center gap-3 px-6 py-12 text-center"
    >
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-teal-50 ring-1 ring-teal-100">
        <Inbox size={22} className="text-teal-500" />
      </span>
      <div className="space-y-1">
        <p className="text-[14px] font-semibold text-slate-800">Tidak ada klaim yang cocok</p>
        <p className="text-[12.5px] text-slate-500">
          Coba lebarkan periode, kurangi filter penjamin, atau hapus chip status.
        </p>
      </div>
      <button
        type="button"
        onClick={onResetFilters}
        className="inline-flex items-center gap-1.5 rounded-md bg-teal-600 px-3 py-1.5 text-[12.5px] font-semibold text-white shadow-sm transition hover:bg-teal-700 hover:shadow active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50"
      >
        Reset filter
        <ArrowRight size={12} />
      </button>
    </motion.div>
  );
}
