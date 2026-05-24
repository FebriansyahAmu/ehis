"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Undo2, AlertCircle, Banknote } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtRupiah, METODE_CFG } from "../invoiceShared";
import type { PaymentRecord } from "../invoiceShared";
import { refundableAmount } from "@/lib/billing/paymentCalc";
import { terbilang } from "@/lib/billing/terbilang";
import { ModalShell, Field, ModalFooter, inputCn, selectCn } from "./AddItemModal";

interface Props {
  open: boolean;
  payment: PaymentRecord | null;          // payment yang akan di-refund
  allPayments: PaymentRecord[];           // untuk hitung sisa yang masih refundable
  onClose: () => void;
  onRefund: (
    paymentId: string,
    nominal: number,
    metode: PaymentRecord["metode"],
    alasan: string,
  ) => void;
}

export default function RefundModal({
  open, payment, allPayments, onClose, onRefund,
}: Props) {
  const [nominal, setNominal] = useState("");
  const [metode, setMetode] = useState<PaymentRecord["metode"]>("Tunai");
  const [alasan, setAlasan] = useState("");
  const [touched, setTouched] = useState(false);

  // Reset state saat modal open dengan payment baru
  useEffect(() => {
    if (open && payment) {
      const maxable = refundableAmount(payment, allPayments);
      setNominal(String(maxable));
      setMetode(payment.metode);
      setAlasan("");
      setTouched(false);
    }
  }, [open, payment, allPayments]);

  // ESC close
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [open, onClose]);

  const maxRefund = useMemo(
    () => (payment ? refundableAmount(payment, allPayments) : 0),
    [payment, allPayments],
  );

  const nominalNum = useMemo(
    () => Number(nominal.replace(/[^\d]/g, "")) || 0,
    [nominal],
  );

  const errors = {
    nominal:
      nominalNum <= 0 ? "Nominal refund harus > 0" :
      nominalNum > maxRefund ? `Maksimum ${fmtRupiah(maxRefund)} (sisa yang bisa direfund)` :
      null,
    alasan: alasan.trim().length < 5 ? "Alasan wajib (minimal 5 karakter)" : null,
  };
  const hasError = Object.values(errors).some(Boolean);

  const submit = () => {
    setTouched(true);
    if (hasError || !payment) return;
    onRefund(payment.id, nominalNum, metode, alasan.trim());
    onClose();
  };

  if (!payment) return null;
  const cfg = METODE_CFG[payment.metode];
  const Icon = cfg.icon;

  return (
    <AnimatePresence>
      {open && (
        <ModalShell title="Refund Pembayaran" onClose={onClose}>
          <div className="space-y-3">
            {/* Source payment context */}
            <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-2.5 dark:border-slate-700 dark:bg-slate-900/60">
              <div className="flex items-center gap-2">
                <div className={cn("flex h-8 w-8 items-center justify-center rounded-md ring-1", cfg.bg, cfg.text, cfg.ring)}>
                  <Icon size={14} />
                </div>
                <div className="flex-1 leading-tight">
                  <p className="text-[12px] font-semibold text-slate-800 dark:text-slate-100">
                    {cfg.label} — {fmtRupiah(payment.nominal)}
                  </p>
                  <p className="font-mono text-[10.5px] text-slate-500">{payment.noKwitansi}</p>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 border-t border-slate-200 pt-2 text-[10.5px] dark:border-slate-700">
                <Stat label="Nominal Asli" value={fmtRupiah(payment.nominal)} />
                <Stat label="Sudah Direfund" value={fmtRupiah(payment.nominal - maxRefund)} tone={maxRefund < payment.nominal ? "orange" : "slate"} />
              </div>
            </div>

            {/* Refund nominal */}
            <Field label="Nominal Refund (Rp)" error={touched ? errors.nominal : null}>
              <input
                type="text"
                inputMode="numeric"
                value={nominal}
                onChange={(e) => setNominal(e.target.value.replace(/[^\d]/g, ""))}
                placeholder="0"
                className={cn(
                  inputCn,
                  "px-3 py-2 text-right font-mono text-[15px] font-bold tabular-nums",
                  errors.nominal && touched && "border-rose-300",
                )}
              />
            </Field>
            {nominalNum > 0 && !errors.nominal && (
              <p className="-mt-2 italic text-[10.5px] text-slate-500">
                <span className="font-semibold text-slate-400">Terbilang:</span> {terbilang(nominalNum)}
              </p>
            )}

            {/* Quick fills */}
            <div className="flex flex-wrap gap-1.5">
              <QuickChip label="Maks" value={maxRefund} onClick={(v) => setNominal(String(v))} />
              <QuickChip label="50%" value={Math.round(maxRefund / 2)} onClick={(v) => setNominal(String(v))} />
              <QuickChip label="25%" value={Math.round(maxRefund / 4)} onClick={(v) => setNominal(String(v))} />
            </div>

            {/* Metode pengembalian */}
            <Field label="Metode Pengembalian">
              <select
                value={metode}
                onChange={(e) => setMetode(e.target.value as PaymentRecord["metode"])}
                className={selectCn}
              >
                {(["Tunai", "Transfer", "QRIS", "EDC"] as PaymentRecord["metode"][]).map((m) => (
                  <option key={m} value={m}>{METODE_CFG[m].label}</option>
                ))}
              </select>
            </Field>

            {/* Alasan */}
            <Field label="Alasan Refund (wajib)" error={touched ? errors.alasan : null}>
              <textarea
                rows={3}
                value={alasan}
                onChange={(e) => setAlasan(e.target.value)}
                placeholder="mis. Kelebihan bayar / revisi tarif / pembatalan layanan"
                className={cn(inputCn, "resize-none")}
              />
            </Field>

            {/* Preview */}
            <div className="rounded-md bg-orange-50/60 px-3 py-2 ring-1 ring-orange-200/50 dark:bg-orange-950/20 dark:ring-orange-900/30">
              <div className="flex items-center justify-between text-[11px]">
                <span className="inline-flex items-center gap-1 text-orange-700 dark:text-orange-300">
                  <Undo2 size={11} />
                  Refund yang akan dicatat
                </span>
                <span className="font-mono text-[14px] font-bold tabular-nums text-orange-700 dark:text-orange-300">
                  −{fmtRupiah(nominalNum)}
                </span>
              </div>
            </div>
          </div>

          <ModalFooter
            onClose={onClose}
            onConfirm={submit}
            confirmLabel="Proses Refund"
            confirmIcon={Banknote}
            danger
          />
        </ModalShell>
      )}
    </AnimatePresence>
  );
}

// ── Sub ─────────────────────────────────────────────────

function Stat({ label, value, tone }: { label: string; value: string; tone?: "orange" | "slate" }) {
  return (
    <div className="flex flex-col leading-tight">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className={cn(
        "font-mono font-semibold tabular-nums",
        tone === "orange" ? "text-orange-700 dark:text-orange-300" : "text-slate-700 dark:text-slate-200",
      )}>
        {value}
      </span>
    </div>
  );
}

function QuickChip({
  label, value, onClick,
}: {
  label: string;
  value: number;
  onClick: (v: number) => void;
}) {
  const disabled = value <= 0;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onClick(value)}
      className={cn(
        "rounded-md border px-2 py-0.5 font-mono text-[10.5px] font-medium transition-all",
        disabled
          ? "cursor-not-allowed border-slate-100 text-slate-300 dark:border-slate-800"
          : "border-slate-200 text-slate-600 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 active:scale-[0.97] dark:border-slate-700 dark:text-slate-300",
      )}
    >
      {label}: {fmtRupiah(value)}
    </button>
  );
}
