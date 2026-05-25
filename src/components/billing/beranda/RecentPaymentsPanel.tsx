"use client";

/**
 * Sidebar feed pembayaran lintas semua shift (Open + Closed).
 * Sort DESC tanggalISO, max 8 entri. Klik baris → invoice detail.
 */

import Link from "next/link";
import { motion } from "framer-motion";
import { History, ChevronRight, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtRupiahShort } from "@/lib/master/penjaminMock";
import { METODE_CFG } from "@/components/billing/invoice/invoiceShared";
import {
  getRecentPaymentsLintasCounter,
  fmtJam,
} from "./berandaBillingShared";

const KATEGORI_TONE: Record<string, { bg: string; text: string }> = {
  Pembayaran: { bg: "bg-emerald-50", text: "text-emerald-700" },
  Deposit:    { bg: "bg-sky-50",     text: "text-sky-700"     },
  Refund:     { bg: "bg-rose-50",    text: "text-rose-700"    },
};

export default function RecentPaymentsPanel() {
  const entries = getRecentPaymentsLintasCounter(8);
  const totalAll = entries
    .filter((e) => e.kategori !== "Refund")
    .reduce((a, e) => a + e.nominal, 0);

  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: 0.15 }}
      className="rounded-xl border border-slate-200 bg-white shadow-sm"
    >
      <header className="flex items-start justify-between gap-2 border-b border-slate-200/80 px-3 py-2.5">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 ring-1 ring-emerald-100">
            <History size={13} className="text-emerald-600" />
          </span>
          <div>
            <h3 className="text-[12.5px] font-bold uppercase tracking-wide text-slate-800">
              Pembayaran Terbaru
            </h3>
            <p className="mt-0.5 text-[10.5px] text-slate-500">
              Lintas counter · sort terbaru
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[9.5px] uppercase tracking-widest text-slate-400">Subtotal</p>
          <p className="font-mono text-[11.5px] font-bold tabular-nums text-emerald-700">
            {fmtRupiahShort(totalAll)}
          </p>
        </div>
      </header>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center gap-1 py-8 text-center">
          <Inbox size={20} className="text-slate-300" />
          <p className="text-[11px] font-semibold text-slate-500">Belum ada pembayaran</p>
          <p className="text-[10px] text-slate-400">Feed muncul saat counter aktif</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {entries.map((e) => {
            const m = METODE_CFG[e.metode];
            const Icon = m.icon;
            const kategoriCfg = KATEGORI_TONE[e.kategori] ?? KATEGORI_TONE.Pembayaran;
            const isRefund = e.kategori === "Refund";

            return (
              <li key={e.id}>
                <Link
                  href={`/ehis-billing/tagihan/${e.invoiceId}`}
                  className="group flex items-start gap-2 px-3 py-2.5 transition hover:bg-emerald-50/40"
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1",
                      m.bg,
                      m.text,
                      m.ring,
                    )}
                  >
                    <Icon size={12} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-[12px] font-semibold text-slate-800 group-hover:text-slate-900">
                        {e.pasienNama}
                      </p>
                      {e.kategori !== "Pembayaran" && (
                        <span
                          className={cn(
                            "rounded-md px-1.5 py-0 text-[9px] font-semibold",
                            kategoriCfg.bg,
                            kategoriCfg.text,
                          )}
                        >
                          {e.kategori}
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1">
                      <span className="font-mono text-[9.5px] text-slate-400">{e.invoiceNo}</span>
                      <span className="text-[10px] text-slate-300">·</span>
                      <span className="text-[10px] text-slate-500">{e.metode}</span>
                      <span className="text-[10px] text-slate-300">·</span>
                      <span className="text-[10px] text-slate-500">{e.counter}</span>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p
                      className={cn(
                        "font-mono text-[12px] font-bold tabular-nums",
                        isRefund ? "text-rose-600" : "text-slate-800",
                      )}
                    >
                      {isRefund && "−"}
                      {fmtRupiahShort(e.nominal)}
                    </p>
                    <p className="font-mono text-[9.5px] text-slate-400">{fmtJam(e.tanggalISO)}</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <footer className="border-t border-slate-100 px-3 py-2">
        <Link
          href="/ehis-billing/pembayaran"
          className="flex items-center justify-between text-[10.5px] font-semibold text-emerald-600 transition hover:text-emerald-700"
        >
          <span>Buka counter pembayaran</span>
          <ChevronRight size={12} />
        </Link>
      </footer>
    </motion.section>
  );
}
