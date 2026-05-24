"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MoreVertical, Printer, Undo2, Ban, FileText, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { METODE_CFG, fmtRupiah } from "../../invoiceShared";
import type { PaymentRecord } from "../../invoiceShared";

export type PaymentRowAction = "print" | "refund" | "void";

interface Props {
  payment: PaymentRecord;
  index: number;
  isRefundedFrom?: PaymentRecord; // jika row ini Refund, isi payment yang di-refund
  onAction: (action: PaymentRowAction, payment: PaymentRecord) => void;
}

export default function PaymentRow({ payment, index, isRefundedFrom, onAction }: Props) {
  const cfg = METODE_CFG[payment.metode];
  const Icon = cfg.icon;
  const isRefund = payment.kategori === "Refund";
  const isVoided = !!payment.voided;

  return (
    <motion.li
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: Math.min(0.04 * index, 0.25), ease: "easeOut" }}
      className={cn(
        "group relative grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 px-3 py-2.5 transition-colors",
        isVoided && "bg-slate-50/60 opacity-60 dark:bg-slate-900/40",
        !isVoided && "hover:bg-slate-50/80 dark:hover:bg-slate-900/40",
      )}
    >
      {/* Method icon */}
      <div className={cn(
        "flex h-9 w-9 flex-none items-center justify-center rounded-lg ring-1",
        cfg.bg, cfg.text, cfg.ring,
      )}>
        <Icon size={15} />
      </div>

      {/* Main col */}
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className={cn(
            "text-[12.5px] font-semibold text-slate-800 dark:text-slate-100",
            isVoided && "line-through",
          )}>
            {cfg.label}
            {payment.kategori === "Deposit" && (
              <span className="ml-1.5 inline-flex items-center rounded-sm bg-sky-50 px-1 py-px text-[9.5px] font-semibold uppercase tracking-wide text-sky-700 ring-1 ring-sky-200">
                Deposit
              </span>
            )}
            {isRefund && (
              <span className="ml-1.5 inline-flex items-center rounded-sm bg-orange-50 px-1 py-px text-[9.5px] font-semibold uppercase tracking-wide text-orange-700 ring-1 ring-orange-200">
                Refund
              </span>
            )}
          </span>
          <span className="font-mono text-[10.5px] text-slate-400">{payment.noKwitansi}</span>
        </div>

        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10.5px] text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1">
            <Clock size={9.5} />
            {formatTanggal(payment.tanggalISO)}
          </span>
          <span className="text-slate-300">·</span>
          <span>{payment.kasir}</span>
          {payment.bank && (
            <>
              <span className="text-slate-300">·</span>
              <span>{payment.bank}</span>
            </>
          )}
          {payment.noRef && (
            <>
              <span className="text-slate-300">·</span>
              <span className="font-mono">{payment.noRef}</span>
            </>
          )}
        </div>

        {payment.catatan && (
          <p className="mt-0.5 truncate text-[10.5px] italic text-slate-500 dark:text-slate-400">
            “{payment.catatan}”
          </p>
        )}

        {isRefundedFrom && (
          <p className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-orange-700 dark:text-orange-300">
            <Undo2 size={9.5} />
            Refund dari kwitansi <span className="font-mono">{isRefundedFrom.noKwitansi}</span>
          </p>
        )}

        {isVoided && payment.voidReason && (
          <p className="mt-0.5 inline-flex items-center gap-1 text-[10px] italic text-rose-600">
            <Ban size={9.5} />
            Void: {payment.voidReason}
          </p>
        )}
      </div>

      {/* Nominal */}
      <div className={cn(
        "text-right font-mono text-[13.5px] font-bold tabular-nums",
        isVoided ? "text-slate-400 line-through" :
        isRefund ? "text-orange-700 dark:text-orange-300" :
        "text-slate-800 dark:text-slate-100",
      )}>
        {payment.nominal < 0 && "−"}
        {fmtRupiah(Math.abs(payment.nominal))}
      </div>

      {/* Kebab */}
      <RowKebab payment={payment} onAction={onAction} />
    </motion.li>
  );
}

// ── Sub: kebab ──────────────────────────────────────────

function RowKebab({
  payment, onAction,
}: {
  payment: PaymentRecord;
  onAction: (action: PaymentRowAction, payment: PaymentRecord) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const isVoided = !!payment.voided;
  const isRefund = payment.kategori === "Refund";

  // Eligibility
  const canPrint  = !isVoided;
  const canRefund = !isVoided && !isRefund && payment.nominal > 0;
  const canVoid   = !isVoided;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((p) => !p); }}
        aria-label="Aksi"
        className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
      >
        <MoreVertical size={14} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-9 z-20 w-44 overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg ring-1 ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <MenuItem
              icon={Printer}
              label="Cetak Kwitansi"
              disabled={!canPrint}
              onClick={() => { setOpen(false); onAction("print", payment); }}
            />
            <MenuItem
              icon={FileText}
              label="Lihat Detail"
              disabled={false}
              onClick={() => { setOpen(false); console.log("[BL2.3] Detail payment", payment); }}
            />
            {canRefund && (
              <>
                <div className="border-t border-slate-100 dark:border-slate-800" />
                <MenuItem
                  icon={Undo2}
                  label="Refund Sebagian"
                  disabled={false}
                  onClick={() => { setOpen(false); onAction("refund", payment); }}
                />
              </>
            )}
            <div className="border-t border-slate-100 dark:border-slate-800" />
            <MenuItem
              icon={Ban}
              label="Void Pembayaran"
              disabled={!canVoid}
              danger
              onClick={() => { setOpen(false); onAction("void", payment); }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuItem({
  icon: Icon, label, disabled, danger, onClick,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  disabled: boolean;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 px-3 py-1.5 text-[12px] font-medium transition-colors",
        disabled
          ? "cursor-not-allowed text-slate-300 dark:text-slate-600"
          : danger
            ? "text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
            : "text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800",
      )}
    >
      <Icon size={12} />
      {label}
    </button>
  );
}

// ── Date format ─────────────────────────────────────────

function formatTanggal(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("id-ID", {
      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
