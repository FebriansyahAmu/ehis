"use client";

// Modal pratinjau payload Rencana Kontrol (JSON) — body wire V-Claim RencanaKontrol/insert|Update
// dari isian form Jadwal Kontrol. Portal + Escape/backdrop tutup + tombol Salin. Pola identik
// SepPayloadModal (registrasi SEP). Nilai turunan (kodeDokter dari mapping DPJP, No. Referensi)
// diselesaikan SERVER saat penerbitan → ini murni PRATINJAU dari isian form.

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { X, Copy, Check, Braces } from "lucide-react";

export default function RencanaKontrolPayloadModal({
  payload, endpoint, onClose,
}: {
  payload: unknown;
  endpoint: string; // "RencanaKontrol/insert" | "RencanaKontrol/Update"
  onClose: () => void;
}) {
  const json = JSON.stringify(payload, null, 2);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard tak tersedia */ }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 8 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5"
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-emerald-300">
              <Braces size={18} />
            </span>
            <div>
              <h2 className="text-[15px] font-bold text-slate-900">Payload Rencana Kontrol</h2>
              <p className="text-[11px] text-slate-400">
                Pratinjau body <span className="font-mono">request</span> — V-Claim <span className="font-mono">{endpoint}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={copy}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-95">
              {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
              {copied ? "Tersalin" : "Salin"}
            </button>
            <button type="button" onClick={onClose} aria-label="Tutup"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:bg-slate-50 hover:text-slate-600">
              <X size={15} />
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-auto bg-slate-950 p-4">
          <pre className="whitespace-pre font-mono text-[11px] leading-relaxed text-emerald-100">{json}</pre>
        </div>
        <div className="border-t border-slate-100 bg-amber-50/60 px-5 py-2.5 text-[10px] leading-relaxed text-amber-700">
          Pratinjau dari isian form. <span className="font-mono">kodeDokter</span> di-resolve server dari mapping DPJP BPJS;
          No. Referensi (<span className="font-mono">noSuratKontrol</span>) diterima dari BPJS saat penerbitan.
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  );
}
