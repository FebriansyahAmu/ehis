"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtRupiah } from "../invoiceShared";
import type { ChargeItem } from "../invoiceShared";
import { ModalShell, Field, ModalFooter, inputCn } from "./AddItemModal";

type Mode = "nominal" | "percent";

interface Props {
  open: boolean;
  item: ChargeItem | null;
  onClose: () => void;
  onApply: (itemId: string, diskon: number, alasan: string) => void;
}

export default function DiskonItemModal({ open, item, onClose, onApply }: Props) {
  const [mode, setMode] = useState<Mode>("nominal");
  const [value, setValue] = useState("");      // nominal Rp atau persen
  const [alasan, setAlasan] = useState("");
  const [touched, setTouched] = useState(false);

  // Reset saat dibuka
  useEffect(() => {
    if (open) {
      setMode("nominal");
      setValue(String(item?.diskonItem ?? ""));
      setAlasan(item?.alasanDiskon ?? "");
      setTouched(false);
    }
  }, [open, item]);

  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [open, onClose]);

  const gross = useMemo(() => (item ? item.qty * item.hargaSatuan : 0), [item]);

  const numericValue = Number(value.replace(/[^\d]/g, ""));
  const diskonRp = useMemo(() => {
    if (!Number.isFinite(numericValue) || numericValue <= 0) return 0;
    if (mode === "percent") {
      const pct = Math.min(100, numericValue);
      return Math.round((gross * pct) / 100);
    }
    return Math.min(gross, numericValue);
  }, [mode, numericValue, gross]);

  const net = Math.max(0, gross - diskonRp);

  const errors = {
    value:  !Number.isFinite(numericValue) || numericValue <= 0
      ? `Diskon ${mode === "percent" ? "%" : "Rp"} harus > 0`
      : mode === "nominal" && numericValue > gross
        ? `Diskon tidak boleh > subtotal (${fmtRupiah(gross)})`
        : mode === "percent" && numericValue > 100
          ? "Persen maksimal 100%"
          : null,
    alasan: alasan.trim() === "" ? "Alasan wajib (audit trail)" : null,
  };
  const hasError = Object.values(errors).some(Boolean);

  const submit = () => {
    setTouched(true);
    if (!item || hasError) return;
    onApply(item.id, diskonRp, alasan.trim());
    onClose();
  };

  return (
    <AnimatePresence>
      {open && item && (
        <ModalShell title="Apply Diskon" onClose={onClose}>
          <div className="space-y-3">
            {/* Item context */}
            <div className="rounded-md bg-slate-50 px-3 py-2 dark:bg-slate-900">
              <div className="truncate text-[12.5px] font-semibold text-slate-800 dark:text-slate-100">
                {item.nama}
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-slate-500 dark:text-slate-400">
                <span>{item.qty} {item.satuan} × {fmtRupiah(item.hargaSatuan)}</span>
                <span className="text-slate-300">·</span>
                <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">
                  Subtotal {fmtRupiah(gross)}
                </span>
              </div>
            </div>

            {/* Mode toggle */}
            <div className="flex gap-1 rounded-md bg-slate-100 p-0.5 dark:bg-slate-900">
              <ModeBtn active={mode === "nominal"} onClick={() => setMode("nominal")} label="Rupiah (Rp)" />
              <ModeBtn active={mode === "percent"} onClick={() => setMode("percent")} label="Persen (%)" />
            </div>

            {/* Value */}
            <Field
              label={mode === "nominal" ? "Nominal Diskon (Rp)" : "Persentase Diskon (%)"}
              error={touched ? errors.value : null}
            >
              <input
                type="text"
                inputMode="numeric"
                value={value}
                onChange={(e) => setValue(e.target.value.replace(/[^\d]/g, ""))}
                placeholder={mode === "nominal" ? "50000" : "10"}
                className={cn(inputCn, "font-mono tabular-nums")}
              />
            </Field>

            {/* Alasan */}
            <Field label="Alasan Diskon (wajib)" error={touched ? errors.alasan : null}>
              <textarea
                rows={2}
                value={alasan}
                onChange={(e) => setAlasan(e.target.value)}
                placeholder="mis. Pegawai RS, Bansos, kebijaksanaan direktur, dll."
                className={cn(inputCn, "resize-none")}
              />
            </Field>

            {/* Preview */}
            <div className="rounded-md border border-amber-200 bg-amber-50/60 px-3 py-2 dark:border-amber-900/50 dark:bg-amber-950/30">
              <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                <PreviewCell label="Gross" value={fmtRupiah(gross)} />
                <PreviewCell label="Diskon" value={`- ${fmtRupiah(diskonRp)}`} tone="emerald" />
                <PreviewCell label="Net" value={fmtRupiah(net)} prominent />
              </div>
            </div>
          </div>

          <ModalFooter
            onClose={onClose}
            onConfirm={submit}
            confirmLabel="Apply Diskon"
            confirmIcon={Tag}
          />
        </ModalShell>
      )}
    </AnimatePresence>
  );
}

function ModeBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 rounded px-2 py-1 text-[11.5px] font-medium transition-all",
        active
          ? "bg-white text-amber-700 shadow-sm ring-1 ring-slate-200 dark:bg-slate-700 dark:text-amber-300 dark:ring-slate-600"
          : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200",
      )}
    >
      {label}
    </button>
  );
}

function PreviewCell({
  label, value, prominent, tone,
}: {
  label: string;
  value: string;
  prominent?: boolean;
  tone?: "emerald";
}) {
  const colorClass = tone === "emerald"
    ? "text-emerald-600"
    : prominent
      ? "text-amber-900 dark:text-amber-200"
      : "text-slate-700 dark:text-slate-200";
  return (
    <div className="flex flex-col leading-tight">
      <span className="text-[9.5px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </span>
      <span className={cn(
        "font-mono font-bold tabular-nums",
        prominent ? "text-[13px]" : "text-[11.5px]",
        colorClass,
      )}>
        {value}
      </span>
    </div>
  );
}
