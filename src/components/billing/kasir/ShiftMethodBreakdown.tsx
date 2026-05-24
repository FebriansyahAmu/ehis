"use client";

import { motion } from "framer-motion";
import { PieChart } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtRupiah, METODE_CFG, METODE_ORDER } from "../invoice/invoiceShared";
import type { MetodeBayar } from "../invoice/invoiceShared";
import type { ShiftMetodeBreakdown } from "@/lib/billing/kasirShiftMock";

interface Props {
  breakdown: ShiftMetodeBreakdown;
  title?: string;
  subtitle?: string;
}

/**
 * Method breakdown — stacked horizontal bar + per-metode row dengan ikon + nominal + persen.
 * Dipakai di ActiveShiftCard area + (future BL3.4) di laporan tutup kas.
 */
export default function ShiftMethodBreakdown({
  breakdown, title = "Breakdown Pembayaran", subtitle = "Per metode bayar — sesi shift aktif",
}: Props) {
  const total = METODE_ORDER.reduce((s, m) => s + breakdown[m], 0);

  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      aria-label={title}
      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-2.5 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700">
            <PieChart size={13} />
          </span>
          <div>
            <h3 className="text-[12.5px] font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
            <p className="text-[10.5px] text-slate-500">{subtitle}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">Total</p>
          <p className="font-mono text-[13px] font-bold tabular-nums text-slate-800 dark:text-slate-100">
            {fmtRupiah(total)}
          </p>
        </div>
      </div>

      {/* Stacked bar */}
      <div className="px-4 py-3">
        <div className="flex h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          {METODE_ORDER.map((m) => {
            const nominal = breakdown[m];
            if (nominal === 0) return null;
            const pct = total > 0 ? (nominal / total) * 100 : 0;
            return (
              <motion.div
                key={m}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                title={`${m}: ${fmtRupiah(nominal)} (${pct.toFixed(1)}%)`}
                className={cn("h-full transition-opacity hover:opacity-80", METODE_CFG[m].dot)}
              />
            );
          })}
        </div>

        {/* Rows */}
        <ul className="mt-3 space-y-1.5">
          {METODE_ORDER.map((m, idx) => (
            <MetodeRow
              key={m}
              metode={m}
              nominal={breakdown[m]}
              total={total}
              delay={idx * 0.04}
            />
          ))}
        </ul>
      </div>
    </motion.section>
  );
}

// ── Per-metode row ─────────────────────────────────────

function MetodeRow({
  metode, nominal, total, delay,
}: {
  metode: MetodeBayar;
  nominal: number;
  total: number;
  delay: number;
}) {
  const cfg = METODE_CFG[metode];
  const Icon = cfg.icon;
  const pct = total > 0 ? (nominal / total) * 100 : 0;
  const isEmpty = nominal === 0;

  return (
    <motion.li
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.18, delay }}
      className={cn(
        "grid grid-cols-[28px_minmax(0,1fr)_auto_60px] items-center gap-2 rounded-md px-2 py-1 transition-colors",
        isEmpty
          ? "opacity-50"
          : "hover:bg-slate-50/80 dark:hover:bg-slate-800/40",
      )}
    >
      {/* Icon */}
      <span className={cn(
        "flex h-6 w-6 items-center justify-center rounded ring-1",
        cfg.bg, cfg.text, cfg.ring,
      )}>
        <Icon size={11} />
      </span>

      {/* Label + hint */}
      <div className="min-w-0">
        <p className="text-[11.5px] font-medium text-slate-700 dark:text-slate-300">
          {cfg.label}
        </p>
        <p className="truncate text-[10px] text-slate-400">{cfg.hint}</p>
      </div>

      {/* Nominal */}
      <span className={cn(
        "font-mono text-[12px] font-semibold tabular-nums",
        isEmpty ? "text-slate-400" : "text-slate-800 dark:text-slate-100",
      )}>
        {fmtRupiah(nominal)}
      </span>

      {/* Pct */}
      <span className={cn(
        "text-right font-mono text-[10.5px] tabular-nums",
        isEmpty ? "text-slate-300" : "text-slate-500 dark:text-slate-400",
      )}>
        {pct.toFixed(1)}%
      </span>
    </motion.li>
  );
}
