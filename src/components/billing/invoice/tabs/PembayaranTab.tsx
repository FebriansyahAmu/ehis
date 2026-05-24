"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Layers, Zap, ExternalLink } from "lucide-react";
import type { InvoiceDetail, PaymentRecord } from "../invoiceShared";
import { grandTotal, sisaTagihan } from "@/lib/billing/invoiceCalc";
import { totalDibayar } from "@/lib/billing/paymentCalc";
import PaymentSummaryCard from "./payment/PaymentSummaryCard";
import PaymentForm from "./payment/PaymentForm";
import PaymentHistoryList from "./payment/PaymentHistoryList";
import type { PaymentRowAction } from "./payment/PaymentRow";

interface Props {
  detail: InvoiceDetail;
  onAddPayment: (payment: Omit<PaymentRecord, "id" | "noKwitansi">) => void;
  onRowAction: (action: PaymentRowAction, payment: PaymentRecord) => void;
}

export default function PembayaranTab({ detail, onAddPayment, onRowAction }: Props) {
  const grand   = useMemo(() => grandTotal(detail), [detail]);
  const dibayar = useMemo(() => totalDibayar(detail.payments), [detail.payments]);
  const sisaG   = useMemo(() => Math.max(0, grand - dibayar), [grand, dibayar]);
  const sisaInv = useMemo(() => sisaTagihan(detail), [detail]);

  // sisa untuk form: pakai sisaInvoice (yang sudah include header dibayar untuk fallback);
  // dengan payments tersedia, gunakan grand-dibayar.
  const sisaForm = detail.payments.length > 0 ? sisaG : sisaInv;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="space-y-4 px-5 py-4">
          {/* I2 — Management View banner: clarify purpose & route ke Quick Bayar */}
          <ManagementBanner />

          {/* Top summary strip */}
          <PaymentSummaryCard
            grand={grand}
            dibayar={dibayar}
            sisa={sisaForm}
          />

          {/* 2-col layout: form (lg sticky-left 380px) + history (flex 1) */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
            <div className="lg:sticky lg:top-2 lg:self-start">
              <PaymentForm
                sisaTagihan={sisaForm}
                onSubmit={onAddPayment}
              />
            </div>

            <div className="min-h-[60vh]">
              <PaymentHistoryList
                payments={detail.payments}
                onAction={onRowAction}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Management Banner ──────────────────────────────────

/**
 * Banner advisory yang menjelaskan peran tab ini dalam dua-persona workflow:
 *   - Tab Pembayaran (sini) = Detail Management — riwayat lengkap, refund,
 *     void, cicilan terstruktur per invoice. Persona: Admin Billing / Kasir
 *     yang lagi inspect 1 invoice.
 *   - /pembayaran (Quick Bayar) = Counter Mode — pasien antri, kasir terima
 *     uang cepat tanpa buka detail. Persona: Kasir di counter saat shift open.
 *
 * Tujuan: hilangkan persepsi redundansi (user prompt: "bukanya ini
 * memungkinkan adanya redundant?") dengan menjelaskan kapan pakai yang mana.
 */
function ManagementBanner() {
  return (
    <section
      role="note"
      aria-label="Management view info"
      className="flex flex-col gap-2 rounded-xl border border-indigo-200 bg-indigo-50/50 px-3.5 py-2.5 sm:flex-row sm:items-center sm:justify-between dark:border-indigo-900/40 dark:bg-indigo-950/20"
    >
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-md bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300 dark:ring-indigo-900/60">
          <Layers size={13} />
        </span>
        <div className="min-w-0">
          <p className="text-[11.5px] font-semibold text-slate-800 dark:text-slate-100">
            Detail Management View · per Invoice
          </p>
          <p className="mt-0.5 text-[10.5px] leading-snug text-slate-600 dark:text-slate-400">
            Tab ini untuk inspeksi riwayat lengkap, <strong>refund</strong>,
            <strong> void</strong>, dan cicilan terstruktur 1 invoice ini.
            Kalau pasien lagi antri di counter — pakai{" "}
            <strong>Quick Bayar</strong> di Kasir Counter (lebih cepat).
          </p>
        </div>
      </div>
      <Link
        href="/ehis-billing/pembayaran?tab=quick"
        className="group inline-flex flex-none items-center gap-1.5 self-start rounded-md bg-white px-2.5 py-1.5 text-[11px] font-semibold text-amber-700 shadow-sm ring-1 ring-amber-200 transition-colors hover:bg-amber-50 hover:ring-amber-300 sm:self-auto dark:bg-slate-900 dark:text-amber-300 dark:ring-amber-900/60 dark:hover:bg-amber-950/30"
        title="Buka Kasir Counter · Quick Bayar (tab antrian cepat)"
      >
        <Zap size={11} />
        Quick Bayar
        <ExternalLink size={10} className="opacity-60 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </section>
  );
}
