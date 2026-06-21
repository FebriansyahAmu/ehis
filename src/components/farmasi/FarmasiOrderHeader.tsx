"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft, AlertTriangle, MapPin, Stethoscope,
  Clock, CalendarDays, User, BedDouble, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  STATUS_CFG, DEPO_CFG, DEPO_LABEL, PRIORITAS_CFG,
  getPatientInfo, calcTATMenit, getTATStatus, TAT_TARGET_UNIT,
  type FarmasiOrder,
} from "./farmasiShared";

// ── TAT Timeline ──────────────────────────────────────────

function TATTimeline({ order }: { order: FarmasiOrder }) {
  const ts = order.timestamps;
  if (!ts) return null;
  const menit  = calcTATMenit(ts);
  const status = getTATStatus(menit, order.unit);
  const target = TAT_TARGET_UNIT[order.unit];

  const TAT_CFG = {
    ok:      { cls: "text-emerald-700 bg-emerald-50 ring-emerald-200", pulse: "bg-emerald-500" },
    warning: { cls: "text-amber-700 bg-amber-50 ring-amber-200",       pulse: "bg-amber-500"   },
    over:    { cls: "text-rose-700 bg-rose-50 ring-rose-200",           pulse: "bg-rose-500"    },
    pending: { cls: "text-slate-500 bg-slate-50 ring-slate-200",        pulse: "bg-sky-400"     },
  }[status];

  const steps: { label: string; time?: string }[] = [
    { label: "Masuk",      time: ts.masuk       },
    { label: "Telaah",     time: ts.telaah      },
    { label: "Dispensing", time: ts.dispensing  },
    { label: "Serah",      time: ts.serahTerima },
  ];

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-slate-100 px-5 py-2">
      <div className="flex items-center gap-2 min-w-0">
        <Clock size={10} className="shrink-0 text-slate-400" />
        <div className="flex items-center gap-0">
          {steps.map((step, i) => (
            <div key={step.label} className="flex items-center">
              <div className="flex flex-col items-center gap-0.5">
                <div className={cn("h-1.5 w-1.5 rounded-full transition-colors", step.time ? "bg-sky-500" : "bg-slate-200")} />
                <span className={cn("text-[9px] font-semibold whitespace-nowrap", step.time ? "text-sky-600" : "text-slate-300")}>
                  {step.time ?? step.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={cn("mx-1.5 mb-3.5 h-px w-4", steps[i + 1]?.time ? "bg-sky-300" : "bg-slate-200")} />
              )}
            </div>
          ))}
        </div>
      </div>

      {menit !== null ? (
        <span className={cn("shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold ring-1", TAT_CFG.cls)}>
          TAT {menit} mnt / target {target} mnt
        </span>
      ) : (
        <span className="flex shrink-0 items-center gap-1 text-[10px] text-slate-400">
          <span className={cn("h-1.5 w-1.5 rounded-full animate-pulse", TAT_CFG.pulse)} />
          Target ≤{target} mnt
        </span>
      )}
    </div>
  );
}

// ── Progress stepper ──────────────────────────────────────

// 3 aksi alur Farmasi: Telaah → Dispensasi → Serah. Serah selesai = order "Selesai"
// (status Selesai = step 3 > indeks terakhir → ketiga step ter-check). Tak ada step "Selesai"
// terpisah (redundan dgn Serah).
const WORKFLOW_STEPS = [
  { label: "Telaah",     s: 0 },
  { label: "Dispensasi", s: 1 },
  { label: "Serah",      s: 2 },
];

function ProgressStepper({ step }: { step: number }) {
  if (step < 0) return null;
  return (
    <div className="flex items-center">
      {WORKFLOW_STEPS.map((st, i) => (
        <div key={st.s} className="flex items-center">
          <div className="flex flex-col items-center gap-0.5">
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.07, type: "spring", stiffness: 300 }}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full border-2 text-[11px] font-black transition-all duration-400",
                st.s < step
                  ? "border-sky-500 bg-sky-500 text-white shadow-sm shadow-sky-200"
                  : st.s === step
                  ? "border-sky-500 bg-white text-sky-600 shadow-sm shadow-sky-100"
                  : "border-slate-200 bg-white text-slate-300",
              )}
            >
              {st.s < step ? <Check size={12} /> : st.s + 1}
            </motion.div>
            <span className={cn(
              "whitespace-nowrap text-[9px] font-semibold",
              st.s <= step ? "text-sky-600" : "text-slate-300",
            )}>{st.label}</span>
          </div>
          {i < WORKFLOW_STEPS.length - 1 && (
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.1 + i * 0.06, duration: 0.45 }}
              className={cn(
                "mx-1 mb-4 h-0.5 w-8 origin-left transition-colors duration-500",
                st.s < step ? "bg-sky-400" : "bg-slate-200",
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function Chip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold",
      className,
    )}>{children}</span>
  );
}

export default function FarmasiOrderHeader({ order }: { order: FarmasiOrder }) {
  const cfg      = STATUS_CFG[order.status];
  const depoCfg  = DEPO_CFG[order.depo];
  const priorCfg = PRIORITAS_CFG[order.prioritas];
  const patient  = getPatientInfo(order.noRM);

  const unitColor = {
    "IGD":         "text-rose-700 bg-rose-50 ring-rose-200",
    "Rawat Inap":  "text-violet-700 bg-violet-50 ring-violet-200",
    "Rawat Jalan": "text-sky-700 bg-sky-50 ring-sky-200",
  }[order.unit] ?? "text-slate-700 bg-slate-100";

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="shrink-0 border-b border-slate-200 bg-white"
    >
      {/* Top bar */}
      <div className="flex items-center gap-3 px-5 py-3.5">
        <Link
          href="/ehis-care/farmasi"
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-500 transition-all hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
        >
          <ArrowLeft size={13} />
          <span className="hidden sm:inline">Kembali</span>
        </Link>
        <span className="h-6 w-px bg-slate-200" aria-hidden="true" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn("rounded-md px-1.5 py-0.5 ring-1 text-[10px] font-bold", unitColor)}>
              {order.unit}
            </span>
            <h1 className="text-base font-bold text-slate-900 leading-tight">{order.namaPasien}</h1>
            {patient?.usia && (
              <span className="text-xs text-slate-400">
                {patient.jenisKelamin === "L" ? "♂" : "♀"} {patient.usia}
              </span>
            )}
            {order.hasHAM && (
              <Chip className="animate-pulse bg-rose-50 text-rose-700 ring-1 ring-rose-200">
                <AlertTriangle size={9} aria-hidden="true" />HAM
              </Chip>
            )}
            <Chip className={priorCfg.badge}>{order.prioritas}</Chip>
          </div>
          <div className="mt-0.5 flex items-center gap-3 flex-wrap">
            <span className="font-mono text-xs text-slate-400">{order.noRM}</span>
            {patient?.ruangan && (
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <BedDouble size={10} aria-hidden="true" />
                {patient.ruangan}{patient.noBed ? ` · ${patient.noBed}` : ""}
              </span>
            )}
          </div>
        </div>

        <div className="shrink-0 text-right hidden sm:block">
          <motion.span
            key={order.status}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn("inline-block rounded-lg px-3 py-1.5 text-xs font-bold", cfg.badge)}
          >
            {cfg.label}
          </motion.span>
          <p className="mt-0.5 font-mono text-[10px] text-slate-400">{order.noOrder}</p>
        </div>
      </div>

      {/* Details + stepper row */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-slate-100 px-5 py-2.5 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <Stethoscope size={11} className="text-slate-400" aria-hidden="true" />
          {order.dokterPeminta}
        </span>
        <span className="flex items-center gap-1.5">
          <MapPin size={11} className="text-slate-400" aria-hidden="true" />
          <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-semibold", depoCfg.badge)}>
            {DEPO_LABEL[order.depo]}
          </span>
        </span>
        <span className="flex items-center gap-1.5">
          <CalendarDays size={11} className="text-slate-400" aria-hidden="true" />
          {order.tanggal}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock size={11} className="text-slate-400" aria-hidden="true" />
          {order.jam}
        </span>
        <span className="flex items-center gap-1.5">
          <User size={11} className="text-slate-400" aria-hidden="true" />
          {order.items.length} item obat
        </span>

        <div className="ml-auto hidden lg:block">
          {order.status !== "Dikembalikan"
            ? <ProgressStepper step={cfg.step} />
            : <Chip className="bg-rose-50 text-rose-700 ring-1 ring-rose-200 px-3 py-1">
                Dikembalikan ke Dokter
              </Chip>
          }
        </div>
      </div>

      {/* TAT timeline */}
      <TATTimeline order={order} />
    </motion.header>
  );
}
