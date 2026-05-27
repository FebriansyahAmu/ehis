"use client";

/**
 * BandingHero — slim header bar for /ehis-eklaim/banding (EK6.1).
 * Teal accent top bar · breadcrumb · title · timestamp · quick stat chip.
 */

import { motion } from "framer-motion";
import { Home, ChevronRight, Scale } from "lucide-react";
import Link from "next/link";

interface Props {
  timestamp: string;
  totalBanding: number;
  pendingCount: number;
}

export default function BandingHero({ timestamp, totalBanding, pendingCount }: Props) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="relative shrink-0 overflow-hidden border-b border-slate-200 bg-linear-to-br from-white via-teal-50/20 to-sky-50/10 px-4 py-3 sm:px-6"
    >
      {/* Accent bar top */}
      <div className="absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-teal-400 via-sky-400 to-emerald-400" />

      <div className="flex items-center justify-between gap-3">
        {/* Left: breadcrumb + title */}
        <div className="min-w-0">
          <nav className="mb-1 flex items-center gap-1 text-[12px] text-slate-500" aria-label="Breadcrumb">
            <Link
              href="/ehis-eklaim"
              className="inline-flex items-center gap-1 rounded px-1 transition-colors hover:text-teal-600"
            >
              <Home size={11} />
              E-Klaim
            </Link>
            <ChevronRight size={10} className="text-slate-300" />
            <span className="font-medium text-slate-700">Banding</span>
          </nav>

          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-teal-500 to-sky-600 shadow-sm ring-1 ring-teal-400/30">
              <Scale size={15} strokeWidth={2.3} className="text-white" />
            </span>
            <div>
              <h1 className="text-[15px] font-extrabold leading-tight tracking-tight text-slate-900">
                Banding &amp; Dispute
              </h1>
              <p className="text-[11.5px] text-slate-500">
                Pengajuan keberatan klaim atas putusan penolakan BPJS / Asuransi
              </p>
            </div>
          </div>
        </div>

        {/* Right: stat chips + timestamp */}
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-0.5 text-[11.5px] font-semibold text-teal-700 ring-1 ring-teal-200">
              {totalBanding} banding
            </span>
            {pendingCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11.5px] font-semibold text-amber-700 ring-1 ring-amber-200">
                {pendingCount} menunggu
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400">{timestamp}</p>
        </div>
      </div>
    </motion.header>
  );
}
