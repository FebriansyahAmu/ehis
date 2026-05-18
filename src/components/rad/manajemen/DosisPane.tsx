"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, Activity, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DOSIS_LOG_MOCK, DRL_CT, DRL_ENTRANCE, MODALITAS_COLOR,
  type DosisLogEntry,
} from "./radManajemenShared";
import { type Modalitas } from "../radShared";

// ── DRL Gauge ─────────────────────────────────────────────

function DRLGauge({ label, val, drl }: { label: string; val: number; drl: number }) {
  const pct     = Math.min((val / drl) * 100, 130);
  const exceeded = val > drl;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-[10px]">
        <span className="text-slate-600">{label}</span>
        <span className={cn("font-semibold", exceeded ? "text-rose-600" : "text-emerald-600")}>
          {val} <span className="font-normal text-slate-400">/ DRL {drl}</span>
        </span>
      </div>
      <div className="relative h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(pct, 100)}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={cn("h-2.5 rounded-full", exceeded ? "bg-rose-500" : "bg-emerald-500")}
        />
        {/* DRL line */}
        <div className="absolute right-0 top-0 h-2.5 w-0.5 bg-slate-600/40" style={{ right: "0%" }} />
      </div>
    </div>
  );
}

// ── Dose Card (left panel row) ────────────────────────────

function DoseCard({ entry, active, onClick }: {
  entry: DosisLogEntry; active: boolean; onClick: () => void;
}) {
  return (
    <motion.button
      layout
      onClick={onClick}
      className={cn(
        "w-full rounded-xl border p-3 text-left transition-all",
        active
          ? "border-teal-400 bg-teal-50 shadow-sm ring-2 ring-teal-100"
          : entry.exceeded
            ? "border-rose-200 bg-rose-50/50 hover:bg-rose-50"
            : "border-slate-200 bg-white hover:bg-slate-50",
      )}
    >
      <div className="flex items-start gap-2.5">
        <div className={cn(
          "mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full mt-1.5",
          entry.exceeded ? "bg-rose-500" : "bg-emerald-400",
        )} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-bold text-slate-800">{entry.namaPasien}</p>
          <p className="text-[10px] text-slate-400">{entry.noRM} · {entry.tanggal}</p>
        </div>
        <span className={cn(
          "shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold",
          MODALITAS_COLOR[entry.modalitas] + " text-white",
        )}>
          {entry.modalitas === "Konvensional" ? "XR" : entry.modalitas}
        </span>
      </div>
      <div className="mt-1.5 flex items-center justify-between">
        <p className="text-[10px] text-slate-500">{entry.region}</p>
        {entry.exceeded && (
          <span className="text-[9px] font-bold text-rose-600">⚠ Melebihi DRL</span>
        )}
      </div>
    </motion.button>
  );
}

// ── Detail Panel ──────────────────────────────────────────

function DoseDetail({ entry }: { entry: DosisLogEntry }) {
  return (
    <motion.div
      key={entry.id}
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col gap-4"
    >
      {/* Exceeded alert */}
      <AnimatePresence>
        {entry.exceeded && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3"
          >
            <AlertTriangle size={13} className="mt-0.5 shrink-0 text-rose-600" />
            <div>
              <p className="text-[11px] font-bold text-rose-800">Dosis Melebihi DRL Nasional</p>
              <p className="text-[10px] text-rose-600">
                Dosis yang diterima pasien melebihi Diagnostic Reference Level PMK 1014/2008.
                Tinjau teknik akuisisi dan parameter protokol — prinsip ALARA wajib diterapkan.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Patient info */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[13px] font-bold text-slate-800">{entry.namaPasien}</p>
            <p className="text-[11px] text-slate-400">{entry.noRM} · {entry.tanggal}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-bold text-white", MODALITAS_COLOR[entry.modalitas])}>
              {entry.modalitas}
            </span>
            {entry.exceeded
              ? <AlertTriangle size={15} className="text-rose-500" />
              : <CheckCircle2 size={15} className="text-emerald-500" />}
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
          <div className="rounded-lg bg-slate-50 px-3 py-2">
            <p className="text-slate-400">Region / Proyeksi</p>
            <p className="font-semibold text-slate-700">{entry.region}</p>
          </div>
          <div className="rounded-lg bg-slate-50 px-3 py-2">
            <p className="text-slate-400">Status DRL</p>
            <p className={cn("font-bold", entry.exceeded ? "text-rose-600" : "text-emerald-600")}>
              {entry.exceeded ? "Melebihi DRL" : "Dalam DRL"}
            </p>
          </div>
        </div>
      </div>

      {/* Dose values */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="mb-3 text-[11px] font-bold text-slate-700">Parameter Dosis</p>
        <div className="flex flex-col gap-3">
          {entry.ctdiVol !== undefined && entry.drlCtdi !== undefined && (
            <DRLGauge label="CTDIvol (mGy)" val={entry.ctdiVol} drl={entry.drlCtdi} />
          )}
          {entry.dlp !== undefined && entry.drlDlp !== undefined && (
            <DRLGauge label="DLP (mGy·cm)" val={entry.dlp} drl={entry.drlDlp} />
          )}
          {entry.entrance !== undefined && entry.drlEntrance !== undefined && (
            <DRLGauge label="Entrance Dose (mGy)" val={entry.entrance} drl={entry.drlEntrance} />
          )}
          {entry.dap !== undefined && (
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-600">DAP (mGy·cm²)</span>
              <span className="font-semibold text-slate-700">{entry.dap}</span>
            </div>
          )}
          {entry.waktuFluoro !== undefined && (
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-600">Waktu Fluoroskopi (det)</span>
              <span className="font-semibold text-slate-700">{entry.waktuFluoro}</span>
            </div>
          )}
        </div>
        <p className="mt-3 text-[9px] text-slate-400">
          DRL: PMK 1014/2008 · Perka BAPETEN No. 2/2018 · IAEA Safety Reports 39
        </p>
      </div>

      {/* ALARA reminder */}
      <div className="rounded-xl border border-teal-100 bg-teal-50/60 px-4 py-3">
        <p className="text-[10px] font-bold text-teal-800">Prinsip ALARA</p>
        <p className="mt-0.5 text-[10px] text-teal-700">
          <em>As Low As Reasonably Achievable</em> — Setiap paparan radiasi harus dijustifikasi secara klinis
          dan dioptimalkan untuk memberikan dosis serendah mungkin yang masih menghasilkan kualitas diagnostik memadai.
          IAEA HH-19 · Perka BAPETEN No. 2/2018
        </p>
      </div>
    </motion.div>
  );
}

// ── DRL Average Summary ────────────────────────────────────

function DRLSummary({ entries }: { entries: DosisLogEntry[] }) {
  const ctEntries = entries.filter((e) => e.modalitas === "CT" && e.ctdiVol !== undefined);
  const xrEntries = entries.filter((e) => e.modalitas === "Konvensional" && e.entrance !== undefined);

  const exceedCount = entries.filter((e) => e.exceeded).length;
  const exceedPct   = entries.length > 0 ? Math.round((exceedCount / entries.length) * 100) : 0;

  const ctAvgCtdi = ctEntries.length > 0
    ? Math.round((ctEntries.reduce((a, e) => a + (e.ctdiVol ?? 0), 0) / ctEntries.length) * 10) / 10
    : null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="mb-3 text-[11px] font-bold text-slate-700">Ringkasan DRL (data saat ini)</p>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-[10px] text-slate-400">Total Log</p>
          <p className="text-xl font-bold text-slate-700">{entries.length}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-400">Melebihi DRL</p>
          <p className={cn("text-xl font-bold", exceedCount > 0 ? "text-rose-600" : "text-emerald-500")}>{exceedCount}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-400">% Melebihi</p>
          <p className={cn("text-xl font-bold", exceedPct > 10 ? "text-rose-600" : "text-slate-700")}>{exceedPct}%</p>
        </div>
      </div>

      {ctAvgCtdi !== null && (
        <div className="mt-3">
          <p className="mb-1.5 text-[10px] font-semibold text-slate-500">Rata-rata CTDIvol CT (semua region)</p>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((ctAvgCtdi / 60) * 100, 100)}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className={cn("h-2 rounded-full", ctAvgCtdi > 40 ? "bg-amber-400" : "bg-teal-500")}
              />
            </div>
            <span className="text-[11px] font-semibold text-slate-700">{ctAvgCtdi} mGy</span>
          </div>
        </div>
      )}

      <div className="mt-3 border-t border-slate-100 pt-3">
        <p className="mb-2 text-[10px] font-semibold text-slate-500">DRL Referensi PMK 1014/2008 — CT</p>
        <div className="grid grid-cols-2 gap-1.5">
          {Object.entries(DRL_CT).map(([region, val]) => (
            <div key={region} className="flex justify-between rounded-lg bg-slate-50 px-2.5 py-1.5 text-[10px]">
              <span className="text-slate-500">{region}</span>
              <span className="font-semibold text-slate-700">{val.ctdi} mGy · {val.dlp} mGy·cm</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────

type FilterMod = "Semua" | Modalitas;

export default function DosisPane() {
  const [selId,    setSelId]    = useState<string>(DOSIS_LOG_MOCK[0].id);
  const [filterMod, setFilter]  = useState<FilterMod>("Semua");

  const filtered = useMemo(() =>
    filterMod === "Semua"
      ? DOSIS_LOG_MOCK
      : DOSIS_LOG_MOCK.filter((e) => e.modalitas === filterMod),
    [filterMod],
  );

  const selected = DOSIS_LOG_MOCK.find((e) => e.id === selId) ?? DOSIS_LOG_MOCK[0];
  const exceeded = DOSIS_LOG_MOCK.filter((e) => e.exceeded).length;

  const modalitasOptions: FilterMod[] = ["Semua", "CT", "Konvensional", "Mammografi", "Fluoroskopi"];

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-[13px] font-bold text-slate-800">Log Dosis Radiasi — DRL Monitoring</p>
          <p className="text-[11px] text-slate-400">Perka BAPETEN No. 2/2018 · PMK 1014/2008 · IAEA Safety Reports 39</p>
        </div>
        {exceeded > 0 && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2">
            <ShieldAlert size={13} className="text-rose-600" />
            <p className="text-[11px] font-semibold text-rose-700">{exceeded} pemeriksaan melebihi DRL</p>
          </div>
        )}
      </div>

      {/* Filter */}
      <div className="flex gap-1.5 flex-wrap">
        {modalitasOptions.map((m) => (
          <button key={m} onClick={() => setFilter(m)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all",
              filterMod === m
                ? "bg-teal-600 text-white"
                : "border border-slate-200 text-slate-600 hover:border-teal-200 hover:text-teal-700",
            )}>
            {m}
          </button>
        ))}
      </div>

      {/* Two-panel */}
      <div className="grid gap-4 md:grid-cols-[260px_1fr]">
        {/* Left: dose log list */}
        <div className="flex flex-col gap-2">
          <p className="px-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Log ({filtered.length} entri)
          </p>
          <div className="flex flex-col gap-2 max-h-[520px] overflow-y-auto pr-1">
            {filtered.map((e) => (
              <DoseCard key={e.id} entry={e} active={selId === e.id} onClick={() => setSelId(e.id)} />
            ))}
          </div>
        </div>

        {/* Right: detail + summary */}
        <div className="flex flex-col gap-4">
          <AnimatePresence mode="wait">
            <DoseDetail key={selected.id} entry={selected} />
          </AnimatePresence>
          <DRLSummary entries={DOSIS_LOG_MOCK} />
        </div>
      </div>
    </div>
  );
}
