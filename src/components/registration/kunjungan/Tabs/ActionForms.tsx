"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Printer, ChevronLeft, ChevronRight, Check, CheckCircle2,
} from "lucide-react";
import type { KunjunganRecord } from "@/lib/data";
import { SepStep1 } from "./sep/BpjsSearch";
import { SepStep2, SepStep3, SepStep4 } from "./sep/SepSteps";
import { StepIndicator } from "./sep/SepShared";
import { BLANK_DRAFT, SLIDE_VARIANTS, type SepDraft } from "./sep/sepTypes";

export { PenjaminForm }   from "./PenjaminForm";
export { PaketForm }       from "./PaketForm";
export { RujukanForm }    from "./RujukanForm";
export { KecelakaanForm } from "./KecelakaanForm";

// ─── Shared form primitives ───────────────────────────────────

function SectionHead({ title, desc }: { title: string; desc: string }) {
  return (
    <div>
      <p className="text-[13px] font-bold text-slate-800">{title}</p>
      <p className="mt-0.5 text-[11px] text-slate-400">{desc}</p>
    </div>
  );
}

const sm    = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-800 placeholder:text-slate-300 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 transition";
const smSel = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-800 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 transition cursor-pointer";
const lbl    = "self-center text-right text-[10px] font-bold uppercase tracking-wider text-slate-400";
const lblTop = "self-start pt-2 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400";

function FieldGrid({ children, danger }: { children: React.ReactNode; danger?: boolean }) {
  return (
    <div className={cn(
      "grid grid-cols-[100px_1fr] items-center gap-x-3 gap-y-2.5 rounded-xl border p-4",
      danger ? "border-rose-100 bg-rose-50/40" : "border-slate-100 bg-slate-50/60",
    )}>
      {children}
    </div>
  );
}

function SaveBtn({ text, danger }: { text: string; danger?: boolean }) {
  return (
    <div className="flex justify-end">
      <button type="button" className={cn(
        "rounded-lg px-4 py-2 text-[12px] font-bold text-white transition active:scale-95",
        danger ? "bg-rose-600 hover:bg-rose-700" : "bg-sky-600 hover:bg-sky-700",
      )}>{text}</button>
    </div>
  );
}

// PenjaminForm is now a full redesigned component in ./PenjaminForm.tsx
// RujukanForm is now a full redesigned component in ./RujukanForm.tsx

// ─── Update data form ─────────────────────────────────────────

export function UpdateForm({ kunjungan }: { kunjungan: KunjunganRecord }) {
  return (
    <div className="space-y-4">
      <SectionHead title="Update Data Kunjungan" desc="Perbarui informasi dasar kunjungan" />
      <FieldGrid>
        <span className={lbl}>DPJP</span>
        <input className={sm} defaultValue={kunjungan.dokter} />
        <span className={lbl}>Tanggal</span>
        <input type="date" className={sm} defaultValue={kunjungan.tanggal} />
        <span className={lbl}>Cara Masuk</span>
        <select className={smSel} defaultValue={kunjungan.caraMasuk ?? ""}>
          <option value="">Pilih cara masuk...</option>
          <option>Rawat Jalan</option><option>IGD</option>
          <option>Rujukan</option><option>Langsung</option>
        </select>
        <span className={lblTop}>Keluhan</span>
        <textarea className={cn(sm, "min-h-16 resize-none")} defaultValue={kunjungan.keluhan} />
      </FieldGrid>
      <SaveBtn text="Simpan Perubahan" />
    </div>
  );
}

// ─── Update SEP form ──────────────────────────────────────────

export function UpdateSEPForm({ kunjungan }: { kunjungan: KunjunganRecord }) {
  const [step,      setStep]      = useState(1);
  const [dir,       setDir]       = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [draft,     setDraft]     = useState<SepDraft>({ ...BLANK_DRAFT });

  const goTo = (next: number) => { setDir(next > step ? 1 : -1); setStep(next); };

  if (submitted) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4 py-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 size={28} className="text-emerald-600" />
        </div>
        <div>
          <p className="text-[15px] font-bold text-slate-800">SEP Berhasil Dikirim</p>
          <p className="mt-1 text-[11px] text-slate-400">Data SEP telah dikirimkan ke sistem BPJS</p>
        </div>
        <button type="button"
          onClick={() => { setSubmitted(false); setStep(1); setDraft({ ...BLANK_DRAFT }); }}
          className="rounded-lg border border-slate-200 px-4 py-2 text-[11px] font-semibold text-slate-600 hover:bg-slate-50">
          Buat SEP Baru
        </button>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <StepIndicator current={step} />

      <div className="overflow-hidden">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div key={step} custom={dir} variants={SLIDE_VARIANTS}
            initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}>
            {step === 1 && <SepStep1 draft={draft} setDraft={setDraft} onNext={() => goTo(2)} />}
            {step === 2 && <SepStep2 draft={draft} setDraft={setDraft} />}
            {step === 3 && <SepStep3 draft={draft} setDraft={setDraft} />}
            {step === 4 && <SepStep4 draft={draft} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {step > 1 && step < 4 && (
        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <button type="button" onClick={() => goTo(step - 1)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-95">
            <ChevronLeft size={13} />Kembali
          </button>
          <button type="button" onClick={() => goTo(step + 1)}
            className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-1.5 text-[11px] font-bold text-white transition hover:bg-sky-700 active:scale-95">
            Lanjut<ChevronRight size={13} />
          </button>
        </div>
      )}
      {step === 4 && (
        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <button type="button" onClick={() => goTo(3)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-95">
            <ChevronLeft size={13} />Kembali
          </button>
          <button type="button" onClick={() => setSubmitted(true)}
            className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-1.5 text-[11px] font-bold text-white transition hover:bg-sky-700 active:scale-95">
            <Check size={12} />Kirim SEP ke BPJS
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Cetak tab ────────────────────────────────────────────────

function PrintRow({ label, disabled }: { label: string; disabled?: boolean }) {
  return (
    <button type="button" disabled={disabled}
      className={cn(
        "group flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition",
        disabled ? "cursor-not-allowed opacity-40" : "hover:border-slate-300 hover:bg-slate-50",
      )}
    >
      <div className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 transition",
        !disabled && "group-hover:bg-slate-800",
      )}>
        <Printer size={13} className={cn("text-slate-500 transition", !disabled && "group-hover:text-white")} />
      </div>
      <span className="flex-1 text-[12px] font-medium text-slate-700">{label}</span>
    </button>
  );
}

export function CetakTab({ kunjungan }: { kunjungan: KunjunganRecord }) {
  const hasSEP     = !!kunjungan.noSEP;
  const hasRujukan = !!kunjungan.dokumen?.rujukan;
  const isDone     = kunjungan.status === "Selesai";
  return (
    <div className="space-y-4">
      <SectionHead title="Cetak Dokumen" desc="Cetak dokumen terkait kunjungan ini" />
      <div className="space-y-2">
        <PrintRow label="Bukti Pendaftaran" />
        <PrintRow label="Kartu Antrean" />
        <PrintRow label="Gelang Identitas" />
        <PrintRow label="No. SEP / Surat Eligibilitas" disabled={!hasSEP} />
        <PrintRow label="Surat Rujukan"                disabled={!hasRujukan} />
        <PrintRow label="Struk Pembayaran"             disabled={!isDone} />
      </div>
    </div>
  );
}

// ─── Hapus form ───────────────────────────────────────────────

export function HapusForm({ kunjungan }: { kunjungan: KunjunganRecord }) {
  const isActive = kunjungan.status === "Aktif";
  return (
    <div className="space-y-4">
      <SectionHead title="Hapus Kunjungan" desc="Tindakan ini tidak dapat dibatalkan" />
      <p className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-700 ring-1 ring-amber-200">
        Kunjungan hanya dapat dihapus oleh admin. Data terkait (SEP, order, diagnosa) ikut dihapus permanen.
      </p>
      {isActive && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-[11px] font-medium text-rose-700">
          Kunjungan masih berstatus <strong>Aktif</strong>. Batalkan terlebih dahulu sebelum menghapus.
        </div>
      )}
      <FieldGrid danger>
        <span className={lblTop}>Alasan</span>
        <textarea className={cn(sm, "min-h-16 resize-none")}
          placeholder="Jelaskan alasan penghapusan data kunjungan..." />
        <span className={lbl}>Konfirmasi</span>
        <input className={sm} placeholder='Ketik "HAPUS" untuk melanjutkan' />
      </FieldGrid>
      <SaveBtn text="Hapus Kunjungan" danger />
    </div>
  );
}
