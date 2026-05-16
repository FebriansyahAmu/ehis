"use client";

import { motion } from "framer-motion";
import { Pill, Clock, Stethoscope, MapPin, AlertTriangle, Package, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type FarmasiOrder,
  STATUS_CFG, DEPO_CFG, PRIORITAS_CFG,
} from "./farmasiShared";

// ── Unit badge ────────────────────────────────────────────

const UNIT_CFG = {
  "IGD":          { cls: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",       short: "IGD" },
  "Rawat Inap":   { cls: "bg-violet-50 text-violet-700 ring-1 ring-violet-200", short: "RI"  },
  "Rawat Jalan":  { cls: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",          short: "RJ"  },
};

// ── Status progress bar ───────────────────────────────────

function StatusProgress({ step }: { step: number }) {
  const steps = [0, 1, 2, 3];
  if (step === -1) return null;
  return (
    <div className="flex items-center gap-0.5">
      {steps.map((s) => (
        <div
          key={s}
          className={cn(
            "h-1 flex-1 rounded-full transition-all duration-300",
            s <= step ? "bg-indigo-500" : "bg-slate-200",
          )}
        />
      ))}
    </div>
  );
}

// ── HAM badge ─────────────────────────────────────────────

function HAMBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 ring-1 ring-rose-200">
      <AlertTriangle size={9} aria-hidden="true" />
      HAM
    </span>
  );
}

// ── Main component ────────────────────────────────────────

interface OrderCardProps {
  order:   FarmasiOrder;
  index?:  number;
  onAction: (order: FarmasiOrder) => void;
}

export default function OrderCard({ order, index = 0, onAction }: OrderCardProps) {
  const cfg       = STATUS_CFG[order.status];
  const depoCfg   = DEPO_CFG[order.depo];
  const unitCfg   = UNIT_CFG[order.unit];
  const priorCfg  = PRIORITAS_CFG[order.prioritas];
  const hamCount  = order.items.filter((i) => i.isHAM).length;

  const borderCls = {
    Menunggu:          "border-l-amber-400",
    Ditelaah:          "border-l-sky-400",
    "Siap Diserahkan": "border-l-indigo-500",
    Selesai:           "border-l-emerald-500",
    Dikembalikan:      "border-l-rose-500",
  }[order.status];

  return (
    <motion.article
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.04, ease: "easeOut" }}
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-slate-200 border-l-4 bg-white p-4 shadow-sm",
        "transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
        borderCls,
      )}
    >
      {/* Row 1 — badges */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wide", priorCfg.badge)}>
            {order.prioritas}
          </span>
          <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-semibold", unitCfg.cls)}>
            {unitCfg.short}
          </span>
          {order.hasHAM && <HAMBadge />}
        </div>
        <span className={cn("shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold", cfg.badge)}>
          {cfg.label}
        </span>
      </div>

      {/* Row 2 — patient */}
      <div>
        <p className="font-semibold text-slate-900 leading-tight">{order.namaPasien}</p>
        <p className="mt-0.5 text-xs text-slate-400 font-mono">{order.noRM}</p>
      </div>

      {/* Row 3 — progress bar */}
      <StatusProgress step={cfg.step} />

      <hr className="border-slate-100" />

      {/* Row 4 — depo + items */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <MapPin size={12} className="text-slate-400 shrink-0" aria-hidden="true" />
          <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-semibold", depoCfg.badge)}>
            {order.depo}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <Package size={11} className="text-slate-400" aria-hidden="true" />
          <span>{order.items.length} item</span>
          {hamCount > 0 && (
            <span className="text-rose-600 font-semibold">· {hamCount} HAM</span>
          )}
        </div>
      </div>

      {/* Row 5 — items preview */}
      <div className="rounded-lg bg-slate-50 px-3 py-2 space-y-1">
        {order.items.slice(0, 3).map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <Pill size={10} className={cn("shrink-0", item.isHAM ? "text-rose-500" : "text-slate-400")} aria-hidden="true" />
              <span className="text-[11px] text-slate-700 truncate font-medium">{item.namaObat}</span>
            </div>
            <span className="shrink-0 text-[10px] text-slate-400">{item.dosis} · {item.rute}</span>
          </div>
        ))}
        {order.items.length > 3 && (
          <p className="text-[10px] text-slate-400 pl-4">+{order.items.length - 3} item lainnya</p>
        )}
      </div>

      {/* Serah terima info */}
      {order.serahTerima && (
        <div className="flex items-center gap-1.5 rounded-lg border border-emerald-100 bg-emerald-50 px-2.5 py-1.5 text-xs text-emerald-700">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
          Diserahkan ke {order.serahTerima.perawatPenerima} · {order.serahTerima.waktu}
        </div>
      )}

      {/* Row 6 — doctor + time + action */}
      <div className="flex items-center justify-between gap-2 pt-0.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <Stethoscope size={11} className="shrink-0 text-slate-400" aria-hidden="true" />
          <p className="truncate text-[11px] text-slate-600">{order.dokterPeminta}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Clock size={11} className="text-slate-400" aria-hidden="true" />
          <span className="text-[11px] text-slate-400">{order.jam}</span>
        </div>
      </div>

      {/* No order */}
      <p className="text-[10px] text-slate-400 font-mono">{order.noOrder}</p>

      {/* Action button */}
      <button
        onClick={() => onAction(order)}
        className={cn(
          "flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all duration-150 active:scale-95",
          cfg.actionCls,
        )}
        aria-label={`${cfg.action} order ${order.noOrder}`}
      >
        {cfg.action}
        <ChevronRight size={13} aria-hidden="true" />
      </button>
    </motion.article>
  );
}
