"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Sparkles, AlertCircle, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  METODE_CFG, METODE_ORDER, fmtRupiah,
  type MetodeBayar, type PaymentRecord,
} from "../../invoice/invoiceShared";
import { terbilang } from "@/lib/billing/terbilang";
import { inputCn, selectCn } from "../../invoice/modals/AddItemModal";
import type { OutstandingResult } from "@/lib/billing/outstandingSearch";
import ChargeSummaryCard from "./ChargeSummaryCard";

interface Props {
  target: OutstandingResult;
  kasirName: string;
  onSubmit: (payment: Omit<PaymentRecord, "id" | "noKwitansi">) => void;
}

interface FormState {
  metode: MetodeBayar;
  nominal: string;
  bank: string;
  noRef: string;
  catatan: string;
}

const initialState = (sisa: number): FormState => ({
  metode: "Tunai",
  nominal: String(sisa),
  bank: "",
  noRef: "",
  catatan: "",
});

const BANK_OPTIONS = ["BCA", "Mandiri", "BNI", "BRI", "BSI", "CIMB"];

/**
 * Quick Payment Form — simplified PaymentForm (BL2.3) untuk Quick Bayar.
 *
 * Beda dengan PaymentForm:
 *   - Tidak ada kategori toggle (default "Pembayaran")
 *   - Header menampilkan target row context (nama pasien + sisa)
 *   - Submit langsung tanpa harus buka invoice detail
 */
export default function QuickPaymentForm({ target, kasirName, onSubmit }: Props) {
  const [form, setForm] = useState<FormState>(() => initialState(target.sisaTagihan));
  const [touched, setTouched] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);

  // Reset saat target berubah (user pilih row lain)
  useEffect(() => {
    setForm(initialState(target.sisaTagihan));
    setTouched(false);
    setJustSubmitted(false);
  }, [target.id, target.sisaTagihan]);

  const nominalNum = useMemo(
    () => Number(form.nominal.replace(/[^\d]/g, "")) || 0,
    [form.nominal],
  );

  const errors = useMemo(() => ({
    nominal:
      nominalNum <= 0 ? "Nominal harus > 0" :
      nominalNum > target.sisaTagihan
        ? `Nominal melebihi sisa (${fmtRupiah(target.sisaTagihan)})` : null,
    noRef:
      (form.metode === "Transfer" || form.metode === "EDC" || form.metode === "QRIS") &&
      form.noRef.trim() === ""
        ? `No referensi wajib untuk ${form.metode}` : null,
    bank:
      (form.metode === "Transfer" || form.metode === "EDC") && form.bank.trim() === ""
        ? "Pilih bank pembayar" : null,
  }), [form, nominalNum, target.sisaTagihan]);

  const hasError = Object.values(errors).some(Boolean);

  const submit = () => {
    setTouched(true);
    if (hasError) return;
    onSubmit({
      tanggalISO: new Date().toISOString().slice(0, 16),
      metode: form.metode,
      nominal: nominalNum,
      kategori: "Pembayaran",
      source: "Quick",
      kasir: kasirName,
      bank: form.bank || undefined,
      noRef: form.noRef || undefined,
      catatan: form.catatan || undefined,
    });
    setJustSubmitted(true);
    setTimeout(() => setJustSubmitted(false), 1500);
  };

  const setNominalLunas = () => setForm({ ...form, nominal: String(target.sisaTagihan) });
  const setNominalSetengah = () =>
    setForm({ ...form, nominal: String(Math.floor(target.sisaTagihan / 2)) });

  const needBank = form.metode === "Transfer" || form.metode === "EDC";
  const needRef = form.metode === "Transfer" || form.metode === "EDC" || form.metode === "QRIS";

  return (
    <section
      aria-label="Quick Payment Form"
      className="overflow-hidden rounded-xl border-2 border-amber-300 bg-white shadow-md dark:border-amber-800 dark:bg-slate-900"
    >
      {/* Header context */}
      <div className="border-b border-amber-200 bg-gradient-to-r from-amber-50 via-amber-50/40 to-white px-4 py-2.5 dark:border-amber-900/40 dark:from-amber-950/30 dark:to-slate-900">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
              Pembayaran Untuk
            </p>
            <p className="truncate text-[13px] font-bold text-slate-800 dark:text-slate-100">
              {target.pasien.nama}{" "}
              <span className="font-mono text-[10.5px] font-normal text-slate-500">
                · {target.pasien.noRM}
              </span>
            </p>
            <p className="font-mono text-[10.5px] text-slate-500">
              {target.noTagihan} · {target.unit} · {target.kelas} · {target.penjamin.nama}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-amber-700">Sisa</p>
            <p className="font-mono text-[15px] font-bold tabular-nums text-amber-700 dark:text-amber-300">
              {fmtRupiah(target.sisaTagihan)}
            </p>
          </div>
        </div>
      </div>

      {/* Form body */}
      <div className="space-y-3 px-4 py-3">
        {/* Rincian charge — kasir explain ke pasien sebelum bayar */}
        <ChargeSummaryCard invoiceId={target.id} />

        {/* Quick chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Quick:
          </span>
          <button
            type="button"
            onClick={setNominalLunas}
            className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200 transition-colors hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-900/60"
          >
            <Sparkles size={10} />
            Lunasi Sisa
          </button>
          <button
            type="button"
            onClick={setNominalSetengah}
            className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 ring-1 ring-slate-200 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700"
          >
            Setengah
          </button>
          {[100_000, 500_000, 1_000_000]
            .filter((n) => n <= target.sisaTagihan)
            .map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setForm({ ...form, nominal: String(n) })}
                className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 ring-1 ring-slate-200 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700"
              >
                {n >= 1_000_000 ? `${n / 1_000_000}jt` : `${n / 1_000}rb`}
              </button>
            ))}
        </div>

        {/* Metode segmented */}
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Metode
          </p>
          <div className="grid grid-cols-5 gap-1">
            {METODE_ORDER.map((m) => {
              const cfg = METODE_CFG[m];
              const Icon = cfg.icon;
              const active = form.metode === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setForm({ ...form, metode: m, bank: "", noRef: "" })}
                  className={cn(
                    "flex flex-col items-center gap-0.5 rounded-md border px-1 py-1.5 text-[10.5px] font-medium transition-all",
                    active
                      ? cn("ring-1", cfg.bg, cfg.text, cfg.ring, "border-transparent")
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800",
                  )}
                >
                  <Icon size={13} />
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Nominal big input */}
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Nominal Bayar
          </p>
          <input
            type="text"
            inputMode="numeric"
            value={form.nominal}
            onChange={(e) => setForm({ ...form, nominal: e.target.value.replace(/[^\d]/g, "") })}
            placeholder="0"
            className={cn(
              inputCn,
              "text-right font-mono text-[18px] font-bold tabular-nums",
              touched && errors.nominal && "border-rose-300 focus:border-rose-400 focus:ring-rose-100",
            )}
          />
          <p className="mt-0.5 text-[10.5px] italic text-slate-500">
            {nominalNum > 0 ? terbilang(nominalNum) : "—"}
          </p>
          {touched && errors.nominal && (
            <p className="mt-0.5 inline-flex items-center gap-1 text-[10.5px] text-rose-600">
              <AlertCircle size={11} />
              {errors.nominal}
            </p>
          )}
        </div>

        {/* Conditional bank + noRef */}
        {(needBank || needRef) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.18 }}
            className="grid grid-cols-2 gap-2"
          >
            {needBank && (
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Bank
                </p>
                <select
                  value={form.bank}
                  onChange={(e) => setForm({ ...form, bank: e.target.value })}
                  className={cn(selectCn, touched && errors.bank && "border-rose-300")}
                >
                  <option value="">— Pilih bank —</option>
                  {BANK_OPTIONS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
                {touched && errors.bank && (
                  <p className="mt-0.5 text-[10px] text-rose-600">{errors.bank}</p>
                )}
              </div>
            )}
            {needRef && (
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  No Referensi
                </p>
                <input
                  type="text"
                  value={form.noRef}
                  onChange={(e) => setForm({ ...form, noRef: e.target.value })}
                  placeholder={form.metode === "QRIS" ? "QRIS-XXX" : "TRF-XXX"}
                  className={cn(inputCn, "font-mono", touched && errors.noRef && "border-rose-300")}
                />
                {touched && errors.noRef && (
                  <p className="mt-0.5 text-[10px] text-rose-600">{errors.noRef}</p>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* Catatan opsional */}
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Catatan (opsional)
          </p>
          <input
            type="text"
            value={form.catatan}
            onChange={(e) => setForm({ ...form, catatan: e.target.value })}
            placeholder="mis. cicilan ke-2"
            className={inputCn}
          />
        </div>

        {/* Submit */}
        <button
          type="button"
          onClick={submit}
          disabled={justSubmitted}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-bold text-white shadow-sm transition-all active:scale-[0.98]",
            justSubmitted
              ? "bg-emerald-600"
              : "bg-amber-600 hover:bg-amber-700",
          )}
        >
          {justSubmitted ? (
            <>
              <CheckCircle2 size={14} />
              Berhasil!
            </>
          ) : (
            <>
              <Zap size={14} />
              Terima Pembayaran {fmtRupiah(nominalNum)}
            </>
          )}
        </button>
      </div>
    </section>
  );
}
