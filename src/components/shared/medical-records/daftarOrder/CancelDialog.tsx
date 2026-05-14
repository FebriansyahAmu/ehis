"use client";

import { motion } from "framer-motion";
import { Ban, X, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { TYPE_CFG, type ConfirmTarget, type ToastData } from "./daftarOrderShared";
import { TypeBadge } from "./OrderRow";

// ── Confirm cancel dialog ─────────────────────────────────

interface ConfirmCancelDialogProps {
  target: ConfirmTarget;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmCancelDialog({ target, onConfirm, onClose }: ConfirmCancelDialogProps) {
  const cfg  = TYPE_CFG[target.type];
  const Icon = cfg.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={onClose}
      />

      {/* Card */}
      <motion.div
        className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-100"
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-rose-100 bg-rose-50 px-5 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white ring-1 ring-rose-200">
            <Ban size={17} className="text-rose-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-rose-700">Batalkan Order?</p>
            <p className="text-[11px] text-rose-400">Tindakan ini tidak dapat dibatalkan</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-rose-300 transition hover:bg-rose-100 hover:text-rose-500"
            aria-label="Tutup"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
            <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1", cfg.softBg, cfg.ring)}>
              <Icon size={16} className={cfg.iconCls} />
            </span>
            <div className="min-w-0">
              <TypeBadge type={target.type} />
              <p className="mt-1 font-mono text-[11px] font-semibold text-slate-700">{target.noOrder}</p>
              <p className="text-[10px] text-slate-400">{target.itemCount} item dalam order ini</p>
            </div>
          </div>
          <p className="mt-3 text-[12px] leading-relaxed text-slate-500">
            Order ini akan ditandai sebagai{" "}
            <span className="rounded-md bg-rose-50 px-1.5 py-0.5 font-semibold text-rose-600 ring-1 ring-rose-100">
              Dibatalkan
            </span>{" "}
            dan tidak dapat diproses lebih lanjut oleh unit terkait.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2.5 border-t border-slate-100 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-[13px] font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-95"
          >
            Kembali
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-rose-600 py-2.5 text-[13px] font-semibold text-white shadow-sm transition hover:bg-rose-700 active:scale-95"
          >
            Ya, Batalkan
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Cancel toast ──────────────────────────────────────────

interface CancelToastProps {
  data: ToastData;
  onClose: () => void;
}

export function CancelToast({ data, onClose }: CancelToastProps) {
  return (
    <motion.div
      key={data.uid}
      className="fixed bottom-5 right-4 z-50 w-72 overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200 sm:right-6 sm:w-80"
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.97 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-start gap-3 px-4 py-3.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 ring-1 ring-emerald-200">
          <CheckCircle2 size={15} className="text-emerald-600" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-slate-800">Order Berhasil Dibatalkan</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <TypeBadge type={data.type} />
            <span className="font-mono text-[10px] text-slate-500">{data.noOrder}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-md p-0.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          aria-label="Tutup notifikasi"
        >
          <X size={13} />
        </button>
      </div>

      {/* Auto-dismiss progress bar */}
      <div className="h-0.5 w-full bg-slate-100">
        <motion.div
          className="h-full bg-emerald-400"
          initial={{ width: "100%" }}
          animate={{ width: "0%" }}
          transition={{ duration: 3.5, ease: "linear" }}
        />
      </div>
    </motion.div>
  );
}
