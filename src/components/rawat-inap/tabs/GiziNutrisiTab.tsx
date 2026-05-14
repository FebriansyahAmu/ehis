"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Salad, BarChart3, Info } from "lucide-react";
import type { RawatInapPatientDetail } from "@/lib/data";
import { cn } from "@/lib/utils";
import {
  SKRINING_MOCK, GIZI_NUTRISI_MOCK, emptyGiziNutrisi,
  type DietOrder, type DietitianAddendum, type DailyMonitoring, type GiziNutrisiData,
} from "./giziNutrisi/giziNutrisiShared";
import DietOrderPane   from "./giziNutrisi/DietOrderPane";
import MonitoringPane  from "./giziNutrisi/MonitoringPane";

// ── StepPill ──────────────────────────────────────────────

function StepPill({ done, label }: { done: boolean; label: string }) {
  return (
    <motion.span
      animate={{ opacity: 1 }}
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 transition-all",
        done
          ? "bg-emerald-100 text-emerald-700 ring-emerald-200"
          : "bg-slate-100    text-slate-400    ring-slate-200",
      )}
    >
      {done ? "✓" : "○"} {label}
    </motion.span>
  );
}

// ── ProgressHeader ────────────────────────────────────────

function ProgressHeader({ data }: { data: GiziNutrisiData }) {
  const dietDone       = !!data.dietOrder;
  const monitoringDone = data.monitoring.length > 0;
  const doneCount      = [dietDone, monitoringDone].filter(Boolean).length;
  const pct            = Math.round((doneCount / 2) * 100);
  const allDone        = doneCount === 2;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xs">
      <div className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-300",
        allDone ? "bg-emerald-100" : "bg-indigo-100",
      )}>
        <Salad size={14} className={allDone ? "text-emerald-600" : "text-indigo-600"} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-700">Gizi & Nutrisi</span>
          <div className="ml-auto flex items-center gap-1.5">
            <StepPill done={dietDone}       label="Diet Order"  />
            <StepPill done={monitoringDone} label="Monitoring"  />
          </div>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <motion.div
            className={cn("h-full rounded-full transition-colors duration-500", allDone ? "bg-emerald-400" : "bg-indigo-400")}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      <span className="shrink-0 text-[11px] font-semibold tabular-nums text-slate-400">{pct}%</span>
    </div>
  );
}

// ── SectionHeader ─────────────────────────────────────────

function SectionHeader({
  icon: Icon, label, color,
}: {
  icon:  React.ElementType;
  label: string;
  color: "indigo" | "teal";
}) {
  const iconCls = { indigo: "text-indigo-500", teal: "text-teal-500" };
  return (
    <div className="mb-3 flex items-center gap-2">
      <Icon size={14} className={iconCls[color]} />
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</span>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────

export default function GiziNutrisiTab({ patient }: { patient: RawatInapPatientDetail }) {
  const rm      = patient.noRM;
  const initial = GIZI_NUTRISI_MOCK[rm] ?? emptyGiziNutrisi();

  const [data, setData] = useState<GiziNutrisiData>(initial);

  function saveMonitoring(day: DailyMonitoring) {
    setData((p) => {
      const filtered = p.monitoring.filter((d) => d.tanggal !== day.tanggal);
      return {
        ...p,
        monitoring: [...filtered, day].sort((a, b) => a.tanggal.localeCompare(b.tanggal)),
      };
    });
  }

  return (
    <div className="flex flex-col gap-4">

      <ProgressHeader data={data} />

      {/* SNARS note */}
      <div className="flex items-start gap-2 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-2.5">
        <Info size={11} className="mt-0.5 shrink-0 text-slate-400" />
        <p className="text-[10px] text-slate-400">
          SNARS AP 1.4 — Skrining nutrisi dalam 24 jam MRS; pasien berisiko dirujuk ke dietitian untuk asesmen penuh dan rencana diet terintegrasi
        </p>
      </div>

      {/* 2-column grid on large screen */}
      <div className="grid gap-4 xl:grid-cols-2">

        {/* Left — Diet & Konsultasi */}
        <div>
          <SectionHeader icon={Salad} label="Diet & Konsultasi" color="indigo" />
          <DietOrderPane
            rm={rm}
            skrining={SKRINING_MOCK[rm]}
            dietOrder={data.dietOrder}
            addendum={data.addendum}
            rujuk={data.rujukDietitian}
            onDietOrder={(d: DietOrder) =>
              setData((p) => ({ ...p, dietOrder: d }))
            }
            onAddendum={(a: DietitianAddendum) =>
              setData((p) => ({ ...p, addendum: a }))
            }
            onRujuk={(v: boolean) =>
              setData((p) => ({ ...p, rujukDietitian: v }))
            }
          />
        </div>

        {/* Right — Monitoring Asupan */}
        <div>
          <SectionHeader icon={BarChart3} label="Monitoring Asupan Harian" color="teal" />
          <MonitoringPane
            history={data.monitoring}
            onSave={saveMonitoring}
          />
        </div>

      </div>

      {/* Completion banner */}
      <AnimatePresence>
        {data.dietOrder && data.monitoring.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3">
              <Salad size={14} className="shrink-0 text-emerald-500" />
              <div>
                <p className="text-xs font-semibold text-emerald-800">Dokumentasi Gizi Lengkap</p>
                <p className="text-[11px] text-emerald-600">
                  Diet order aktif · {data.monitoring.length} hari monitoring tercatat
                  {data.addendum ? " · Addendum dietitian tersimpan" : ""}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
