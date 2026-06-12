"use client";

// DiscardDialog (GLOBAL, shared master) — konfirmasi "buang perubahan" non-destruktif saat
// membatalkan / pindah dari form yang masih dirty. Netral (amber/slate), BUKAN rose/delete.
// a11y: role=dialog + aria-modal, Escape menutup, fokus awal ke tombol aman, backdrop klik menutup,
// hormati reduced-motion. Dipakai lintas halaman master via barrel: import { DiscardDialog } from "@/components/master/shared".

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DiscardDialogProps {
  open: boolean;
  title?: string;
  message?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DiscardDialog({
  open,
  title = "Buang perubahan?",
  message = "Perubahan yang belum disimpan akan hilang.",
  confirmLabel = "Buang",
  cancelLabel = "Lanjut Edit",
  onConfirm,
  onCancel,
}: DiscardDialogProps) {
  const reduce = useReducedMotion();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", onKey);
    const t = setTimeout(() => cancelRef.current?.focus(), 50);
    return () => {
      document.removeEventListener("keydown", onKey);
      clearTimeout(t);
    };
  }, [open, onCancel]);

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
          <motion.div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onCancel}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-100"
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            {...card}
          >
            <div className="flex items-center gap-3 border-b border-amber-100 bg-amber-50 px-5 py-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white ring-1 ring-amber-200">
                <AlertTriangle size={17} className="text-amber-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-amber-700">{title}</p>
                <p className="text-[11px] text-amber-500">Perubahan belum tersimpan</p>
              </div>
              <button
                type="button"
                onClick={onCancel}
                className="rounded-lg p-1 text-amber-300 transition hover:bg-amber-100 hover:text-amber-500"
                aria-label="Tutup"
              >
                <X size={14} />
              </button>
            </div>

            <div className="px-5 py-4">
              <p className="text-[12px] leading-relaxed text-slate-500">{message}</p>
            </div>

            <div className="flex gap-2.5 border-t border-slate-100 px-5 py-4">
              <button
                ref={cancelRef}
                type="button"
                onClick={onCancel}
                className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-[13px] font-semibold text-slate-600 outline-none transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-300 active:scale-95"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-[13px] font-semibold text-white shadow-sm outline-none transition",
                  "bg-amber-600 hover:bg-amber-700 focus-visible:ring-2 focus-visible:ring-amber-300 active:scale-95",
                )}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
