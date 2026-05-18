"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FlaskConical, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, FileWarning } from "lucide-react";
import { cn } from "@/lib/utils";
import { EQA_PROGRAMS_MOCK, EQA_STATUS_CFG, MODALITAS_COLOR, type EQAProgram, type EQASiklus } from "./radManajemenShared";

// ── Deviasi Bar ────────────────────────────────────────────

function DeviasiBar({ deviasi, status }: { deviasi: number; status: string }) {
  const abs  = Math.abs(deviasi);
  const pct  = Math.min(abs / 20 * 100, 100);
  const isNeg= deviasi < 0;
  const barColor = abs <= 5 ? "bg-emerald-500" : abs <= 10 ? "bg-amber-400" : "bg-rose-500";

  return (
    <div className="flex items-center gap-2">
      {/* Negative side */}
      <div className="relative h-2 w-full rounded-full bg-slate-100 overflow-hidden flex">
        {isNeg ? (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5 }}
            className={cn("h-2 rounded-full ml-auto", barColor)}
          />
        ) : (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5 }}
            className={cn("h-2 rounded-full", barColor)}
          />
        )}
      </div>
      <span className={cn(
        "shrink-0 text-[10px] font-semibold w-12 text-right",
        abs <= 5 ? "text-emerald-700" : abs <= 10 ? "text-amber-700" : "text-rose-700",
      )}>
        {deviasi > 0 ? "+" : ""}{deviasi.toFixed(1)}%
      </span>
    </div>
  );
}

// ── Siklus Table ──────────────────────────────────────────

function SiklusTable({ siklus }: { siklus: EQASiklus[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-1.5">
      {siklus.map((s, i) => {
        const cfg     = EQA_STATUS_CFG[s.status];
        const isOpen  = openId === s.id;
        const hasCata = Boolean(s.catatan);

        return (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className={cn(
              "rounded-lg border",
              s.status === "Tidak Lulus" ? "border-rose-200 bg-rose-50/40" : "border-slate-100 bg-white",
            )}
          >
            <button
              onClick={() => hasCata && setOpenId(isOpen ? null : s.id)}
              className={cn(
                "grid w-full items-center gap-2 px-3 py-2.5 text-left",
                "grid-cols-[1fr_80px_90px_20px]",
              )}
            >
              <div>
                <p className="text-[11px] font-medium text-slate-700">{s.parameter}</p>
                <p className="text-[9px] text-slate-400">{s.tanggal}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-semibold text-slate-700">{s.nilaiRS}</p>
                <p className="text-[9px] text-slate-400">Acuan: {s.nilaiAcuan}</p>
              </div>
              <div>
                <DeviasiBar deviasi={s.deviasi} status={s.status} />
              </div>
              <div className="flex items-center justify-end">
                {hasCata && (
                  isOpen ? <ChevronUp size={11} className="text-slate-400" /> : <ChevronDown size={11} className="text-slate-400" />
                )}
              </div>
            </button>

            <AnimatePresence>
              {isOpen && s.catatan && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-start gap-2 border-t border-rose-100 px-3 pb-2.5 pt-2">
                    <FileWarning size={11} className="mt-0.5 shrink-0 text-rose-500" />
                    <p className="text-[10px] text-rose-700">{s.catatan}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}

      {/* Table header explanation */}
      <div className="flex gap-2 px-3 pt-1 text-[9px] text-slate-400">
        <span>Deviasi: hijau &lt;5% · amber 5–10% · merah &gt;10%</span>
      </div>
    </div>
  );
}

// ── Program Card ──────────────────────────────────────────

function ProgramCard({ prog }: { prog: EQAProgram }) {
  const [expanded, setExpanded] = useState(true);
  const lulusCount  = prog.siklus.filter((s) => s.status === "Lulus").length;
  const tidakLulus  = prog.siklus.filter((s) => s.status === "Tidak Lulus").length;
  const pendingCount= prog.siklus.filter((s) => s.status === "Pending").length;
  const hasFailure  = tidakLulus > 0;

  return (
    <div className={cn(
      "rounded-2xl border bg-white overflow-hidden",
      hasFailure ? "border-rose-200" : "border-slate-200",
    )}>
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left"
      >
        <div className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
          MODALITAS_COLOR[prog.modalitas] ?? "bg-slate-500",
        )}>
          <FlaskConical size={15} className="text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold text-slate-800">{prog.nama}</p>
          <p className="text-[10px] text-slate-400">{prog.provider} · {prog.tahun}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 text-[10px]">
            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
              <CheckCircle2 size={10} /> {lulusCount} Lulus
            </span>
            {tidakLulus > 0 && (
              <span className="flex items-center gap-1 text-rose-600 font-semibold">
                <AlertTriangle size={10} /> {tidakLulus} Tidak Lulus
              </span>
            )}
            {pendingCount > 0 && (
              <span className="text-slate-400">{pendingCount} Pending</span>
            )}
          </div>
          {expanded ? <ChevronUp size={13} className="text-slate-400" /> : <ChevronDown size={13} className="text-slate-400" />}
        </div>
      </button>

      {/* CAPA Banner */}
      <AnimatePresence>
        {hasFailure && expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mx-4 mb-3 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
              <AlertTriangle size={13} className="mt-0.5 shrink-0 text-rose-600" />
              <div>
                <p className="text-[11px] font-bold text-rose-800">CAPA Diperlukan — {tidakLulus} Parameter Tidak Lulus</p>
                <p className="text-[10px] text-rose-600 mt-0.5">
                  Corrective and Preventive Action wajib dilakukan sebelum siklus berikutnya.
                  Dokumentasikan akar masalah, tindakan korektif, dan jadwal verifikasi perbaikan.
                  IAEA HH-19 · ACR Accreditation Requirements.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Siklus content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-100 px-5 pb-4 pt-3">
              {/* Column headers */}
              <div className="mb-2 grid grid-cols-[1fr_80px_90px_20px] gap-2 px-3 text-[9px] font-bold uppercase tracking-widest text-slate-400">
                <span>Parameter</span>
                <span className="text-right">Nilai RS</span>
                <span>Deviasi</span>
                <span />
              </div>
              <SiklusTable siklus={prog.siklus} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────

export default function EQAPane() {
  const totalPrograms = EQA_PROGRAMS_MOCK.length;
  const totalSiklus   = EQA_PROGRAMS_MOCK.flatMap((p) => p.siklus);
  const totalLulus    = totalSiklus.filter((s) => s.status === "Lulus").length;
  const totalTidak    = totalSiklus.filter((s) => s.status === "Tidak Lulus").length;
  const hasCapa       = totalTidak > 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-[13px] font-bold text-slate-800">EQA & Phantom Test Radiologi</p>
          <p className="text-[11px] text-slate-400">IAEA HH-19 · ACR Accreditation Program · AAPM</p>
        </div>
        {hasCapa && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2">
            <AlertTriangle size={13} className="text-rose-600" />
            <p className="text-[11px] font-semibold text-rose-700">{totalTidak} parameter perlu CAPA</p>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Program Aktif",   val: totalPrograms, color: "text-teal-700"    },
          { label: "Total Siklus",    val: totalSiklus.length, color: "text-slate-700" },
          { label: "Lulus",           val: totalLulus, color: "text-emerald-700"    },
          { label: "Tidak Lulus",     val: totalTidak, color: totalTidak > 0 ? "text-rose-600" : "text-slate-400", alert: totalTidak > 0 },
        ].map((s) => (
          <div key={s.label} className={cn(
            "rounded-xl border px-4 py-3",
            s.alert ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-white",
          )}>
            <p className="text-[10px] text-slate-400">{s.label}</p>
            <p className={cn("text-2xl font-bold", s.color)}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Reference info */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-[10px] font-semibold text-slate-600 mb-1">Standar Acuan Program EQA / Phantom Test</p>
        <div className="grid grid-cols-3 gap-3 text-[10px] text-slate-500">
          <div>
            <p className="font-semibold text-slate-600">CT — AAPM TG-18</p>
            <p>CTDIvol · Noise · Uniformitas HU · Resolusi kontras rendah</p>
          </div>
          <div>
            <p className="font-semibold text-slate-600">USG — AIUM / SMPTE</p>
            <p>Akurasi jarak · Dead zone · Penetrasi kedalaman · Resolusi aksial</p>
          </div>
          <div>
            <p className="font-semibold text-slate-600">MRI — ACR</p>
            <p>SNR · Uniformitas gambar · Resolusi spasial · Ketebalan irisan</p>
          </div>
        </div>
      </div>

      {/* Program cards */}
      <div className="flex flex-col gap-3">
        {EQA_PROGRAMS_MOCK.map((prog, i) => (
          <motion.div
            key={prog.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <ProgramCard prog={prog} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
