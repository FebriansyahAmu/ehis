"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { History, Inbox, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtRupiah } from "../../invoiceShared";
import type { PaymentRecord } from "../../invoiceShared";
import {
  sortPaymentsDesc, countByKategori, totalDibayar,
} from "@/lib/billing/paymentCalc";
import PaymentRow, { type PaymentRowAction } from "./PaymentRow";

type FilterKey = "all" | "Pembayaran" | "Deposit" | "Refund" | "Voided";

interface Props {
  payments: PaymentRecord[];
  onAction: (action: PaymentRowAction, payment: PaymentRecord) => void;
}

const FILTER_DEFS: { key: FilterKey; label: string }[] = [
  { key: "all",        label: "Semua"      },
  { key: "Pembayaran", label: "Pembayaran" },
  { key: "Deposit",    label: "Deposit"    },
  { key: "Refund",     label: "Refund"     },
  { key: "Voided",     label: "Voided"     },
];

export default function PaymentHistoryList({ payments, onAction }: Props) {
  const [filter, setFilter] = useState<FilterKey>("all");

  const sorted = useMemo(() => sortPaymentsDesc(payments), [payments]);
  const counts = useMemo(() => countByKategori(payments), [payments]);
  const totalAll = useMemo(() => totalDibayar(payments), [payments]);

  const filtered = useMemo(() => {
    if (filter === "all") return sorted;
    if (filter === "Voided") return sorted.filter((p) => p.voided);
    return sorted.filter((p) => !p.voided && p.kategori === filter);
  }, [sorted, filter]);

  // Map untuk row lookup "Refund dari kwitansi X"
  const byId = useMemo(() => {
    const m = new Map<string, PaymentRecord>();
    for (const p of payments) m.set(p.id, p);
    return m;
  }, [payments]);

  return (
    <section
      aria-label="Riwayat pembayaran"
      className="flex min-h-0 flex-col rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950"
    >
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-2.5 dark:border-slate-800">
        <h3 className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-800 dark:text-slate-100">
          <History size={13} className="text-amber-600" />
          Riwayat Pembayaran
          <span className="ml-1 rounded-full bg-slate-100 px-1.5 py-px font-mono text-[10px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            {payments.length}
          </span>
        </h3>
        <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
          Total bersih: <span className="font-semibold text-slate-800 dark:text-slate-100">{fmtRupiah(totalAll)}</span>
        </span>
      </header>

      {/* Filter chips */}
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-100 px-4 py-1.5 dark:border-slate-800">
        <Filter size={11} className="text-slate-400" />
        {FILTER_DEFS.map((f) => {
          const isActive = filter === f.key;
          const count =
            f.key === "all" ? payments.length :
            f.key === "Voided" ? counts.Voided :
            counts[f.key];
          const isEmpty = count === 0 && f.key !== "all";
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              disabled={isEmpty}
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10.5px] font-medium transition-all",
                isActive
                  ? "bg-amber-100 text-amber-800 ring-1 ring-amber-300 dark:bg-amber-950/40 dark:text-amber-300"
                  : isEmpty
                    ? "cursor-not-allowed text-slate-300 dark:text-slate-600"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800",
              )}
              aria-pressed={isActive}
            >
              {f.label}
              <span className={cn(
                "rounded-full px-1 font-mono text-[9px] tabular-nums",
                isActive ? "bg-amber-200/60" : "bg-slate-100 dark:bg-slate-800",
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* List */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <EmptyState filter={filter} hasAny={payments.length > 0} />
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            <AnimatePresence initial={false}>
              {filtered.map((p, i) => (
                <PaymentRow
                  key={p.id}
                  payment={p}
                  index={i}
                  isRefundedFrom={p.refundOf ? byId.get(p.refundOf) : undefined}
                  onAction={onAction}
                />
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </section>
  );
}

// ── Empty state ─────────────────────────────────────────

function EmptyState({ filter, hasAny }: { filter: FilterKey; hasAny: boolean }) {
  const isFilterEmpty = hasAny && filter !== "all";
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}
      className="flex flex-col items-center justify-center px-6 py-12 text-center"
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-400 ring-4 ring-slate-100/60 dark:bg-slate-900 dark:ring-slate-800/60">
        <Inbox size={20} />
      </div>
      <h4 className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">
        {isFilterEmpty ? `Tidak ada pembayaran ${filter}` : "Belum ada pembayaran"}
      </h4>
      <p className="mt-1 max-w-xs text-[11.5px] text-slate-500 dark:text-slate-400">
        {isFilterEmpty
          ? "Coba filter lain atau lihat Semua."
          : "Pembayaran akan tampil di sini setelah kasir menerima setoran dari pasien."}
      </p>
    </motion.div>
  );
}
