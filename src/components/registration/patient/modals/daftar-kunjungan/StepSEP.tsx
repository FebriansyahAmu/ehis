"use client";

import { FileText, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SepDraft } from "@/components/registration/kunjungan/Tabs/sep/sepTypes";
import { SepStep2, SepStep3 } from "@/components/registration/kunjungan/Tabs/sep/SepSteps";

/**
 * Step SEP — penerbitan SEP BPJS. Toggle "Buat & cetak SEP sekarang?":
 *  - ON  → form SEP tampil; SEP diterbitkan bersama pendaftaran (default).
 *  - OFF → SEP ditangguhkan; kunjungan tetap terdaftar, SEP dibuat nanti
 *          (dari detail kunjungan / menu BPJS). Form SEP disembunyikan.
 */
export function StepSEP({
  draft, setDraft, terbitSep, setTerbitSep,
}: {
  draft: SepDraft;
  setDraft: React.Dispatch<React.SetStateAction<SepDraft>>;
  terbitSep: boolean;
  setTerbitSep: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return (
    <div className="space-y-4">
      {/* Toggle penerbitan SEP */}
      <div
        className={cn(
          "flex items-center gap-3 rounded-xl border px-4 py-3 transition",
          terbitSep ? "border-sky-200 bg-sky-50/70" : "border-slate-200 bg-slate-50",
        )}
      >
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
            terbitSep ? "bg-sky-100 text-sky-600" : "bg-slate-200 text-slate-500",
          )}
        >
          {terbitSep ? <FileText size={17} /> : <Clock size={17} />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold text-slate-800">Buat &amp; cetak SEP sekarang?</p>
          <p className="text-[11px] leading-tight text-slate-500">
            {terbitSep
              ? "SEP diterbitkan bersama pendaftaran dan siap dicetak."
              : "SEP ditangguhkan — kunjungan tetap terdaftar, SEP dibuat nanti dari detail kunjungan."}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={terbitSep}
          aria-label="Buat dan cetak SEP sekarang"
          onClick={() => setTerbitSep((v) => !v)}
          className={cn(
            "relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors",
            terbitSep ? "bg-sky-600" : "bg-slate-300",
          )}
        >
          <span
            className={cn(
              "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200",
              terbitSep ? "translate-x-5" : "translate-x-0",
            )}
          />
        </button>
      </div>

      {terbitSep ? (
        <>
          <SepStep2 draft={draft} setDraft={setDraft} />
          <SepStep3 draft={draft} setDraft={setDraft} />
        </>
      ) : (
        <div className="flex items-start gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-5">
          <Clock size={16} className="mt-0.5 shrink-0 text-slate-400" />
          <div className="text-[12px] leading-relaxed text-slate-500">
            <p className="font-semibold text-slate-600">SEP akan dibuat nanti.</p>
            <p>
              Pendaftaran kunjungan tetap diproses tanpa menerbitkan SEP. Terbitkan SEP kapan saja
              dari <span className="font-medium text-slate-600">detail kunjungan</span> atau menu{" "}
              <span className="font-medium text-slate-600">BPJS</span> saat data sudah lengkap.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
