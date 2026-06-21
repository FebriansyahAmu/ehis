"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FlaskConical, Clock, AlertTriangle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type LabOrder,
  LAB_STATUS_CFG, LAB_STATUS_STEPS,
  PRIORITAS_CFG, UNIT_CFG,
  getTATElapsed, getTATStatus,
} from "./labShared";

// ── TAT Chip ──────────────────────────────────────────────

function TATChip({ order }: { order: LabOrder }) {
  const menit  = getTATElapsed(order.timestamps);
  const status = getTATStatus(menit, order.prioritas, order.unitAsal);
  if (status === "pending" || menit === null) return null;

  const cls = {
    ok:      "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    warning: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    over:    "bg-rose-50 text-rose-700 ring-1 ring-rose-200 font-bold",
  }[status];

  const display = menit >= 60
    ? `${Math.floor(menit / 60)}j ${menit % 60}m`
    : `${menit} mnt`;

  return (
    <span className={cn("flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px]", cls)}>
      <Clock size={9} />
      {display}
      {status === "over" && " ⚠"}
    </span>
  );
}

// ── Progress Bar ──────────────────────────────────────────

function ProgressBar({ order }: { order: LabOrder }) {
  if (order.status === "Ditolak") {
    return (
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-rose-100">
        <div className="h-full w-full rounded-full bg-rose-400" />
      </div>
    );
  }
  const total  = LAB_STATUS_STEPS.length - 1;
  const step   = LAB_STATUS_CFG[order.status].step;
  const pct    = Math.max(0, Math.min(100, (step / total) * 100));
  const barCls = step >= 4 ? "bg-emerald-400" : step >= 2 ? "bg-violet-400" : "bg-sky-400";

  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
      <motion.div
        className={cn("h-full rounded-full", barCls)}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────

export default function LabOrderCard({ order }: { order: LabOrder }) {
  const cfg   = LAB_STATUS_CFG[order.status];
  const priCfg = PRIORITAS_CFG[order.prioritas];
  const unitCfg = UNIT_CFG[order.unitAsal];
  const isCITO = order.prioritas === "CITO";
  const isDone = order.status === "Selesai";
  const isRejected = order.status === "Ditolak";
  const hasCritical = order.criticalNotifs?.some((n) => !n.confirmed) ?? false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md",
        isCITO    ? "border-rose-200 ring-1 ring-rose-100" :
        isDone    ? "border-emerald-100" :
        isRejected ? "border-rose-100" :
        "border-slate-200",
      )}
    >
      {/* CITO accent stripe */}
      {isCITO && (
        <div className="absolute left-0 top-0 h-full w-1 bg-rose-500" />
      )}

      <div className={cn("p-4", isCITO && "pl-5")}>
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
              isCITO ? "bg-rose-100" : "bg-sky-50",
            )}>
              <FlaskConical size={15} className={isCITO ? "text-rose-500" : "text-sky-500"} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-bold text-slate-800">{order.namaPasien}</p>
              <p className="text-[11px] text-slate-400">{order.noRM} · {order.noOrder}</p>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", priCfg.badge)}>
              {order.prioritas}
            </span>
            {hasCritical && (
              <span className="flex items-center gap-0.5 rounded-full bg-rose-500 px-2 py-0.5 text-[9px] font-bold text-white">
                <AlertTriangle size={8} />
                KRITIS
              </span>
            )}
          </div>
        </div>

        {/* Meta row */}
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", unitCfg.badge)}>
            {order.unitAsal}
          </span>
          <span className={cn("rounded-full px-2 py-0.5 text-[10px]", cfg.badge)}>
            {cfg.label}
          </span>
          <TATChip order={order} />
        </div>

        {/* Tests */}
        <div className="mt-2.5">
          <div className="flex flex-wrap gap-1">
            {order.items.slice(0, 3).map((item) => (
              <span
                key={item.id}
                className={cn(
                  "rounded-md px-1.5 py-0.5 text-[10px]",
                  item.isSpecial
                    ? "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
                    : "bg-slate-100 text-slate-600",
                )}
              >
                {item.nama}
              </span>
            ))}
            {order.items.length > 3 && (
              <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-400">
                +{order.items.length - 3} lainnya
              </span>
            )}
          </div>
        </div>

        {/* Progress + Action */}
        <div className="mt-3 space-y-2">
          <ProgressBar order={order} />
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-slate-400">
              {order.jam} · {order.dokter.split(",")[0]}
            </p>
            <Link
              href={`/ehis-care/laboratorium/${order.id}`}
              className="flex items-center gap-1 rounded-lg bg-sky-600 px-3 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-sky-700"
            >
              {isDone ? "Lihat Hasil" : isRejected ? "Detail" : cfg.action || "Proses"}
              <ChevronRight size={11} />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
