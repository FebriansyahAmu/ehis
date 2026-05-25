"use client";

/**
 * Sidebar panel — daftar pasien dengan tagihan outstanding terbesar.
 * Sort sisa desc, max 6 entri. Klik baris → deep link ke invoice detail.
 */

import Link from "next/link";
import { motion } from "framer-motion";
import { AlertCircle, ChevronRight, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtRupiahShort, fmtRupiah } from "@/lib/master/penjaminMock";
import {
  getPasienSiapBayar,
  PENJAMIN_TIPE_CFG,
  TONE_PALETTE,
} from "./berandaBillingShared";

export default function PasienSiapBayarPanel() {
  const entries = getPasienSiapBayar(6);
  const totalAll = entries.reduce((a, e) => a + e.sisaNominal, 0);

  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: 0.05 }}
      className="rounded-xl border border-slate-200 bg-white shadow-sm"
    >
      <header className="flex items-start justify-between gap-2 border-b border-slate-200/80 px-3 py-2.5">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-50 ring-1 ring-rose-100">
            <AlertCircle size={13} className="text-rose-600" />
          </span>
          <div>
            <h3 className="text-[12.5px] font-bold uppercase tracking-wide text-slate-800">
              Pasien Siap Bayar
            </h3>
            <p className="mt-0.5 text-[10.5px] text-slate-500">
              Outstanding terbesar · sort sisa
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[9.5px] uppercase tracking-widest text-slate-400">Total</p>
          <p className="font-mono text-[11.5px] font-bold tabular-nums text-rose-700">
            {fmtRupiahShort(totalAll)}
          </p>
        </div>
      </header>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center gap-1 py-8 text-center">
          <User size={20} className="text-slate-300" />
          <p className="text-[11px] font-semibold text-slate-500">Tidak ada outstanding</p>
          <p className="text-[10px] text-slate-400">Semua tagihan sudah lunas</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {entries.map((e, i) => {
            const t = PENJAMIN_TIPE_CFG[e.row.penjamin.tipe];
            const palette = TONE_PALETTE[t.tone];
            return (
              <li key={e.row.id}>
                <Link
                  href={`/ehis-billing/tagihan/${e.row.id}`}
                  className="group block px-3 py-2.5 transition hover:bg-rose-50/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[12px] font-semibold text-slate-800 group-hover:text-slate-900">
                          {e.row.pasien.nama}
                        </p>
                        <span className="font-mono text-[10px] text-slate-400">
                          {e.row.pasien.noRM}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span
                          className={cn(
                            "rounded-md px-1.5 py-0.5 text-[9.5px] font-semibold ring-1",
                            palette.badgeBg,
                            palette.badgeText,
                            palette.ring,
                          )}
                        >
                          {t.label}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {e.row.unit} · {e.row.kelas}
                        </span>
                        <span className="text-[10px] text-slate-400">·</span>
                        <span className="font-mono text-[9.5px] text-slate-400">
                          {e.row.noTagihan}
                        </span>
                      </div>
                      {/* progress bar tipis untuk visualisasi sisa relatif total */}
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <motion.span
                            initial={{ width: 0 }}
                            animate={{ width: `${e.sisaPct}%` }}
                            transition={{ duration: 0.5, delay: 0.1 + i * 0.05 }}
                            className="block h-full bg-rose-400"
                          />
                        </div>
                        <span className="font-mono text-[9.5px] text-slate-400">
                          {e.sisaPct}%
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        title={fmtRupiah(e.sisaNominal)}
                        className="font-mono text-[12.5px] font-bold tabular-nums text-rose-700"
                      >
                        {fmtRupiahShort(e.sisaNominal)}
                      </p>
                      <p className="font-mono text-[9.5px] text-slate-400">
                        dari {fmtRupiahShort(e.row.total)}
                      </p>
                      <ChevronRight
                        size={11}
                        className="ml-auto mt-0.5 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-rose-500"
                      />
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <footer className="border-t border-slate-100 px-3 py-2">
        <Link
          href="/ehis-billing/tagihan?quickTab=outstanding"
          className="flex items-center justify-between text-[10.5px] font-semibold text-rose-600 transition hover:text-rose-700"
        >
          <span>Lihat semua outstanding</span>
          <ChevronRight size={12} />
        </Link>
      </footer>
    </motion.section>
  );
}
