"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Clock, Award } from "lucide-react";
import {
  buildCoderProfiles,
  buildCoderDailyOutputs,
  type CoderProfile,
  type CoderDailyOutput,
} from "@/lib/eklaim/dashboardShared";

const CHART_H = 140;

// ── Panel ──────────────────────────────────────────────────

export default function CoderProductivityPanel() {
  const coders   = useMemo(() => buildCoderProfiles(), []);
  const daily    = useMemo(() => buildCoderDailyOutputs(), []);
  const maxTotal = Math.max(...daily.map(d => d.total), 1);

  return (
    <div className="space-y-5 p-5">
      <PanelHeader coders={coders} />

      {/* Coder profile cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {coders.map((c, idx) => (
          <CoderCard key={c.id} coder={c} idx={idx} />
        ))}
      </div>

      <DailyOutputChart coders={coders} daily={daily} maxTotal={maxTotal} />

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 border-t border-slate-200" />
        <span className="flex items-center gap-1.5 text-sm font-medium text-slate-500">
          <Clock size={13} className="text-sky-400" />
          Rata-rata Kunjungan → Submit
        </span>
        <div className="flex-1 border-t border-slate-200" />
      </div>

      <SubmitLatencyPanel coders={coders} />
    </div>
  );
}

// ── Panel Header ───────────────────────────────────────────

function PanelHeader({ coders }: { coders: CoderProfile[] }) {
  const total = coders.reduce((s, c) => s + c.totalKoded, 0);
  return (
    <div className="flex items-start justify-between">
      <div>
        <h2 className="text-base font-semibold text-slate-800">Produktivitas Coder</h2>
        <p className="text-sm text-slate-500">
          Output koding & turnaround kunjungan-to-submit · 8 hari terakhir
        </p>
      </div>
      <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-sm font-medium text-sky-600 ring-1 ring-sky-200">
        {total} klaim koded
      </span>
    </div>
  );
}

// ── Coder Profile Card ─────────────────────────────────────

function CoderCard({ coder, idx }: { coder: CoderProfile; idx: number }) {
  const positive = coder.trend >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * idx, duration: 0.2 }}
      className="rounded-xl bg-white p-3 ring-1 ring-slate-200"
    >
      <div className="mb-2 flex items-center gap-1.5">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: coder.colorHex }}
        />
        <span className="text-sm font-semibold leading-tight text-slate-700">
          {coder.name}
        </span>
      </div>

      <p className="text-2xl font-bold tabular-nums text-slate-800">
        {coder.totalKoded}
      </p>
      <p className="text-sm text-slate-400">klaim koded</p>

      <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2.5">
        <span
          className={`flex items-center gap-0.5 text-sm font-semibold tabular-nums ${positive ? "text-emerald-600" : "text-rose-600"}`}
        >
          {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {positive ? "+" : ""}{coder.trend}%
        </span>
        <span className="text-sm text-slate-500">
          <span className="font-bold text-slate-700 tabular-nums">
            {(coder.accuracy * 100).toFixed(0)}%
          </span>{" "}
          akurasi
        </span>
      </div>
    </motion.div>
  );
}

// ── Daily Output Stacked Bar Chart ─────────────────────────

function DailyOutputChart({
  coders,
  daily,
  maxTotal,
}: {
  coders: CoderProfile[];
  daily: CoderDailyOutput[];
  maxTotal: number;
}) {
  return (
    <div className="rounded-xl bg-white ring-1 ring-slate-200">
      {/* Chart header */}
      <div className="border-b border-slate-100 px-4 py-2.5">
        <p className="text-sm font-semibold text-slate-700">Klaim Koded per Hari</p>
        <div className="mt-1.5 flex flex-wrap gap-3">
          {coders.map(c => (
            <span key={c.id} className="flex items-center gap-1.5 text-sm text-slate-600">
              <span
                className="h-2 w-4 rounded-full"
                style={{ backgroundColor: c.colorHex }}
              />
              {c.name.split(" ")[0]}
            </span>
          ))}
        </div>
      </div>

      <div className="px-4 pb-4 pt-3">
        {/* Bars */}
        <div
          className="flex items-end gap-1.5"
          style={{ height: CHART_H }}
          role="img"
          aria-label="Bar chart klaim koded per hari"
        >
          {daily.map((d, dayIdx) => {
            const barH = (d.total / maxTotal) * CHART_H;
            return (
              <div key={d.dateKey} className="flex flex-1">
                <motion.div
                  className="flex w-full flex-col-reverse overflow-hidden rounded-t"
                  initial={{ height: 0 }}
                  animate={{ height: barH }}
                  transition={{ delay: 0.05 * dayIdx, duration: 0.5, ease: "easeOut" }}
                  title={`${d.label}: ${d.total} klaim`}
                >
                  {d.totals.map((t, ci) => {
                    const pct = d.total > 0 ? (t.count / d.total) * 100 : 0;
                    return (
                      <div
                        key={t.coderId}
                        className="w-full shrink-0"
                        style={{ height: `${pct}%`, backgroundColor: coders[ci].colorHex }}
                      />
                    );
                  })}
                </motion.div>
              </div>
            );
          })}
        </div>

        {/* X-axis labels */}
        <div className="mt-2 flex gap-1.5">
          {daily.map(d => (
            <p
              key={d.dateKey}
              className="flex-1 text-center text-xs text-slate-400"
            >
              {d.label.split(" ")[0]}
            </p>
          ))}
        </div>
      </div>

      {/* Footer: total */}
      <div className="flex justify-end border-t border-slate-100 px-4 py-2">
        <span className="text-xs text-slate-400">
          Total 8 hari:{" "}
          <span className="font-semibold text-slate-600">
            {daily.reduce((s, d) => s + d.total, 0)} klaim
          </span>
        </span>
      </div>
    </div>
  );
}

// ── Submit Latency Panel ───────────────────────────────────

function SubmitLatencyPanel({ coders }: { coders: CoderProfile[] }) {
  const maxDays = Math.max(...coders.map(c => c.avgDaysToSubmit));
  const minDays = Math.min(...coders.map(c => c.avgDaysToSubmit));
  const sorted  = [...coders].sort((a, b) => a.avgDaysToSubmit - b.avgDaysToSubmit);

  return (
    <div className="rounded-xl bg-white ring-1 ring-slate-200">
      <div className="border-b border-slate-100 px-4 py-2.5">
        <p className="text-sm font-semibold text-slate-700">
          Rata-rata Hari Kunjungan → Submit
        </p>
        <p className="text-xs text-slate-400">
          Durasi dari tanggal kunjungan pasien hingga klaim disubmit ke penjamin
        </p>
      </div>

      <div className="divide-y divide-slate-50 px-4">
        {sorted.map((c, idx) => {
          const pct       = (c.avgDaysToSubmit / maxDays) * 100;
          const isFastest = c.avgDaysToSubmit === minDays;
          const isSlowest = c.avgDaysToSubmit === maxDays;
          return (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.08 * idx, duration: 0.2 }}
              className="flex items-center gap-3 py-3"
            >
              {/* Coder label */}
              <div className="flex w-28 shrink-0 items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: c.colorHex }}
                />
                <span className="text-sm font-medium text-slate-700">
                  {c.name.split(" ")[0]}
                </span>
              </div>

              {/* Bar */}
              <div
                className="flex flex-1 overflow-hidden rounded-full bg-slate-100"
                style={{ height: 8 }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: c.colorHex }}
                  initial={{ width: "0%" }}
                  animate={{ width: `${pct}%` }}
                  transition={{ delay: 0.1 + 0.08 * idx, duration: 0.5, ease: "easeOut" }}
                />
              </div>

              {/* Value + badge */}
              <div className="flex w-32 shrink-0 items-center justify-end gap-1.5">
                <span className="text-sm font-bold tabular-nums text-slate-700">
                  {c.avgDaysToSubmit} hari
                </span>
                {isFastest && (
                  <span className="flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-xs font-medium text-emerald-600 ring-1 ring-emerald-200">
                    <Award size={10} />
                    Tercepat
                  </span>
                )}
                {isSlowest && (
                  <span className="rounded-full bg-rose-50 px-1.5 py-0.5 text-xs font-medium text-rose-600 ring-1 ring-rose-200">
                    Terlambat
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2">
        <span className="text-xs text-slate-400">Target BPJS: ≤ 7 hari setelah pulang</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-xs text-emerald-600">
            <span className="h-1.5 w-3 rounded-full bg-emerald-300" />
            Tercepat
          </span>
          <span className="flex items-center gap-1 text-xs text-rose-500">
            <span className="h-1.5 w-3 rounded-full bg-rose-300" />
            Terlambat
          </span>
        </div>
      </div>
    </div>
  );
}
