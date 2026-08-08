"use client";

// Bukti Pendaftaran — modal preview + cetak (A4). Overlay + toolbar (Cetak · tutup) + preview
// A4 interaktif. Infra print global globals.css: `.print-area` (isolasi saat print) +
// `.no-print` (toolbar di-hide). Pola identik SuratKontrolCetakModal. Accent sky (selaras
// kartu "Bukti Pendaftaran" di Tab Cetak Dokumen).

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Printer, FileText } from "lucide-react";
import type { KunjunganRecord, PatientMaster } from "@/lib/data";
import BuktiPendaftaranSheet from "./BuktiPendaftaranSheet";

interface Props {
  open: boolean;
  onClose: () => void;
  kunjungan: KunjunganRecord;
  patient: PatientMaster;
}

function ModalBody({ onClose, kunjungan, patient }: Omit<Props, "open">) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [onClose]);

  return (
    <>
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
        role="dialog"
        aria-modal="true"
        aria-labelledby="bukti-daftar-print-title"
      >
        {/* Toolbar */}
        <header className="no-print flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-sky-100 text-sky-700 ring-1 ring-sky-200">
              <FileText size={14} />
            </span>
            <div>
              <h2 id="bukti-daftar-print-title" className="text-[13px] font-semibold text-slate-800">
                Cetak Bukti Pendaftaran
              </h2>
              <p className="text-[10.5px] text-slate-500">
                Preview · A4 · {patient.name} · {patient.noRM}
                <span className="ml-1 inline-flex items-center rounded bg-sky-50 px-1 py-0.5 font-mono text-[9px] font-semibold text-sky-700 ring-1 ring-sky-200">
                  {kunjungan.noPendaftaran || kunjungan.noKunjungan}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTimeout(() => window.print(), 60)}
              className="inline-flex items-center gap-1.5 rounded-md bg-sky-600 px-3 py-1.5 text-[11.5px] font-semibold text-white shadow-sm transition-all hover:bg-sky-700 active:scale-[0.97]"
              title="Cetak / simpan PDF"
            >
              <Printer size={12} />
              Cetak
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup"
              className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={14} />
            </button>
          </div>
        </header>

        {/* Preview area */}
        <div className="flex-1 overflow-auto bg-slate-200/60 px-3 py-5">
          <div className="print-area mx-auto w-[794px] max-w-full bg-white shadow-sm" data-paper="A4">
            <BuktiPendaftaranSheet kunjungan={kunjungan} patient={patient} />
          </div>
        </div>

        {/* Footer hint */}
        <footer className="no-print border-t border-slate-200 bg-white px-4 py-1.5 text-center text-[10px] text-slate-500">
          Tip: pada dialog cetak pilih &ldquo;Save as PDF&rdquo; untuk arsip digital ·
          <kbd className="ml-1 rounded border border-slate-300 bg-slate-100 px-1 font-mono text-[9.5px]">Esc</kbd> untuk tutup
        </footer>
      </motion.div>
    </>
  );
}

export default function BuktiPendaftaranModal({ open, onClose, kunjungan, patient }: Props) {
  return (
    <AnimatePresence>
      {open && <ModalBody onClose={onClose} kunjungan={kunjungan} patient={patient} />}
    </AnimatePresence>
  );
}
