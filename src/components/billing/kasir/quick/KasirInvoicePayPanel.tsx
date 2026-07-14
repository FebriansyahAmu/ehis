"use client";

// KasirInvoicePayPanel (Slice 2b) — panel pembayaran NYATA untuk 1 tagihan kunjungan yang di-deep-link
// dari detail (?invoice=<kunjunganId>). Kasir = SATU pintu bayar: form ini memanggil recordPayment
// (DB) → invoice lazy-create + kwitansi (KW). Kasir di-resolve server dari actor (anti-spoof).
// Berbeda dari mock QuickBayarPanel (search outstanding mock) — ini invoice nyata terpilih.

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Loader2, Receipt, Wallet, CheckCircle2, AlertTriangle, X, ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getInvoiceState, recordPayment, type InvoiceStateDTO } from "@/lib/api/billing/invoice";
import { METODE_ORDER, METODE_CFG, fmtRupiah, type MetodeBayar } from "../../invoice/invoiceShared";

interface Props {
  kunjunganId: string;
  shiftId?: string;
  /** Dipanggil setelah pembayaran sukses — parent boleh akumulasi ke shift display. */
  onPaid?: (metode: MetodeBayar, nominal: number) => void;
  /** Tutup panel deep-link (kembali ke search biasa). */
  onDismiss?: () => void;
}

const UNIT_LABEL: Record<string, string> = { IGD: "IGD", RawatInap: "Rawat Inap", RawatJalan: "Rawat Jalan" };

export default function KasirInvoicePayPanel({ kunjunganId, shiftId, onPaid, onDismiss }: Props) {
  const [state, setState] = useState<InvoiceStateDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [metode, setMetode] = useState<MetodeBayar>("Tunai");
  const [nominal, setNominal] = useState<number>(0);
  const [nominalTouched, setNominalTouched] = useState(false);
  const [noRef, setNoRef] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lastKw, setLastKw] = useState<string | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    getInvoiceState(kunjunganId, ac.signal)
      .then((s) => { if (!ac.signal.aborted) { setState(s); setError(null); } })
      .catch((e) => { if (!ac.signal.aborted) setError(e instanceof Error ? e.message : "Gagal memuat tagihan"); })
      .finally(() => { if (!ac.signal.aborted) setLoading(false); });
    return () => ac.abort();
  }, [kunjunganId]);

  // Default nominal = sisa (sampai user mengetik manual).
  const sisa = state?.sisa ?? 0;
  useEffect(() => {
    if (!nominalTouched) setNominal(sisa);
  }, [sisa, nominalTouched]);

  const isLunas = state?.status === "Lunas";
  const requiresRef = metode !== "Tunai";
  const canSubmit = useMemo(
    () => !!state && !submitting && nominal >= 1 && nominal <= sisa && (!requiresRef || noRef.trim() !== ""),
    [state, submitting, nominal, sisa, requiresRef, noRef],
  );

  const handleSubmit = async () => {
    if (!state || !canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const next = await recordPayment(kunjunganId, {
        metode,
        kategori: "Pembayaran",
        nominal,
        source: "Quick",
        shiftId,
        noRef: requiresRef ? noRef.trim() : undefined,
      });
      const kw = next.payments[0]?.noKwitansi ?? null; // terbaru (list desc)
      setState(next);
      setLastKw(kw);
      setNominalTouched(false);
      setNoRef("");
      onPaid?.(metode, nominal);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal mencatat pembayaran");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden rounded-xl border border-indigo-200 bg-white shadow-sm ring-1 ring-indigo-100 dark:border-indigo-900/50 dark:bg-slate-950 dark:ring-indigo-950/40"
    >
      <header className="flex items-center justify-between gap-2 border-b border-indigo-100 bg-indigo-50/60 px-4 py-2.5 dark:border-indigo-900/40 dark:bg-indigo-950/20">
        <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-indigo-800 dark:text-indigo-300">
          <Receipt size={13} /> Tagihan Terpilih — Pembayaran Langsung
        </span>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
            aria-label="Tutup"
          >
            <X size={14} />
          </button>
        )}
      </header>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-slate-400">
          <Loader2 size={16} className="animate-spin" /> <span className="text-[12px]">Memuat tagihan…</span>
        </div>
      ) : error && !state ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <AlertTriangle size={22} className="text-rose-400" />
          <p className="text-[12px] font-semibold text-rose-700">{error}</p>
          {onDismiss && (
            <button type="button" onClick={onDismiss} className="mt-1 inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-700">
              <ArrowLeft size={12} /> Kembali ke pencarian
            </button>
          )}
        </div>
      ) : state ? (
        <div className="p-4">
          {/* Identitas + ringkasan */}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[14px] font-bold text-slate-900 dark:text-slate-50">{state.pasien.nama}</p>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[11px] text-slate-500">
                <span className="font-mono">{state.pasien.noRM}</span>
                <span className="text-slate-300">·</span>
                <span>{UNIT_LABEL[state.unit] ?? state.unit}</span>
                <span className="text-slate-300">·</span>
                <span className="font-mono text-slate-500">{state.noKunjungan}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-[9.5px] font-bold uppercase tracking-widest text-slate-400">Sisa Tagihan</p>
              <p className={cn("font-mono text-lg font-extrabold tabular-nums", isLunas ? "text-emerald-600" : "text-rose-600")}>
                {fmtRupiah(sisa)}
              </p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <Mini label="Grand Total" value={state.grandTotal} />
            <Mini label="Dibayar" value={state.dibayar} tone="sky" />
            <Mini label="Status" text={state.status} tone={isLunas ? "emerald" : "amber"} />
          </div>

          {/* Sukses toast */}
          {lastKw && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/70 px-3 py-2 text-[11.5px] text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300">
              <CheckCircle2 size={14} className="shrink-0" />
              Pembayaran tercatat · Kwitansi <span className="font-mono font-semibold">{lastKw}</span>
            </div>
          )}

          {isLunas ? (
            <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-emerald-50 py-3 text-[13px] font-semibold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-300">
              <CheckCircle2 size={16} /> Tagihan sudah lunas
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {/* Metode */}
              <div>
                <p className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-slate-500">Metode Bayar</p>
                <div className="flex flex-wrap gap-1.5">
                  {METODE_ORDER.map((m) => {
                    const cfg = METODE_CFG[m];
                    const active = metode === m;
                    const Icon = cfg.icon;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMetode(m)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11.5px] font-medium ring-1 transition-all",
                          active
                            ? cn(cfg.bg, cfg.text, cfg.ring, "shadow-sm")
                            : "bg-white text-slate-500 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-700",
                        )}
                      >
                        <Icon size={13} />
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Nominal */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-500">Nominal</span>
                  <button
                    type="button"
                    onClick={() => { setNominal(sisa); setNominalTouched(true); }}
                    className="text-[10.5px] font-semibold text-indigo-600 hover:underline"
                  >
                    Bayar Penuh ({fmtRupiah(sisa)})
                  </button>
                </div>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-slate-400">Rp</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={sisa}
                    value={nominal || ""}
                    onChange={(e) => { setNominal(Math.max(0, Math.floor(Number(e.target.value) || 0))); setNominalTouched(true); }}
                    className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-right font-mono text-[14px] font-bold tabular-nums text-slate-800 outline-none ring-indigo-200 transition focus:border-indigo-300 focus:ring-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    placeholder="0"
                  />
                </div>
                {nominal > sisa && (
                  <p className="mt-1 text-[10.5px] font-medium text-rose-600">Nominal melebihi sisa tagihan.</p>
                )}
              </div>

              {/* No. Ref (non-tunai) */}
              {requiresRef && (
                <div>
                  <p className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-slate-500">No. Referensi / Approval</p>
                  <input
                    value={noRef}
                    onChange={(e) => setNoRef(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] text-slate-800 outline-none ring-indigo-200 transition focus:border-indigo-300 focus:ring-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    placeholder={`No. ${metode} (wajib)`}
                  />
                </div>
              )}

              {error && (
                <p className="text-[11px] font-medium text-rose-600">{error}</p>
              )}

              <button
                type="button"
                disabled={!canSubmit}
                onClick={handleSubmit}
                className={cn(
                  "inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-bold text-white shadow-sm transition-all",
                  canSubmit ? "bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99]" : "cursor-not-allowed bg-slate-300 dark:bg-slate-700",
                )}
              >
                {submitting ? <Loader2 size={15} className="animate-spin" /> : <Wallet size={15} />}
                {submitting ? "Memproses…" : `Terima ${fmtRupiah(nominal || 0)}`}
              </button>
            </div>
          )}
        </div>
      ) : null}
    </motion.section>
  );
}

// ── Mini stat ───────────────────────────────────────────

function Mini({ label, value, text, tone = "slate" }: {
  label: string; value?: number; text?: string; tone?: "slate" | "sky" | "emerald" | "amber";
}) {
  const toneText = {
    slate: "text-slate-800 dark:text-slate-100",
    sky: "text-sky-700 dark:text-sky-300",
    emerald: "text-emerald-700 dark:text-emerald-300",
    amber: "text-amber-700 dark:text-amber-300",
  }[tone];
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 py-1.5 dark:border-slate-800 dark:bg-slate-900/40">
      <p className="text-[9.5px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className={cn("mt-0.5 font-mono text-[12.5px] font-bold tabular-nums", toneText)}>
        {text ?? fmtRupiah(value ?? 0)}
      </p>
    </div>
  );
}
