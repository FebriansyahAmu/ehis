"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, X, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import type { KunjunganRecord } from "@/lib/data";
import { type BpjsData, type SepDraft, BLANK_DRAFT, SLIDE_VARIANTS } from "./sepTypes";
import { SEPStepper } from "./SepShared";
import { SEPCardStep1 } from "./BpjsSearch";
import { SepStep2, SepStep3, SepStep4 } from "./SepSteps";

// ─── InlineSEPCard ────────────────────────────────────────────

export function InlineSEPCard({ data, kunjungan, onClose }: {
  data: BpjsData;
  kunjungan: KunjunganRecord;
  onClose: () => void;
}) {
  const [step,      setStep]      = useState(1);
  const [dir,       setDir]       = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [draft,     setDraft]     = useState<SepDraft>(() => {
    const klsMap: Record<string, string> = { "Kelas I": "1", "Kelas II": "2", "Kelas III": "3" };
    return {
      ...BLANK_DRAFT,
      noKartu: data.noKartu, namaPeserta: data.nama,
      klsRawatHak: klsMap[data.kelas] ?? "2", jenisPeserta: data.jenis,
      tglSep: new Date().toISOString().slice(0, 10),
    };
  });

  const goTo = (next: number) => { setDir(next > step ? 1 : -1); setStep(next); };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="bg-sky-400 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15">
            <FileText size={16} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-[14px] font-bold text-white">Penerbitan SEP</p>
            <p className="text-[10px] text-white/70">Surat Eligibilitas Peserta · BPJS Kesehatan</p>
          </div>
          <button type="button" onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-white/80 transition hover:bg-white/20">
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Success state */}
      {submitted ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25 }}
          className="flex flex-col items-center gap-5 px-6 py-14 text-center"
        >
          <motion.div
            initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 280, damping: 18 }}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100"
          >
            <CheckCircle2 size={32} className="text-emerald-600" />
          </motion.div>
          <div>
            <p className="text-[15px] font-bold text-slate-800">SEP Berhasil Diterbitkan</p>
            <p className="mt-1 text-[11px] text-slate-400">
              SEP atas nama <span className="font-bold text-slate-600">{data.nama}</span> telah dikirim ke sistem BPJS Kesehatan
            </p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50">
              Tutup
            </button>
            <button type="button"
              onClick={() => { setSubmitted(false); setStep(1); setDraft({ ...BLANK_DRAFT }); }}
              className="rounded-xl bg-sky-500 px-4 py-2.5 text-[11px] font-bold text-white hover:bg-sky-600">
              Buat SEP Baru
            </button>
          </div>
        </motion.div>
      ) : (
        <>
          {/* Stepper */}
          <div className="border-b border-slate-100 bg-slate-50/80 px-6 py-4">
            <SEPStepper current={step} />
          </div>

          {/* Step content */}
          <div className="overflow-hidden px-6 py-5">
            <AnimatePresence mode="wait" custom={dir}>
              <motion.div
                key={step} custom={dir} variants={SLIDE_VARIANTS}
                initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              >
                {step === 1 && <SEPCardStep1 data={data} draft={draft} setDraft={setDraft} />}
                {step === 2 && <SepStep2 draft={draft} setDraft={setDraft} />}
                {step === 3 && <SepStep3 draft={draft} setDraft={setDraft} />}
                {step === 4 && <SepStep4 draft={draft} />}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation footer */}
          {step < 4 && (
            <div className="flex items-center gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
              {step > 1 ? (
                <button type="button" onClick={() => goTo(step - 1)}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[12px] font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-95">
                  <ChevronLeft size={13} />Kembali
                </button>
              ) : <div />}
              <span className="flex-1 text-center text-[9px] text-slate-400">Langkah {step} dari 4</span>
              <button type="button" onClick={() => goTo(step + 1)}
                className="flex items-center gap-2 rounded-xl bg-sky-500 px-5 py-2.5 text-[12px] font-bold text-white shadow-sm shadow-sky-200/70 transition hover:bg-sky-600 active:scale-95">
                Lanjut<ChevronRight size={13} />
              </button>
            </div>
          )}
          {step === 4 && (
            <div className="flex items-center gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
              <button type="button" onClick={() => goTo(3)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[12px] font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-95">
                <ChevronLeft size={13} />Kembali
              </button>
              <div className="flex-1" />
              <button type="button" onClick={() => setSubmitted(true)}
                className="flex items-center gap-2 rounded-xl bg-sky-500 px-5 py-2.5 text-[12px] font-bold text-white shadow-md shadow-sky-200/80 transition hover:bg-sky-600 active:scale-95">
                <CheckCircle2 size={14} />Kirim SEP ke BPJS
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
