"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Stethoscope, AlertCircle, ChevronDown, Ban } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  TYPE_CFG, STATUS_BADGE, STATUS_STEPS,
  type Order, type OrderType,
} from "./daftarOrderShared";

// ── Type badge ────────────────────────────────────────────

export function TypeBadge({ type }: { type: OrderType }) {
  const cfg  = TYPE_CFG[type];
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ring-1",
        cfg.softBg, cfg.text, cfg.ring,
      )}
    >
      <Icon size={9} />
      {cfg.label}
    </span>
  );
}

// ── Status pipeline ───────────────────────────────────────

export function StatusPipeline({ status }: { status: Order["status"] }) {
  if (status === "Selesai" || status === "Dibatalkan") return null;
  const current = STATUS_STEPS.indexOf(status);
  return (
    <div className="mt-2.5 flex items-center">
      {STATUS_STEPS.map((step, i) => {
        const done   = i <= current;
        const isLast = i === STATUS_STEPS.length - 1;
        return (
          <div key={step} className="flex items-center">
            <motion.div
              className="flex flex-col items-center gap-0.5"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.06, duration: 0.2 }}
            >
              <div
                className={cn(
                  "flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold transition-colors",
                  done ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-100 text-slate-400 ring-1 ring-slate-200",
                  i === current && "ring-2 ring-indigo-200",
                )}
              >
                {i + 1}
              </div>
              <span
                className={cn(
                  "text-[8px] font-medium leading-none",
                  done ? "text-indigo-600" : "text-slate-400",
                  i === current && "font-bold",
                )}
              >
                {step}
              </span>
            </motion.div>
            {!isLast && (
              <div
                className={cn(
                  "mb-3.5 h-px w-8 transition-colors sm:w-12",
                  i < current ? "bg-indigo-300" : "bg-slate-200",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Order row ─────────────────────────────────────────────

interface OrderRowProps {
  order: Order;
  onRequestCancel: (id: string, noOrder: string, type: OrderType, itemCount: number) => void;
}

export function OrderRow({ order, onRequestCancel }: OrderRowProps) {
  const [open, setOpen] = useState(false);
  const cfg         = TYPE_CFG[order.type];
  const Icon        = cfg.icon;
  const isActive    = ["Menunggu", "Diterima", "Diproses"].includes(order.status);
  const isCancelled = order.status === "Dibatalkan";

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border transition-all duration-200",
        isActive
          ? cn("border-slate-200 bg-white", open ? "shadow-md" : "shadow-xs hover:shadow-sm")
          : isCancelled
            ? "border-rose-100 bg-rose-50/20 opacity-60"
            : "border-slate-100 bg-slate-50/50",
      )}
    >
      {/* Header row — click to expand */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={cn(
          "flex w-full cursor-pointer items-start gap-3 px-4 py-3 text-left transition-colors",
          open ? "bg-slate-50/60" : "hover:bg-slate-50/70",
        )}
      >
        {/* Type icon */}
        <span
          className={cn(
            "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1",
            cfg.softBg, cfg.ring,
          )}
        >
          <Icon size={14} className={cfg.iconCls} />
        </span>

        {/* Main info */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <TypeBadge type={order.type} />
            <span className="font-mono text-[11px] text-slate-400">{order.noOrder}</span>
          </div>

          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500">
            <span className="flex items-center gap-0.5">
              <Clock size={9} />
              {order.jam}
            </span>
            <span className="text-slate-200">·</span>
            <span className="flex items-center gap-0.5 truncate">
              <Stethoscope size={9} className="shrink-0" />
              {order.dokter}
            </span>
            {order.tujuan && (
              <>
                <span className="hidden text-slate-200 sm:inline">·</span>
                <span className="hidden text-slate-400 sm:inline">{order.tujuan}</span>
              </>
            )}
          </div>

          {order.catatan && (
            <p className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-amber-600">
              <AlertCircle size={9} />
              {order.catatan}
            </p>
          )}

          {isActive && open && <StatusPipeline status={order.status} />}
        </div>

        {/* Right: badge + count + chevron */}
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-semibold", STATUS_BADGE[order.status])}>
            {order.status}
          </span>
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <span>{order.items.length} item</span>
            <motion.div
              animate={{ rotate: open ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown size={10} className="text-slate-400" />
            </motion.div>
          </div>
        </div>
      </button>

      {/* Expanded item list — animated */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className={cn("border-t px-4 pb-3 pt-2.5", cfg.border, cfg.softBg + "/30")}>
              <div className="flex flex-col gap-1.5">
                {order.items.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04, duration: 0.18 }}
                    className="flex items-start gap-2 rounded-lg border border-white/80 bg-white px-3 py-2 shadow-xs"
                  >
                    <span className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md", cfg.softBg)}>
                      <Icon size={10} className={cfg.iconCls} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="text-xs font-semibold text-slate-800">{item.nama}</p>
                        {item.isSpecial && (
                          <span className="rounded-sm bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 ring-1 ring-amber-200">
                            KHUSUS
                          </span>
                        )}
                      </div>
                      {(item.detail || item.keterangan) && (
                        <p className="text-[10px] text-slate-400">
                          {item.detail}
                          {item.keterangan && (
                            <span className="ml-1 italic text-slate-400">({item.keterangan})</span>
                          )}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Cancel button */}
              {isActive && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="mt-3 flex justify-end border-t border-slate-100 pt-2.5"
                >
                  <button
                    type="button"
                    onClick={() => onRequestCancel(order.id, order.noOrder, order.type, order.items.length)}
                    className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-[12px] font-semibold text-rose-600 transition hover:bg-rose-100 hover:text-rose-700 active:scale-95"
                  >
                    <Ban size={11} />
                    Batalkan Order
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
