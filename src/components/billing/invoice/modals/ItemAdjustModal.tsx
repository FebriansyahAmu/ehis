"use client";

// ItemAdjustModal — penyesuaian per BARIS charge (Slice 2d Fase 2): diskon (Rp/persen) atau void.
// Charge = proyeksi; overlay disimpan server (billing.ItemAdjustment). Net dihitung live untuk preview.

import { useMemo, useState } from "react";
import { Tag, Ban, X, AlertCircle, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtRupiah } from "../invoiceShared";
import type { ChargeItem } from "../invoiceShared";

export interface ItemAdjustPayload {
  jenis: "diskon" | "void";
  mode?: "rp" | "pct";
  nilai?: number;
  alasan?: string;
}

interface Props {
  open: boolean;
  mode: "diskon" | "void";
  item: ChargeItem | null;
  busy?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (payload: ItemAdjustPayload) => void;
  /** Hapus penyesuaian eksisting (mis. batal diskon) — hanya saat baris sudah punya diskon. */
  onRemove?: () => void;
}

export default function ItemAdjustModal({
  open, mode, item, busy, error, onClose, onSubmit, onRemove,
}: Props) {
  const gross = item ? item.qty * item.hargaSatuan : 0;
  const hasDiskon = (item?.diskonItem ?? 0) > 0;

  const [diskonMode, setDiskonMode] = useState<"rp" | "pct">("rp");
  const [nilai, setNilai] = useState("");
  const [alasan, setAlasan] = useState("");

  // Prefill saat modal dibuka utk baris tertentu (pola adjust-state-during-render).
  const key = `${item?.sourceRef ?? ""}|${mode}|${open}`;
  const [prevKey, setPrevKey] = useState("");
  if (key !== prevKey) {
    setPrevKey(key);
    setDiskonMode("rp");
    setNilai(open && mode === "diskon" && hasDiskon ? String(item?.diskonItem ?? "") : "");
    setAlasan("");
  }

  const nilaiNum = Number(nilai.replace(/[^\d]/g, "")) || 0;
  const reduksi = useMemo(() => {
    if (mode === "void") return gross;
    if (diskonMode === "pct") return Math.min(gross, Math.round((gross * nilaiNum) / 100));
    return Math.min(gross, nilaiNum);
  }, [mode, diskonMode, nilaiNum, gross]);
  const net = Math.max(0, gross - reduksi);

  const err =
    mode === "void" ? null
    : nilaiNum <= 0 ? "Nilai diskon harus > 0"
    : diskonMode === "pct" && nilaiNum > 100 ? "Persen maksimal 100"
    : diskonMode === "rp" && nilaiNum > gross ? `Diskon melebihi harga baris (${fmtRupiah(gross)})`
    : null;

  if (!open || !item) return null;

  const isVoid = mode === "void";
  const submit = () => {
    if (err) return;
    onSubmit(isVoid
      ? { jenis: "void", alasan: alasan || undefined }
      : { jenis: "diskon", mode: diskonMode, nilai: nilaiNum, alasan: alasan || undefined });
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950"
      >
        {/* Header */}
        <div className={cn("flex items-center justify-between px-4 py-3", isVoid ? "bg-rose-50 dark:bg-rose-950/30" : "bg-amber-50 dark:bg-amber-950/30")}>
          <h3 className={cn("inline-flex items-center gap-2 text-[13.5px] font-bold", isVoid ? "text-rose-800 dark:text-rose-200" : "text-amber-800 dark:text-amber-200")}>
            {isVoid ? <Ban size={15} /> : <Tag size={15} />}
            {isVoid ? "Void Baris" : hasDiskon ? "Ubah Diskon Baris" : "Diskon Baris"}
          </h3>
          <button type="button" onClick={onClose} aria-label="Tutup" className="rounded-md p-1 text-slate-400 transition hover:bg-white/60 hover:text-slate-600 dark:hover:bg-slate-800">
            <X size={15} />
          </button>
        </div>

        <div className="space-y-3 px-4 py-3">
          {/* Target baris */}
          <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 dark:border-slate-800 dark:bg-slate-900/40">
            <p className="truncate text-[12.5px] font-semibold text-slate-800 dark:text-slate-100">{item.nama}</p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              {item.qty} {item.satuan} × {fmtRupiah(item.hargaSatuan)} ={" "}
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">{fmtRupiah(gross)}</span>
            </p>
          </div>

          {isVoid ? (
            <p className="text-[12px] leading-relaxed text-slate-600 dark:text-slate-300">
              Baris ini akan <b>di-void</b> (nilai jadi <b>Rp0</b>, tetap tampil dicoret). Order klinis
              tidak dibatalkan — hanya charge yang dinolkan. Dapat dipulihkan lewat menu baris.
            </p>
          ) : (
            <>
              {/* Mode Rp / % */}
              <div className="grid grid-cols-2 gap-1.5">
                {(["rp", "pct"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setDiskonMode(m)}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-[12px] font-semibold transition",
                      diskonMode === m
                        ? "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300"
                        : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400",
                    )}
                  >
                    {m === "rp" ? "Nominal (Rp)" : "Persen (%)"}
                  </button>
                ))}
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  {diskonMode === "rp" ? "Nilai Diskon (Rp)" : "Diskon (%)"}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={nilai}
                  onChange={(e) => setNilai(e.target.value.replace(/[^\d]/g, ""))}
                  placeholder={diskonMode === "rp" ? "0" : "0–100"}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-right font-mono text-[15px] font-bold tabular-nums text-slate-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
                {err && (
                  <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-rose-600">
                    <AlertCircle size={11} /> {err}
                  </p>
                )}
              </div>

              {/* Preview net */}
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-[12px] dark:bg-slate-900/50">
                <span className="text-slate-500">Setelah diskon</span>
                <span className="flex items-baseline gap-2">
                  <span className="font-mono text-[11px] text-slate-400 line-through">{fmtRupiah(gross)}</span>
                  <span className="font-mono text-[14px] font-extrabold tabular-nums text-emerald-700 dark:text-emerald-300">{fmtRupiah(net)}</span>
                </span>
              </div>
            </>
          )}

          {/* Alasan */}
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Alasan {isVoid && <span className="text-rose-500">*</span>}
            </label>
            <input
              type="text"
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
              placeholder={isVoid ? "mis. duplikat / salah input" : "mis. kebijakan / goodwill"}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12.5px] text-slate-700 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            />
          </div>

          {error && (
            <p className="inline-flex items-center gap-1 text-[11.5px] font-medium text-rose-600">
              <AlertCircle size={12} /> {error}
            </p>
          )}
        </div>

        {/* Aksi */}
        <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-4 py-3 dark:border-slate-800">
          <div>
            {!isVoid && hasDiskon && onRemove && (
              <button
                type="button"
                disabled={busy}
                onClick={onRemove}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-semibold text-rose-600 ring-1 ring-rose-200 transition hover:bg-rose-50 disabled:opacity-50 dark:ring-rose-900/50"
              >
                <Trash2 size={13} /> Hapus Diskon
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3 py-1.5 text-[12px] font-semibold text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50 dark:text-slate-300 dark:ring-slate-700"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={busy || !!err || (isVoid && !alasan.trim())}
              onClick={submit}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[12px] font-bold text-white shadow-sm transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40",
                isVoid ? "bg-rose-600 hover:bg-rose-700" : "bg-amber-600 hover:bg-amber-700",
              )}
            >
              {busy ? <Loader2 size={13} className="animate-spin" /> : isVoid ? <Ban size={13} /> : <Tag size={13} />}
              {isVoid ? "Void Baris" : "Terapkan Diskon"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
