"use client";

/**
 * KlaimHero — slim teal-accent header untuk Klaim Board (EK2.1).
 *
 * Visual hierarchy:
 * 1. Breadcrumb + module label (eyebrow)
 * 2. H1 title + 1-line description
 * 3. Timestamp pill + primary CTA
 *
 * No long-scroll: header tinggi ~76px desktop / ~96px mobile (CTA wrap).
 */

import { motion } from "framer-motion";
import Link from "next/link";
import { ShieldCheck, ArrowLeft, Plus, Clock3 } from "lucide-react";

interface Props {
  timestamp: string;
}

export default function KlaimHero({ timestamp }: Props) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="border-b border-slate-200 bg-white px-4 py-3 sm:px-6"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        {/* Left: eyebrow + h1 + desc */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link
              href="/ehis-eklaim"
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[12px] font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-teal-700"
              aria-label="Kembali ke Beranda E-Klaim"
            >
              <ArrowLeft size={12} />
              Beranda
            </Link>
            <span className="text-slate-300">·</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-teal-50 ring-1 ring-teal-200">
                <ShieldCheck size={11} className="text-teal-600" />
              </span>
              <span className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-teal-700">
                EHIS E-Klaim · Worklist
              </span>
            </span>
          </div>

          <h1 className="mt-1.5 text-[20px] font-bold tracking-tight text-slate-900 sm:text-[22px]">
            Klaim Board
          </h1>
          <p className="mt-0.5 max-w-2xl text-[13px] text-slate-500">
            Telusuri, koding, dan kirim batch klaim ke BPJS / asuransi — lintas penjamin, status, dan era grouper.
          </p>
        </div>

        {/* Right: timestamp pill + primary CTA */}
        <div className="flex items-center gap-2">
          <span
            className="hidden items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[12px] font-medium text-slate-600 sm:inline-flex"
            title="Waktu sekarang"
          >
            <Clock3 size={12} className="text-teal-500" />
            <span className="font-mono">{timestamp}</span>
          </span>
          <button
            type="button"
            className="group inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-2 text-[13px] font-semibold text-white shadow-sm transition-all duration-200 hover:bg-teal-700 hover:shadow active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 focus-visible:ring-offset-2"
            title="Buat klaim baru manual (EK3 — segera)"
          >
            <Plus size={14} className="transition-transform duration-200 group-hover:rotate-90" />
            Buat Klaim
          </button>
        </div>
      </div>
    </motion.header>
  );
}
