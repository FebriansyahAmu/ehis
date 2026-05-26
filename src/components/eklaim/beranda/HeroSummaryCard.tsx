"use client";

/**
 * Hero Summary Card V3 — compact 2-row design.
 *
 *  ┌──────────────────────────────────────────────────────┐
 *  │ [teal accent line]                                   │
 *  │  Total Klaim · Bulan Ini  [Hari Ini][7 Hari][Bulan] │  Row 1
 *  │  Rp 245 jt  ↑12%  vs Rp 200 jt   [sparkline]       │
 *  ├──────────────┬──────────────┬──────────────┬─────────┤
 *  │ Hari Ini     │ Pending      │ Belum Submit │ Rate %  │  Row 2
 *  │ 12           │ 8            │ 5            │ 94%     │
 *  └──────────────┴──────────────┴──────────────┴─────────┘
 *
 * Row 1 ≈ 66px · Row 2 ≈ 52px → total ~120px card height.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  EKLAIM_TONE,
  PERIOD_OPTIONS,
  buildSparklinePath,
  calcTrend,
  fmtRupiahKpi,
  getMiniKpis,
  getSparkline14d,
  type EklaimStats,
  type Period,
} from "./berandaEklaimShared";

// ── Period Segmented Control ───────────────────────────

function PeriodSegmented({
  value,
  onChange,
}: {
  value: Period;
  onChange: (v: Period) => void;
}) {
  return (
    <div
      role="tablist"
      className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50/80 p-0.5"
    >
      {PERIOD_OPTIONS.map((opt) => {
        const active = opt.key === value;
        return (
          <button
            key={opt.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.key)}
            className="relative px-2 py-0.5 text-[10px] font-semibold transition focus-visible:outline-none"
          >
            {active && (
              <motion.span
                layoutId="hero-period-active"
                className="absolute inset-0 rounded-sm bg-white shadow-sm ring-1 ring-slate-200"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <span
              className={cn(
                "relative",
                active ? "text-teal-700" : "text-slate-500 hover:text-slate-700",
              )}
            >
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ── Sparkline SVG ──────────────────────────────────────

function Sparkline({ width = 116, height = 32 }: { width?: number; height?: number }) {
  const data = getSparkline14d();
  const { line, area } = buildSparklinePath(data, width, height, 2);
  const maxVal   = Math.max(...data.map((d) => d.count), 1);
  const peakIdx  = data.findIndex((d) => d.count === maxVal);
  const stepX    = (width - 4) / Math.max(1, data.length - 1);
  const peakX    = 2 + peakIdx * stepX;
  const peakY    = 2 + (height - 4) * (1 - data[peakIdx].count / maxVal);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-label="Trend klaim 14 hari terakhir"
      role="img"
      className="overflow-visible"
    >
      <defs>
        <linearGradient id="hero-spark-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="rgb(20 184 166)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="rgb(20 184 166)" stopOpacity="0"    />
        </linearGradient>
      </defs>

      <motion.path
        d={area}
        fill="url(#hero-spark-grad)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      />
      <motion.path
        d={line}
        fill="none"
        stroke="rgb(13 148 136)"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      />
      <motion.circle
        cx={peakX}
        cy={peakY}
        r={2.5}
        fill="white"
        stroke="rgb(13 148 136)"
        strokeWidth={1.5}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.7, type: "spring", stiffness: 300 }}
      />
    </svg>
  );
}

// ── Trend Chip ─────────────────────────────────────────

function TrendChip({
  delta,
  direction,
}: {
  delta: number;
  direction: "up" | "down" | "flat";
}) {
  const Icon =
    direction === "up"
      ? TrendingUp
      : direction === "down"
        ? TrendingDown
        : Minus;
  const cls =
    direction === "up"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
      : direction === "down"
        ? "bg-rose-50 text-rose-700 ring-rose-100"
        : "bg-slate-50 text-slate-600 ring-slate-200";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ring-1",
        cls,
      )}
    >
      <Icon size={10} strokeWidth={2.5} />
      <span className="tabular-nums">{delta >= 0 ? `+${delta}` : delta}%</span>
    </span>
  );
}

// ── KPI Tile (bottom strip) ────────────────────────────

function KpiTile({
  label,
  value,
  hint,
  tone,
  index,
}: {
  label: string;
  value: string;
  hint: string;
  tone: keyof typeof EKLAIM_TONE;
  index: number;
}) {
  const t = EKLAIM_TONE[tone];
  return (
    <motion.div
      initial={{ opacity: 0, y: 3 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: 0.18 + index * 0.04 }}
      className="group relative flex flex-col gap-0 px-3 py-2.5"
    >
      <div className="flex items-center gap-1">
        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", t.dot)} />
        <p className="truncate text-[9px] font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </p>
      </div>
      <p className="mt-0.5 text-[17px] font-black leading-none tabular-nums text-slate-900">
        {value}
      </p>
      <p className="mt-0.5 truncate text-[9.5px] tabular-nums text-slate-500">{hint}</p>
      <span
        className={cn(
          "absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 rounded-b transition-transform duration-300 group-hover:scale-x-100",
          t.bar,
        )}
      />
    </motion.div>
  );
}

// ── Main ───────────────────────────────────────────────

export default function HeroSummaryCard({ stats }: { stats: EklaimStats }) {
  const [period, setPeriod] = useState<Period>("bulan-ini");
  const trend    = calcTrend(period);
  const miniKpis = getMiniKpis(stats);

  const periodLabel =
    period === "hari-ini"
      ? "Hari Ini"
      : period === "minggu-ini"
        ? "7 Hari"
        : "Bulan Ini";

  return (
    <motion.section
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
    >
      {/* Teal accent line */}
      <div className="h-0.5 bg-linear-to-r from-teal-500 via-teal-400 to-teal-300/30" />

      {/* ── Row 1: Featured stat + Sparkline ───────── */}
      <div className="relative flex items-center gap-4 bg-linear-to-br from-white to-teal-50/30 px-4 pt-2.5 pb-2">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-teal-100/20 blur-2xl"
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-[9.5px] font-bold uppercase tracking-widest text-teal-600">
              Total Klaim · {periodLabel}
            </p>
            <PeriodSegmented value={period} onChange={setPeriod} />
          </div>

          <div className="mt-1 flex items-baseline gap-2">
            <h2 className="text-[24px] font-black leading-none tracking-tight tabular-nums text-slate-900">
              {fmtRupiahKpi(trend.currentNominal)}
            </h2>
            <TrendChip delta={trend.deltaPercent} direction={trend.direction} />
          </div>

          <p className="mt-0.5 text-[10px] text-slate-500">
            vs{" "}
            <span className="font-mono font-medium text-slate-700">
              {fmtRupiahKpi(trend.previousNominal)}
            </span>{" "}
            periode lalu
          </p>
        </div>

        <div className="hidden shrink-0 sm:block">
          <Sparkline width={116} height={34} />
        </div>
      </div>

      {/* ── Row 2: 4 KPI strip (divided) ──────────── */}
      <div className="grid grid-cols-4 divide-x divide-slate-100 border-t border-slate-100">
        {miniKpis.map((k, i) => (
          <KpiTile
            key={k.key}
            label={k.label}
            value={k.value}
            hint={k.hint}
            tone={k.tone}
            index={i}
          />
        ))}
      </div>
    </motion.section>
  );
}
