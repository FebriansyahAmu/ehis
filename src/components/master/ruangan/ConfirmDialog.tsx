"use client";

// Dialog konfirmasi destruktif (hapus Unit / Ruangan / Bed) — controlled & reusable.
// Palet: rose (destruktif) + slate (netral) + teal (aksen app). TANPA indigo/violet.
// a11y: role=dialog + aria-modal, Escape menutup, fokus awal ke "Batal" (aman utk destruktif),
// backdrop klik menutup. Hormati prefers-reduced-motion. Pola selaras CancelDialog daftarOrder.

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { AlertTriangle, X, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ConfirmDialogProps {
  open: boolean;
  /** Label jenis objek — mis. "Unit" / "Ruangan" / "Bed". */
  kindLabel: string;
  /** Nama target (ditebalkan di kartu). */
  name: string;
  /** Kode target (opsional, ditampilkan monospace). */
  kode?: string;
  /** Ikon objek (default Trash2). */
  icon?: IconComponent;
  /** Teks konsekuensi (opsional, default generik). */
  message?: React.ReactNode;
  /** Label tombol konfirmasi (default "Ya, Hapus"). */
  confirmLabel?: string;
  /** Sedang memproses → tombol disabled + spinner. */
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open, kindLabel, name, kode, icon: Icon = Trash2, message,
  confirmLabel = "Ya, Hapus", busy = false, onConfirm, onCancel,
}: ConfirmDialogProps) {
  const reduce = useReducedMotion();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Escape menutup (kecuali sedang busy) + fokus awal ke tombol Batal.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    document.addEventListener("keydown", onKey);
    const t = setTimeout(() => cancelRef.current?.focus(), 50);
    return () => {
      document.removeEventListener("keydown", onKey);
      clearTimeout(t);
    };
  }, [open, busy, onCancel]);

  if (!mounted) return null;

  const card = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, scale: 0.92, y: 16 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.95, y: 8 },
      };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => !busy && onCancel()}
          />

          {/* Card */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`Konfirmasi hapus ${kindLabel}`}
            className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-100"
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            {...card}
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-rose-100 bg-rose-50 px-5 py-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white ring-1 ring-rose-200">
                <AlertTriangle size={17} className="text-rose-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-rose-700">Hapus {kindLabel}?</p>
                <p className="text-[11px] text-rose-400">Tindakan ini tidak dapat dibatalkan</p>
              </div>
              <button
                type="button"
                onClick={onCancel}
                disabled={busy}
                className="rounded-lg p-1 text-rose-300 transition hover:bg-rose-100 hover:text-rose-500 disabled:opacity-40"
                aria-label="Tutup"
              >
                <X size={14} />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4">
              <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 ring-1 ring-slate-200">
                  <Icon size={16} />
                </span>
                <div className="min-w-0">
                  <span className="inline-flex items-center rounded-md bg-slate-200/70 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-600">
                    {kindLabel}
                  </span>
                  <p className="mt-1 truncate text-[13px] font-bold text-slate-800">{name || "—"}</p>
                  {kode && <p className="font-mono text-[10px] text-slate-400">{kode}</p>}
                </div>
              </div>
              <p className="mt-3 text-[12px] leading-relaxed text-slate-500">
                {message ?? (
                  <>
                    {kindLabel} ini akan{" "}
                    <span className="rounded-md bg-rose-50 px-1.5 py-0.5 font-semibold text-rose-600 ring-1 ring-rose-100">
                      dihapus
                    </span>{" "}
                    dari data master dan tidak lagi muncul di sistem.
                  </>
                )}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2.5 border-t border-slate-100 px-5 py-4">
              <button
                ref={cancelRef}
                type="button"
                onClick={onCancel}
                disabled={busy}
                className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-[13px] font-semibold text-slate-600 outline-none transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-300 active:scale-95 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={busy}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-[13px] font-semibold text-white shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-rose-300 active:scale-95",
                  busy ? "cursor-not-allowed bg-rose-400" : "bg-rose-600 hover:bg-rose-700",
                )}
              >
                {busy ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={13} />}
                {busy ? "Menghapus…" : confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
