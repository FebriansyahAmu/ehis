"use client";

// Pembayaran (mode proyeksi/kunjungan) — READ-ONLY. Keputusan "Kasir = satu pintu": form bayar
// TIDAK ada di detail; tab ini hanya menampilkan ringkasan (grand/dibayar/sisa) + riwayat pembayaran
// nyata (DB) + CTA "Terima Pembayaran" yang deep-link ke Kasir Counter (Quick Bayar) dgn ?invoice=.
// Void/refund juga di Kasir (shift-bound → rekonsiliasi setoran benar).

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Landmark, Wallet, ArrowUpRight, History, Inbox, Ban, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtRupiah, METODE_CFG, type PaymentRecord, type MetodeBayar } from "../invoiceShared";
import PaymentSummaryCard from "./payment/PaymentSummaryCard";

interface Props {
  kunjunganId: string;
  grand: number;
  dibayar: number;
  sisa: number;
  status: string;
  payments: PaymentRecord[];
}

export default function KunjunganPembayaranReadonly({
  kunjunganId, grand, dibayar, sisa, status, payments,
}: Props) {
  const sorted = useMemo(
    () => [...payments].sort((a, b) => b.tanggalISO.localeCompare(a.tanggalISO)),
    [payments],
  );
  const isLunas = status === "Lunas";
  const kasirHref = `/ehis-billing/pembayaran?tab=quick&invoice=${encodeURIComponent(kunjunganId)}`;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="space-y-4 px-5 py-4">
          {/* One-door banner + CTA */}
          <section className="flex flex-col gap-2.5 rounded-xl border border-indigo-200 bg-indigo-50/50 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-indigo-900/40 dark:bg-indigo-950/20">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-md bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300 dark:ring-indigo-900/60">
                <Landmark size={14} />
              </span>
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-slate-800 dark:text-slate-100">
                  Pembayaran lewat satu pintu — Kasir Counter
                </p>
                <p className="mt-0.5 text-[11px] leading-snug text-slate-600 dark:text-slate-400">
                  Tab ini <strong>read-only</strong> (status &amp; riwayat). Penerimaan uang, refund,
                  &amp; void dilakukan di <strong>Kasir</strong> agar terikat shift (rekonsiliasi setoran benar).
                </p>
              </div>
            </div>
            {isLunas ? (
              <span className="inline-flex flex-none items-center gap-1.5 self-start rounded-md bg-emerald-50 px-2.5 py-1.5 text-[11.5px] font-semibold text-emerald-700 ring-1 ring-emerald-200 sm:self-auto dark:bg-emerald-950/30 dark:text-emerald-300">
                <ShieldCheck size={13} /> Lunas
              </span>
            ) : (
              <Link
                href={kasirHref}
                className="group inline-flex flex-none items-center gap-1.5 self-start rounded-md bg-indigo-600 px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 sm:self-auto"
                title="Buka Kasir Counter · Quick Bayar untuk tagihan ini"
              >
                <Wallet size={13} />
                Terima Pembayaran
                <ArrowUpRight size={12} className="opacity-70 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            )}
          </section>

          <PaymentSummaryCard grand={grand} dibayar={dibayar} sisa={sisa} />

          {/* Riwayat pembayaran (read-only) */}
          <section className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <header className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-2.5 dark:border-slate-800">
              <h3 className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-800 dark:text-slate-100">
                <History size={13} className="text-amber-600" />
                Riwayat Pembayaran
                <span className="ml-1 rounded-full bg-slate-100 px-1.5 py-px font-mono text-[10px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  {payments.length}
                </span>
              </h3>
              <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                Total: <span className="font-semibold text-slate-800 dark:text-slate-100">{fmtRupiah(dibayar)}</span>
              </span>
            </header>

            {sorted.length === 0 ? (
              <EmptyHistory />
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {sorted.map((p, i) => (
                  <PaymentRowReadonly key={p.id} payment={p} index={i} />
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

// ── Row (read-only) ─────────────────────────────────────

function PaymentRowReadonly({ payment, index }: { payment: PaymentRecord; index: number }) {
  const cfg = METODE_CFG[payment.metode as MetodeBayar] ?? METODE_CFG.Tunai;
  const Icon = cfg.icon;
  const isRefund = payment.nominal < 0 || payment.kategori === "Refund";
  const voided = !!payment.voided;

  return (
    <motion.li
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: Math.min(0.2, index * 0.03) }}
      className={cn(
        "flex items-center gap-3 px-4 py-2.5",
        voided && "bg-slate-50/50 dark:bg-slate-900/40",
      )}
    >
      <span className={cn("flex h-8 w-8 flex-none items-center justify-center rounded-lg ring-1", cfg.bg, cfg.text, cfg.ring)}>
        <Icon size={14} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className={cn("text-[12.5px] font-semibold", voided ? "text-slate-400 line-through dark:text-slate-500" : "text-slate-800 dark:text-slate-100")}>
            {cfg.label}
          </span>
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            {payment.kategori}
          </span>
          {voided && (
            <span className="inline-flex items-center gap-1 rounded bg-rose-100 px-1.5 py-0.5 text-[9.5px] font-bold text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
              <Ban size={9} /> VOID
            </span>
          )}
        </div>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[10.5px] text-slate-400">
          <span className="font-mono text-slate-500 dark:text-slate-400">{payment.noKwitansi}</span>
          <span>·</span>
          <span>{fmtTgl(payment.tanggalISO)}</span>
          <span>·</span>
          <span>{payment.kasir}</span>
          {voided && payment.voidReason && (
            <span className="italic text-rose-500">· {payment.voidReason}</span>
          )}
        </p>
      </div>
      <span className={cn(
        "shrink-0 font-mono text-[13px] font-bold tabular-nums",
        voided ? "text-slate-400 line-through dark:text-slate-600"
          : isRefund ? "text-rose-600 dark:text-rose-400" : "text-emerald-700 dark:text-emerald-400",
      )}>
        {isRefund ? "−" : "+"}{fmtRupiah(Math.abs(payment.nominal))}
      </span>
    </motion.li>
  );
}

function EmptyHistory() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-400 ring-4 ring-slate-100/60 dark:bg-slate-900 dark:ring-slate-800/60">
        <Inbox size={20} />
      </div>
      <h4 className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">Belum ada pembayaran</h4>
      <p className="mt-1 max-w-xs text-[11.5px] text-slate-500 dark:text-slate-400">
        Pembayaran akan tampil di sini setelah kasir menerima setoran di Kasir Counter.
      </p>
    </div>
  );
}

function fmtTgl(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) +
    ` · ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
