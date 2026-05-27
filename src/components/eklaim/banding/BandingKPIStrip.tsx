"use client";

/**
 * BandingKPIStrip — 3 animated KPI cards (EK6.1).
 *   1. Total Banding     · teal
 *   2. Approval Rate     · emerald/amber/rose (adaptive)
 *   3. Avg Hari Keputusan · emerald/amber/slate (adaptive)
 */

import { motion } from "framer-motion";
import { Scale, TrendingUp, Clock } from "lucide-react";

import { cn } from "@/lib/utils";
import { BANDING_TONE, type BandingKPIResult, type ToneKey } from "./bandingShared";

const KPI_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  total:         Scale,
  "approval-rate": TrendingUp,
  "avg-days":    Clock,
};

interface Props {
  kpis: BandingKPIResult[];
}

export default function BandingKPIStrip({ kpis }: Props) {
  return (
    <section
      aria-label="Ringkasan KPI Banding"
      className="grid gap-3 px-4 pt-4 sm:grid-cols-3 sm:px-6"
    >
      {kpis.map((kpi, idx) => {
        const tone = BANDING_TONE[kpi.tone as ToneKey];
        const Icon = KPI_ICONS[kpi.id] ?? Scale;

        return (
          <motion.article
            key={kpi.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: idx * 0.06, ease: "easeOut" }}
            className={cn(
              "group relative overflow-hidden rounded-xl bg-white p-4 ring-1 transition-all duration-200",
              "hover:-translate-y-0.5 hover:shadow-md",
              tone.ringIdle,
              tone.ringHover,
            )}
          >
            {/* Left accent bar */}
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
                <p
                  className={cn(
                    "mt-1.5 text-[22px] font-bold leading-tight tracking-tight tabular-nums",
                    tone.valueText,
                  )}
                >
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
          </motion.article>
        );
      })}
    </section>
  );
}
