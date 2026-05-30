"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, XCircle, Download } from "lucide-react";
import {
  buildApprovalRateData,
  buildRejectedReasons,
  type PeriodKey,
  type MonthPoint,
} from "@/lib/eklaim/dashboardShared";
import { downloadCSV, todayISO } from "@/lib/eklaim/exportUtils";

// ── SVG Chart constants ────────────────────────────────

const CW = 520;   // chart viewBox width
const CH = 200;   // chart viewBox height
const PL = 44;    // padding left (Y-axis labels)
const PR = 12;    // padding right
const PT = 16;    // padding top
const PB = 40;    // padding bottom (X-axis labels)

const IW = CW - PL - PR;   // 464
const IH = CH - PT - PB;   // 144

const Y_MIN = 0.62;
const Y_MAX = 1.00;
const Y_RANGE = Y_MAX - Y_MIN;

const Y_TICKS = [0.70, 0.80, 0.90, 1.00];

// SVG color values (Tailwind cannot be used inside SVG attributes)
const SERIES_COLOR = {
  bpjs:     "#14b8a6", // teal-500
  asuransi: "#0ea5e9", // sky-500
  jamkesda: "#f59e0b", // amber-500
};

// ── Helpers ────────────────────────────────────────────

function xAt(i: number, n: number): number {
  return PL + (i / Math.max(n - 1, 1)) * IW;
}

function yAt(v: number): number {
  return PT + (1 - (v - Y_MIN) / Y_RANGE) * IH;
}

function toPath(data: MonthPoint[], key: keyof Pick<MonthPoint, "bpjs" | "asuransi" | "jamkesda">): string {
  return data
    .map((p, i) => `${i === 0 ? "M" : "L"}${xAt(i, data.length).toFixed(1)},${yAt(p[key]).toFixed(1)}`)
    .join(" ");
}

// ── Period Config ──────────────────────────────────────

const PERIOD_OPTS: { key: PeriodKey; label: string; months: number }[] = [
  { key: "3m",  label: "3 Bln",  months: 3  },
  { key: "6m",  label: "6 Bln",  months: 6  },
  { key: "12m", label: "12 Bln", months: 12 },
];

// ── Panel ──────────────────────────────────────────────

export default function ApprovalRatePanel() {
  const [period, setPeriod] = useState<PeriodKey>("12m");

  const allData    = useMemo(() => buildApprovalRateData(), []);
  const reasons    = useMemo(() => buildRejectedReasons(), []);
  const periodCfg  = PERIOD_OPTS.find(p => p.key === period)!;
  const chartData  = allData.slice(-periodCfg.months);

  const latest = chartData[chartData.length - 1];
  const prev   = chartData.length > 1 ? chartData[chartData.length - 2] : null;
  const overallDelta = prev ? latest.overall - prev.overall : 0;

  function handleExportCSV() {
    downloadCSV(`klaim-approval-rate-${todayISO()}.csv`, [
      {
        title: "Tren Approval Rate",
        headers: ["Bulan", "BPJS (%)", "Asuransi (%)", "Jamkesda (%)", "Overall (%)"],
        rows: chartData.map((p) => [
          p.label,
          (p.bpjs * 100).toFixed(1),
          (p.asuransi * 100).toFixed(1),
          (p.jamkesda * 100).toFixed(1),
          (p.overall * 100).toFixed(1),
        ]),
      },
      {
        title: "Top 5 Alasan Ditolak",
        headers: ["Alasan", "Jumlah", "Persentase (%)"],
        rows: reasons.map((r) => [r.reason, r.count, r.percent]),
      },
    ]);
  }

  return (
    <div className="p-5 space-y-5">
      {/* Panel header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-800">Tren Approval Rate</h2>
          <p className="text-sm text-slate-500">
            Persetujuan klaim per penjamin · rolling {periodCfg.months} bulan
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-sm font-medium text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
          >
            <Download size={13} className="text-teal-600" />
            CSV
          </button>
          <div className="flex items-center gap-1">
          {PERIOD_OPTS.map(opt => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setPeriod(opt.key)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 ${
                period === opt.key
                  ? "bg-teal-600 text-white shadow-sm"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              {opt.label}
            </button>
          ))}
          </div>
        </div>
      </div>

      {/* Summary row */}
      <div className="flex flex-wrap items-center gap-3">
        {(["bpjs", "asuransi", "jamkesda"] as const).map(key => {
          const labels: Record<typeof key, string> = {
            bpjs: "BPJS",
            asuransi: "Asuransi",
            jamkesda: "Jamkesda",
          };
          const val = latest[key];
          const clr = SERIES_COLOR[key];
          return (
            <div
              key={key}
              className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 ring-1 ring-slate-200"
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: clr }} />
              <span className="text-sm text-slate-600">{labels[key]}</span>
              <span className="text-sm font-bold text-slate-800 tabular-nums">
                {(val * 100).toFixed(1)}%
              </span>
            </div>
          );
        })}
        <div className="ml-auto flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-2">
          {overallDelta >= 0 ? (
            <TrendingUp size={14} className="text-emerald-600" />
          ) : (
            <TrendingDown size={14} className="text-rose-500" />
          )}
          <span className={`text-sm font-semibold tabular-nums ${overallDelta >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
            {overallDelta >= 0 ? "+" : ""}{(overallDelta * 100).toFixed(1)}%
          </span>
          <span className="text-xs text-slate-400">vs bulan lalu</span>
        </div>
      </div>

      {/* SVG Line Chart */}
      <div className="overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
        <svg
          viewBox={`0 0 ${CW} ${CH}`}
          className="w-full"
          aria-label="Grafik tren approval rate"
        >
          {/* Grid lines */}
          {Y_TICKS.map(v => {
            const y = yAt(v);
            return (
              <g key={v}>
                <line
                  x1={PL} y1={y} x2={CW - PR} y2={y}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                  strokeDasharray={v === 1.0 ? "none" : "4 3"}
                />
                <text
                  x={PL - 6}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill="#94a3b8"
                >
                  {Math.round(v * 100)}%
                </text>
              </g>
            );
          })}

          {/* X-axis labels — show every Nth to avoid crowding */}
          {chartData.map((p, i) => {
            const step = Math.ceil(chartData.length / 6);
            const show = i % step === 0 || i === chartData.length - 1;
            if (!show) return null;
            const x = xAt(i, chartData.length);
            return (
              <text
                key={p.yearMonth}
                x={x}
                y={CH - 4}
                textAnchor="middle"
                fontSize="10"
                fill="#94a3b8"
              >
                {p.label}
              </text>
            );
          })}

          {/* Lines */}
          {(["bpjs", "asuransi", "jamkesda"] as const).map(key => (
            <motion.path
              key={key}
              d={toPath(chartData, key)}
              fill="none"
              stroke={SERIES_COLOR[key]}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            />
          ))}

          {/* Dots for latest point */}
          {(["bpjs", "asuransi", "jamkesda"] as const).map(key => {
            const last = chartData[chartData.length - 1];
            const x = xAt(chartData.length - 1, chartData.length);
            const y = yAt(last[key]);
            return (
              <g key={`dot-${key}`}>
                <circle cx={x} cy={y} r="4" fill="white" stroke={SERIES_COLOR[key]} strokeWidth="2" />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 border-t border-slate-200" />
        <span className="flex items-center gap-1.5 text-sm font-medium text-slate-500">
          <XCircle size={13} className="text-rose-400" />
          Top 5 Alasan Ditolak
        </span>
        <div className="flex-1 border-t border-slate-200" />
      </div>

      {/* Rejected reasons bar chart */}
      <div className="rounded-xl bg-white ring-1 ring-slate-200">
        <div className="divide-y divide-slate-100">
          {reasons.map((r, idx) => (
            <motion.div
              key={r.reason}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * idx, duration: 0.2 }}
              className="flex items-center gap-3 px-4 py-3"
            >
              <span className="w-5 shrink-0 text-right text-sm font-bold text-slate-400 tabular-nums">
                {idx + 1}
              </span>
              <div className="min-w-0 flex-1 space-y-1">
                <p className="truncate text-sm text-slate-700">{r.reason}</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 overflow-hidden rounded-full bg-slate-100" style={{ height: 6 }}>
                    <motion.div
                      className="h-full rounded-full bg-rose-400"
                      initial={{ width: "0%" }}
                      animate={{ width: `${r.percent}%` }}
                      transition={{ delay: 0.1 + 0.05 * idx, duration: 0.4, ease: "easeOut" }}
                    />
                  </div>
                  <span className="w-10 shrink-0 text-right text-xs font-semibold text-slate-500 tabular-nums">
                    {r.percent}%
                  </span>
                </div>
              </div>
              <span className="w-8 shrink-0 text-right text-sm font-semibold text-rose-600 tabular-nums">
                {r.count}
              </span>
            </motion.div>
          ))}
        </div>
        <div className="flex justify-end border-t border-slate-100 px-4 py-2">
          <span className="text-xs text-slate-400">
            Total sampel: {reasons.reduce((s, r) => s + r.count, 0)} klaim ditolak
          </span>
        </div>
      </div>
    </div>
  );
}
