"use client";

/**
 * KlaimKPIStrip — 4 KPI cards untuk Klaim Board (EK2.1).
 *
 * KPI:
 *  1. Klaim Hari Ini       (teal · count + tarif RS)
 *  2. Pending Verifikasi   (sky · count + nominal menunggu)
 *  3. Rejected Bulan Ini   (rose · count + selisih)
 *  4. Approval Rate        (emerald · % + nominal disetujui/paid)
 *
 * Setiap kartu animasi stagger-up dan punya accent bar kiri.
 */

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

import { cn } from "@/lib/utils";
import { KPI_DEFS, KLAIM_TONE, type KlaimFilterState } from "./klaimBoardShared";
import { KLAIM_BOARD_MOCK, computeKPIs } from "./klaimBoardLogic";

const TREND_ICON = { up: TrendingUp, down: TrendingDown, flat: Minus };

interface Props {
  filters: KlaimFilterState;
}

export default function KlaimKPIStrip({ filters }: Props) {
  const kpis = computeKPIs(KLAIM_BOARD_MOCK, filters);

  return (
    <section
      aria-label="Ringkasan KPI Klaim"
      className="grid gap-3 px-4 pt-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4"
    >
      {kpis.map((kpi, idx) => {
        const def = KPI_DEFS[idx];
        const tone = KLAIM_TONE[def.tone];
        const TrendIcon = kpi.trend ? TREND_ICON[kpi.trend.sign] : null;
        const Icon = def.icon;

        return (
          <motion.article
            key={kpi.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: idx * 0.05, ease: "easeOut" }}
            className={cn(
              "group relative overflow-hidden rounded-xl bg-white p-4 ring-1 transition-all duration-200",
              "hover:-translate-y-0.5 hover:shadow-md",
              tone.ringIdle,
              tone.ringHover,
            )}
          >
            {/* Accent bar (left) */}
            <div
              className={cn(
                "pointer-events-none absolute inset-y-0 left-0 w-1 bg-linear-to-b to-transparent",
                tone.barFrom,
              )}
            />

            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  {kpi.label}
                </p>
                <p className={cn("mt-1.5 text-[22px] font-bold leading-tight tracking-tight tabular-nums", tone.valueText)}>
                  {kpi.value}
                </p>
                <p className="mt-0.5 text-[12.5px] text-slate-500">{kpi.sub}</p>
              </div>

              <span
                className={cn(
                  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1",
                  tone.iconBg,
                  tone.iconText,
                  tone.ringIdle,
                )}
                aria-hidden
              >
                <Icon size={16} />
              </span>
            </div>

            {kpi.trend && TrendIcon && (
              <div
                className={cn(
                  "mt-3 inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-1 text-[11.5px] font-medium",
                  tone.chipText,
                )}
              >
                <TrendIcon size={11} />
                <span>{kpi.trend.text}</span>
              </div>
            )}
          </motion.article>
        );
      })}
    </section>
  );
}
