"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart2, Clock, Target, AlertOctagon, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  REGISTER_MOCK, MODALITAS_COLOR,
  totalRegister, avgTAT, pctTarget, sumModalitas, sumUnit,
  type DailyRegister,
} from "./radManajemenShared";

// ── Horizontal Bar Chart ───────────────────────────────────

function HBar({ label, val, max, color }: {
  label: string; val: number; max: number; color: string;
}) {
  const pct = max > 0 ? (val / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2.5">
      <p className="w-28 shrink-0 truncate text-[11px] text-slate-600">{label}</p>
      <div className="relative flex-1 h-3 rounded-full bg-slate-100 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={cn("h-3 rounded-full", color)}
        />
      </div>
      <p className="w-8 shrink-0 text-right text-[11px] font-semibold text-slate-700">{val}</p>
    </div>
  );
}

// ── Volume Sparkline ───────────────────────────────────────

function Sparkline({ data, days }: { data: DailyRegister[]; days: number }) {
  const slice = data.slice(0, days).reverse();
  const max   = Math.max(...slice.map((d) => d.total), 1);
  const w     = 100 / slice.length;

  return (
    <svg viewBox={`0 0 ${slice.length * 8} 40`} className="w-full" preserveAspectRatio="none">
      <polyline
        points={slice.map((d, i) => `${i * 8 + 4},${40 - (d.total / max) * 34}`).join(" ")}
        fill="none"
        stroke="#0d9488"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {slice.map((d, i) => (
        <circle key={i} cx={i * 8 + 4} cy={40 - (d.total / max) * 34} r="1.5" fill="#0d9488" />
      ))}
    </svg>
  );
}

// ── Daily Log Table ────────────────────────────────────────

function DailyLogTable({ data }: { data: DailyRegister[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-[11px]">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            <th className="px-3 py-2.5 text-left font-semibold text-slate-500">Tanggal</th>
            <th className="px-3 py-2.5 text-right font-semibold text-slate-500">Total</th>
            <th className="hidden px-3 py-2.5 text-right font-semibold text-slate-500 sm:table-cell">TAT Avg</th>
            <th className="hidden px-3 py-2.5 text-right font-semibold text-slate-500 sm:table-cell">% Target</th>
            <th className="px-3 py-2.5 text-right font-semibold text-slate-500">Kritis</th>
            <th className="px-3 py-2.5 text-right font-semibold text-slate-500">Ditolak</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {data.slice(0, 14).map((d, i) => {
            const pct = d.total > 0 ? Math.round((d.dalamTarget / d.total) * 100) : 0;
            return (
              <motion.tr
                key={d.tanggal}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                className="hover:bg-slate-50"
              >
                <td className="px-3 py-2 text-slate-600">{d.tanggal}</td>
                <td className="px-3 py-2 text-right font-semibold text-slate-800">{d.total}</td>
                <td className={cn(
                  "hidden px-3 py-2 text-right sm:table-cell",
                  d.tatAvg > 180 ? "text-rose-600 font-semibold" : d.tatAvg > 120 ? "text-amber-600" : "text-slate-600",
                )}>
                  {d.tatAvg} mnt
                </td>
                <td className="hidden px-3 py-2 text-right sm:table-cell">
                  <span className={cn(
                    "rounded-full px-1.5 py-0.5 text-[9px] font-bold",
                    pct >= 85 ? "bg-emerald-100 text-emerald-700" : pct >= 70 ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700",
                  )}>
                    {pct}%
                  </span>
                </td>
                <td className="px-3 py-2 text-right">
                  {d.kritis > 0
                    ? <span className="font-bold text-rose-600">{d.kritis}</span>
                    : <span className="text-slate-300">—</span>}
                </td>
                <td className="px-3 py-2 text-right">
                  {d.ditolak > 0
                    ? <span className="font-semibold text-amber-600">{d.ditolak}</span>
                    : <span className="text-slate-300">—</span>}
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────

type FilterDays = 1 | 7 | 30;

export default function RegisterPane() {
  const [days, setDays] = useState<FilterDays>(7);

  const data    = useMemo(() => REGISTER_MOCK.slice(0, days), [days]);
  const tot     = useMemo(() => totalRegister(data), [data]);
  const tat     = useMemo(() => avgTAT(data), [data]);
  const pct     = useMemo(() => pctTarget(data), [data]);
  const totKrit = useMemo(() => data.reduce((a, d) => a + d.kritis, 0), [data]);
  const totTolak= useMemo(() => data.reduce((a, d) => a + d.ditolak, 0), [data]);
  const byMod   = useMemo(() => sumModalitas(data), [data]);
  const byUnit  = useMemo(() => sumUnit(data), [data]);
  const maxMod  = useMemo(() => Math.max(...Object.values(byMod), 1), [byMod]);
  const maxUnit = useMemo(() => Math.max(...Object.values(byUnit), 1), [byUnit]);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[13px] font-bold text-slate-800">Register Pemeriksaan Radiologi</p>
          <p className="text-[11px] text-slate-400">PMK 1014/2008 · PMK 24/2020</p>
        </div>
        <div className="flex rounded-lg border border-slate-200 bg-white p-0.5">
          {([1, 7, 30] as FilterDays[]).map((d) => (
            <button key={d} onClick={() => setDays(d)}
              className={cn(
                "rounded-md px-3 py-1.5 text-[11px] font-semibold transition-all",
                days === d ? "bg-teal-600 text-white" : "text-slate-500 hover:text-slate-700",
              )}>
              {d === 1 ? "Hari Ini" : d === 7 ? "7 Hari" : "30 Hari"}
            </button>
          ))}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { icon: BarChart2,   label: "Total Pemeriksaan", val: tot,            color: "text-teal-700",    bg: "bg-teal-50 border-teal-200" },
          { icon: Clock,       label: "Rata-rata TAT",      val: `${tat} mnt`,   color: tat > 180 ? "text-rose-600" : "text-slate-700", bg: "bg-white border-slate-200" },
          { icon: Target,      label: "Dalam Target TAT",   val: `${pct}%`,      color: pct >= 85 ? "text-emerald-700" : "text-amber-700", bg: "bg-white border-slate-200" },
          { icon: AlertOctagon,label: "Temuan Kritis",      val: totKrit,        color: totKrit > 0 ? "text-rose-600" : "text-slate-400", bg: totKrit > 0 ? "bg-rose-50 border-rose-200" : "bg-white border-slate-200" },
          { icon: XCircle,     label: "Ditolak / Reject",   val: totTolak,       color: totTolak > 0 ? "text-amber-700" : "text-slate-400", bg: "bg-white border-slate-200" },
        ].map((s) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn("rounded-xl border px-4 py-3", s.bg)}
          >
            <s.icon size={13} className={cn("mb-1", s.color)} />
            <p className="text-[10px] text-slate-400">{s.label}</p>
            <p className={cn("text-xl font-bold", s.color)}>{s.val}</p>
          </motion.div>
        ))}
      </div>

      {/* Sparkline + Charts */}
      <div className="grid gap-4 md:grid-cols-[1fr_220px_220px]">
        {/* Volume sparkline */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="mb-3 text-[11px] font-bold text-slate-700">Volume Harian ({days === 1 ? "Hari Ini" : days === 7 ? "7 Hari Terakhir" : "30 Hari Terakhir"})</p>
          <Sparkline data={REGISTER_MOCK} days={days === 1 ? 7 : days} />
          <div className="mt-2 flex justify-between text-[9px] text-slate-400">
            <span>{days === 1 ? "7 hari lalu" : days === 7 ? "7 hari lalu" : "30 hari lalu"}</span>
            <span>Hari ini</span>
          </div>
        </div>

        {/* Distribusi Modalitas */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="mb-3 text-[11px] font-bold text-slate-700">Per Modalitas</p>
          <div className="flex flex-col gap-2">
            {Object.entries(byMod).map(([k, v]) => (
              <HBar key={k} label={k} val={v} max={maxMod} color={MODALITAS_COLOR[k] ?? "bg-slate-400"} />
            ))}
          </div>
        </div>

        {/* Distribusi Unit */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="mb-3 text-[11px] font-bold text-slate-700">Per Unit</p>
          <div className="flex flex-col gap-2">
            {Object.entries(byUnit).map(([k, v]) => (
              <HBar key={k} label={k} val={v} max={maxUnit} color="bg-teal-400" />
            ))}
          </div>
        </div>
      </div>

      {/* Log Table */}
      <div>
        <p className="mb-2 text-[11px] font-bold text-slate-700">Log Harian</p>
        <DailyLogTable data={data} />
        <p className="mt-2 text-[9px] text-slate-400">
          Menampilkan {Math.min(data.length, 14)} hari terakhir · TAT target: CITO ≤60 mnt · Semi-Cito ≤180 mnt · Rutin ≤360 mnt
        </p>
      </div>
    </div>
  );
}
