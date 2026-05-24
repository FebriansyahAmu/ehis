"use client";

import { motion } from "framer-motion";
import { Wallet, Sparkles, LockOpen, Lock } from "lucide-react";

interface Props {
  timestamp: string;
  hasOpenShift: boolean;
  onBukaShift: () => void;
  onTutupShift: () => void;
}

export default function KasirHero({
  timestamp, hasOpenShift, onBukaShift, onTutupShift,
}: Props) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-950"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        {/* Left: eyebrow + h1 + desc */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-amber-50 ring-1 ring-amber-200">
              <Wallet size={13} className="text-amber-600" />
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-700">
              EHIS Billing · Kasir Counter
            </span>
          </div>
          <h1 className="mt-1.5 text-xl font-bold tracking-tight text-slate-900 sm:text-[22px] dark:text-slate-50">
            Pembayaran &amp; Counter Kasir
          </h1>
          <p className="mt-0.5 max-w-2xl text-[13px] text-slate-500 dark:text-slate-400">
            Buka shift counter, terima pembayaran, dan tutup shift dengan rekonsiliasi kas otomatis.
          </p>
        </div>

        {/* Right: timestamp + CTA */}
        <div className="flex items-center gap-2">
          <span
            className="hidden items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-medium text-slate-600 sm:inline-flex dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            title="Waktu sekarang"
          >
            <Sparkles size={11} className="text-amber-500" />
            <span className="font-mono">{timestamp}</span>
          </span>
          {hasOpenShift ? (
            <button
              type="button"
              onClick={onTutupShift}
              className="group inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-2 text-[13px] font-semibold text-white shadow-sm transition-all duration-200 hover:bg-rose-700 hover:shadow active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50 focus-visible:ring-offset-2"
            >
              <Lock size={14} className="transition-transform duration-200 group-hover:rotate-12" />
              Tutup Shift
            </button>
          ) : (
            <button
              type="button"
              onClick={onBukaShift}
              className="group inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3.5 py-2 text-[13px] font-semibold text-white shadow-sm transition-all duration-200 hover:bg-amber-700 hover:shadow active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 focus-visible:ring-offset-2"
            >
              <LockOpen size={14} className="transition-transform duration-200 group-hover:-rotate-12" />
              Buka Shift Baru
            </button>
          )}
        </div>
      </div>
    </motion.header>
  );
}
