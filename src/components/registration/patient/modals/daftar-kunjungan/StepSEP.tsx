"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, FileCheck2, Clock, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SepDraft } from "@/components/registration/kunjungan/Tabs/sep/sepTypes";
import { SepFormBody } from "./sep/SepFormBody";

const KLS: Record<string, string> = { "1": "Kelas I", "2": "Kelas II", "3": "Kelas III" };
const JENIS: Record<string, string> = { PBI: "PBI", "Non PBI": "Non-PBI", "Non-PBI": "Non-PBI" };

/**
 * Step SEP (SaaS) — penerbitan SEP BPJS. Mode penerbitan pakai CHECKLIST (bukan toggle):
 *  ☑ "Terbitkan & cetak SEP sekarang" → form SEP tampil; SEP terbit bersama pendaftaran.
 *  ☐ tak dicentang → SEP ditangguhkan; kunjungan tetap terdaftar, SEP dibuat nanti.
 */
export function StepSEP({
  patientId, draft, setDraft, terbitSep, setTerbitSep,
}: {
  patientId: string;
  draft: SepDraft;
  setDraft: React.Dispatch<React.SetStateAction<SepDraft>>;
  terbitSep: boolean;
  setTerbitSep: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const kls = KLS[draft.klsRawatHak] ?? "—";
  const jenis = JENIS[draft.jenisPeserta] ?? draft.jenisPeserta;

  return (
    <div className="space-y-3">
      {/* ── Peserta hero (soft sky) ── */}
      <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600 ring-1 ring-sky-200">
            <ShieldCheck size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="truncate text-[15px] font-bold leading-tight text-slate-800">{draft.namaPeserta || "Peserta BPJS"}</p>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700 ring-1 ring-emerald-200">
                <Check size={9} /> Terverifikasi
              </span>
            </div>
            <p className="mt-0.5 font-mono text-[11px] tracking-wider text-sky-600">{draft.noKartu || "—"}</p>
          </div>
          <div className="shrink-0 space-y-1 text-right">
            <div>
              <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400">Hak Kelas</p>
              <p className="text-[13px] font-bold leading-none text-slate-800">{kls}</p>
            </div>
            {jenis && (
              <span className="inline-block rounded-md bg-sky-100 px-1.5 py-0.5 text-[9px] font-bold text-sky-700">{jenis}</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Mode penerbitan (checklist) ── */}
      <button
        type="button"
        role="checkbox"
        aria-checked={terbitSep}
        aria-label="Terbitkan dan cetak SEP sekarang"
        onClick={() => setTerbitSep((v) => !v)}
        className={cn(
          "flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition active:scale-[0.99]",
          terbitSep ? "border-sky-300 bg-sky-50 ring-1 ring-sky-100" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60",
        )}
      >
        <span
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition",
            terbitSep ? "border-sky-500 bg-sky-500" : "border-slate-300 bg-white",
          )}
        >
          <Check size={15} className={cn("text-white transition", terbitSep ? "scale-100" : "scale-0")} />
        </span>
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition",
            terbitSep ? "bg-sky-100 text-sky-600" : "bg-slate-100 text-slate-400",
          )}
        >
          {terbitSep ? <FileCheck2 size={18} /> : <Clock size={18} />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold text-slate-800">Terbitkan &amp; cetak SEP sekarang</p>
          <p className="text-[11px] leading-tight text-slate-500">
            {terbitSep
              ? "SEP diterbitkan bersama pendaftaran dan siap dicetak."
              : "SEP ditangguhkan — kunjungan tetap terdaftar, SEP dibuat nanti."}
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold",
            terbitSep ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500",
          )}
        >
          {terbitSep ? "Aktif" : "Nanti"}
        </span>
      </button>

      {/* ── Form SEP / catatan tangguh ── */}
      <AnimatePresence mode="wait" initial={false}>
        {terbitSep ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <SepFormBody patientId={patientId} draft={draft} setDraft={setDraft} />
          </motion.div>
        ) : (
          <motion.div
            key="defer"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-start gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-5"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
              <Clock size={17} />
            </span>
            <div className="text-[12px] leading-relaxed text-slate-500">
              <p className="font-semibold text-slate-600">SEP akan dibuat nanti.</p>
              <p>
                Pendaftaran kunjungan tetap diproses tanpa menerbitkan SEP. Terbitkan SEP kapan saja dari{" "}
                <span className="font-medium text-slate-600">detail kunjungan</span> atau menu{" "}
                <span className="font-medium text-slate-600">BPJS</span> saat data sudah lengkap.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
