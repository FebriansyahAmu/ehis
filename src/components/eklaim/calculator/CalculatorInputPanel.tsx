"use client";

/**
 * CalculatorInputPanel — Left panel: ICD-10-IM + ICD-9-CM-IM pickers (EK4.1).
 *
 * Sections (internal scroll independent):
 *   1. Diagnosa Primer (required · single ICD-10-IM)
 *   2. Diagnosa Sekunder (optional · max 10 · toggle hospitalAcquired)
 *   3. Tindakan / Prosedur (optional · ICD-9-CM-IM)
 */

import { Stethoscope, PlusCircle, Activity, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { KodeICD10IM, KodeICD9CMIM } from "@/lib/eklaim/eklaimShared";

import ICDPicker from "../detail/tabs/coding/ICDPicker";
import ICDSelectedList from "../detail/tabs/coding/ICDSelectedList";
import type { DiagnosaSekunderEntry } from "../detail/tabs/coding/codingShared";
import type { CalcStatus, CalculatorFormState } from "./calculatorShared";

interface Props {
  form: CalculatorFormState;
  setForm: React.Dispatch<React.SetStateAction<CalculatorFormState>>;
  calcStatus: CalcStatus;
}

// ── Label styles ────────────────────────────────────────

const SECTION_LABEL = "flex items-center gap-2 px-4 py-2 text-[11.5px] font-bold uppercase tracking-widest border-b border-slate-100";
const COUNT_BADGE = "ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10.5px] font-extrabold tabular-nums";

// ── Primer picked chip ──────────────────────────────────

function PrimerChip({
  icd,
  onRemove,
  disabled,
}: {
  icd: KodeICD10IM;
  onRemove: () => void;
  disabled: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ duration: 0.15 }}
      className="flex items-start gap-2 rounded-xl border border-teal-200 bg-linear-to-br from-teal-50 to-emerald-50/60 p-3 shadow-sm ring-1 ring-teal-100"
    >
      <div className="flex-1 min-w-0">
        <p className="font-mono text-[13px] font-bold text-teal-800">{icd.kode}</p>
        <p className="mt-0.5 text-[12.5px] font-medium leading-snug text-slate-700 line-clamp-2">{icd.deskripsi}</p>
        <div className="mt-1.5 flex flex-wrap gap-1">
          <span className="rounded-md bg-teal-100 px-1.5 py-0.5 text-[10.5px] font-bold text-teal-700">
            {icd.kategori}
          </span>
          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10.5px] text-slate-600">
            {icd.versiIM}
          </span>
          {icd.hospitalAcquired && (
            <span className="rounded-md bg-rose-100 px-1.5 py-0.5 text-[10.5px] font-bold text-rose-700">
              HAC · CC/MCC
            </span>
          )}
        </div>
      </div>
      {!disabled && (
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 rounded-md p-0.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
          title="Hapus diagnosa primer"
        >
          <ChevronRight size={14} className="rotate-180" />
        </button>
      )}
    </motion.div>
  );
}

// ── Main ────────────────────────────────────────────────

export default function CalculatorInputPanel({ form, setForm, calcStatus }: Props) {
  const disabled = calcStatus === "loading";

  // Primer handlers
  const handlePrimerSelect = (entry: KodeICD10IM | KodeICD9CMIM) => {
    if ("versiIM" in entry && entry.versiIM.startsWith("ICD-10")) {
      setForm((f) => ({ ...f, diagnosaPrimer: entry as KodeICD10IM }));
    }
  };
  const handlePrimerRemove = () => setForm((f) => ({ ...f, diagnosaPrimer: null }));

  // Sekunder handlers
  const handleSekunderSelect = (entry: KodeICD10IM | KodeICD9CMIM) => {
    const icd = entry as KodeICD10IM;
    if (form.diagnosaSekunder.length >= 10) return;
    if (form.diagnosaSekunder.some((e) => e.icd.kode === icd.kode)) return;
    setForm((f) => ({
      ...f,
      diagnosaSekunder: [...f.diagnosaSekunder, { icd, hospitalAcquired: icd.hospitalAcquired ?? false }],
    }));
  };
  const handleSekunderRemove = (kode: string) =>
    setForm((f) => ({ ...f, diagnosaSekunder: f.diagnosaSekunder.filter((e) => e.icd.kode !== kode) }));
  const handleToggleHA = (kode: string) =>
    setForm((f) => ({
      ...f,
      diagnosaSekunder: f.diagnosaSekunder.map((e) =>
        e.icd.kode === kode ? { ...e, hospitalAcquired: !e.hospitalAcquired } : e,
      ),
    }));

  // Tindakan handlers
  const handleTindakanSelect = (entry: KodeICD10IM | KodeICD9CMIM) => {
    const icd = entry as KodeICD9CMIM;
    if (form.tindakanProsedur.some((e) => e.kode === icd.kode)) return;
    setForm((f) => ({ ...f, tindakanProsedur: [...f.tindakanProsedur, icd] }));
  };
  const handleTindakanRemove = (kode: string) =>
    setForm((f) => ({ ...f, tindakanProsedur: f.tindakanProsedur.filter((e) => e.kode !== kode) }));

  const primerKodes = form.diagnosaPrimer ? [form.diagnosaPrimer.kode] : [];
  const sekunderKodes = form.diagnosaSekunder.map((e) => e.icd.kode);
  const tindakanKodes = form.tindakanProsedur.map((e) => e.kode);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      {/* Panel header */}
      <div className="shrink-0 border-b border-slate-200 bg-linear-to-r from-teal-50/60 to-white px-4 py-2">
        <div className="flex items-center gap-2">
          <Stethoscope size={14} strokeWidth={2.4} className="text-teal-600" />
          <span className="text-[12.5px] font-bold text-slate-800">Input Koding</span>
          <span className="ml-auto text-[11px] text-slate-400">ICD-10-IM · ICD-9-CM-IM</span>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="min-h-0 flex-1 overflow-y-auto">

        {/* ── Section 1: Diagnosa Primer ── */}
        <div className={cn(SECTION_LABEL, "bg-teal-50/40 text-teal-700 sticky top-0 z-10")}>
          <span className="inline-flex h-4.5 w-4.5 items-center justify-center rounded-full bg-teal-500 text-[9px] font-black text-white">
            1
          </span>
          Diagnosa Primer
          <span className="ml-1 text-[10px] font-normal normal-case text-teal-500">
            ICD-10-IM · Wajib
          </span>
          <span className={cn(COUNT_BADGE, form.diagnosaPrimer ? "bg-teal-600 text-white" : "bg-slate-200 text-slate-500")}>
            {form.diagnosaPrimer ? "✓" : "0"}
          </span>
        </div>

        <div className="space-y-2.5 p-4">
          {!form.diagnosaPrimer && (
            <ICDPicker
              variant="icd10"
              placeholder="Cari kode / deskripsi ICD-10-IM..."
              selectedKodes={primerKodes}
              onSelect={handlePrimerSelect}
              disabled={disabled}
            />
          )}
          <AnimatePresence>
            {form.diagnosaPrimer && (
              <PrimerChip
                icd={form.diagnosaPrimer}
                onRemove={handlePrimerRemove}
                disabled={disabled}
              />
            )}
          </AnimatePresence>
          {!form.diagnosaPrimer && (
            <p className="text-[11.5px] text-slate-400 italic">
              Diagnosa primer wajib untuk memulai perhitungan iDRG
            </p>
          )}
        </div>

        {/* ── Section 2: Diagnosa Sekunder ── */}
        <div className={cn(SECTION_LABEL, "bg-sky-50/40 text-sky-700 sticky top-0 z-10")}>
          <span className="inline-flex h-4.5 w-4.5 items-center justify-center rounded-full bg-sky-500 text-[9px] font-black text-white">
            2
          </span>
          Diagnosa Sekunder
          <span className="ml-1 text-[10px] font-normal normal-case text-sky-500">
            ICD-10-IM · max 10
          </span>
          <span className={cn(COUNT_BADGE, form.diagnosaSekunder.length > 0 ? "bg-sky-600 text-white" : "bg-slate-200 text-slate-500")}>
            {form.diagnosaSekunder.length}
          </span>
        </div>

        <div className="space-y-2.5 p-4">
          {form.diagnosaSekunder.length < 10 && (
            <ICDPicker
              variant="icd10"
              placeholder="Tambah diagnosa sekunder / komorbid..."
              selectedKodes={[...primerKodes, ...sekunderKodes]}
              onSelect={handleSekunderSelect}
              disabled={disabled}
            />
          )}
          {form.diagnosaSekunder.length === 0 ? (
            <p className="text-[11.5px] text-slate-400 italic">
              CC/MCC meningkatkan akurasi severity iDRG (ICS v1)
            </p>
          ) : (
            <ICDSelectedList
              variant="sekunder"
              entries={form.diagnosaSekunder}
              onRemove={handleSekunderRemove}
              onToggleHA={handleToggleHA}
              disabled={disabled}
            />
          )}
        </div>

        {/* ── Section 3: Tindakan/Prosedur ── */}
        <div className={cn(SECTION_LABEL, "bg-emerald-50/40 text-emerald-700 sticky top-0 z-10")}>
          <Activity size={11} strokeWidth={2.5} />
          Tindakan / Prosedur
          <span className="ml-1 text-[10px] font-normal normal-case text-emerald-500">
            ICD-9-CM-IM · Opsional
          </span>
          <span className={cn(COUNT_BADGE, form.tindakanProsedur.length > 0 ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-500")}>
            {form.tindakanProsedur.length}
          </span>
        </div>

        <div className="space-y-2.5 p-4 pb-6">
          <ICDPicker
            variant="icd9"
            placeholder="Cari kode tindakan / prosedur ICD-9-CM-IM..."
            selectedKodes={tindakanKodes}
            onSelect={handleTindakanSelect}
            disabled={disabled}
          />
          {form.tindakanProsedur.length === 0 ? (
            <p className="text-[11.5px] text-slate-400 italic">
              Kode prosedur dibutuhkan untuk grup iDRG bedah / ICU
            </p>
          ) : (
            <ICDSelectedList
              variant="tindakan"
              entries={form.tindakanProsedur}
              onRemove={handleTindakanRemove}
              disabled={disabled}
            />
          )}
        </div>

      </div>

      {/* Footer hint */}
      <div className="shrink-0 border-t border-slate-100 bg-slate-50 px-4 py-1.5">
        <div className="flex items-center gap-1.5 text-[10.5px] text-slate-400">
          <PlusCircle size={9} strokeWidth={2} />
          <span>Sumber: Pedoman Pengodean iDRG 2025 Kemenkes · ICS v1</span>
        </div>
      </div>
    </div>
  );
}
