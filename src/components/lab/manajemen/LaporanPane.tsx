"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, Printer, TrendingUp, TrendingDown, Minus, CheckCircle2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { REGISTER_DAILY } from "./manajemenShared";

// ── Mini Bar Chart (SVG) ──────────────────────────────────

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const h = max > 0 ? Math.round((value / max) * 48) : 0;
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[9px] tabular-nums text-slate-500">{value}</span>
      <div className="flex h-12 w-6 items-end justify-center rounded-sm bg-slate-100 overflow-hidden">
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: h }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full rounded-sm"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// ── Trend Icon ────────────────────────────────────────────

function TrendIcon({ pct }: { pct: number }) {
  if (pct > 2)  return <TrendingUp size={12} className="text-emerald-500" />;
  if (pct < -2) return <TrendingDown size={12} className="text-rose-500" />;
  return <Minus size={12} className="text-slate-400" />;
}

// ── KPI Card ───────────────────────────────────────────────

function KPICard({ label, value, sub, trend, accent, icon }: {
  label: string; value: string; sub?: string;
  trend?: number; accent?: string; icon: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-xl border bg-white p-4", accent ?? "border-slate-200")}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5 text-slate-400">{icon}</div>
        {trend !== undefined && <TrendIcon pct={trend} />}
      </div>
      <p className="text-xl font-bold text-slate-900 tabular-nums">{value}</p>
      <p className="text-[11px] font-medium text-slate-500">{label}</p>
      {sub && <p className="mt-0.5 text-[10px] text-slate-400">{sub}</p>}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────

export default function LaporanPane() {
  const [printing, setPrinting] = useState(false);
  const [printed,  setPrinted]  = useState(false);

  const data    = REGISTER_DAILY;
  const today   = data[0];
  const prevDay = data[1];

  const totalPemeriksaan = data.reduce((s, d) => s + d.total, 0);
  const avgPerHari       = Math.round(totalPemeriksaan / data.length);
  const avgTAT           = Math.round(data.reduce((s, d) => s + d.tatRataRata, 0) / data.length);
  const avgTATTarget     = Math.round(data.reduce((s, d) => s + d.tatTarget, 0) / data.length);
  const totalKritis      = data.reduce((s, d) => s + d.kritisCount, 0);
  const avgKritisRespon  = data.filter((d) => d.kritisCount > 0).length > 0
    ? Math.round(data.filter((d) => d.kritisCount > 0).reduce((s, d) => s + d.kritisRespon, 0) / data.filter((d) => d.kritisCount > 0).length)
    : 0;

  const trendTotal  = prevDay ? ((today.total - prevDay.total) / prevDay.total) * 100 : 0;
  const trendTarget = prevDay ? today.tatTarget - prevDay.tatTarget : 0;
  const maxTotal    = Math.max(...data.map((d) => d.total));

  function handlePrint() {
    setPrinting(true);
    setTimeout(() => { setPrinting(false); setPrinted(true); setTimeout(() => setPrinted(false), 3000); }, 800);
  }

  // Aggregate by unit across all days
  const byUnit: Record<string, number> = {};
  data.forEach((d) => Object.entries(d.byUnit).forEach(([k, v]) => { byUnit[k] = (byUnit[k] ?? 0) + v; }));

  const byKategori: Record<string, number> = {};
  data.forEach((d) => Object.entries(d.byKategori).forEach(([k, v]) => { byKategori[k] = (byKategori[k] ?? 0) + v; }));

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5">
          <BarChart3 size={14} className="text-sky-600 shrink-0" />
          <div>
            <p className="text-[12px] font-bold text-sky-800">Laporan Bulanan Laboratorium</p>
            <p className="text-[10px] text-sky-600">Periode: Mei 2026 · PMK 43/2013</p>
          </div>
        </div>
        <button
          onClick={handlePrint}
          disabled={printing}
          className="flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
        >
          {printed ? <CheckCircle2 size={14} /> : <Printer size={14} />}
          {printing ? "Mencetak…" : printed ? "Tercetak!" : "Cetak Laporan"}
        </button>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KPICard
          label="Total Pemeriksaan"
          value={totalPemeriksaan.toString()}
          sub={`Rata-rata ${avgPerHari}/hari`}
          trend={trendTotal}
          icon={<BarChart3 size={13} />}
        />
        <KPICard
          label="TAT Rata-rata"
          value={`${avgTAT} mnt`}
          sub="Order → Rilis hasil"
          icon={<BarChart3 size={13} />}
          accent={avgTAT <= 90 ? "border-emerald-200" : "border-amber-200"}
        />
        <KPICard
          label="TAT Dalam Target"
          value={`${avgTATTarget}%`}
          sub={avgTATTarget >= 90 ? "Memenuhi standar" : "Di bawah 90%"}
          trend={trendTarget}
          icon={<TrendingUp size={13} />}
          accent={avgTATTarget >= 90 ? "border-emerald-200" : "border-rose-200"}
        />
        <KPICard
          label="Nilai Kritis"
          value={totalKritis.toString()}
          sub={totalKritis > 0 ? `Respon avg ${avgKritisRespon} mnt` : "Tidak ada"}
          icon={<AlertTriangle size={13} className={totalKritis > 0 ? "text-rose-500" : "text-slate-400"} />}
          accent={totalKritis > 0 ? "border-rose-200" : "border-slate-200"}
        />
      </div>

      {/* Two panel */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

        {/* Left — volume bar chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="mb-4 text-[11px] font-bold uppercase tracking-wide text-slate-400">Volume Harian — 7 Hari Terakhir</p>
          <div className="flex items-end justify-between gap-1.5">
            {[...data].reverse().map((d) => (
              <div key={d.tanggal} className="flex flex-col items-center gap-1 flex-1">
                <MiniBar value={d.total} max={maxTotal} color="#0284c7" />
                <span className="text-[9px] text-slate-400">{d.tanggal.slice(8)}/{d.tanggal.slice(5, 7)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 border-t border-slate-100 pt-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-2">Per Unit (kumulatif)</p>
            {Object.entries(byUnit).map(([unit, total]) => {
              const pct = Math.round((total / totalPemeriksaan) * 100);
              return (
                <div key={unit} className="flex items-center gap-2 mb-1.5">
                  <p className="w-24 shrink-0 text-[11px] text-slate-500">{unit}</p>
                  <div className="flex-1 h-4 rounded-full bg-slate-100 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className="h-full rounded-full bg-sky-400"
                    />
                  </div>
                  <p className="w-8 text-right text-[11px] font-semibold text-slate-700">{pct}%</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right — TAT table + kritis */}
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="border-b border-slate-100 px-4 py-2.5 bg-slate-50">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">TAT & Nilai Kritis Harian</p>
            </div>
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-3 py-2 text-left font-semibold text-slate-400">Tanggal</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-400">TAT</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-400">Target%</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-400">CITO</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-400">Kritis</th>
                </tr>
              </thead>
              <tbody>
                {data.map((d, i) => (
                  <motion.tr
                    key={d.tanggal}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-3 py-2 text-slate-600">{d.tanggal.slice(5)}</td>
                    <td className="px-3 py-2 text-right text-slate-700">{d.tatRataRata}</td>
                    <td className={cn("px-3 py-2 text-right font-semibold", d.tatTarget >= 90 ? "text-emerald-600" : "text-rose-600")}>
                      {d.tatTarget}%
                    </td>
                    <td className="px-3 py-2 text-right text-slate-600">{d.tatCITO}</td>
                    <td className={cn("px-3 py-2 text-right", d.kritisCount > 0 ? "font-bold text-rose-600" : "text-slate-400")}>
                      {d.kritisCount > 0 ? d.kritisCount : "—"}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-slate-400">Distribusi per Jenis Pemeriksaan</p>
            {Object.entries(byKategori).sort((a, b) => b[1] - a[1]).map(([k, v]) => {
              const pct = Math.round((v / totalPemeriksaan) * 100);
              return (
                <div key={k} className="flex items-center gap-2 mb-1.5 text-[11px]">
                  <p className="w-28 shrink-0 text-slate-500 truncate">{k}</p>
                  <div className="flex-1 h-3 rounded-full bg-slate-100 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className="h-full rounded-full bg-sky-400"
                    />
                  </div>
                  <p className="w-12 text-right text-slate-600">{v} ({pct}%)</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <p className="text-[10px] text-slate-400 border-t border-slate-100 pt-3">
        Laporan ini mencakup semua pemeriksaan yang diproses lab · Target TAT ≥90% dalam-target · Respon nilai kritis ≤30 mnt · PMK 43/2013 · SNARS AP 5.11
      </p>
    </div>
  );
}
