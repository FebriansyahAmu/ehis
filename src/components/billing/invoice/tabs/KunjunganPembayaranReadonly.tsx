"use client";

// Pembayaran (mode proyeksi/kunjungan). Ringkasan (grand/dibayar/sisa) + riwayat pembayaran nyata
// (DB) + CTA "Terima Pembayaran"/"Proses Refund" yang deep-link ke Kasir Counter (shift-bound).
// PENGECUALIAN: pembatalan (VOID) kwitansi bisa langsung dari sini (koreksi kwitansi spesifik) —
// gate billing.kasir:create; alasan wajib; voidedBy di-resolve server.

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Landmark, Wallet, ArrowUpRight, History, Inbox, Ban, ShieldCheck, RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCan } from "@/components/auth/Can";
import { voidPayment } from "@/lib/api/billing/invoice";
import { fmtRupiah, METODE_CFG, type PaymentRecord, type MetodeBayar } from "../invoiceShared";
import { ModalShell, Field, ModalFooter, inputCn } from "../modals/AddItemModal";
import PaymentSummaryCard from "./payment/PaymentSummaryCard";

interface Props {
  kunjunganId: string;
  grand: number;
  dibayar: number;
  sisa: number;
  status: string;
  payments: PaymentRecord[];
  /** Dipanggil sesudah void sukses → parent refetch state invoice. */
  onChanged?: () => void;
}

export default function KunjunganPembayaranReadonly({
  kunjunganId, grand, dibayar, sisa, status, payments, onChanged,
}: Props) {
  const can = useCan();
  const canVoid = can("billing.kasir", "create");
  const sorted = useMemo(
    () => [...payments].sort((a, b) => b.tanggalISO.localeCompare(a.tanggalISO)),
    [payments],
  );
  const isLunas = status === "Lunas";
  const kasirHref = `/ehis-billing/pembayaran?tab=quick&invoice=${encodeURIComponent(kunjunganId)}`;
  const refundHref = `${kasirHref}&mode=refund`;

  // Void dialog (koreksi kwitansi spesifik).
  const [voidTarget, setVoidTarget] = useState<PaymentRecord | null>(null);
  const [voidAlasan, setVoidAlasan] = useState("");
  const [voidBusy, setVoidBusy] = useState(false);

  const submitVoid = async () => {
    if (!voidTarget || voidAlasan.trim().length < 1) return;
    setVoidBusy(true);
    try {
      await voidPayment(kunjunganId, voidTarget.id, voidAlasan.trim());
      setVoidTarget(null);
      setVoidAlasan("");
      onChanged?.();
    } catch (e) {
      console.error("[Void] gagal:", e);
    } finally {
      setVoidBusy(false);
    }
  };

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
                  Penerimaan uang &amp; <strong>refund</strong> lewat <strong>Kasir</strong> (terikat shift).
                  Pembatalan (<strong>void</strong>) kwitansi bisa langsung dari sini.
                </p>
              </div>
            </div>
            <div className="flex flex-none flex-wrap items-center gap-1.5 self-start sm:self-auto">
              {dibayar > 0 && (
                <Link
                  href={refundHref}
                  className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-white px-2.5 py-1.5 text-[11.5px] font-semibold text-rose-700 transition-colors hover:bg-rose-50 dark:border-rose-900/50 dark:bg-slate-900 dark:text-rose-300"
                  title="Proses refund di Kasir Counter (terikat shift)"
                >
                  <RotateCcw size={12} /> Refund
                </Link>
              )}
              {isLunas ? (
                <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1.5 text-[11.5px] font-semibold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300">
                  <ShieldCheck size={13} /> Lunas
                </span>
              ) : (
                <Link
                  href={kasirHref}
                  className="group inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
                  title="Buka Kasir Counter · Quick Bayar untuk tagihan ini"
                >
                  <Wallet size={13} />
                  Terima Pembayaran
                  <ArrowUpRight size={12} className="opacity-70 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              )}
            </div>
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
                  <PaymentRowReadonly
                    key={p.id}
                    payment={p}
                    index={i}
                    onVoid={canVoid && !p.voided ? () => { setVoidTarget(p); setVoidAlasan(""); } : undefined}
                  />
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      {/* Dialog void kwitansi */}
      <AnimatePresence>
        {voidTarget && (
          <ModalShell title="Batalkan Pembayaran" onClose={() => setVoidTarget(null)} maxWidth="max-w-sm">
            <div className="space-y-3">
              <div className="rounded-md border border-rose-200 bg-rose-50/50 px-3 py-2 text-[11.5px] text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300">
                <p className="font-semibold">
                  {voidTarget.noKwitansi} · {fmtRupiah(Math.abs(voidTarget.nominal))}
                </p>
                <p className="mt-0.5 text-[10.5px] leading-snug">
                  Void <strong>bukan hapus</strong> — kwitansi tetap tercatat sebagai dibatalkan (audit).
                  Sisa tagihan akan bertambah kembali.
                </p>
              </div>
              <Field label="Alasan pembatalan (wajib)">
                <input
                  type="text"
                  value={voidAlasan}
                  onChange={(e) => setVoidAlasan(e.target.value)}
                  placeholder="mis. salah input nominal / metode"
                  autoFocus
                  className={inputCn}
                />
              </Field>
            </div>
            <ModalFooter
              onClose={() => setVoidTarget(null)}
              onConfirm={submitVoid}
              confirmLabel={voidBusy ? "Membatalkan…" : "Batalkan Pembayaran"}
              confirmIcon={Ban}
              danger
            />
          </ModalShell>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Row (read-only) ─────────────────────────────────────

function PaymentRowReadonly({
  payment, index, onVoid,
}: {
  payment: PaymentRecord;
  index: number;
  onVoid?: () => void;
}) {
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
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <span className={cn(
          "font-mono text-[13px] font-bold tabular-nums",
          voided ? "text-slate-400 line-through dark:text-slate-600"
            : isRefund ? "text-rose-600 dark:text-rose-400" : "text-emerald-700 dark:text-emerald-400",
        )}>
          {isRefund ? "−" : "+"}{fmtRupiah(Math.abs(payment.nominal))}
        </span>
        {onVoid && (
          <button
            type="button"
            onClick={onVoid}
            className="inline-flex items-center gap-1 rounded text-[10px] font-semibold text-slate-400 transition-colors hover:text-rose-600"
            title="Batalkan (void) pembayaran ini"
          >
            <Ban size={10} /> Batalkan
          </button>
        )}
      </div>
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
