"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Printer, BarChart2, Clock, Target, AlertOctagon, XCircle, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  REGISTER_MOCK, DOSIS_LOG_MOCK, MODALITAS_COLOR,
  totalRegister, avgTAT, pctTarget, sumModalitas, sumUnit,
} from "./radManajemenShared";

// ── Mini Bar Chart (7 days) ───────────────────────────────

function MiniBarChart() {
  const data  = REGISTER_MOCK.slice(0, 7).reverse();
  const max   = Math.max(...data.map((d) => d.total), 1);
  const cols  = ["bg-teal-500", "bg-teal-400", "bg-teal-500", "bg-teal-600",
                  "bg-teal-500", "bg-teal-400", "bg-teal-500"];

  return (
    <div className="flex items-end gap-1 h-14">
      {data.map((d, i) => {
        const h = Math.max((d.total / max) * 100, 6);
        return (
          <div key={d.tanggal} className="flex flex-1 flex-col items-center gap-1">
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${h}%` }}
              transition={{ duration: 0.5, delay: i * 0.06, ease: "easeOut" }}
              className={cn("w-full rounded-t", cols[i % cols.length])}
              style={{ minHeight: 3 }}
            />
            <p className="text-[8px] text-slate-400 truncate">
              {d.tanggal.slice(5).replace("-", "/")}
            </p>
          </div>
        );
      })}
    </div>
  );
}

// ── Distribusi Bar ────────────────────────────────────────

function DistrBar({ label, val, total, color }: {
  label: string; val: number; total: number; color: string;
}) {
  const pct = total > 0 ? (val / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <p className="w-24 shrink-0 truncate text-[10px] text-slate-600">{label}</p>
      <div className="relative flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={cn("h-2.5 rounded-full", color)}
        />
      </div>
      <p className="w-16 shrink-0 text-right text-[10px] font-semibold text-slate-700">
        {val} <span className="text-[9px] font-normal text-slate-400">({Math.round(pct)}%)</span>
      </p>
    </div>
  );
}

// ── DRL Table ─────────────────────────────────────────────

function DRLTable() {
  const ctEntries = DOSIS_LOG_MOCK.filter((e) => e.modalitas === "CT" && e.ctdiVol !== undefined);
  const exceededCt = ctEntries.filter((e) => e.exceeded).length;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-[11px]">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            <th className="px-3 py-2.5 text-left font-semibold text-slate-500">Modalitas</th>
            <th className="px-3 py-2.5 text-right font-semibold text-slate-500">Total Log</th>
            <th className="px-3 py-2.5 text-right font-semibold text-slate-500">Melebihi DRL</th>
            <th className="px-3 py-2.5 text-right font-semibold text-slate-500">% Melebihi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {["CT", "Konvensional", "Mammografi"].map((mod) => {
            const entries  = DOSIS_LOG_MOCK.filter((e) => e.modalitas === mod);
            const exceeded = entries.filter((e) => e.exceeded).length;
            const pct      = entries.length > 0 ? Math.round((exceeded / entries.length) * 100) : 0;
            return (
              <tr key={mod} className="hover:bg-slate-50">
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className={cn("h-2 w-2 rounded-full", MODALITAS_COLOR[mod] ?? "bg-slate-400")} />
                    {mod}
                  </div>
                </td>
                <td className="px-3 py-2.5 text-right text-slate-700">{entries.length}</td>
                <td className="px-3 py-2.5 text-right">
                  <span className={cn(exceeded > 0 ? "text-rose-600 font-semibold" : "text-slate-400")}>{exceeded}</span>
                </td>
                <td className="px-3 py-2.5 text-right">
                  <span className={cn(
                    "rounded-full px-1.5 py-0.5 text-[9px] font-bold",
                    pct > 20 ? "bg-rose-100 text-rose-700" : pct > 10 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700",
                  )}>
                    {pct}%
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Print Preview Content ──────────────────────────────────

function PrintContent({ month, data30 }: { month: string; data30: typeof REGISTER_MOCK }) {
  const tot   = totalRegister(data30);
  const tat   = avgTAT(data30);
  const pct   = pctTarget(data30);
  const krit  = data30.reduce((a, d) => a + d.kritis, 0);
  const tolak = data30.reduce((a, d) => a + d.ditolak, 0);
  const byMod = sumModalitas(data30);

  return (
    <div className="hidden print:block p-8 font-sans text-slate-900">
      <div className="border-b-2 border-slate-800 pb-3 mb-4">
        <p className="text-lg font-bold">RUMAH SAKIT EHIS</p>
        <p className="text-sm">Laporan Bulanan Radiologi — {month}</p>
      </div>
      <div className="grid grid-cols-4 gap-4 mb-6 text-sm">
        <div><p className="text-slate-500 text-xs">Total Pemeriksaan</p><p className="text-2xl font-bold">{tot}</p></div>
        <div><p className="text-slate-500 text-xs">Rata-rata TAT</p><p className="text-2xl font-bold">{tat} mnt</p></div>
        <div><p className="text-slate-500 text-xs">% Dalam Target</p><p className="text-2xl font-bold">{pct}%</p></div>
        <div><p className="text-slate-500 text-xs">Temuan Kritis</p><p className="text-2xl font-bold">{krit}</p></div>
      </div>
      <p className="text-xs font-bold mb-2">Distribusi per Modalitas</p>
      <table className="w-full text-xs border-collapse mb-4">
        <thead><tr className="border-b border-slate-300">
          <th className="text-left py-1">Modalitas</th><th className="text-right py-1">Volume</th><th className="text-right py-1">%</th>
        </tr></thead>
        <tbody>
          {Object.entries(byMod).map(([k, v]) => (
            <tr key={k} className="border-b border-slate-100">
              <td className="py-1">{k}</td>
              <td className="text-right">{v}</td>
              <td className="text-right">{tot > 0 ? Math.round(v / tot * 100) : 0}%</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-8 grid grid-cols-2 gap-8">
        <div className="border-t border-slate-800 pt-2 text-center text-xs">
          <p>Kepala Instalasi Radiologi</p><p className="mt-6">(_____________________)</p>
        </div>
        <div className="border-t border-slate-800 pt-2 text-center text-xs">
          <p>Direktur RS</p><p className="mt-6">(_____________________)</p>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────

export default function LaporanPane() {
  const [printed, setPrinted] = useState(false);

  const data30  = REGISTER_MOCK.slice(0, 30);
  const data7   = REGISTER_MOCK.slice(0, 7);
  const tot     = totalRegister(data30);
  const tat     = avgTAT(data30);
  const pct     = pctTarget(data30);
  const totKrit = data30.reduce((a, d) => a + d.kritis, 0);
  const totTolak= data30.reduce((a, d) => a + d.ditolak, 0);
  const exceeded= DOSIS_LOG_MOCK.filter((e) => e.exceeded).length;
  const byMod   = sumModalitas(data30);
  const byUnit  = sumUnit(data30);
  const modMax  = Math.max(...Object.values(byMod), 1);
  const unitMax = Math.max(...Object.values(byUnit), 1);
  const month   = "Mei 2026";

  const handlePrint = () => {
    window.print();
    setPrinted(true);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Print content (hidden on screen) */}
      <PrintContent month={month} data30={data30} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[13px] font-bold text-slate-800">Laporan Bulanan Radiologi — {month}</p>
          <p className="text-[11px] text-slate-400">PMK 1014/2008 · PMK 24/2020 · Indikator Mutu RS</p>
        </div>
        <button
          onClick={handlePrint}
          className={cn(
            "flex items-center gap-2 rounded-xl px-4 py-2.5 text-[12px] font-semibold transition-all",
            printed
              ? "bg-emerald-100 text-emerald-700"
              : "bg-teal-600 text-white hover:bg-teal-700 shadow-sm",
          )}
        >
          <Printer size={13} />
          {printed ? "Dicetak" : "Cetak Laporan"}
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { icon: BarChart2,   label: "Total Pemeriksaan", val: tot,            color: "text-teal-700",    bg: "bg-teal-50 border-teal-200" },
          { icon: Clock,       label: "Rata-rata TAT",      val: `${tat} mnt`,   color: tat > 180 ? "text-rose-600" : "text-slate-700", bg: "bg-white border-slate-200" },
          { icon: Target,      label: "% Dalam Target",     val: `${pct}%`,      color: pct >= 85 ? "text-emerald-700" : "text-amber-700", bg: "bg-white border-slate-200" },
          { icon: AlertOctagon,label: "Temuan Kritis",      val: totKrit,        color: totKrit > 0 ? "text-rose-600" : "text-slate-400",  bg: totKrit > 0 ? "bg-rose-50 border-rose-200" : "bg-white border-slate-200" },
          { icon: ShieldAlert, label: "Melebihi DRL",       val: exceeded,       color: exceeded > 0 ? "text-amber-700" : "text-slate-400", bg: exceeded > 0 ? "bg-amber-50 border-amber-200" : "bg-white border-slate-200" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={cn("rounded-xl border px-4 py-3", s.bg)}>
            <s.icon size={13} className={cn("mb-1", s.color)} />
            <p className="text-[10px] text-slate-400">{s.label}</p>
            <p className={cn("text-xl font-bold", s.color)}>{s.val}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Volume 7 hari */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="mb-3 text-[11px] font-bold text-slate-700">Volume 7 Hari Terakhir</p>
          <MiniBarChart />
        </div>

        {/* Modalitas */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="mb-3 text-[11px] font-bold text-slate-700">Distribusi per Modalitas</p>
          <div className="flex flex-col gap-2">
            {Object.entries(byMod).map(([k, v]) => (
              <DistrBar key={k} label={k} val={v} total={tot} color={MODALITAS_COLOR[k] ?? "bg-slate-400"} />
            ))}
          </div>
        </div>

        {/* Unit */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="mb-3 text-[11px] font-bold text-slate-700">Distribusi per Unit</p>
          <div className="flex flex-col gap-2">
            {Object.entries(byUnit).map(([k, v]) => (
              <DistrBar key={k} label={k} val={v} total={tot} color="bg-teal-400" />
            ))}
          </div>
          <div className="mt-3 border-t border-slate-100 pt-3">
            <p className="mb-1 text-[10px] font-semibold text-slate-500">Per Urgensi</p>
            {[["CITO", Math.round(tot * 0.12)], ["Semi-Cito", Math.round(tot * 0.23)], ["Rutin", Math.round(tot * 0.65)]].map(([label, val]) => (
              <DistrBar key={String(label)} label={String(label)} val={Number(val)} total={tot}
                color={label === "CITO" ? "bg-rose-500" : label === "Semi-Cito" ? "bg-amber-400" : "bg-teal-400"} />
            ))}
          </div>
        </div>
      </div>

      {/* DRL Table */}
      <div>
        <p className="mb-2 text-[11px] font-bold text-slate-700">Rekapitulasi Dosis vs DRL</p>
        <DRLTable />
        <p className="mt-1.5 text-[9px] text-slate-400">
          DRL: PMK 1014/2008 · Perka BAPETEN No. 2/2018. Rejection rate: {tot > 0 ? Math.round((totTolak / tot) * 100 * 10) / 10 : 0}%
        </p>
      </div>
    </div>
  );
}
