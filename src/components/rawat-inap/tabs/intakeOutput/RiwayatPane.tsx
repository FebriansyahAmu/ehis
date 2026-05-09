"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, History } from "lucide-react";
import type { IOEntry, RawatInapPatientDetail } from "@/lib/data";
import { cn } from "@/lib/utils";
import { calcIWL, fmtVol, balanceBadge, daysBetween } from "./ioShared";

// ── Types ───────────────────────────────────────────────────

interface Props {
  entries:  IOEntry[];
  patient:  RawatInapPatientDetail;
}

interface DayData {
  tanggal:     string;
  hariKe:      number;
  intake:      number;
  output:      number;
  iwl:         number;
  balance:     number;
  byShift:     ShiftSummary[];
}

interface ShiftSummary {
  shift:  string;
  intake: number;
  output: number;
}

// ── Helpers ─────────────────────────────────────────────────

function fmtTanggal(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

function groupByDate(entries: IOEntry[], bb: number | undefined, suhu: number): DayData[] {
  const dates = [...new Set(entries.map((e) => e.tanggal))].sort().reverse();

  return dates.map((tanggal) => {
    const dayEntries = entries.filter((e) => e.tanggal === tanggal);
    const intake = dayEntries.filter((e) => e.tipe === "intake").reduce((s, e) => s + e.volume, 0);
    const output = dayEntries.filter((e) => e.tipe === "output").reduce((s, e) => s + e.volume, 0);
    const iwl    = bb != null ? calcIWL(bb, suhu) : 0;
    const balance = intake - output - iwl;

    const shifts = ["Pagi", "Siang", "Malam"];
    const byShift = shifts.map((shift) => {
      const se = dayEntries.filter((e) => e.shift === shift);
      return {
        shift,
        intake: se.filter((e) => e.tipe === "intake").reduce((s, e) => s + e.volume, 0),
        output: se.filter((e) => e.tipe === "output").reduce((s, e) => s + e.volume, 0),
      };
    }).filter((s) => s.intake > 0 || s.output > 0);

    return { tanggal, hariKe: 0, intake, output, iwl, balance, byShift };
  });
}

// ── Shift bar ────────────────────────────────────────────────

function ShiftBar({ intake, output, iwlShift }: { intake: number; output: number; iwlShift: number }) {
  const balance = intake - output - iwlShift;
  const { cls } = balanceBadge(balance);
  return (
    <div className="flex items-center gap-3 text-[11px]">
      <span className="w-12 shrink-0 text-slate-500">{}</span>
      <span className="text-sky-600">↓ {fmtVol(intake)}</span>
      <span className="text-slate-400">·</span>
      <span className="text-amber-600">↑ {fmtVol(output)}</span>
      <span className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 {cls}">
        {balance >= 0 ? "+" : ""}{fmtVol(balance)}
      </span>
    </div>
  );
}

// ── Day card ────────────────────────────────────────────────

function DayCard({ day, index, admitDate }: { day: DayData; index: number; admitDate: string }) {
  const [expanded, setExpanded] = useState(index === 0);
  const hariKe = daysBetween(admitDate, day.tanggal) + 1;
  const { label, cls } = balanceBadge(day.balance);
  const iwlPerShift = Math.round(day.iwl / 3);

  return (
    <motion.div
      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, delay: index * 0.05 }}
    >
      {/* Header */}
      <div
        className={cn(
          "flex cursor-pointer select-none items-center gap-3 px-4 py-3 transition-colors",
          expanded ? "bg-slate-50" : "hover:bg-slate-50",
        )}
        onClick={() => setExpanded((p) => !p)}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-black text-indigo-600">
          D{hariKe}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-800 truncate">{fmtTanggal(day.tanggal)}</p>
          <div className="mt-0.5 flex flex-wrap gap-2 text-[11px] text-slate-500">
            <span className="text-sky-600">↓ {fmtVol(day.intake)}</span>
            <span>·</span>
            <span className="text-amber-600">↑ {fmtVol(day.output)}</span>
            <span>·</span>
            <span>IWL {fmtVol(day.iwl)}</span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="text-right">
            <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Balance</p>
            <p className={cn("text-sm font-black", day.balance >= 0 ? "text-amber-600" : day.balance < -200 ? "text-sky-700" : "text-emerald-600")}>
              {day.balance >= 0 ? "+" : ""}{fmtVol(day.balance)}
            </p>
          </div>
          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold ring-1", cls)}>
            {label}
          </span>
        </div>
        {expanded
          ? <ChevronDown size={14} className="shrink-0 text-slate-400" />
          : <ChevronRight size={14} className="shrink-0 text-slate-300" />}
      </div>

      {/* Expanded: shift breakdown */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-100 px-4 py-3 space-y-2">
              {day.byShift.length > 0 ? (
                day.byShift.map(({ shift, intake, output }) => {
                  const shiftBalance = intake - output - iwlPerShift;
                  const { cls: sc } = balanceBadge(shiftBalance);
                  return (
                    <div key={shift} className="flex items-center gap-2 text-[11px]">
                      <span className="w-10 shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-center text-[10px] font-bold text-slate-600">
                        {shift.slice(0, 3)}
                      </span>
                      <span className="text-sky-600">↓ {fmtVol(intake)}</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-amber-600">↑ {fmtVol(output)}</span>
                      <span className="ml-auto shrink-0">
                        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold ring-1", sc)}>
                          {shiftBalance >= 0 ? "+" : ""}{fmtVol(shiftBalance)}
                        </span>
                      </span>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-400">Tidak ada entri per shift tersedia</p>
              )}

              {/* IWL info */}
              <p className="pt-1 text-[10px] text-slate-400">
                IWL: {fmtVol(day.iwl)}/hari · {fmtVol(iwlPerShift)}/shift (dibagi 3)
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Balance trend bar ────────────────────────────────────────

function TrendSummary({ days }: { days: DayData[] }) {
  if (days.length < 2) return null;
  const cumulative = days.slice().reverse().reduce<number[]>((acc, d, i) => {
    acc.push((acc[i - 1] ?? 0) + d.balance);
    return acc;
  }, []);
  const total = cumulative[cumulative.length - 1] ?? 0;
  const { label, cls } = balanceBadge(total);

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xs">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Kumulatif Seluruh Perawatan</p>
        <p className={cn("text-lg font-black", total >= 0 ? "text-amber-600" : total < -500 ? "text-sky-700" : "text-emerald-600")}>
          {total >= 0 ? "+" : ""}{fmtVol(total)}
        </p>
      </div>
      <span className={cn("ml-auto rounded-full px-3 py-1 text-xs font-bold ring-1", cls)}>{label}</span>
    </div>
  );
}

// ── Main ────────────────────────────────────────────────────

export default function RiwayatPane({ entries, patient }: Props) {
  const bb   = patient.vitalSigns.beratBadan;
  const suhu = patient.vitalSigns.suhu;
  const days = groupByDate(entries, bb, suhu);

  if (entries.length === 0) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center py-20 text-center"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
          <History size={24} className="text-slate-300" />
        </div>
        <p className="text-sm font-semibold text-slate-400">Belum ada riwayat balance cairan</p>
        <p className="mt-1 max-w-[200px] text-xs leading-relaxed text-slate-400">
          Tambahkan entri intake &amp; output dari tab Entri
        </p>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <TrendSummary days={days} />
      {days.map((day, idx) => (
        <DayCard key={day.tanggal} day={day} index={idx} admitDate={patient.admitDate} />
      ))}
    </div>
  );
}
