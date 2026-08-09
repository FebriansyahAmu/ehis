"use client";

// Gelang Identitas — modal preview + cetak. Dua media: "Gelang" (strip gelang dewasa
// 279 × 30 mm, media printer gelang/label) & "A4" (beberapa salinan siap gunting untuk
// holder). Infra print global: `.print-area` isolasi · `.no-print` toolbar · @page dinamis
// (di-inject saat modal terbuka → tak mengganggu cetakan A4 lain). Accent sky.

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Printer, Barcode } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PatientMaster } from "@/lib/data";
import GelangIdentitasSheet from "./GelangIdentitasSheet";

type GelangPaper = "band" | "A4";

const PAPER: Record<GelangPaper, { label: string; printW: string; page: string; margin: string; pad: string }> = {
  band: { label: "Gelang", printW: "271mm", page: "279mm 30mm", margin: "2mm 4mm", pad: "p-0" },
  A4:   { label: "A4",     printW: "190mm", page: "A4",         margin: "12mm 10mm", pad: "px-9 py-8" },
};

const PAPER_ORDER: GelangPaper[] = ["band", "A4"];

interface Props {
  open: boolean;
  onClose: () => void;
  patient: PatientMaster;
}

function ModalBody({ onClose, patient }: { onClose: () => void; patient: PatientMaster }) {
  const [paper, setPaper] = useState<GelangPaper>("band");
  const cfg = PAPER[paper];

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [onClose]);

  return (
    <>
      {/* @page dinamis — override size/margin global saat cetak (hanya saat modal terbuka). */}
      <style>{`@page { size: ${cfg.page}; margin: ${cfg.margin}; }`}</style>

      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={onClose}
        className="no-print fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-[3px]"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 10 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="fixed inset-3 z-50 flex flex-col overflow-hidden rounded-xl bg-slate-100 shadow-2xl ring-1 ring-slate-200 md:inset-6"
        role="dialog" aria-modal="true" aria-labelledby="gelang-print-title"
      >
        <header className="no-print flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-sky-100 text-sky-700 ring-1 ring-sky-200">
              <Barcode size={14} />
            </span>
            <div>
              <h2 id="gelang-print-title" className="text-[13px] font-semibold text-slate-800">
                Cetak Gelang Identitas
              </h2>
              <p className="text-[10.5px] text-slate-500">
                Preview · {PAPER[paper].label} · {patient.name} · {patient.noRM}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Pemilih media */}
            <div className="flex items-center gap-0.5 rounded-lg bg-slate-100 p-0.5 ring-1 ring-slate-200">
              {PAPER_ORDER.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPaper(p)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-[10.5px] font-semibold transition-all",
                    paper === p ? "bg-white text-sky-700 shadow-sm ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-700",
                  )}
                  title={`Media ${PAPER[p].label}`}
                >
                  {PAPER[p].label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setTimeout(() => window.print(), 60)}
              className="inline-flex items-center gap-1.5 rounded-md bg-sky-600 px-3 py-1.5 text-[11.5px] font-semibold text-white shadow-sm transition-all hover:bg-sky-700 active:scale-[0.97]"
              title="Cetak / simpan PDF"
            >
              <Printer size={12} /> Cetak
            </button>
            <button
              type="button" onClick={onClose} aria-label="Tutup"
              className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={14} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto bg-slate-200/60 px-3 py-5">
          <div
            className={cn("print-area mx-auto max-w-full bg-white shadow-sm", cfg.pad)}
            style={{ width: cfg.printW }}
            data-paper={paper}
          >
            <GelangIdentitasSheet patient={patient} paper={paper} />
          </div>
        </div>

        <footer className="no-print border-t border-slate-200 bg-white px-4 py-1.5 text-center text-[10px] text-slate-500">
          Pilih media sesuai printer · pada dialog cetak set Paper size yang sama ({cfg.label}) ·
          <kbd className="ml-1 rounded border border-slate-300 bg-slate-100 px-1 font-mono text-[9.5px]">Esc</kbd> untuk tutup
        </footer>
      </motion.div>
    </>
  );
}

export default function GelangIdentitasModal({ open, onClose, patient }: Props) {
  return (
    <AnimatePresence>
      {open && <ModalBody onClose={onClose} patient={patient} />}
    </AnimatePresence>
  );
}
