"use client";

import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import {
  Lock, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ModalShell, Field, ModalFooter, inputCn,
} from "../../invoice/modals/AddItemModal";
import { fmtRupiah, METODE_CFG, METODE_ORDER } from "../../invoice/invoiceShared";
import {
  COUNTER_LIST, computeSelisih, expectedCashOnHand, formatDuration, formatJam,
  totalShiftAll, totalShiftNonTunai, type KasirShift,
} from "@/lib/billing/kasirShiftMock";
import { COUNTER_TONE } from "../kasirShared";

interface Props {
  open: boolean;
  shift: KasirShift | null;
  onClose: () => void;
  onTutupShift: (input: TutupShiftInput) => void;
}

export interface TutupShiftInput {
  shiftId: string;
  tutupSaldoAkhir: number;
  selisih: number;
  tutupCatatan?: string;
}

interface FormState {
  saldo: string;
  catatan: string;
}

const initialState = (suggested: number): FormState => ({
  saldo: String(suggested),
  catatan: "",
});

/**
 * Form Tutup Shift — auto-show breakdown per metode + expected cash + input
 * saldo fisik laci → compute selisih real-time → konfirmasi.
 */
export default function TutupShiftModal({
  open, shift, onClose, onTutupShift,
}: Props) {
  // Hook order rule: panggil selalu, derive default conditionally.
  const expected = shift ? expectedCashOnHand(shift) : 0;
  const [form, setForm] = useState<FormState>(() => initialState(expected));
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (open && shift) setForm(initialState(expectedCashOnHand(shift)));
    if (!open) setTouched(false);
  }, [open, shift]);

  // ESC close
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [open, onClose]);

  if (!shift) return null;

  const counter = COUNTER_LIST.find((c) => c.id === shift.counter);
  const counterTone = COUNTER_TONE[shift.counter];
  const CounterIcon = counterTone.icon;
  const saldoNum = Number(form.saldo.replace(/[^\d]/g, ""));
  const totalAll = totalShiftAll(shift.totalByMetode);
  const totalNonTunai = totalShiftNonTunai(shift.totalByMetode);
  const selisih = Number.isFinite(saldoNum) ? computeSelisih(shift, saldoNum) : 0;
  const selisihPalette = paletteForSelisih(selisih);

  const errors = {
    saldo: !Number.isFinite(saldoNum) || saldoNum < 0
      ? "Saldo akhir harus ≥ 0"
      : null,
    catatan: Math.abs(selisih) > 0 && form.catatan.trim().length < 5
      ? "Wajib isi catatan (min 5 char) jika selisih ≠ 0"
      : null,
  };
  const hasError = Object.values(errors).some(Boolean);

  const submit = () => {
    setTouched(true);
    if (hasError) return;
    onTutupShift({
      shiftId: shift.id,
      tutupSaldoAkhir: saldoNum,
      selisih,
      tutupCatatan: form.catatan.trim() || undefined,
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <ModalShell title="Tutup Shift Kasir" onClose={onClose} maxWidth="max-w-xl">
          <div className="space-y-3">
            {/* ── Shift context card ── */}
            <div className="rounded-md border border-slate-200 bg-slate-50/60 px-3 py-2 dark:border-slate-800 dark:bg-slate-900/40">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-md ring-1",
                    counterTone.bg, counterTone.text, counterTone.ring,
                  )}>
                    <CounterIcon size={14} />
                  </span>
                  <div>
                    <p className="text-[12px] font-semibold text-slate-800 dark:text-slate-100">
                      {counter?.nama ?? shift.counter}
                    </p>
                    <p className="text-[10.5px] text-slate-500">
                      {shift.kasirNama} · sejak {formatJam(shift.bukaAt)} ({formatDuration(shift.bukaAt)})
                    </p>
                  </div>
                </div>
                <span className="font-mono text-[10px] tabular-nums text-slate-400">{shift.id}</span>
              </div>
            </div>

            {/* ── Breakdown auto ── */}
            <div>
              <p className="mb-1 block text-[10.5px] font-semibold uppercase tracking-[0.06em] text-slate-500">
                Breakdown Sesi Ini
              </p>
              <ul className="space-y-1 rounded-md border border-slate-200 bg-white px-2 py-2 text-[11.5px] dark:border-slate-800 dark:bg-slate-900">
                {METODE_ORDER.map((m) => {
                  const cfg = METODE_CFG[m];
                  const Icon = cfg.icon;
                  const nominal = shift.totalByMetode[m];
                  const isEmpty = nominal === 0;
                  return (
                    <li
                      key={m}
                      className={cn(
                        "grid grid-cols-[24px_1fr_auto] items-center gap-2",
                        isEmpty && "opacity-50",
                      )}
                    >
                      <span className={cn("flex h-5 w-5 items-center justify-center rounded ring-1", cfg.bg, cfg.text, cfg.ring)}>
                        <Icon size={10} />
                      </span>
                      <span className="text-slate-700 dark:text-slate-300">{cfg.label}</span>
                      <span className={cn(
                        "font-mono text-[11.5px] tabular-nums",
                        isEmpty ? "text-slate-400" : "text-slate-800 dark:text-slate-100",
                      )}>
                        {fmtRupiah(nominal)}
                      </span>
                    </li>
                  );
                })}
                <li className="mt-1 grid grid-cols-[24px_1fr_auto] items-center gap-2 border-t border-slate-200 pt-1 text-[11.5px] dark:border-slate-700">
                  <span />
                  <span className="font-semibold text-slate-800 dark:text-slate-100">Total Semua</span>
                  <span className="font-mono font-bold tabular-nums text-slate-900 dark:text-slate-50">
                    {fmtRupiah(totalAll)}
                  </span>
                </li>
              </ul>
            </div>

            {/* ── Expected cash + form ── */}
            <div className="grid grid-cols-2 gap-2">
              <Field label="Saldo Awal (saat buka)">
                <div className={cn(inputCn, "bg-slate-50 font-mono tabular-nums text-slate-700 dark:bg-slate-800/50")}>
                  {fmtRupiah(shift.bukaSaldoAwal)}
                </div>
              </Field>
              <Field label="Total Tunai Masuk">
                <div className={cn(inputCn, "bg-emerald-50/60 font-mono tabular-nums text-emerald-700 dark:bg-emerald-950/15")}>
                  + {fmtRupiah(shift.totalByMetode.Tunai)}
                </div>
              </Field>
              {shift.totalRefund > 0 && (
                <>
                  <Field label="Refund (asumsi cash)">
                    <div className={cn(inputCn, "bg-rose-50/60 font-mono tabular-nums text-rose-700 dark:bg-rose-950/15")}>
                      − {fmtRupiah(shift.totalRefund)}
                    </div>
                  </Field>
                  <Field label="Non-Tunai (info)">
                    <div className={cn(inputCn, "bg-sky-50/60 font-mono tabular-nums text-sky-700 dark:bg-sky-950/15")}>
                      {fmtRupiah(totalNonTunai)}
                    </div>
                  </Field>
                </>
              )}
            </div>

            <div className="rounded-md border border-amber-200 bg-amber-50/40 px-3 py-2 dark:border-amber-900/40 dark:bg-amber-950/15">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                Saldo Cash yang Diharapkan di Laci
              </p>
              <p className="mt-0.5 font-mono text-[18px] font-bold tabular-nums text-amber-700 dark:text-amber-300">
                {fmtRupiah(expected)}
              </p>
              <p className="text-[10px] text-slate-500">
                Hitung manual kas fisik di laci, lalu input di kolom bawah.
              </p>
            </div>

            <Field label="Saldo Kas Akhir (Rp — actual di laci)" error={touched ? errors.saldo : null}>
              <input
                type="text"
                inputMode="numeric"
                value={form.saldo}
                onChange={(e) => setForm({ ...form, saldo: e.target.value.replace(/[^\d]/g, "") })}
                placeholder={String(expected)}
                autoFocus
                className={cn(inputCn, "font-mono text-[16px] tabular-nums")}
              />
            </Field>

            {/* ── Selisih live ── */}
            <div className={cn(
              "rounded-md border px-3 py-2.5 transition-colors",
              selisihPalette.border, selisihPalette.bg,
            )}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {selisihPalette.icon}
                  <p className={cn("text-[11px] font-semibold uppercase tracking-wider", selisihPalette.text)}>
                    {selisihPalette.label}
                  </p>
                </div>
                <p className={cn("font-mono text-[16px] font-bold tabular-nums", selisihPalette.text)}>
                  {selisih === 0 ? fmtRupiah(0) : `${selisih > 0 ? "+" : ""}${fmtRupiah(selisih)}`}
                </p>
              </div>
              <p className="mt-0.5 text-[10.5px] text-slate-600 dark:text-slate-400">
                Saldo aktual <span className="font-mono">{fmtRupiah(saldoNum)}</span> −
                expected <span className="font-mono">{fmtRupiah(expected)}</span>.
                {Math.abs(selisih) > 0 && " Catatan wajib diisi."}
              </p>
            </div>

            <Field
              label={Math.abs(selisih) > 0 ? "Catatan (WAJIB - jelaskan selisih)" : "Catatan (opsional)"}
              error={touched ? errors.catatan : null}
            >
              <textarea
                rows={2}
                value={form.catatan}
                onChange={(e) => setForm({ ...form, catatan: e.target.value })}
                placeholder={
                  selisih > 0
                    ? "mis. surplus dari tip pasien"
                    : selisih < 0
                      ? "mis. minus karena kembalian salah, laporkan audit"
                      : "Balance — siap serah-terima"
                }
                className={cn(inputCn, "resize-none")}
              />
            </Field>
          </div>

          <ModalFooter
            onClose={onClose}
            onConfirm={submit}
            confirmLabel={selisih === 0 ? "Tutup Shift (Balance)" : "Tutup Shift dengan Selisih"}
            confirmIcon={Lock}
            danger={Math.abs(selisih) > 0}
          />
        </ModalShell>
      )}
    </AnimatePresence>
  );
}

// ── Selisih palette ────────────────────────────────────

function paletteForSelisih(selisih: number) {
  if (selisih === 0) return {
    border: "border-emerald-200 dark:border-emerald-900/40",
    bg:     "bg-emerald-50/60 dark:bg-emerald-950/15",
    text:   "text-emerald-700 dark:text-emerald-300",
    label:  "Balance",
    icon:   <CheckCircle2 size={14} className="text-emerald-600" />,
  };
  if (selisih > 0) return {
    border: "border-sky-200 dark:border-sky-900/40",
    bg:     "bg-sky-50/60 dark:bg-sky-950/15",
    text:   "text-sky-700 dark:text-sky-300",
    label:  "Surplus",
    icon:   <TrendingUp size={14} className="text-sky-600" />,
  };
  return {
    border: "border-rose-200 dark:border-rose-900/40",
    bg:     "bg-rose-50/60 dark:bg-rose-950/15",
    text:   "text-rose-700 dark:text-rose-300",
    label:  "Minus — Audit Required",
    icon:   <AlertTriangle size={14} className="text-rose-600" />,
  };
}
