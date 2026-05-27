"use client";

/**
 * IDRGCalculatorPage — EK4 iDRG Calculator Standalone.
 *
 * Layout (no page scroll · banner sticky):
 *   ┌──────────────────────────────────────────────┐
 *   │ Header: title + Mode Toggle + Reset          │ ~56px
 *   ├─────────────────────┬────────────────────────┤
 *   │ CalculatorInputPanel│ CalculatorParamsPanel  │
 *   │ (ICD pickers)       │ (params + Hitung)      │
 *   │                     ├────────────────────────┤
 *   │                     │ CalculatorResultCard   │
 *   │                     │ (AnimatePresence)      │
 *   └─────────────────────┴────────────────────────┘
 *
 * Referensi: TODO-EKLAIM.md § EK4 · groupingResolver.ts.
 */

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Calculator, RotateCcw, Sparkles } from "lucide-react";

import { useSkeletonDelay } from "@/components/master/shared";
import { resolveGrouping, resolveComparator } from "@/lib/eklaim/groupingResolver";
import type { ClaimGrouperContext } from "@/lib/eklaim/groupingResolver";
import type { ClaimError } from "@/lib/eklaim/eklaimShared";
import { cn } from "@/lib/utils";

import {
  INITIAL_FORM,
  MODE_CFG,
  canCalculate,
  isIDRGResult,
  type CalcResult,
  type CalcStatus,
  type CalculatorFormState,
  type CalculatorMode,
} from "./calculatorShared";
import CalculatorInputPanel from "./CalculatorInputPanel";
import CalculatorParamsPanel from "./CalculatorParamsPanel";
import CalculatorResultCard from "./CalculatorResultCard";

// ── Mode accent tokens ─────────────────────────────────

const ACCENT: Record<CalculatorMode, { active: string; inactive: string }> = {
  idrg:     { active: "bg-teal-600 text-white shadow-sm",    inactive: "text-teal-700 hover:bg-teal-50/80" },
  "ina-cbg":{ active: "bg-amber-500 text-white shadow-sm",   inactive: "text-amber-700 hover:bg-amber-50/80" },
  compare:  { active: "bg-sky-600 text-white shadow-sm",     inactive: "text-sky-700 hover:bg-sky-50/80" },
};

// ── Helpers ────────────────────────────────────────────

function parseTarifRS(s: string): bigint | undefined {
  const clean = s.replace(/[^0-9]/g, "");
  return clean ? BigInt(clean) : undefined;
}

function claimErrorMsg(e: ClaimError): string {
  if ("message" in e) return (e as { message: string }).message;
  if (e.type === "EligibilityError") return `Eligibility: ${e.reason}`;
  if (e.type === "DuplicateClaimError") return `Duplikat klaim: ${e.existingClaimId}`;
  return `Konflik versi (v${e.currentVersion})`;
}

// ── Page ───────────────────────────────────────────────

export default function IDRGCalculatorPage() {
  const ready = useSkeletonDelay(300);
  const [form, setForm] = useState<CalculatorFormState>(INITIAL_FORM);
  const [calcStatus, setCalcStatus] = useState<CalcStatus>("idle");
  const [result, setResult] = useState<CalcResult | null>(null);

  // ── Mode switch (reset result) ─────────────────────
  const setMode = (mode: CalculatorMode) => {
    setForm((f) => ({ ...f, mode }));
    setResult(null);
    setCalcStatus("idle");
  };

  // ── Reset all ─────────────────────────────────────
  const handleReset = () => {
    setForm(INITIAL_FORM);
    setResult(null);
    setCalcStatus("idle");
  };

  // ── Calculate ─────────────────────────────────────
  const handleCalculate = async () => {
    const check = canCalculate(form);
    if (!check.ok || !form.diagnosaPrimer) return;

    setCalcStatus("loading");
    const t0 = Date.now();
    const modeCfg = MODE_CFG.find((m) => m.key === form.mode)!;

    const ctx: ClaimGrouperContext = {
      eraGrouper: modeCfg.era,
      diagnosaPrimer: form.diagnosaPrimer,
      diagnosaSekunder: form.diagnosaSekunder.map((e) => e.icd),
      tindakanProsedur: form.tindakanProsedur,
      tipePelayanan: form.tipePelayanan,
      kelas: form.mode === "ina-cbg" ? form.kelasLegacy : "KRIS",
      isKRIS: form.mode !== "ina-cbg",
      tingkatKompetensiRS: form.tingkatKompetensiRS,
      los: form.los,
      age: form.age,
      gender: form.gender,
      caraPulang: form.caraPulang,
    };

    try {
      let res: CalcResult;

      if (form.mode === "compare") {
        const r = await resolveComparator(ctx);
        if (!r.ok) {
          res = { errorMsg: claimErrorMsg(r.error), elapsedMs: Date.now() - t0 };
        } else {
          const { primary, secondary, secondaryError } = r.value;
          res = {
            idrg:        isIDRGResult(primary) ? primary : undefined,
            inaCbg:      secondary && !isIDRGResult(secondary) ? secondary : undefined,
            inaCbgError: secondaryError ? "INA-CBG estimasi gagal — data tidak tersedia" : undefined,
            elapsedMs:   Date.now() - t0,
            tarifRS:     parseTarifRS(form.tarifRSInput),
          };
        }
      } else {
        const r = await resolveGrouping(ctx);
        if (!r.ok) {
          res = { errorMsg: claimErrorMsg(r.error), elapsedMs: Date.now() - t0 };
        } else if (isIDRGResult(r.value)) {
          res = { idrg: r.value, elapsedMs: Date.now() - t0, tarifRS: parseTarifRS(form.tarifRSInput) };
        } else {
          res = { inaCbg: r.value, elapsedMs: Date.now() - t0, tarifRS: parseTarifRS(form.tarifRSInput) };
        }
      }

      setResult(res);
      setCalcStatus(res.errorMsg ? "error" : "done");
    } catch (err) {
      setResult({ errorMsg: err instanceof Error ? err.message : String(err), elapsedMs: Date.now() - t0 });
      setCalcStatus("error");
    }
  };

  if (!ready) return <SkeletonShell />;

  const activeCfg = MODE_CFG.find((m) => m.key === form.mode)!;
  const showResult = calcStatus === "loading" || calcStatus === "done" || calcStatus === "error";

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-50/60">

      {/* ── Header ──────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="relative shrink-0 overflow-hidden border-b border-slate-200 bg-linear-to-br from-white via-teal-50/30 to-sky-50/20 px-4 py-2.5 sm:px-6"
      >
        {/* Animated accent bar */}
        <motion.div
          aria-hidden
          className="absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-teal-400 via-sky-400 to-emerald-400 bg-size-[200%_100%]"
          animate={{ backgroundPosition: ["0% 50%", "100% 50%"] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Title */}
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-linear-to-br from-teal-500 to-sky-600 shadow-sm ring-1 ring-teal-400/30">
              <Calculator size={15} strokeWidth={2.3} className="text-white" />
            </span>
            <div>
              <h1 className="text-[14.5px] font-extrabold leading-tight tracking-tight text-slate-900">
                iDRG Calculator
              </h1>
              <p className="text-[11px] text-slate-500">
                Pedoman Pengodean iDRG 2025 · Perpres 59/2024
              </p>
            </div>
          </div>

          {/* Mode toggle */}
          <div className="flex items-center gap-1 rounded-xl bg-slate-100/80 p-1 ring-1 ring-slate-200/60">
            {MODE_CFG.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => setMode(m.key)}
                className={cn(
                  "rounded-lg px-3 py-1 text-[12px] font-semibold transition-all duration-150",
                  form.mode === m.key ? ACCENT[m.key].active : ACCENT[m.key].inactive,
                )}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Reset */}
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/30"
          >
            <RotateCcw size={11} strokeWidth={2.2} />
            Reset
          </button>
        </div>

        {/* Mode info bar */}
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <span className="text-[11.5px] text-slate-500">{activeCfg.desc}</span>
          {activeCfg.caveat && (
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-1.5 py-0.5 text-[10.5px] font-bold text-amber-700 ring-1 ring-amber-200">
              <Sparkles size={9} strokeWidth={2.5} />
              {activeCfg.caveat}
            </span>
          )}
        </div>
      </motion.div>

      {/* ── 2-col content ──────────────────────────── */}
      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[5fr_7fr]">

        {/* Left: ICD Input */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.05 }}
          className="min-h-0 overflow-hidden border-b border-slate-200 lg:border-b-0 lg:border-r"
        >
          <CalculatorInputPanel
            form={form}
            setForm={setForm}
            calcStatus={calcStatus}
          />
        </motion.div>

        {/* Right: Params + Result */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="flex min-h-0 flex-col overflow-hidden"
        >
          {/* Params form */}
          <div className="shrink-0">
            <CalculatorParamsPanel
              form={form}
              setForm={setForm}
              calcStatus={calcStatus}
              onCalculate={handleCalculate}
            />
          </div>

          {/* Result (AnimatePresence) */}
          <AnimatePresence mode="wait">
            {showResult && (
              <motion.div
                key={`result-${form.mode}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="min-h-0 flex-1 overflow-y-auto border-t border-slate-200 bg-slate-50/40"
              >
                <CalculatorResultCard
                  status={calcStatus}
                  result={result}
                  form={form}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

// ── Skeleton ───────────────────────────────────────────

function SkeletonShell() {
  return (
    <div className="flex h-full animate-pulse flex-col">
      <div className="border-b border-slate-200 bg-white px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-teal-200" />
            <div className="space-y-1">
              <div className="h-4 w-32 rounded bg-slate-200" />
              <div className="h-3 w-48 rounded bg-slate-100" />
            </div>
          </div>
          <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
            {[1, 2, 3].map((i) => <div key={i} className="h-7 w-24 rounded-lg bg-slate-200" />)}
          </div>
          <div className="h-7 w-16 rounded-lg bg-slate-100" />
        </div>
      </div>
      <div className="grid flex-1 grid-cols-[5fr_7fr]">
        <div className="border-r border-slate-200 space-y-4 p-5">
          {[80, 120, 100].map((h, i) => (
            <div key={i} className={`h-${h === 80 ? "20" : h === 120 ? "28" : "24"} rounded-xl bg-slate-100`} />
          ))}
        </div>
        <div className="space-y-3 p-5">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-14 rounded-xl bg-slate-100" />)}
        </div>
      </div>
    </div>
  );
}
