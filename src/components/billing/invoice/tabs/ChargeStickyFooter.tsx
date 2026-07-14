"use client";

import { motion } from "framer-motion";
import { Receipt, Wallet, AlertTriangle, CheckCircle2, Percent } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtRupiah } from "../invoiceShared";
import type { InvoiceDetail } from "../invoiceShared";
import {
  netAfterItemDiskon, totalDiskonItem, ppnAmount,
  grandTotal, sisaTagihan, saldoDeposit,
} from "@/lib/billing/invoiceCalc";

interface Props {
  detail: InvoiceDetail;
  onApplyDiskonInvoice: () => void;
  onFinalize?: () => void;
  readOnly?: boolean;
}

export default function ChargeStickyFooter({ detail, onApplyDiskonInvoice, onFinalize, readOnly }: Props) {
  const netItems = netAfterItemDiskon(detail.items);
  const dskItems = totalDiskonItem(detail.items);
  const dskInv   = detail.diskonInvoice ?? 0;
  const ppnPct   = detail.ppnPct ?? 0;
  const afterInv = Math.max(0, netItems - dskInv);
  const ppn      = ppnAmount(afterInv, ppnPct);
  const materai  = detail.materai ?? 0;
  const grand    = grandTotal(detail);
  const sisa     = sisaTagihan(detail);
  const saldo    = saldoDeposit(detail);

  const isLunas = sisa === 0 && grand > 0;
  const showFinalize = detail.status === "Draft" && onFinalize;

  return (
    <motion.footer
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="sticky bottom-0 z-10 border-t border-slate-200 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95"
    >
      {/* Breakdown row */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-slate-100 px-5 py-2 text-[11px] dark:border-slate-800/60">
        <BreakdownItem label="Subtotal Items"     value={netItems + dskItems} />
        {dskItems > 0 && <BreakdownItem label="Diskon Item"  value={-dskItems} tone="emerald" />}
        {dskInv > 0  && <BreakdownItem label="Diskon Invoice" value={-dskInv}  tone="emerald" />}
        {ppnPct > 0  && <BreakdownItem label={`PPN ${ppnPct}%`} value={ppn} />}
        {materai > 0 && <BreakdownItem label="Materai" value={materai} />}
      </div>

      {/* Main totals + actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-2.5">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
          <Total label="Grand Total" value={grand} icon={Receipt} tone="amber" prominent />
          <Total label="Saldo Deposit" value={saldo} icon={Wallet} tone="sky" />
          <Total
            label="Sisa Tagihan"
            value={sisa}
            icon={isLunas ? CheckCircle2 : AlertTriangle}
            tone={isLunas ? "emerald" : "rose"}
            prominent
          />
        </div>

        {!readOnly && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onApplyDiskonInvoice}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11.5px] font-medium text-slate-700 transition-all hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 active:scale-[0.97] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-amber-950/30"
            >
              <Percent size={12} />
              Diskon Invoice
            </button>
            {showFinalize && (
              <button
                type="button"
                onClick={onFinalize}
                className="inline-flex items-center gap-1.5 rounded-md bg-amber-600 px-2.5 py-1 text-[11.5px] font-semibold text-white shadow-sm transition-all hover:bg-amber-700 active:scale-[0.97]"
              >
                <CheckCircle2 size={12} />
                Finalize
              </button>
            )}
          </div>
        )}
      </div>
    </motion.footer>
  );
}

// ── Sub-components ──────────────────────────────────────

function BreakdownItem({
  label, value, tone,
}: {
  label: string;
  value: number;
  tone?: "emerald" | "rose";
}) {
  const colorClass =
    tone === "emerald" ? "text-emerald-600"
    : tone === "rose" ? "text-rose-600"
    : "text-slate-700 dark:text-slate-200";
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className={cn("font-mono font-semibold tabular-nums", colorClass)}>
        {value < 0 ? `-${fmtRupiah(Math.abs(value))}` : fmtRupiah(value)}
      </span>
    </span>
  );
}

function Total({
  label, value, icon: Icon, tone, prominent,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  tone: "amber" | "sky" | "emerald" | "rose";
  prominent?: boolean;
}) {
  const toneClass = {
    amber:   { iconBg: "bg-amber-50 text-amber-600",     valueText: "text-amber-900 dark:text-amber-200" },
    sky:     { iconBg: "bg-sky-50 text-sky-600",         valueText: "text-sky-900 dark:text-sky-200" },
    emerald: { iconBg: "bg-emerald-50 text-emerald-600", valueText: "text-emerald-900 dark:text-emerald-200" },
    rose:    { iconBg: "bg-rose-50 text-rose-600",       valueText: "text-rose-900 dark:text-rose-200" },
  }[tone];

  return (
    <div className="flex items-center gap-2">
      <div className={cn("flex h-7 w-7 items-center justify-center rounded-md", toneClass.iconBg)}>
        <Icon size={13} />
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-[10.5px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {label}
        </span>
        <span className={cn(
          "font-mono font-bold tabular-nums",
          prominent ? "text-[15px]" : "text-[13px]",
          toneClass.valueText,
        )}>
          {fmtRupiah(value)}
        </span>
      </div>
    </div>
  );
}
