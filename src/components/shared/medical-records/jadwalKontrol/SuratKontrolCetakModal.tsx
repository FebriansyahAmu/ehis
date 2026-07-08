"use client";

// Surat Kontrol Cetak Modal — SHARED (Rawat Inap · Rawat Jalan). Overlay + toolbar (picker jadwal
// bila >1 · Cetak · tutup) + preview A4 interaktif. Pakai infra print global globals.css:
// `.print-area` (isolasi saat print) + `.no-print` (toolbar di-hide). Pola identik ResepCetakModal.
// State pilihan jadwal hidup di ModalBody (mount saat open) → reset alami tiap buka.

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Printer, CalendarCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import SuratKontrolCetakTemplate, { type SuratKontrolCetakData } from "./SuratKontrolCetakTemplate";

interface Props {
  open: boolean;
  onClose: () => void;
  /** 1 surat per jadwal kontrol — urut terbaru dulu. */
  list: SuratKontrolCetakData[];
}

function fmtTglPendek(ymd: string): string {
  const d = new Date(`${ymd}T00:00:00`);
  if (Number.isNaN(d.getTime())) return ymd;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function ModalBody({ onClose, list }: { onClose: () => void; list: SuratKontrolCetakData[] }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [onClose]);

  const active = list[Math.min(idx, list.length - 1)];

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
        aria-labelledby="surat-kontrol-print-title"
      >
        {/* Toolbar */}
        <header className="no-print flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200">
              <Printer size={14} />
            </span>
            <div>
              <h2 id="surat-kontrol-print-title" className="text-[13px] font-semibold text-slate-800">
                Cetak Surat Kontrol
              </h2>
              <p className="text-[10.5px] text-slate-500">
                Preview · A4 · {active.pasien.nama} · {active.pasien.noRM}
                {active.jadwal.noReferensi && (
                  <span className="ml-1 inline-flex items-center rounded bg-emerald-50 px-1 py-0.5 font-mono text-[9px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                    Ref {active.jadwal.noReferensi}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTimeout(() => window.print(), 60)}
              className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-[11.5px] font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-[0.97]"
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

        {/* Picker jadwal — hanya bila lebih dari 1 surat */}
        {list.length > 1 && (
          <div className="no-print flex flex-wrap items-center gap-1.5 border-b border-slate-200 bg-white px-4 py-2">
            <span className="mr-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Pilih Jadwal
            </span>
            {list.map((d, i) => (
              <button
                key={`${d.jadwal.nomor || d.jadwal.tanggal}-${i}`}
                type="button"
                onClick={() => setIdx(i)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10.5px] font-medium transition-all",
                  i === idx
                    ? "border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm"
                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700",
                )}
              >
                <CalendarCheck size={11} className={i === idx ? "text-emerald-600" : "text-slate-400"} />
                <span className="font-mono font-semibold">{d.jadwal.nomor || fmtTglPendek(d.jadwal.tanggal)}</span>
                <span className={i === idx ? "text-emerald-600/80" : "text-slate-400"}>
                  {fmtTglPendek(d.jadwal.tanggal)} · {d.jadwal.poliNama}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Preview area */}
        <div className="flex-1 overflow-auto bg-slate-200/60 px-3 py-5">
          <div className="print-area mx-auto w-[794px] max-w-full bg-white shadow-sm" data-paper="A4">
            <SuratKontrolCetakTemplate data={active} />
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

export default function SuratKontrolCetakModal({ open, onClose, list }: Props) {
  return (
    <AnimatePresence>
      {open && list.length > 0 && <ModalBody onClose={onClose} list={list} />}
    </AnimatePresence>
  );
}
