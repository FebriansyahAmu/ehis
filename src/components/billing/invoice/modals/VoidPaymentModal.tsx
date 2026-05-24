"use client";

import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { AlertTriangle, Ban } from "lucide-react";
import { cn } from "@/lib/utils";
import { METODE_CFG, fmtRupiah } from "../invoiceShared";
import type { PaymentRecord } from "../invoiceShared";
import { ModalShell, Field, ModalFooter, inputCn } from "./AddItemModal";

interface Props {
  open: boolean;
  payment: PaymentRecord | null;
  onClose: () => void;
  onVoid: (paymentId: string, reason: string) => void;
}

export default function VoidPaymentModal({ open, payment, onClose, onVoid }: Props) {
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (open) {
      setReason("");
      setTouched(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [open, onClose]);

  const error = reason.trim().length < 5 ? "Alasan wajib (minimal 5 karakter)" : null;

  const submit = () => {
    setTouched(true);
    if (error || !payment) return;
    onVoid(payment.id, reason.trim());
    onClose();
  };

  if (!payment) return null;
  const cfg = METODE_CFG[payment.metode];
  const Icon = cfg.icon;
  const isRefund = payment.kategori === "Refund";

  return (
    <AnimatePresence>
      {open && (
        <ModalShell title="Void Pembayaran" onClose={onClose}>
          <div className="space-y-3">
            {/* Warning banner */}
            <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50/70 p-2.5 dark:border-rose-900/40 dark:bg-rose-950/20">
              <AlertTriangle size={14} className="mt-0.5 flex-none text-rose-600" />
              <div className="text-[11px] leading-relaxed text-rose-700 dark:text-rose-300">
                <p className="font-semibold">Pembayaran akan ditandai void.</p>
                <p className="mt-0.5 text-rose-600/90 dark:text-rose-300/80">
                  Saldo deposit invoice akan disesuaikan otomatis. Aksi ini dapat dibatalkan
                  dari riwayat audit (BL2.5).
                </p>
              </div>
            </div>

            {/* Payment context */}
            <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-2.5 dark:border-slate-700 dark:bg-slate-900/60">
              <div className="flex items-center gap-2">
                <div className={cn("flex h-8 w-8 items-center justify-center rounded-md ring-1", cfg.bg, cfg.text, cfg.ring)}>
                  <Icon size={14} />
                </div>
                <div className="flex-1 leading-tight">
                  <p className="text-[12px] font-semibold text-slate-800 dark:text-slate-100">
                    {cfg.label}
                    {isRefund && (
                      <span className="ml-1.5 text-[10px] uppercase text-orange-700">Refund</span>
                    )}
                  </p>
                  <p className="font-mono text-[10.5px] text-slate-500">{payment.noKwitansi}</p>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "font-mono text-[14px] font-bold tabular-nums line-through",
                    isRefund ? "text-orange-600" : "text-slate-700 dark:text-slate-200",
                  )}>
                    {payment.nominal < 0 && "−"}{fmtRupiah(Math.abs(payment.nominal))}
                  </p>
                  <p className="text-[10px] text-slate-400">{payment.kasir}</p>
                </div>
              </div>
            </div>

            {/* Reason */}
            <Field label="Alasan Void (wajib)" error={touched ? error : null}>
              <textarea
                rows={3}
                autoFocus
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="mis. Salah input nominal / data ganda / pembayar berbeda"
                className={cn(inputCn, "resize-none")}
              />
            </Field>
          </div>

          <ModalFooter
            onClose={onClose}
            onConfirm={submit}
            confirmLabel="Void Pembayaran"
            confirmIcon={Ban}
            danger
          />
        </ModalShell>
      )}
    </AnimatePresence>
  );
}
