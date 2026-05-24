"use client";

import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Ban, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtRupiah } from "../invoiceShared";
import type { ChargeItem } from "../invoiceShared";
import { rowGross } from "@/lib/billing/invoiceCalc";
import { ModalShell, Field, ModalFooter, inputCn } from "./AddItemModal";

interface Props {
  open: boolean;
  item: ChargeItem | null;
  onClose: () => void;
  onVoid: (itemId: string, reason: string) => void;
}

export default function VoidItemModal({ open, item, onClose, onVoid }: Props) {
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (open) {
      setReason("");
      setTouched(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [open, onClose]);

  const error = reason.trim().length < 5
    ? "Alasan minimal 5 karakter (audit trail)"
    : null;

  const submit = () => {
    setTouched(true);
    if (!item || error) return;
    onVoid(item.id, reason.trim());
    onClose();
  };

  return (
    <AnimatePresence>
      {open && item && (
        <ModalShell title="Void Item Tagihan" onClose={onClose}>
          <div className="space-y-3">
            {/* Warning banner */}
            <div className="flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50/70 px-3 py-2 dark:border-rose-900/50 dark:bg-rose-950/30">
              <AlertTriangle size={14} className="mt-0.5 flex-none text-rose-600" />
              <div className="text-[11.5px] text-rose-700 dark:text-rose-300">
                Item akan ditandai <strong>void</strong>. Subtotal akan dikeluarkan dari grand total,
                tapi audit trail tetap tersimpan dan item bisa dipulihkan.
              </div>
            </div>

            {/* Item context */}
            <div className="rounded-md bg-slate-50 px-3 py-2 dark:bg-slate-900">
              <div className="truncate text-[12.5px] font-semibold text-slate-800 dark:text-slate-100">
                {item.nama}
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-slate-500 dark:text-slate-400">
                <span>{item.qty} {item.satuan} × {fmtRupiah(item.hargaSatuan)}</span>
                <span className="text-slate-300">·</span>
                <span className="font-mono font-semibold text-rose-600 line-through">
                  {fmtRupiah(rowGross(item))}
                </span>
              </div>
            </div>

            {/* Reason */}
            <Field label="Alasan Void (wajib, min. 5 karakter)" error={touched ? error : null}>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="mis. Salah input qty, pasien menolak tindakan, duplikat charge dari adapter"
                className={cn(inputCn, "resize-none")}
                autoFocus
              />
            </Field>

            <p className="text-[10.5px] italic text-slate-500 dark:text-slate-400">
              Alasan akan dicatat di Riwayat Audit (BL2.5) dan tidak dapat diubah setelah submit.
            </p>
          </div>

          <ModalFooter
            onClose={onClose}
            onConfirm={submit}
            confirmLabel="Void Item"
            confirmIcon={Ban}
            danger
          />
        </ModalShell>
      )}
    </AnimatePresence>
  );
}
