"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Printer } from "lucide-react";
import { cn } from "@/lib/utils";
import { PAPER_CFG, PAPER_ORDER, triggerPrint, type PaperSize } from "./printShared";

interface Props {
  open: boolean;
  title: string;                // "Cetak Struk Tagihan" / "Cetak Kwitansi"
  paper: PaperSize;
  onPaperChange: (p: PaperSize) => void;
  onClose: () => void;
  /** Sheet content — wajib bungkus `.print-area` di root. */
  children: React.ReactNode;
}

/**
 * Print Modal Shell — overlay + toolbar (paper toggle + close + print) + preview frame.
 *
 * `no-print` class di toolbar/overlay agar tidak ikut di-print.
 * Sheet content disuruh punya `.print-area` di root (global @media print rule
 * akan show hanya `.print-area`).
 */
export default function PrintModalShell({
  open, title, paper, onPaperChange, onClose, children,
}: Props) {
  // ESC close
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="no-print fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-[3px]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 10 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fixed inset-3 z-50 flex flex-col overflow-hidden rounded-xl bg-slate-100 shadow-2xl ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800 md:inset-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="print-modal-title"
          >
            {/* Toolbar */}
            <header className="no-print flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-2.5 dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-100 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:ring-amber-900/60">
                  <Printer size={14} />
                </span>
                <div>
                  <h2 id="print-modal-title" className="text-[13px] font-semibold text-slate-800 dark:text-slate-100">
                    {title}
                  </h2>
                  <p className="text-[10.5px] text-slate-500">
                    Preview · Format <span className="font-semibold">{paper}</span> ·{" "}
                    {PAPER_CFG[paper].description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Paper size segmented */}
                <PaperSegmented value={paper} onChange={onPaperChange} />

                {/* Print button */}
                <button
                  type="button"
                  onClick={() => triggerPrint()}
                  className="inline-flex items-center gap-1.5 rounded-md bg-amber-600 px-3 py-1.5 text-[11.5px] font-semibold text-white shadow-sm transition-all hover:bg-amber-700 active:scale-[0.97]"
                  title="Cetak / simpan PDF dialog"
                >
                  <Printer size={12} />
                  Cetak
                </button>

                {/* Close */}
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Tutup"
                  className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                >
                  <X size={14} />
                </button>
              </div>
            </header>

            {/* Preview area */}
            <div className="flex-1 overflow-auto bg-slate-200/60 px-3 py-5 dark:bg-slate-950">
              <div className="mx-auto" style={{ width: PAPER_CFG[paper].screenWidthPx }}>
                {children}
              </div>
            </div>

            {/* Footer hint */}
            <footer className="no-print border-t border-slate-200 bg-white px-4 py-1.5 text-center text-[10px] text-slate-500 dark:border-slate-800 dark:bg-slate-950">
              Tip: Browser print dialog → pilih &ldquo;Save as PDF&rdquo; untuk arsip digital ·
              shortcut <kbd className="rounded border border-slate-300 bg-slate-100 px-1 font-mono text-[9.5px] dark:border-slate-700 dark:bg-slate-800">Esc</kbd> untuk tutup
            </footer>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Paper size segmented ───────────────────────────────

function PaperSegmented({
  value, onChange,
}: {
  value: PaperSize;
  onChange: (p: PaperSize) => void;
}) {
  return (
    <div className="inline-flex rounded-md bg-slate-100 p-0.5 ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
      {PAPER_ORDER.map((p) => {
        const active = value === p;
        return (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-pressed={active}
            title={PAPER_CFG[p].description}
            className={cn(
              "rounded px-2 py-0.5 text-[11px] font-semibold transition-all",
              active
                ? "bg-white text-amber-700 shadow-sm ring-1 ring-amber-200 dark:bg-slate-900 dark:text-amber-300 dark:ring-amber-900/60"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200",
            )}
          >
            {p}
          </button>
        );
      })}
    </div>
  );
}
