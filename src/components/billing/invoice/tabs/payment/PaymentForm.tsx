"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2, Sparkles, Upload, AlertCircle, ArrowDownToLine,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  METODE_CFG, METODE_ORDER, fmtRupiah,
} from "../../invoiceShared";
import type {
  MetodeBayar, PaymentKategori, PaymentRecord,
} from "../../invoiceShared";
import { terbilang } from "@/lib/billing/terbilang";
import { inputCn, selectCn } from "../../modals/AddItemModal";

interface Props {
  sisaTagihan: number;
  onSubmit: (payload: Omit<PaymentRecord, "id" | "noKwitansi">) => void;
}

interface FormState {
  metode: MetodeBayar;
  nominal: string;          // raw numeric string
  kategori: PaymentKategori;
  bank: string;
  noRef: string;
  bukti: string;            // filename stub
  catatan: string;
}

const KASIR_SESSION = "Sari (Kasir-1)"; // mock — backend BL3 ambil dari auth

const initialState = (sisa: number): FormState => ({
  metode: "Tunai",
  nominal: sisa > 0 ? String(sisa) : "",
  kategori: sisa > 0 ? "Pembayaran" : "Deposit",
  bank: "",
  noRef: "",
  bukti: "",
  catatan: "",
});

export default function PaymentForm({ sisaTagihan, onSubmit }: Props) {
  const [form, setForm] = useState<FormState>(() => initialState(sisaTagihan));
  const [touched, setTouched] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);

  // Reset saat sisa berubah signifikan (e.g. setelah submit pembayaran)
  useEffect(() => {
    setForm(initialState(sisaTagihan));
    setTouched(false);
  }, [sisaTagihan]);

  const nominalNum = useMemo(
    () => Number(form.nominal.replace(/[^\d]/g, "")) || 0,
    [form.nominal],
  );

  const errors = useMemo(() => ({
    nominal:
      nominalNum <= 0 ? "Nominal harus > 0" :
      form.kategori === "Pembayaran" && nominalNum > sisaTagihan && sisaTagihan > 0
        ? `Nominal melebihi sisa (${fmtRupiah(sisaTagihan)})` : null,
    noRef:
      (form.metode === "Transfer" || form.metode === "EDC" || form.metode === "QRIS") &&
      form.noRef.trim() === ""
        ? `No referensi wajib untuk ${form.metode}` : null,
    bank:
      (form.metode === "Transfer" || form.metode === "EDC") && form.bank.trim() === ""
        ? "Pilih bank pembayar" : null,
  }), [form, nominalNum, sisaTagihan]);

  const hasError = Object.values(errors).some(Boolean);

  const submit = () => {
    setTouched(true);
    if (hasError) return;
    onSubmit({
      tanggalISO: new Date().toISOString().slice(0, 16),
      metode: form.metode,
      nominal: nominalNum,
      kasir: KASIR_SESSION,
      kategori: form.kategori,
      bank: form.bank.trim() || undefined,
      noRef: form.noRef.trim() || undefined,
      bukti: form.bukti.trim() || undefined,
      catatan: form.catatan.trim() || undefined,
    });
    setJustSubmitted(true);
    setTimeout(() => setJustSubmitted(false), 1200);
  };

  const quickFills = useMemo(() => [
    { label: "Lunasi Sisa", value: sisaTagihan, disabled: sisaTagihan <= 0 },
    { label: "Setengah",    value: Math.round(sisaTagihan / 2), disabled: sisaTagihan <= 0 },
    { label: "100rb",       value: 100_000, disabled: false },
    { label: "500rb",       value: 500_000, disabled: false },
  ], [sisaTagihan]);

  const needsRef = form.metode === "Transfer" || form.metode === "EDC" || form.metode === "QRIS";
  const needsBank = form.metode === "Transfer" || form.metode === "EDC";

  return (
    <section
      aria-label="Form pembayaran baru"
      className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950"
    >
      <header className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5 dark:border-slate-800">
        <h3 className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-800 dark:text-slate-100">
          <ArrowDownToLine size={13} className="text-amber-600" />
          Terima Pembayaran
        </h3>
        <span className="font-mono text-[10.5px] text-slate-400">
          Kasir: <span className="text-slate-600 dark:text-slate-300">{KASIR_SESSION}</span>
        </span>
      </header>

      <div className="flex-1 space-y-3 px-4 py-3">
        {/* Quick fill */}
        <div>
          <p className="mb-1 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
            Quick Fill
          </p>
          <div className="flex flex-wrap gap-1.5">
            {quickFills.map((q) => (
              <button
                key={q.label}
                type="button"
                disabled={q.disabled}
                onClick={() => setForm({ ...form, nominal: String(q.value) })}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition-all",
                  q.disabled
                    ? "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-600"
                    : "border-slate-200 bg-white text-slate-600 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 active:scale-[0.97] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-amber-950/30",
                )}
              >
                {q.label === "Lunasi Sisa" && <Sparkles size={10} />}
                {q.label}
              </button>
            ))}
          </div>
        </div>

        {/* Metode segmented */}
        <div>
          <p className="mb-1 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
            Metode Pembayaran
          </p>
          <div className="grid grid-cols-5 gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-900">
            {METODE_ORDER.map((m) => {
              const cfg = METODE_CFG[m];
              const Icon = cfg.icon;
              const isActive = form.metode === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setForm({ ...form, metode: m })}
                  className={cn(
                    "flex flex-col items-center gap-0.5 rounded-md px-1 py-1.5 text-[10.5px] font-medium transition-all",
                    isActive
                      ? cn("shadow-sm ring-1", cfg.bg, cfg.text, cfg.ring)
                      : "text-slate-500 hover:bg-white hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-950 dark:hover:text-slate-200",
                  )}
                  aria-pressed={isActive}
                  title={cfg.hint}
                >
                  <Icon size={14} />
                  {cfg.label}
                </button>
              );
            })}
          </div>
          <p className="mt-1 text-[10px] italic text-slate-400">{METODE_CFG[form.metode].hint}</p>
        </div>

        {/* Nominal */}
        <div>
          <label className="block">
            <span className="mb-1 block text-[10.5px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
              Nominal (Rp)
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={form.nominal}
              onChange={(e) => setForm({ ...form, nominal: e.target.value.replace(/[^\d]/g, "") })}
              placeholder="0"
              className={cn(
                inputCn,
                "px-3 py-2 text-right font-mono text-[16px] font-bold tabular-nums",
                errors.nominal && touched && "border-rose-300 focus:border-rose-400 focus:ring-rose-100",
              )}
            />
          </label>
          {/* Terbilang preview */}
          {nominalNum > 0 && (
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="mt-1 italic text-[10.5px] leading-snug text-slate-500 dark:text-slate-400"
            >
              <span className="font-semibold text-slate-400">Terbilang:</span> {terbilang(nominalNum)}
            </motion.p>
          )}
          {errors.nominal && touched && (
            <span className="mt-1 inline-flex items-center gap-1 text-[10.5px] text-rose-600">
              <AlertCircle size={11} />
              {errors.nominal}
            </span>
          )}
        </div>

        {/* Kategori toggle */}
        <div>
          <p className="mb-1 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
            Kategori
          </p>
          <div className="flex gap-1.5">
            {(["Pembayaran", "Deposit"] as PaymentKategori[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setForm({ ...form, kategori: k })}
                className={cn(
                  "flex-1 rounded-md border px-2 py-1.5 text-[11.5px] font-medium transition-all",
                  form.kategori === k
                    ? "border-amber-300 bg-amber-50 text-amber-800 ring-1 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-300"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
                )}
                aria-pressed={form.kategori === k}
              >
                {k}
              </button>
            ))}
          </div>
        </div>

        {/* Conditional bank + no ref */}
        {(needsRef || needsBank) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.18 }}
            className="grid grid-cols-2 gap-2"
          >
            {needsBank && (
              <label className="block">
                <span className="mb-1 block text-[10.5px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
                  Bank
                </span>
                <select
                  value={form.bank}
                  onChange={(e) => setForm({ ...form, bank: e.target.value })}
                  className={cn(selectCn, errors.bank && touched && "border-rose-300")}
                >
                  <option value="">Pilih bank…</option>
                  {["BCA", "Mandiri", "BNI", "BRI", "BSI", "CIMB"].map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
                {errors.bank && touched && (
                  <span className="mt-1 inline-flex items-center gap-1 text-[10.5px] text-rose-600">
                    <AlertCircle size={11} />{errors.bank}
                  </span>
                )}
              </label>
            )}
            {needsRef && (
              <label className={cn("block", !needsBank && "col-span-2")}>
                <span className="mb-1 block text-[10.5px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
                  No Referensi
                </span>
                <input
                  type="text"
                  value={form.noRef}
                  onChange={(e) => setForm({ ...form, noRef: e.target.value })}
                  placeholder={form.metode === "EDC" ? "Approval code" : "Trace/transaction id"}
                  className={cn(inputCn, "font-mono", errors.noRef && touched && "border-rose-300")}
                />
                {errors.noRef && touched && (
                  <span className="mt-1 inline-flex items-center gap-1 text-[10.5px] text-rose-600">
                    <AlertCircle size={11} />{errors.noRef}
                  </span>
                )}
              </label>
            )}
          </motion.div>
        )}

        {/* Bukti upload (stub) */}
        {(form.metode === "Transfer" || form.metode === "EDC") && (
          <label className="block">
            <span className="mb-1 block text-[10.5px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
              Bukti (opsional)
            </span>
            <div className="flex items-center gap-1.5 rounded-md border border-dashed border-slate-300 bg-slate-50/50 px-2 py-1.5 transition-colors hover:border-amber-300 hover:bg-amber-50/30 dark:border-slate-700 dark:bg-slate-900/50">
              <Upload size={12} className="text-slate-400" />
              <input
                type="text"
                value={form.bukti}
                onChange={(e) => setForm({ ...form, bukti: e.target.value })}
                placeholder="Nama file / link bukti"
                className="flex-1 bg-transparent text-[11.5px] text-slate-700 placeholder:text-slate-400 focus:outline-none dark:text-slate-200"
              />
            </div>
          </label>
        )}

        {/* Catatan */}
        <label className="block">
          <span className="mb-1 block text-[10.5px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
            Catatan (opsional)
          </span>
          <textarea
            rows={2}
            value={form.catatan}
            onChange={(e) => setForm({ ...form, catatan: e.target.value })}
            placeholder="mis. Cicilan ke-2 / titipan keluarga / dll"
            className={cn(inputCn, "resize-none")}
          />
        </label>
      </div>

      {/* Submit */}
      <footer className="border-t border-slate-100 px-4 py-2.5 dark:border-slate-800">
        <button
          type="button"
          onClick={submit}
          disabled={hasError && touched}
          className={cn(
            "group flex w-full items-center justify-center gap-1.5 rounded-md px-3 py-2 text-[12.5px] font-semibold text-white shadow-sm transition-all active:scale-[0.98]",
            justSubmitted
              ? "bg-emerald-600 hover:bg-emerald-700"
              : "bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 disabled:hover:bg-slate-300",
          )}
        >
          {justSubmitted ? (
            <>
              <CheckCircle2 size={13} />
              Pembayaran Tercatat
            </>
          ) : (
            <>
              <CheckCircle2 size={13} className="transition-transform group-hover:scale-110" />
              Terima Pembayaran {nominalNum > 0 && <span className="font-mono">— {fmtRupiah(nominalNum)}</span>}
            </>
          )}
        </button>
      </footer>
    </section>
  );
}
