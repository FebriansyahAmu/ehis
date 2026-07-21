"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { PiggyBank, Sparkles, AlertCircle, Wallet } from "lucide-react";
import {
  ModalShell, ModalFooter, Field, inputCn,
} from "../../invoice/modals/AddItemModal";
import { fmtRupiah } from "../../invoice/invoiceShared";
import { DateTimePicker } from "@/components/shared/inputs";
import { terbilang } from "@/lib/billing/terbilang";
import { COUNTER_LIST, type KasirShift } from "@/lib/billing/kasirShiftMock";
import type { SetoranInput } from "@/lib/api/billing/shift";

interface Props {
  open: boolean;
  shift: KasirShift | null;
  busy?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (shiftId: string, input: SetoranInput) => void;
}

interface FormState {
  tanggalSerah: string;   // datetime-local "YYYY-MM-DDTHH:mm"
  penerima: string;
  nominal: string;
  catatan: string;
}

/**
 * SetoranFormModal (BL3.4) — input catat setoran kas ke keuangan setelah
 * shift Closed.
 *
 * Default value:
 *   - tanggalSerah: now (datetime-local format)
 *   - nominal: `tutupSaldoAkhir − bukaSaldoAwal` (net kas tunai yang disetor)
 *
 * No. setoran (STR/YYYY/MM/NNNNN) TIDAK diketik di sini — di-generate server saat simpan
 * (counter atomik), sama seperti nomor invoice/kwitansi.
 *
 * Validation:
 *   - Semua field wajib (kecuali catatan)
 *   - Nominal > 0
 */
export default function SetoranFormModal({ open, shift, busy, error, onClose, onSubmit }: Props) {
  const defaultNominal = useMemo(() => {
    if (!shift) return 0;
    const akhir = shift.tutupSaldoAkhir ?? 0;
    return Math.max(0, akhir - shift.bukaSaldoAwal);
  }, [shift]);

  const [form, setForm] = useState<FormState>(() => ({
    tanggalSerah: nowLocal(), penerima: "", nominal: "0", catatan: "",
  }));
  const [touched, setTouched] = useState(false);

  // Prefill saat modal dibuka untuk shift tertentu (pola adjust-state-during-render, bukan effect).
  const formKey = open && shift ? `${shift.id}|${defaultNominal}` : "";
  const [prevKey, setPrevKey] = useState("");
  if (formKey !== prevKey) {
    setPrevKey(formKey);
    setForm({
      tanggalSerah: nowLocal(),
      penerima: "",
      nominal: String(defaultNominal),
      catatan: "",
    });
    setTouched(false);
  }

  // ESC close
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [open, onClose]);

  if (!shift) return null;
  const counter = COUNTER_LIST.find((c) => c.id === shift.counter);
  const nominalNum = Number(form.nominal.replace(/[^\d]/g, ""));
  const isAutoSuggested = Number.isFinite(nominalNum) && nominalNum === defaultNominal;

  const errors = {
    tanggalSerah: form.tanggalSerah.trim() === "" ? "Tanggal serah wajib diisi" : null,
    penerima: form.penerima.trim() === "" ? "Nama penerima wajib diisi" : null,
    nominal: !Number.isFinite(nominalNum) || nominalNum <= 0
      ? "Nominal harus > 0"
      : null,
  };
  const hasError = Object.values(errors).some(Boolean);

  const submit = () => {
    setTouched(true);
    if (hasError || busy) return;
    // Modal TIDAK menutup sendiri — parent menutup sesudah server sukses (biar galat terlihat).
    onSubmit(shift.id, {
      tanggalSerah: toIsoFromLocal(form.tanggalSerah),
      penerima: form.penerima.trim(),
      nominal: nominalNum,
      catatan: form.catatan.trim() || undefined,
    });
  };

  return (
    <AnimatePresence>
      {open && (
        <ModalShell title="Catat Setoran Kas" onClose={onClose} maxWidth="max-w-lg">
          {/* Shift context */}
          <section className="mb-4 rounded-lg border border-amber-200 bg-amber-50/60 p-3 dark:border-amber-900/60 dark:bg-amber-900/10">
            <div className="flex items-start gap-2">
              <span className="flex h-8 w-8 flex-none items-center justify-center rounded-md bg-amber-100 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-900/40 dark:text-amber-300">
                <Wallet size={14} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10.5px] font-semibold uppercase tracking-wider text-amber-700">
                  Shift Sumber Setoran
                </p>
                <p className="mt-0.5 text-[12.5px] font-semibold text-slate-800 dark:text-slate-100">
                  {counter?.nama ?? shift.counter} · {shift.kasirNama}
                </p>
                <p className="font-mono text-[10.5px] text-slate-500">{shift.id}</p>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-amber-200/60 pt-2 text-[11px] dark:border-amber-900/40">
              <Stat label="Saldo Akhir" value={fmtRupiah(shift.tutupSaldoAkhir ?? 0)} />
              <Stat label="Saldo Awal Shift" value={fmtRupiah(shift.bukaSaldoAwal)} />
              <Stat label="Selisih Shift" value={selisihLabel(shift.selisih)} tone={selisihTone(shift.selisih)} />
              <Stat label="Net Tunai (suggest)" value={fmtRupiah(defaultNominal)} tone="amber" />
            </div>
          </section>

          {/* Form fields */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="No. Setoran">
              <div className="flex h-8.5 items-center gap-1.5 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 dark:border-slate-700 dark:bg-slate-900/40">
                <Sparkles size={11} className="flex-none text-slate-400" />
                <span className="font-mono text-[11.5px] text-slate-500">
                  Auto <span className="text-slate-400">· STR/YYYY/MM/NNNNN</span>
                </span>
              </div>
            </Field>

            <Field label="Tanggal Serah" error={touched ? errors.tanggalSerah : null}>
              <DateTimePicker
                value={form.tanggalSerah}
                onChange={(v) => setForm({ ...form, tanggalSerah: v })}
              />
            </Field>

            <div className="sm:col-span-2">
              <Field label="Diterima Oleh (Penerima)" error={touched ? errors.penerima : null}>
                <input
                  type="text"
                  value={form.penerima}
                  onChange={(e) => setForm({ ...form, penerima: e.target.value })}
                  className={inputCn}
                  placeholder="Nama bendahara / staf keuangan penerima"
                />
                <p className="mt-1 text-[10.5px] text-slate-500">
                  Nama tercetak di slip sebagai pihak yang menerima fisik uang. Penyetor terisi
                  otomatis dari akun Anda.
                </p>
              </Field>
            </div>

            <div className="sm:col-span-2">
              <Field label="Nominal Setor (Rp)" error={touched ? errors.nominal : null}>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={form.nominal}
                    onChange={(e) => setForm({ ...form, nominal: e.target.value.replace(/[^\d]/g, "") })}
                    className={inputCn + " pr-24 text-right font-mono text-[14px] font-semibold tabular-nums"}
                    placeholder="0"
                  />
                  {isAutoSuggested ? (
                    <span className="absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[9.5px] font-semibold text-amber-700 ring-1 ring-amber-200">
                      <Sparkles size={9} />
                      ikut saran
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, nominal: String(defaultNominal) })}
                      className="absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[9.5px] font-medium text-slate-600 transition-colors hover:bg-slate-200"
                    >
                      ← Pakai saran
                    </button>
                  )}
                </div>
                {nominalNum > 0 && (
                  <p className="mt-1 text-[10.5px] italic text-slate-500">
                    {terbilang(nominalNum)}
                  </p>
                )}
              </Field>
            </div>

            <div className="sm:col-span-2">
              <Field label="Catatan (opsional)">
                <textarea
                  value={form.catatan}
                  onChange={(e) => setForm({ ...form, catatan: e.target.value })}
                  rows={2}
                  className={inputCn + " resize-none"}
                  placeholder="Selisih, kondisi uang, atau catatan serah-terima lainnya"
                />
              </Field>
            </div>
          </div>

          {/* Selisih warning */}
          {nominalNum > 0 && Number.isFinite(nominalNum) && nominalNum !== defaultNominal && (
            <div className="mt-3 flex items-start gap-2 rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-[11px] text-sky-800 dark:border-sky-900/60 dark:bg-sky-900/20 dark:text-sky-300">
              <AlertCircle size={12} className="mt-0.5 flex-none" />
              <p>
                Nominal manual ({fmtRupiah(nominalNum)}) berbeda dengan saran sistem ({fmtRupiah(defaultNominal)}).
                Pastikan catatan menyertakan alasan perbedaan.
              </p>
            </div>
          )}

          {error && (
            <div className="mt-3 flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-[11.5px] font-medium text-rose-700 dark:border-rose-900/60 dark:bg-rose-900/20 dark:text-rose-300">
              <AlertCircle size={12} className="mt-0.5 flex-none" />
              <p>{error}</p>
            </div>
          )}

          <ModalFooter
            onClose={onClose}
            onConfirm={submit}
            confirmLabel={busy ? "Menyimpan…" : "Catat & Cetak Slip"}
            confirmIcon={PiggyBank}
          />
        </ModalShell>
      )}
    </AnimatePresence>
  );
}

// ── Helpers ────────────────────────────────────────────

function nowLocal(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * datetime-local ("YYYY-MM-DDTHH:mm", waktu LOKAL tanpa zona) → ISO ber-offset (UTC "Z").
 * Wajib: kontrak server (`SetoranInput.tanggalSerah`) menolak string tanpa zona, dan tanpa
 * konversi ini jam setoran akan tersimpan bergeser sebesar offset zona waktu.
 */
function toIsoFromLocal(local: string): string {
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

function Stat({
  label, value, tone = "slate",
}: {
  label: string;
  value: string;
  tone?: "slate" | "amber" | "emerald" | "rose" | "sky";
}) {
  const toneCn: Record<typeof tone, string> = {
    slate:   "text-slate-700",
    amber:   "text-amber-700 font-bold",
    emerald: "text-emerald-700",
    rose:    "text-rose-700",
    sky:     "text-sky-700",
  };
  return (
    <div>
      <p className="text-[9.5px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className={"font-mono tabular-nums " + toneCn[tone]}>{value}</p>
    </div>
  );
}

function selisihLabel(selisih?: number): string {
  if (selisih === undefined) return "—";
  if (selisih === 0) return "Balance";
  return `${selisih > 0 ? "+" : ""}${fmtRupiah(selisih)}`;
}

function selisihTone(selisih?: number): "emerald" | "sky" | "rose" | "slate" {
  if (selisih === undefined) return "slate";
  if (selisih === 0) return "emerald";
  if (selisih > 0) return "sky";
  return "rose";
}
