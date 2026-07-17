"use client";

import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Percent, Save, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ModalShell, Field, ModalFooter, inputCn } from "./AddItemModal";
import { fmtRupiah } from "../invoiceShared";

interface Props {
  open: boolean;
  /** Subtotal proyeksi (Σ item) — batas diskon + basis hint %. */
  subtotal: number;
  current: { diskonInvoice: number; materai: number; ppnPct: number };
  busy?: boolean;
  onClose: () => void;
  onSubmit: (input: { diskonInvoice: number; materai: number; ppnPct: number; alasan?: string }) => void;
}

const digits = (s: string) => Number(s.replace(/[^\d]/g, "")) || 0;

/**
 * Penyesuaian level-invoice (Slice 2d — Fase 1): Diskon Invoice (Rp) + Materai (Rp) + PPN (%).
 * Charge (proyeksi order) TIDAK diubah — hanya total invoice. Preview grand total live.
 */
export default function AdjustmentModal({ open, subtotal, current, busy, onClose, onSubmit }: Props) {
  const [diskon, setDiskon] = useState(String(current.diskonInvoice || ""));
  const [materai, setMaterai] = useState(String(current.materai || ""));
  const [ppn, setPpn] = useState(String(current.ppnPct || ""));
  const [alasan, setAlasan] = useState("");
  const [touched, setTouched] = useState(false);

  // Reset ke nilai terkini setiap kali dibuka (pola adjust-state-during-render).
  const [wasOpen, setWasOpen] = useState(false);
  if (open && !wasOpen) {
    setWasOpen(true);
    setDiskon(String(current.diskonInvoice || ""));
    setMaterai(String(current.materai || ""));
    setPpn(String(current.ppnPct || ""));
    setAlasan("");
    setTouched(false);
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  const diskonNum = digits(diskon);
  const materaiNum = digits(materai);
  const ppnNum = Math.min(100, digits(ppn));

  const preview = useMemo(() => {
    const afterDiskon = Math.max(0, subtotal - diskonNum);
    const ppnAmt = Math.round((afterDiskon * ppnNum) / 100);
    return { afterDiskon, ppnAmt, grand: afterDiskon + ppnAmt + materaiNum };
  }, [subtotal, diskonNum, ppnNum, materaiNum]);

  const diskonPct = subtotal > 0 ? Math.round((diskonNum / subtotal) * 100) : 0;
  const errDiskon = diskonNum > subtotal ? "Diskon melebihi subtotal" : null;
  const hasError = !!errDiskon;

  const submit = () => {
    setTouched(true);
    if (hasError) return;
    onSubmit({ diskonInvoice: diskonNum, materai: materaiNum, ppnPct: ppnNum, alasan: alasan.trim() || undefined });
  };

  return (
    <AnimatePresence>
      {open && (
        <ModalShell title="Penyesuaian Tagihan" onClose={onClose} maxWidth="max-w-md">
          <div className="space-y-3">
            <p className="rounded-md border border-slate-200 bg-slate-50/60 px-3 py-2 text-[11px] text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400">
              Penyesuaian <strong>level-invoice</strong> — rincian charge (proyeksi order) tidak diubah.
              Subtotal: <span className="font-mono font-semibold text-slate-800 dark:text-slate-100">{fmtRupiah(subtotal)}</span>
            </p>

            <div className="grid grid-cols-2 gap-2">
              <Field label="Diskon Invoice (Rp)" error={touched ? errDiskon : null}>
                <input
                  type="text" inputMode="numeric" value={diskon}
                  onChange={(e) => setDiskon(e.target.value.replace(/[^\d]/g, ""))}
                  placeholder="0"
                  className={cn(inputCn, "font-mono tabular-nums", touched && errDiskon && "border-rose-300")}
                />
                <p className="mt-0.5 text-[10px] text-slate-400">
                  {diskonNum > 0 ? `= ${diskonPct}% dari subtotal` : "keringanan / diskon manajemen"}
                </p>
              </Field>
              <Field label="Materai (Rp)">
                <input
                  type="text" inputMode="numeric" value={materai}
                  onChange={(e) => setMaterai(e.target.value.replace(/[^\d]/g, ""))}
                  placeholder="0"
                  className={cn(inputCn, "font-mono tabular-nums")}
                />
              </Field>
            </div>

            <Field label="PPN (%)">
              <input
                type="text" inputMode="numeric" value={ppn}
                onChange={(e) => { const v = Math.min(100, digits(e.target.value)); setPpn(v ? String(v) : ""); }}
                placeholder="0"
                className={cn(inputCn, "font-mono tabular-nums")}
              />
            </Field>

            <Field label="Alasan (opsional)">
              <input
                type="text" value={alasan}
                onChange={(e) => setAlasan(e.target.value)}
                placeholder="mis. keringanan pasien tidak mampu / diskon promo"
                className={inputCn}
              />
            </Field>

            {/* Preview grand total */}
            <div className="rounded-md border border-amber-200 bg-amber-50/40 px-3 py-2.5 dark:border-amber-900/40 dark:bg-amber-950/15">
              <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
                <span>Subtotal − Diskon</span>
                <span className="font-mono tabular-nums">{fmtRupiah(preview.afterDiskon)}</span>
              </div>
              {ppnNum > 0 && (
                <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
                  <span>PPN {ppnNum}%</span>
                  <span className="font-mono tabular-nums">+ {fmtRupiah(preview.ppnAmt)}</span>
                </div>
              )}
              {materaiNum > 0 && (
                <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
                  <span>Materai</span>
                  <span className="font-mono tabular-nums">+ {fmtRupiah(materaiNum)}</span>
                </div>
              )}
              <div className="mt-1 flex items-center justify-between border-t border-amber-200/70 pt-1 dark:border-amber-900/40">
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                  <Percent size={10} /> Grand Total Baru
                </span>
                <span className="font-mono text-[15px] font-bold tabular-nums text-amber-700 dark:text-amber-300">
                  {fmtRupiah(preview.grand)}
                </span>
              </div>
            </div>

            {touched && hasError && (
              <p className="inline-flex items-center gap-1 text-[10.5px] text-rose-600">
                <AlertCircle size={11} /> {errDiskon}
              </p>
            )}
          </div>

          <ModalFooter
            onClose={onClose}
            onConfirm={submit}
            confirmLabel={busy ? "Menyimpan…" : "Simpan Penyesuaian"}
            confirmIcon={Save}
          />
        </ModalShell>
      )}
    </AnimatePresence>
  );
}
