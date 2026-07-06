"use client";

// Dialog konfirmasi "Batalkan Kunjungan" (worklist RJ — mis. tab Order Masuk). Portal + aksen
// rose, pola RICancelOrderDialog. Batal kunjungan = DIKEMBALIKAN ke loket admisi (bukan hapus).
// a11y: role=dialog + aria-modal, Escape/backdrop menutup (kecuali busy), fokus awal ke "Tidak".

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Ban, X, Loader2, Undo2 } from "lucide-react";
import type { RJPatient } from "@/lib/data";
import { cn } from "@/lib/utils";
import { POLI_CFG } from "./rjShared";

export default function RJCancelDialog({
  patient, busy, onConfirm, onCancel,
}: {
  patient: RJPatient | null; // null = tertutup
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const reduce = useReducedMotion();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const open = patient !== null;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !busy) onCancel(); };
    document.addEventListener("keydown", onKey);
    const t = setTimeout(() => cancelRef.current?.focus(), 50);
    return () => { document.removeEventListener("keydown", onKey); clearTimeout(t); };
  }, [open, busy, onCancel]);

  if (typeof document === "undefined") return null; // SSR guard (portal butuh document.body)

  const card = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, scale: 0.92, y: 16 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.95, y: 8 },
      };

  return createPortal(
    <AnimatePresence>
      {open && patient && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => !busy && onCancel()}
          />
          <motion.div
            role="dialog" aria-modal="true" aria-label="Konfirmasi batalkan kunjungan"
            className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-100"
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            {...card}
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-rose-100 bg-rose-50 px-5 py-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white ring-1 ring-rose-200">
                <Ban size={17} className="text-rose-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-rose-700">Batalkan Kunjungan?</p>
                <p className="text-[11px] text-rose-400">Kunjungan dikembalikan ke loket admisi</p>
              </div>
              <button
                type="button" onClick={onCancel} disabled={busy} aria-label="Tutup"
                className="rounded-lg p-1 text-rose-300 transition hover:bg-rose-100 hover:text-rose-500 disabled:opacity-40"
              >
                <X size={14} />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4">
              <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                <span className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-black",
                  patient.gender === "L" ? "bg-sky-100 text-sky-700" : "bg-pink-100 text-pink-700",
                )}>
                  {patient.name.charAt(0)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-bold text-slate-800">{patient.name}</p>
                  <p className="font-mono text-[10px] text-slate-400">RM {patient.noRM}</p>
                  <p className="truncate text-[10px] text-slate-500">{POLI_CFG[patient.poli].label} · {patient.dokter}</p>
                </div>
              </div>
              <p className="mt-3 text-[12px] leading-relaxed text-slate-500">
                Kunjungan ini akan{" "}
                <span className="rounded-md bg-rose-50 px-1.5 py-0.5 font-semibold text-rose-600 ring-1 ring-rose-100">
                  dibatalkan
                </span>{" "}
                dan dikembalikan ke loket admisi. Pasien perlu didaftarkan ulang bila ingin dilanjutkan.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2.5 border-t border-slate-100 px-5 py-4">
              <button
                ref={cancelRef}
                type="button" onClick={onCancel} disabled={busy}
                className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-[13px] font-semibold text-slate-600 outline-none transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-300 active:scale-95 disabled:opacity-50"
              >
                Tidak
              </button>
              <button
                type="button" onClick={onConfirm} disabled={busy}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-[13px] font-semibold text-white shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-rose-300 active:scale-95",
                  busy ? "cursor-not-allowed bg-rose-400" : "bg-rose-600 hover:bg-rose-700",
                )}
              >
                {busy ? <Loader2 size={14} className="animate-spin" /> : <Undo2 size={13} />}
                {busy ? "Membatalkan…" : "Ya, Batalkan"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
