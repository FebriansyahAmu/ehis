"use client";

// Konfirmasi pilih / lepas Paket Layanan — controlled & reusable, adaptif per mode.
// pick  = konstruktif (emerald) → paket masuk tagihan.
// release = netral peringatan (amber) → biaya paket keluar dari tagihan.
// Pola selaras ConfirmDialog master (portal · framer-motion · Escape · backdrop · reduced-motion),
// tapi dua-tema karena aksi di sini bukan destruktif-hapus.

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { PackageCheck, PackageX, X, Loader2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { type PaketLayananData, fmtRp } from "./paketTypes";

export type PaketConfirmMode = "pick" | "release";

export interface PaketConfirmDialogProps {
  open: boolean;
  mode: PaketConfirmMode;
  /** Paket target aksi. */
  paket: PaketLayananData | null;
  /** Saat pick menggantikan paket aktif lain (opsional). */
  replacing?: PaketLayananData | null;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const THEME = {
  pick: {
    ring: "ring-emerald-200", headBorder: "border-emerald-100", headBg: "bg-emerald-50",
    iconBg: "ring-emerald-200", iconFg: "text-emerald-600", title: "text-emerald-700",
    sub: "text-emerald-400", closeFg: "text-emerald-300", closeHover: "hover:bg-emerald-100 hover:text-emerald-500",
    priceFg: "text-emerald-700", chip: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    btn: "bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-emerald-300", btnBusy: "bg-emerald-400",
    Icon: PackageCheck, heading: "Pilih Paket Layanan?", subtitle: "Biaya paket akan masuk ke tagihan",
    label: "Ya, Pilih Paket", labelBusy: "Menyimpan…",
  },
  release: {
    ring: "ring-amber-200", headBorder: "border-amber-100", headBg: "bg-amber-50",
    iconBg: "ring-amber-200", iconFg: "text-amber-600", title: "text-amber-700",
    sub: "text-amber-400", closeFg: "text-amber-300", closeHover: "hover:bg-amber-100 hover:text-amber-500",
    priceFg: "text-amber-700", chip: "bg-amber-50 text-amber-600 ring-amber-100",
    btn: "bg-amber-600 hover:bg-amber-700 focus-visible:ring-amber-300", btnBusy: "bg-amber-400",
    Icon: PackageX, heading: "Lepas Paket Layanan?", subtitle: "Biaya paket akan dihapus dari tagihan",
    label: "Ya, Lepas Paket", labelBusy: "Menghapus…",
  },
} as const;

export default function PaketConfirmDialog({
  open, mode, paket, replacing, busy = false, onConfirm, onCancel,
}: PaketConfirmDialogProps) {
  const reduce = useReducedMotion();
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Escape menutup (kecuali busy) + fokus awal ke Batal.
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

  if (typeof document === "undefined") return null;

  const t = THEME[mode];
  const Icon = t.Icon;

  const card = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, scale: 0.92, y: 16 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.95, y: 8 },
      };

  return createPortal(
    <AnimatePresence>
      {open && paket && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
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
            aria-label={t.heading}
            className={cn("relative z-10 w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl ring-1", t.ring)}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            {...card}
          >
            {/* Header */}
            <div className={cn("flex items-center gap-3 border-b px-5 py-4", t.headBorder, t.headBg)}>
              <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white ring-1", t.iconBg)}>
                <Icon size={17} className={t.iconFg} />
              </div>
              <div className="min-w-0 flex-1">
                <p className={cn("text-sm font-bold", t.title)}>{t.heading}</p>
                <p className={cn("text-[11px]", t.sub)}>{t.subtitle}</p>
              </div>
              <button
                type="button"
                onClick={onCancel}
                disabled={busy}
                className={cn("rounded-lg p-1 transition disabled:opacity-40", t.closeFg, t.closeHover)}
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
                <div className="min-w-0 flex-1">
                  <span className="inline-flex items-center rounded-md bg-slate-200/70 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-600">
                    {paket.kategori}
                  </span>
                  <p className="mt-1 truncate text-[13px] font-bold text-slate-800">{paket.nama}</p>
                </div>
                <p className={cn("shrink-0 text-[13px] font-bold", t.priceFg)}>{fmtRp(paket.harga)}</p>
              </div>

              {/* Menggantikan paket aktif (pick over active) */}
              {mode === "pick" && replacing && (
                <div className="mt-2.5 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-500 ring-1 ring-slate-100">
                  <span className="truncate font-semibold text-slate-600">{replacing.nama}</span>
                  <ArrowRight size={12} className="shrink-0 text-slate-400" />
                  <span className="truncate font-semibold text-emerald-600">{paket.nama}</span>
                </div>
              )}

              <p className="mt-3 text-[12px] leading-relaxed text-slate-500">
                {mode === "pick" ? (
                  <>
                    Paket ini akan{" "}
                    <span className={cn("rounded-md px-1.5 py-0.5 font-semibold ring-1", t.chip)}>
                      ditambahkan ke tagihan
                    </span>{" "}
                    kunjungan (rekam medis &amp; ehis-billing).
                    {replacing && " Paket sebelumnya akan diganti."}
                  </>
                ) : (
                  <>
                    Biaya paket ini akan{" "}
                    <span className={cn("rounded-md px-1.5 py-0.5 font-semibold ring-1", t.chip)}>
                      dikeluarkan dari tagihan
                    </span>{" "}
                    kunjungan (rekam medis &amp; ehis-billing).
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
                  "flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-[13px] font-semibold text-white shadow-sm outline-none transition focus-visible:ring-2 active:scale-95",
                  busy ? cn("cursor-not-allowed", t.btnBusy) : t.btn,
                )}
              >
                {busy ? <Loader2 size={14} className="animate-spin" /> : <Icon size={13} />}
                {busy ? t.labelBusy : t.label}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
