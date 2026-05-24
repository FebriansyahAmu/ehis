"use client";

import { motion } from "framer-motion";
import { History, Printer, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtRupiah, METODE_CFG } from "../../invoice/invoiceShared";
import type { ShiftPaymentLog } from "@/lib/billing/shiftPaymentsMock";

interface Props {
  payments: ShiftPaymentLog[];
  onPrintKwitansi?: (payment: ShiftPaymentLog) => void;
}

/**
 * Recent Payments Feed — list 10 pembayaran terakhir di shift aktif.
 * Per row: metode icon + nama pasien + nominal mono + jam + tombol cetak kwitansi.
 */
export default function RecentPaymentsFeed({ payments, onPrintKwitansi }: Props) {
  return (
    <section
      aria-label="Pembayaran Terakhir di Shift Ini"
      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-2.5 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700">
            <History size={13} />
          </span>
          <div>
            <h3 className="text-[12.5px] font-semibold text-slate-800 dark:text-slate-100">
              Pembayaran Terakhir
            </h3>
            <p className="text-[10.5px] text-slate-500">
              <span className="font-mono tabular-nums">{payments.length}</span>{" "}
              transaksi di shift ini
            </p>
          </div>
        </div>
        {payments.length > 0 && (
          <span className="font-mono text-[10.5px] tabular-nums text-slate-400">
            sort: terbaru dulu
          </span>
        )}
      </div>

      {/* List */}
      {payments.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {payments.map((p, idx) => (
            <PaymentRow
              key={p.id}
              payment={p}
              onPrint={onPrintKwitansi}
              delay={Math.min(0.25, idx * 0.03)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

// ── Row ────────────────────────────────────────────────

function PaymentRow({
  payment, onPrint, delay,
}: {
  payment: ShiftPaymentLog;
  onPrint?: (p: ShiftPaymentLog) => void;
  delay: number;
}) {
  const cfg = METODE_CFG[payment.metode];
  const Icon = cfg.icon;
  const jam = formatJamRelatif(payment.tanggalISO);
  const isDeposit = payment.kategori === "Deposit";
  const isRefund = payment.kategori === "Refund";

  return (
    <motion.li
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.18, delay }}
      className="group grid grid-cols-[28px_minmax(0,1fr)_auto_auto] items-center gap-2 px-4 py-2 transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/30"
    >
      {/* Metode icon */}
      <span className={cn(
        "flex h-7 w-7 items-center justify-center rounded-md ring-1",
        cfg.bg, cfg.text, cfg.ring,
      )}>
        <Icon size={12} />
      </span>

      {/* Main */}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="truncate text-[12px] font-semibold text-slate-800 dark:text-slate-100">
            {payment.pasienNama}
          </span>
          <span className="font-mono text-[9.5px] text-slate-500">
            {payment.pasienRM}
          </span>
          {isDeposit && (
            <span className="rounded-full bg-sky-100 px-1.5 py-0 text-[9.5px] font-semibold text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
              Deposit
            </span>
          )}
          {isRefund && (
            <span className="rounded-full bg-rose-100 px-1.5 py-0 text-[9.5px] font-semibold text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
              Refund
            </span>
          )}
        </div>
        <p className="font-mono text-[10px] text-slate-500">
          {payment.invoiceNo} · {cfg.label}
          {payment.bank && ` · ${payment.bank}`}
          {payment.noRef && ` · ${payment.noRef}`}
        </p>
      </div>

      {/* Right: nominal + jam */}
      <div className="text-right">
        <p className={cn(
          "font-mono text-[12.5px] font-bold tabular-nums leading-tight",
          isRefund ? "text-rose-700 dark:text-rose-300" : "text-emerald-700 dark:text-emerald-300",
        )}>
          {isRefund ? "−" : ""}{fmtRupiah(Math.abs(payment.nominal))}
        </p>
        <p className="font-mono text-[9.5px] tabular-nums text-slate-400">
          {jam}
        </p>
      </div>

      {/* Print kwitansi (icon-only) */}
      {onPrint && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onPrint(payment); }}
          aria-label="Cetak kwitansi"
          title={`Cetak kwitansi ${payment.noKwitansi}`}
          className="rounded-md p-1.5 text-slate-400 opacity-0 transition-all hover:bg-amber-50 hover:text-amber-700 group-hover:opacity-100 dark:hover:bg-amber-950/30 dark:hover:text-amber-300"
        >
          <Printer size={13} />
        </button>
      )}
    </motion.li>
  );
}

// ── Empty state ────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center px-6 py-8 text-center">
      <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
        <Inbox size={18} />
      </span>
      <p className="text-[12px] font-semibold text-slate-700 dark:text-slate-200">
        Belum ada pembayaran
      </p>
      <p className="mt-0.5 max-w-[240px] text-[10.5px] text-slate-500">
        Cari tagihan di atas dan terima pembayaran — akan muncul di sini real-time.
      </p>
    </div>
  );
}

// ── Format helper ──────────────────────────────────────

function formatJamRelatif(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const now = new Date();
  const diffMin = Math.floor((now.getTime() - d.getTime()) / 60_000);
  if (diffMin < 1) return "Baru saja";
  if (diffMin < 60) return `${diffMin}m lalu`;
  // Tampilkan jam HH:MM jika hari ini, atau "dd MMM HH:MM" jika kemarin/lebih
  const todayStr = now.toISOString().slice(0, 10);
  const dStr = d.toISOString().slice(0, 10);
  const hhmm = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  if (dStr === todayStr) return hhmm;
  return `${d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" })} · ${hhmm}`;
}
