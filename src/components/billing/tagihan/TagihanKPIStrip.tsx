"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { KPI_MOCK, KPI_TONE, type KPIData } from "./tagihanShared";
import { cn } from "@/lib/utils";

const TREND_ICON = { up: TrendingUp, down: TrendingDown, flat: Minus };

export default function TagihanKPIStrip() {
  return (
    <section
      aria-label="Ringkasan KPI Tagihan"
      className="grid gap-3 px-6 pt-5 sm:grid-cols-2 lg:grid-cols-4"
    >
      {KPI_MOCK.map((kpi, idx) => (
        <KPICard key={kpi.id} kpi={kpi} index={idx} />
      ))}
    </section>
  );
}

function KPICard({ kpi, index }: { kpi: KPIData; index: number }) {
  const tone = KPI_TONE[kpi.tone];
  const TrendIcon = kpi.trend ? TREND_ICON[kpi.trend.sign] : null;
  const Icon = kpi.icon;

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.04, ease: "easeOut" }}
      className={cn(
        "group relative overflow-hidden rounded-xl bg-white p-4 ring-1 transition-all duration-200",
        "hover:-translate-y-0.5 hover:shadow-md",
        tone.ringIdle, tone.ringHover,
        "dark:bg-slate-900",
      )}
    >
      {/* Accent bar (left) */}
      <div
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b to-transparent",
          tone.barFrom,
        )}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
            {kpi.label}
          </p>
          <p className={cn("mt-1.5 text-[22px] font-bold leading-tight tracking-tight", tone.valueText, "dark:text-slate-50")}>
            {kpi.value}
          </p>
          {kpi.sub && (
            <p className="mt-0.5 text-[12px] text-slate-500 dark:text-slate-400">
              {kpi.sub}
            </p>
          )}
        </div>

        <span
          className={cn(
            "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1",
            tone.iconBg, tone.iconText, tone.ringIdle,
          )}
          aria-hidden
        >
          <Icon size={16} />
        </span>
      </div>

      {kpi.trend && TrendIcon && (
        <div className={cn(
          "mt-3 inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-1 text-[10.5px] font-medium dark:bg-slate-800",
          tone.trendUp,
        )}>
          <TrendIcon size={11} />
          <span>{kpi.trend.text}</span>
        </div>
      )}
    </motion.article>
  );
}
