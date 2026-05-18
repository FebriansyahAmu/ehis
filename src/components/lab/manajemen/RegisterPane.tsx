"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { BookOpen, AlertTriangle, Clock, CheckCircle2, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { REGISTER_DAILY, type DailyRegister } from "./manajemenShared";

type RangeKey = "hari" | "minggu" | "bulan";

const RANGE_OPTIONS: { key: RangeKey; label: string; days: number }[] = [
  { key: "hari",   label: "Hari Ini",  days: 1 },
  { key: "minggu", label: "7 Hari",    days: 7 },
  { key: "bulan",  label: "30 Hari",   days: 30 },
];

const KATEGORI_COLORS: Record<string, string> = {
  "Hematologi":  "#3b82f6",
  "Kimia Klinik":"#0ea5e9",
  "Urinalisis":  "#f59e0b",
  "Serologi":    "#8b5cf6",
  "Koagulasi":   "#ec4899",
};

// ── Horizontal Bar Chart (SVG) ────────────────────────────

function HBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <p className="w-24 shrink-0 text-right text-[11px] text-slate-500 truncate">{label}</p>
      <div className="relative flex-1 h-5 rounded-full bg-slate-100 overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
      <p className="w-8 shrink-0 text-right text-[11px] font-semibold text-slate-700">{value}</p>
    </div>
  );
}

// ── Volume Trend (SVG sparkline) ──────────────────────────

function VolumeTrend({ data }: { data: DailyRegister[] }) {
  const vals = [...data].reverse().map((d) => d.total);
  if (vals.length < 2) return null;
  const maxV = Math.max(...vals);
  const W = 400, H = 60, pad = 6;

  const points = vals.map((v, i) => {
    const x = pad + (i / (vals.length - 1)) * (W - pad * 2);
    const y = H - pad - ((v / maxV) * (H - pad * 2));
    return `${x},${y}`;
  }).join(" ");

  const areaPath = `M${pad},${H - pad} ` +
    vals.map((v, i) => {
      const x = pad + (i / (vals.length - 1)) * (W - pad * 2);
      const y = H - pad - ((v / maxV) * (H - pad * 2));
      return `L${x},${y}`;
    }).join(" ") +
    ` L${W - pad},${H - pad} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-label="Volume trend">
      <defs>
        <linearGradient id="vol-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#vol-grad)" />
      <polyline points={points} fill="none" stroke="#0284c7" strokeWidth={1.5} />
      {vals.map((v, i) => {
        const x = pad + (i / (vals.length - 1)) * (W - pad * 2);
        const y = H - pad - ((v / maxV) * (H - pad * 2));
        return <circle key={i} cx={x} cy={y} r={2.5} fill="#0284c7" />;
      })}
    </svg>
  );
}

// ── Stat Card ──────────────────────────────────────────────

function StatCard({ label, value, sub, icon, accent }: {
  label: string; value: string | number; sub?: string;
  icon: React.ReactNode; accent?: string;
}) {
  return (
    <div className={cn("rounded-xl border bg-white p-3", accent ?? "border-slate-200")}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <p className="text-[10px] text-slate-400 font-medium">{label}</p>
      </div>
      <p className="text-lg font-bold text-slate-900 tabular-nums">{value}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────

export default function RegisterPane() {
  const [range, setRange] = useState<RangeKey>("minggu");
  const days = RANGE_OPTIONS.find((r) => r.key === range)!.days;
  const data  = useMemo(() => REGISTER_DAILY.slice(0, Math.min(days, REGISTER_DAILY.length)), [days]);

  const aggTotal    = useMemo(() => data.reduce((s, d) => s + d.total, 0), [data]);
  const avgPerHari  = data.length > 0 ? Math.round(aggTotal / data.length) : 0;
  const avgTAT      = data.length > 0 ? Math.round(data.reduce((s, d) => s + d.tatRataRata, 0) / data.length) : 0;
  const avgTATTarget = data.length > 0 ? Math.round(data.reduce((s, d) => s + d.tatTarget, 0) / data.length) : 0;
  const totalKritis  = data.reduce((s, d) => s + d.kritisCount, 0);
  const avgKritisRespon = totalKritis > 0
    ? Math.round(data.filter((d) => d.kritisCount > 0).reduce((s, d) => s + d.kritisRespon, 0) / data.filter((d) => d.kritisCount > 0).length)
    : 0;

  // Aggregate by kategori
  const byKategori = useMemo(() => {
    const agg: Record<string, number> = {};
    data.forEach((d) => Object.entries(d.byKategori).forEach(([k, v]) => { agg[k] = (agg[k] ?? 0) + v; }));
    return Object.entries(agg).sort((a, b) => b[1] - a[1]);
  }, [data]);

  const byUnit = useMemo(() => {
    const agg: Record<string, number> = {};
    data.forEach((d) => Object.entries(d.byUnit).forEach(([k, v]) => { agg[k] = (agg[k] ?? 0) + v; }));
    return Object.entries(agg).sort((a, b) => b[1] - a[1]);
  }, [data]);

  const maxKategori = byKategori[0]?.[1] ?? 1;
  const maxUnit     = byUnit[0]?.[1] ?? 1;

  return (
    <div className="space-y-5">

      {/* Header + range */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5">
          <BookOpen size={14} className="text-sky-600 shrink-0" />
          <div>
            <p className="text-[12px] font-bold text-sky-800">Register Pemeriksaan</p>
            <p className="text-[10px] text-sky-600">Volume, TAT, distribusi unit · PMK 43/2013</p>
          </div>
        </div>
        <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1">
          {RANGE_OPTIONS.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={cn(
                "rounded-md px-3 py-1.5 text-[11px] font-semibold transition-colors",
                range === r.key ? "bg-sky-600 text-white" : "text-slate-500 hover:bg-sky-50 hover:text-sky-700",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Pemeriksaan"  value={aggTotal}        sub={`${avgPerHari}/hari rata-rata`} icon={<CheckCircle2 size={13} className="text-sky-500" />} />
        <StatCard label="TAT Rata-rata"      value={`${avgTAT} mnt`} sub="Order → Rilis"                 icon={<Clock size={13} className="text-amber-500" />} />
        <StatCard label="TAT Dalam Target"   value={`${avgTATTarget}%`} sub="≥ 90% target acreditasi"   icon={<TrendingUp size={13} className={cn(avgTATTarget >= 90 ? "text-emerald-500" : "text-rose-500")} />}
          accent={avgTATTarget >= 90 ? "border-emerald-200" : "border-rose-200"}
        />
        <StatCard label="Nilai Kritis"       value={totalKritis}     sub={totalKritis > 0 ? `Respon avg ${avgKritisRespon} mnt` : "Tidak ada"}
          icon={<AlertTriangle size={13} className={cn(totalKritis > 0 ? "text-rose-500" : "text-slate-400")} />}
          accent={totalKritis > 0 ? "border-rose-200" : "border-slate-200"}
        />
      </div>

      {/* Two-panel */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

        {/* Left — distribusi kategori + unit */}
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-slate-400">Distribusi per Kategori</p>
            <div className="space-y-2">
              {byKategori.map(([nama, total]) => (
                <HBar key={nama} label={nama} value={total} max={maxKategori} color={KATEGORI_COLORS[nama] ?? "#94a3b8"} />
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-slate-400">Distribusi per Unit</p>
            <div className="space-y-2">
              {byUnit.map(([nama, total]) => (
                <HBar key={nama} label={nama} value={total} max={maxUnit} color="#0284c7" />
              ))}
            </div>
          </div>
        </div>

        {/* Right — volume trend + TAT table */}
        <div className="space-y-4">
          {data.length > 1 && (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">Tren Volume Pemeriksaan</p>
              <VolumeTrend data={data} />
              <p className="mt-1 text-right text-[10px] text-slate-400">{data.length} hari terakhir</p>
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="border-b border-slate-100 px-4 py-2.5">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Log Harian</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-3 py-2 text-left font-semibold text-slate-500">Tanggal</th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-500">Total</th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-500">TAT (mnt)</th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-500">Target%</th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-500">Kritis</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((d, i) => (
                    <motion.tr
                      key={d.tanggal}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.04 }}
                      className={cn(
                        "border-b border-slate-50 last:border-0",
                        i === 0 ? "bg-sky-50/60" : "hover:bg-slate-50",
                      )}
                    >
                      <td className="px-3 py-2 text-slate-700 font-medium">
                        {i === 0 ? <span className="text-sky-600">Hari Ini</span> : d.tanggal.slice(5)}
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-slate-800">{d.total}</td>
                      <td className="px-3 py-2 text-right text-slate-600">{d.tatRataRata}</td>
                      <td className={cn("px-3 py-2 text-right font-semibold", d.tatTarget >= 90 ? "text-emerald-600" : "text-rose-600")}>
                        {d.tatTarget}%
                      </td>
                      <td className={cn("px-3 py-2 text-right", d.kritisCount > 0 ? "font-bold text-rose-600" : "text-slate-400")}>
                        {d.kritisCount > 0 ? d.kritisCount : "—"}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <p className="text-[10px] text-slate-400">
        Standar TAT: CITO ≤60 mnt · RI/RJ ≤120 mnt · Target dalam-target ≥90% · Respon nilai kritis ≤30 mnt · SNARS AP 5.11 · PMK 43/2013
      </p>
    </div>
  );
}
