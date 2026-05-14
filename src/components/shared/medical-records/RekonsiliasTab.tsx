"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Repeat, AlertTriangle, Home, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  REKON_PHASES, emptyRekon,
  type RekonContext, type RekonPhase, type RekonData,
} from "./rekonsiliasi/rekonsiliasiShared";
import RekonSection from "./rekonsiliasi/RekonSection";

// ── Patient interface (minimal — both IGD and RI satisfy this) ─

interface RekonPatient {
  noRM:         string;
  name?:        string;
  obatSaatIni?: string;
}

interface Props {
  patient: RekonPatient;
  context: RekonContext;
}

// ── Progress bar header ────────────────────────────────────

function ProgressHeader({
  doneCount, total,
}: { doneCount: number; total: number }) {
  const pct    = total === 0 ? 0 : Math.round((doneCount / total) * 100);
  const allDone = doneCount === total;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xs">
      <div className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
        allDone ? "bg-emerald-100" : "bg-indigo-100",
      )}>
        <Repeat size={14} className={allDone ? "text-emerald-600" : "text-indigo-600"} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700">Rekonsiliasi Obat</span>
          <motion.span
            key={doneCount}
            initial={{ scale: 0.85, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className={cn(
              "rounded-full px-2.5 py-0.5 text-[11px] font-bold",
              allDone
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-100 text-slate-500",
            )}
          >
            {doneCount}/{total} selesai
          </motion.span>
        </div>

        {/* Animated progress bar */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <motion.div
            className={cn("h-full rounded-full", allDone ? "bg-emerald-400" : "bg-indigo-400")}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      <span className="shrink-0 text-[11px] font-semibold tabular-nums text-slate-400">
        {pct}%
      </span>
    </div>
  );
}

// ── HAM summary banner ─────────────────────────────────────

function HAMBanner({ count }: { count: number }) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -6, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -6, height: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50/60 px-4 py-3">
            <AlertTriangle size={13} className="mt-0.5 shrink-0 text-red-500" />
            <p className="text-[11px] text-red-700">
              <span className="font-bold">{count} obat High-Alert Medication (HAM)</span>{" "}
              terdeteksi dalam rekonsiliasi ini. Wajib verifikasi ganda sebelum pemberian.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Home meds banner (shown for RI when obatSaatIni available) ─

function HomeMedsBanner({ obatSaatIni }: { obatSaatIni?: string }) {
  if (!obatSaatIni) return null;
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <Home size={13} className="mt-0.5 shrink-0 text-slate-400" />
      <p className="text-[11px] text-slate-600">
        <span className="font-semibold">Obat dari rumah (anamnesis):</span>{" "}
        {obatSaatIni}
      </p>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────

export default function RekonsiliasTab({ patient, context }: Props) {
  const phases = REKON_PHASES[context];

  const [open, setOpen] = useState<RekonPhase | null>(null);
  const [dataMap, setDataMap] = useState<Record<RekonPhase, RekonData>>({
    admisi:    emptyRekon(),
    transfer:  emptyRekon(),
    discharge: emptyRekon(),
  });

  const doneCount = Object.values(dataMap).filter((d) => d.selesai).length;
  const totalHAM  = Object.values(dataMap).reduce(
    (acc, d) => acc + d.obatList.filter((o) => o.isHAM).length,
    0,
  );

  return (
    <div className="flex flex-col gap-3">

      <ProgressHeader doneCount={doneCount} total={phases.length} />

      <HAMBanner count={totalHAM} />

      {context === "ri" && <HomeMedsBanner obatSaatIni={patient.obatSaatIni} />}

      {/* Card containing compliance note + all sections */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">

        {/* Compliance note */}
        <div className="flex items-start gap-2 border-b border-slate-100 bg-slate-50/60 px-4 py-2.5">
          <Info size={11} className="mt-0.5 shrink-0 text-slate-400" />
          <p className="text-[10px] text-slate-400">
            SNARS PP 3.1 · SKP 3 · PMK 72/2016 — Rekonsiliasi wajib di setiap titik transisi perawatan pasien
          </p>
        </div>

        {/* Sections */}
        {phases.map((phase, idx) => (
          <div key={phase.id} className={cn(idx > 0 && "border-t border-slate-100")}>
            <RekonSection
              phase={phase}
              data={dataMap[phase.id]}
              onChange={(d) => setDataMap((p) => ({ ...p, [phase.id]: d }))}
              isOpen={open === phase.id}
              onToggle={() => setOpen((prev) => (prev === phase.id ? null : phase.id))}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
