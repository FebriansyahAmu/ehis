"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft, FlaskConical, User, Building2, Clock,
  CheckCircle2, Circle, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type LabOrder,
  LAB_STATUS_CFG, LAB_STATUS_STEPS, PRIORITAS_CFG, UNIT_CFG,
  calcTATMenit, getTATStatus, fmtTimestamp,
} from "./labShared";

// ── TAT Timeline ──────────────────────────────────────────

interface TSTep {
  label:     string;
  time?:     string;
  isDone:    boolean;
  isCurrent: boolean;
}

function TATTimeline({ order }: { order: LabOrder }) {
  const ts = order.timestamps;
  const steps: TSTep[] = [
    { label: "Order",        time: ts.order,       isDone: !!ts.order,       isCurrent: order.status === "Menunggu" },
    { label: "Terima",       time: ts.terima,      isDone: !!ts.terima,      isCurrent: order.status === "Diterima" },
    { label: "Ambil Sampel", time: ts.ambil,       isDone: !!ts.ambil,       isCurrent: order.status === "Ambil Sampel" },
    { label: "Reg. Sampel",  time: ts.registrasi,  isDone: !!ts.registrasi,  isCurrent: order.status === "Sampel Diterima" },
    { label: "Analisa",      time: ts.analisa,     isDone: !!ts.analisa,     isCurrent: order.status === "Dianalisa" },
    { label: "Validasi",     time: ts.validasi,    isDone: !!ts.validasi,    isCurrent: order.status === "Divalidasi" },
    { label: "Selesai",      time: ts.rilis,       isDone: !!ts.rilis,       isCurrent: order.status === "Selesai" },
  ];

  const elapsed = ts.order
    ? calcTATMenit(ts.order, ts.rilis ?? new Date().toISOString().slice(0, 16))
    : null;
  const tatStatus = elapsed !== null
    ? getTATStatus(elapsed, order.prioritas, order.unitAsal)
    : "pending";

  const tatCls = { ok: "text-emerald-600", warning: "text-amber-600", over: "text-rose-600 font-bold", pending: "text-slate-400" }[tatStatus];

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center gap-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">TAT Timeline</p>
        {elapsed !== null && (
          <span className={cn("text-[11px] font-semibold", tatCls)}>
            {elapsed >= 60 ? `${Math.floor(elapsed / 60)}j ${elapsed % 60}m` : `${elapsed} mnt`}
            {tatStatus === "over" && " ⚠ Melewati target"}
          </span>
        )}
      </div>
      <div className="flex items-start gap-0">
        {steps.map((step, idx) => (
          <div key={idx} className="flex flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              {idx > 0 && (
                <div className={cn("h-px flex-1", step.isDone ? "bg-sky-300" : "bg-slate-200")} />
              )}
              <div className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full border-2 text-white transition-colors",
                step.isDone  ? "border-sky-500 bg-sky-500" :
                step.isCurrent ? "border-sky-400 bg-sky-100" :
                "border-slate-200 bg-white",
              )}>
                {step.isDone
                  ? <CheckCircle2 size={10} />
                  : step.isCurrent
                    ? <Circle size={8} className="animate-pulse text-sky-500" />
                    : null
                }
              </div>
              {idx < steps.length - 1 && (
                <div className={cn("h-px flex-1", steps[idx + 1]?.isDone ? "bg-sky-300" : "bg-slate-200")} />
              )}
            </div>
            <div className="mt-1 text-center">
              <p className={cn("text-[9px] font-semibold", step.isDone ? "text-sky-600" : "text-slate-400")}>
                {step.label}
              </p>
              {step.time && (
                <p className="text-[9px] text-slate-400">{fmtTimestamp(step.time)}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Status Progress ───────────────────────────────────────

function StatusProgress({ order }: { order: LabOrder }) {
  if (order.status === "Ditolak") return null;
  const currentStep = LAB_STATUS_CFG[order.status].step;
  const total = LAB_STATUS_STEPS.length - 1;

  return (
    <div className="mt-3 flex items-center gap-1.5">
      {LAB_STATUS_STEPS.map((s, idx) => {
        const step = LAB_STATUS_CFG[s].step;
        const done = step <= currentStep;
        return (
          <div key={s} className="group relative flex-1">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: done ? 1 : 0 }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              className={cn(
                "h-1.5 origin-left rounded-full",
                step < currentStep ? "bg-sky-500" :
                step === currentStep ? "bg-sky-400" :
                "bg-slate-200",
              )}
              style={{ scaleX: done ? 1 : undefined, transformOrigin: "left" }}
            />
            <div className="absolute -top-5 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-slate-800 px-1.5 py-0.5 text-[9px] text-white group-hover:block">
              {LAB_STATUS_CFG[s].label}
            </div>
          </div>
        );
      })}
      <span className="shrink-0 text-[11px] font-semibold text-slate-500">
        {currentStep}/{total}
      </span>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────

export default function LabOrderHeader({ order }: { order: LabOrder }) {
  const cfg     = LAB_STATUS_CFG[order.status];
  const priCfg  = PRIORITAS_CFG[order.prioritas];
  const unitCfg = UNIT_CFG[order.unitAsal];
  const isCITO  = order.prioritas === "CITO";
  const isRejected = order.status === "Ditolak";
  const hasUnconfirmedCritical = order.criticalNotifs?.some((n) => !n.confirmed) ?? false;

  return (
    <header className={cn(
      "border-b bg-white px-6 py-4",
      isCITO ? "border-rose-200" : "border-slate-200",
    )}>
      {/* Top row */}
      <div className="flex items-start gap-4">
        <Link
          href="/ehis-care/laboratorium"
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-sky-300 hover:text-sky-600"
        >
          <ArrowLeft size={16} />
        </Link>

        <div className="flex flex-1 flex-wrap items-start justify-between gap-3">
          {/* Patient + Order info */}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900">{order.namaPasien}</h1>
              <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-bold", priCfg.badge)}>
                {order.prioritas}
              </span>
              {hasUnconfirmedCritical && (
                <motion.span
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                  className="flex items-center gap-1 rounded-full bg-rose-500 px-2.5 py-0.5 text-[11px] font-bold text-white"
                >
                  <AlertTriangle size={10} />
                  NILAI KRITIS BELUM DIKONFIRMASI
                </motion.span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-[12px] text-slate-500">
              <span className="flex items-center gap-1">
                <User size={11} />
                {order.noRM} · {order.usia} thn · {order.gender === "L" ? "Laki-laki" : "Perempuan"}
              </span>
              <span className="flex items-center gap-1">
                <Building2 size={11} />
                <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-medium", unitCfg.badge)}>
                  {order.unitAsal}
                </span>
                {order.ruangan && <span className="text-slate-400">{order.ruangan}</span>}
              </span>
              <span className="flex items-center gap-1">
                <FlaskConical size={11} />
                {order.noOrder}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={11} />
                {order.tanggal} · {order.jam}
              </span>
            </div>
            <p className="mt-0.5 text-[12px] text-slate-500">
              {order.items.length} pemeriksaan · {order.dokter}
              {order.catatan && <span className="ml-2 text-slate-400">· {order.catatan}</span>}
            </p>
          </div>

          {/* Status badge */}
          <div className="flex flex-col items-end gap-1.5">
            <motion.span
              key={order.status}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className={cn("rounded-full px-3 py-1 text-[12px] font-bold", cfg.badge)}
            >
              {cfg.label}
            </motion.span>
            {isRejected && (
              <span className="flex items-center gap-1 text-[11px] text-rose-600">
                <AlertTriangle size={11} />
                {order.penolakan?.alasan}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* TAT Timeline */}
      <TATTimeline order={order} />

      {/* Status progress bar */}
      <StatusProgress order={order} />
    </header>
  );
}
