"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, ChevronRight, AlertTriangle, User, MapPin, Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type RadOrder,
  MODALITAS_CFG, URGENSI_CFG, RAD_STATUS_CFG,
  calcTATMenit, getTATStatus, hasCriticalFinding, getStatusStep,
} from "./radShared";

// ── TAT Chip ─────────────────────────────────────────────

function TATChip({ order }: { order: RadOrder }) {
  const menit  = calcTATMenit(order);
  const status = getTATStatus(order);
  if (menit === null) return null;

  const cfg = {
    ok:      "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    over:    "bg-rose-50 text-rose-700 border-rose-200",
  }[status];

  const label = menit >= 60
    ? `${Math.floor(menit / 60)}j ${menit % 60}m`
    : `${menit}m`;

  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold", cfg)}>
      <Clock size={9} />
      {label}
    </span>
  );
}

// ── Progress Bar ──────────────────────────────────────────

function ProgressBar({ order }: { order: RadOrder }) {
  const step  = getStatusStep(order.status);
  const total = 7;
  const pct   = step < 0 ? 0 : Math.round((step / total) * 100);

  const barColor = order.status === "Selesai"
    ? "bg-emerald-500"
    : order.status === "Ditolak"
    ? "bg-rose-400"
    : order.prioritas === "CITO"
    ? "bg-rose-500"
    : "bg-teal-500";

  return (
    <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-slate-100">
      <motion.div
        className={cn("h-full rounded-full", barColor)}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────

export default function RadOrderCard({ order }: { order: RadOrder }) {
  const mod       = order.items[0]?.modalitas ?? "Konvensional";
  const modCfg    = MODALITAS_CFG[mod];
  const urgCfg    = URGENSI_CFG[order.prioritas];
  const statusCfg = RAD_STATUS_CFG[order.status];
  const critical  = hasCriticalFinding(order);
  const isCITO    = order.prioritas === "CITO";

  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
      transition={{ duration: 0.15 }}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-shadow",
        isCITO ? "border-rose-200" : order.prioritas === "Semi_Cito" ? "border-amber-200" : "border-slate-200",
      )}
    >
      {/* CITO / Semi-Cito stripe */}
      {order.prioritas !== "Rutin" && (
        <div className={cn("h-1 w-full", urgCfg.stripe)} />
      )}

      <div className="flex flex-col gap-3 p-4">
        {/* Header: patient + badges */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900">{order.namaPasien}</p>
            <p className="text-[11px] text-slate-400">{order.noRM} · {order.usia}th {order.gender}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", urgCfg.badge)}>
              {urgCfg.label}
            </span>
            {critical && (
              <span className="flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                <AlertTriangle size={9} />
                Temuan Kritis
              </span>
            )}
          </div>
        </div>

        {/* Exam info */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={cn("rounded-lg px-2 py-0.5 text-[11px] font-semibold", modCfg.bgColor, modCfg.textColor)}>
            {modCfg.label}
          </span>
          {order.items.map((item) => (
            <span key={item.id} className="truncate text-[12px] font-medium text-slate-700">
              {item.nama}
            </span>
          ))}
          {order.items.length > 1 && (
            <span className="text-[11px] text-slate-400">+{order.items.length - 1}</span>
          )}
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <User size={10} />
            {order.dokter.replace("dr. ", "").split(" ")[0]}
          </span>
          <span className="flex items-center gap-1">
            <MapPin size={10} />
            {order.unitAsal}{order.noBed ? ` · ${order.noBed}` : ""}
          </span>
          <span className="flex items-center gap-1">
            <Stethoscope size={10} />
            {order.jam}
          </span>
        </div>

        {/* Status + TAT */}
        <div className="flex items-center justify-between">
          <div className={cn("flex items-center gap-1.5 rounded-lg px-2 py-1", statusCfg.badge)}>
            <span className={cn("h-1.5 w-1.5 rounded-full", statusCfg.dot)} />
            <span className="text-[11px] font-semibold">{statusCfg.label}</span>
          </div>
          <TATChip order={order} />
        </div>

        <ProgressBar order={order} />
      </div>

      {/* Action button */}
      <div className="border-t border-slate-100 px-4 py-2.5">
        <Link
          href={`/ehis-care/radiologi/${order.id}`}
          className={cn(
            "flex w-full items-center justify-between rounded-lg px-3 py-2 text-[12px] font-semibold transition-colors",
            order.status === "Selesai"
              ? "text-slate-400 hover:bg-slate-50"
              : "bg-teal-600 text-white hover:bg-teal-700 shadow-sm",
          )}
        >
          <span>{order.status === "Selesai" ? "Lihat Laporan" : "Proses Order"}</span>
          <ChevronRight size={14} />
        </Link>
      </div>
    </motion.div>
  );
}
