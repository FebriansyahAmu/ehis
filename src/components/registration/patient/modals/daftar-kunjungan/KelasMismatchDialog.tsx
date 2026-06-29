"use client";

// Konfirmasi saat KELAS KAMAR ≠ HAK KELAS (BPJS) di admisi Rawat Inap. Dua mode:
//  · TITIPAN — kelas hak penuh → dititipkan ke kamar lain; TAGIHAN tetap ikut hak kelas.
//  · Beda kelas (disengaja) — naik/turun kelas atas permintaan/kebutuhan; tagihan ikut kamar.
// Bukan blokir: petugas memutuskan & lanjut, atau "Perbaiki" untuk ganti kamar.

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ArrowLeftRight, X, Loader2, BedDouble, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { RIKELAS_LABEL } from "./config";

export interface KelasDecision {
  titipan: boolean;
  alasan?: string;
}

export function KelasMismatchDialog({
  open, hakKelas, kamarKelas, busy = false, onConfirm, onCancel,
}: {
  open: boolean;
  hakKelas: string;   // RIKelas hak (BPJS)
  kamarKelas: string; // RIKelas kamar terpilih
  busy?: boolean;
  onConfirm: (d: KelasDecision) => void;
  onCancel: () => void;
}) {
  if (typeof document === "undefined") return null; // SSR guard (portal butuh document.body)
  // Body di-mount hanya saat `open` → state mode/alasan selalu fresh (tanpa reset-effect).
  return createPortal(
    <AnimatePresence>
      {open && (
        <DialogBody hakKelas={hakKelas} kamarKelas={kamarKelas} busy={busy} onConfirm={onConfirm} onCancel={onCancel} />
      )}
    </AnimatePresence>,
    document.body,
  );
}

function DialogBody({
  hakKelas, kamarKelas, busy, onConfirm, onCancel,
}: {
  hakKelas: string;
  kamarKelas: string;
  busy: boolean;
  onConfirm: (d: KelasDecision) => void;
  onCancel: () => void;
}) {
  const reduce = useReducedMotion();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [mode, setMode] = useState<"titipan" | "beda">("titipan");
  const [alasan, setAlasan] = useState("Kelas hak penuh");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !busy) onCancel(); };
    document.addEventListener("keydown", onKey);
    const t = setTimeout(() => cancelRef.current?.focus(), 50);
    return () => { document.removeEventListener("keydown", onKey); clearTimeout(t); };
  }, [busy, onCancel]);

  const card = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, scale: 0.92, y: 16 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.95, y: 8 },
      };

  const confirm = () =>
    onConfirm(mode === "titipan" ? { titipan: true, alasan: alasan.trim() || "Kelas hak penuh" } : { titipan: false });

  return (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }} onClick={() => !busy && onCancel()}
          />
          <motion.div
            role="dialog" aria-modal="true" aria-label="Konfirmasi perbedaan kelas"
            className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-100"
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }} {...card}
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-amber-100 bg-amber-50 px-5 py-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white ring-1 ring-amber-200">
                <ArrowLeftRight size={17} className="text-amber-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-amber-800">Kelas kamar ≠ hak kelas</p>
                <p className="text-[11px] text-amber-500">Konfirmasi penempatan sebelum mendaftarkan</p>
              </div>
              <button
                type="button" onClick={onCancel} disabled={busy} aria-label="Tutup"
                className="rounded-lg p-1 text-amber-300 transition hover:bg-amber-100 hover:text-amber-500 disabled:opacity-40"
              >
                <X size={14} />
              </button>
            </div>

            {/* Perbandingan hak vs kamar */}
            <div className="grid grid-cols-2 gap-2 px-5 pt-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  <ShieldCheck size={11} /> Hak Kelas
                </p>
                <p className="mt-1 text-sm font-bold text-slate-800">{RIKELAS_LABEL[hakKelas] ?? hakKelas}</p>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-emerald-500">
                  <BedDouble size={11} /> Kamar Dipilih
                </p>
                <p className="mt-1 text-sm font-bold text-emerald-700">{RIKELAS_LABEL[kamarKelas] ?? kamarKelas}</p>
              </div>
            </div>

            {/* Mode penempatan */}
            <div className="space-y-2 px-5 py-4">
              <ModeCard
                active={mode === "titipan"} onClick={() => setMode("titipan")}
                title="Titipan (kelas hak penuh)"
                desc={`Pasien dititipkan ke kamar lain karena kelas haknya penuh. Tagihan tetap mengikuti hak (${RIKELAS_LABEL[hakKelas] ?? hakKelas}).`}
              />
              {mode === "titipan" && (
                <div className="pl-1">
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Alasan titipan</label>
                  <textarea
                    value={alasan} onChange={(e) => setAlasan(e.target.value)} rows={2}
                    placeholder="mis. Kelas hak penuh / permintaan ruang isolasi…"
                    className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                  />
                </div>
              )}
              <ModeCard
                active={mode === "beda"} onClick={() => setMode("beda")}
                title="Beda kelas (disengaja)"
                desc={`Naik/turun kelas atas permintaan pasien atau kebutuhan klinis. Tagihan mengikuti kamar (${RIKELAS_LABEL[kamarKelas] ?? kamarKelas}).`}
              />
            </div>

            {/* Aksi */}
            <div className="flex gap-2.5 border-t border-slate-100 px-5 py-4">
              <button
                ref={cancelRef} type="button" onClick={onCancel} disabled={busy}
                className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-[13px] font-semibold text-slate-600 outline-none transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-300 active:scale-95 disabled:opacity-50"
              >
                Perbaiki Kamar
              </button>
              <button
                type="button" onClick={confirm} disabled={busy}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-[13px] font-semibold text-white shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-amber-300 active:scale-95",
                  busy ? "cursor-not-allowed bg-amber-400" : "bg-amber-600 hover:bg-amber-700",
                )}
              >
                {busy ? <Loader2 size={14} className="animate-spin" /> : null}
                {mode === "titipan" ? "Lanjutkan sebagai Titipan" : "Lanjutkan"}
              </button>
            </div>
          </motion.div>
        </div>
  );
}

function ModeCard({ active, onClick, title, desc }: { active: boolean; onClick: () => void; title: string; desc: string }) {
  return (
    <button
      type="button" onClick={onClick}
      className={cn(
        "flex w-full items-start gap-2.5 rounded-xl border p-3 text-left transition",
        active ? "border-amber-400 bg-amber-50 ring-1 ring-amber-200" : "border-slate-200 bg-white hover:border-slate-300",
      )}
    >
      <span className={cn("mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2", active ? "border-amber-500" : "border-slate-300")}>
        {active && <span className="h-2 w-2 rounded-full bg-amber-500" />}
      </span>
      <span className="min-w-0">
        <span className={cn("block text-[12px] font-bold", active ? "text-amber-800" : "text-slate-700")}>{title}</span>
        <span className="mt-0.5 block text-[11px] leading-snug text-slate-500">{desc}</span>
      </span>
    </button>
  );
}
