"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Info, AlertTriangle } from "lucide-react";
import { buildMarginGroups, type MarginGroup } from "@/lib/eklaim/dashboardShared";
import { formatRupiahShort } from "@/lib/eklaim/money";

// ── Helpers ────────────────────────────────────────────

function absMax(groups: MarginGroup[]): number {
  return Math.max(...groups.map(g => Math.abs(g.avgMarginPct)), 1);
}

// ── Panel ──────────────────────────────────────────────

export default function MarginAnalysisPanel() {
  const groups  = useMemo(() => buildMarginGroups(), []);
  const maxAbs  = useMemo(() => absMax(groups), [groups]);

  const profit  = groups.filter(g => g.avgMarginPct > 0);
  const loss    = groups.filter(g => g.avgMarginPct <= 0);

  const totalPositive = profit.reduce((s, g) => s + g.totalNominal, 0n);
  const totalNegative = loss.reduce((s, g) => s + g.totalNominal, 0n);
  const netMargin = totalPositive + totalNegative; // totalNegative already negative

  return (
    <div className="space-y-5 p-5">
      {/* Panel header */}
      <div>
        <h2 className="text-base font-semibold text-slate-800">Margin iDRG per MDC Group</h2>
        <p className="text-sm text-slate-500">
          Selisih tarif grouper vs tarif RS · per kelompok diagnostik (MDC)
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <SummaryCard
          label="Total Surplus"
          value={formatRupiahShort(totalPositive)}
          sub={`${profit.length} group MDC`}
          Icon={TrendingUp}
          tone="emerald"
        />
        <SummaryCard
          label="Total Defisit"
          value={formatRupiahShort(totalNegative < 0n ? -totalNegative : totalNegative)}
          sub={`${loss.length} group MDC`}
          Icon={TrendingDown}
          tone="rose"
          negative
        />
        <SummaryCard
          label="Net Margin"
          value={formatRupiahShort(netMargin < 0n ? -netMargin : netMargin)}
          sub={netMargin >= 0n ? "Posisi untung bersih" : "Posisi rugi bersih"}
          Icon={netMargin >= 0n ? TrendingUp : TrendingDown}
          tone={netMargin >= 0n ? "teal" : "amber"}
          negative={netMargin < 0n}
        />
      </div>

      {/* Margin chart — all groups */}
      <div className="rounded-xl bg-white ring-1 ring-slate-200">
        <div className="border-b border-slate-100 px-4 py-2.5">
          <p className="text-sm font-semibold text-slate-700">Breakdown per MDC Group</p>
          <p className="text-xs text-slate-400">
            Positif = tarif iDRG &gt; tarif RS (RS untung) · Negatif = RS rugi
          </p>
        </div>

        <div className="divide-y divide-slate-50 px-4">
          {groups.map((g, idx) => {
            const isPositive = g.avgMarginPct > 0;
            const barW = Math.abs(g.avgMarginPct) / maxAbs;
            return (
              <motion.div
                key={g.label}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.04 * idx, duration: 0.2 }}
                className="py-3"
              >
                <div className="mb-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-slate-400">{g.code}</span>
                    <span className="text-sm font-medium text-slate-700">{g.label}</span>
                    <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
                      {g.count} klaim
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-bold tabular-nums ${isPositive ? "text-emerald-600" : "text-rose-600"}`}
                    >
                      {isPositive ? "+" : ""}{g.avgMarginPct.toFixed(1)}%
                    </span>
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums ${
                        isPositive
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      {formatRupiahShort(g.totalNominal < 0n ? -g.totalNominal : g.totalNominal)}
                    </span>
                  </div>
                </div>

                {/* Diverging bar */}
                <div className="flex h-4 items-center gap-0">
                  {/* Left side — negative zone */}
                  <div className="flex flex-1 justify-end overflow-hidden rounded-l-full bg-slate-100">
                    {!isPositive && (
                      <motion.div
                        className="h-full rounded-l-full bg-rose-400"
                        style={{ width: `${barW * 100}%` }}
                        initial={{ width: "0%" }}
                        animate={{ width: `${barW * 100}%` }}
                        transition={{ delay: 0.1 + 0.04 * idx, duration: 0.4, ease: "easeOut" }}
                      />
                    )}
                  </div>
                  {/* Center divider */}
                  <div className="mx-1 h-4 w-px bg-slate-300 shrink-0" />
                  {/* Right side — positive zone */}
                  <div className="flex flex-1 overflow-hidden rounded-r-full bg-slate-100">
                    {isPositive && (
                      <motion.div
                        className="h-full rounded-r-full bg-emerald-400"
                        style={{ width: `${barW * 100}%` }}
                        initial={{ width: "0%" }}
                        animate={{ width: `${barW * 100}%` }}
                        transition={{ delay: 0.1 + 0.04 * idx, duration: 0.4, ease: "easeOut" }}
                      />
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2">
          <span className="flex items-center gap-1 text-xs text-rose-500">
            <span className="mr-0.5 h-2 w-4 rounded-full bg-rose-300" />
            ← RS Rugi
          </span>
          <span className="text-xs text-slate-400">Diverging margin chart</span>
          <span className="flex items-center gap-1 text-xs text-emerald-600">
            RS Untung →
            <span className="ml-0.5 h-2 w-4 rounded-full bg-emerald-300" />
          </span>
        </div>
      </div>

      {/* Caveat Banner */}
      <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" />
        <div className="space-y-1 text-sm">
          <p className="font-semibold text-amber-800">Catatan Analitik</p>
          <p className="text-amber-700">
            Data margin di atas dihitung dari tarif iDRG aktual vs tarif RS internal (mock data).
            Saat integrasi INA-Grouper iDRG real-time aktif, nilai akan otomatis di-update.
          </p>
          <p className="flex items-center gap-1 text-xs text-amber-600">
            <Info size={11} />
            Estimasi INA-CBG (mode Comparator AD-19) tersedia di Tab Grouper per klaim.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Summary Card ───────────────────────────────────────

type SummaryTone = "emerald" | "rose" | "teal" | "amber";

const SUMMARY_TONE: Record<SummaryTone, { bg: string; iconBg: string; icon: string; value: string; label: string }> = {
  emerald: { bg: "bg-emerald-50 ring-emerald-200", iconBg: "bg-emerald-100", icon: "text-emerald-600", value: "text-emerald-700", label: "text-emerald-600" },
  rose:    { bg: "bg-rose-50 ring-rose-200",       iconBg: "bg-rose-100",    icon: "text-rose-600",    value: "text-rose-700",    label: "text-rose-600"    },
  teal:    { bg: "bg-teal-50 ring-teal-200",       iconBg: "bg-teal-100",    icon: "text-teal-600",    value: "text-teal-700",    label: "text-teal-600"    },
  amber:   { bg: "bg-amber-50 ring-amber-200",     iconBg: "bg-amber-100",   icon: "text-amber-600",   value: "text-amber-700",   label: "text-amber-600"   },
};

function SummaryCard({
  label,
  value,
  sub,
  Icon,
  tone,
  negative = false,
}: {
  label: string;
  value: string;
  sub: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  tone: SummaryTone;
  negative?: boolean;
}) {
  const cls = SUMMARY_TONE[tone];
  return (
    <div className={`rounded-xl p-3 ring-1 ${cls.bg}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={`inline-flex h-6 w-6 items-center justify-center rounded-md ${cls.iconBg}`}>
          <Icon size={13} className={cls.icon} />
        </span>
        <span className={`text-xs font-medium ${cls.label}`}>{label}</span>
      </div>
      <p className={`text-base font-bold tabular-nums leading-tight ${cls.value}`}>
        {negative ? "-" : ""}{value}
      </p>
      <p className="mt-0.5 text-xs text-slate-400">{sub}</p>
    </div>
  );
}
