"use client";

/**
 * ReGroupWidget — tombol Re-Group iDRG + INA-CBG Legacy, loading state, result card.
 * Calls resolveGrouping() dengan context dari CodingState + ClaimRecord.
 */

import { useState } from "react";
import { Loader2, RotateCcw, Zap, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { resolveGrouping } from "@/lib/eklaim/groupingResolver";
import type { ClaimGrouperContext } from "@/lib/eklaim/groupingResolver";
import type {
  iDRGResult,
  InaCbgLegacyResult,
  EraGrouper,
} from "@/lib/eklaim/eklaimShared";
import { formatRupiah } from "@/lib/eklaim/money";
import type { CodingState } from "./codingShared";
import type { ClaimRecord } from "@/lib/eklaim/eklaimShared";

// ── Types ──────────────────────────────────────────────

interface GrouperState {
  iDRGResult?: iDRGResult;
  inaCbgResult?: InaCbgLegacyResult;
  loadingEra?: EraGrouper;
  errorEra?: EraGrouper;
  errorMsg?: string;
}

interface Props {
  codingState: CodingState;
  claim: ClaimRecord;
  disabled?: boolean;
}

// ── Component ──────────────────────────────────────────

export default function ReGroupWidget({ codingState, claim, disabled }: Props) {
  const [state, setState] = useState<GrouperState>({});

  const canReGroup = !!codingState.diagnosaPrimer && !disabled;

  const buildCtx = (era: EraGrouper): ClaimGrouperContext => ({
    eraGrouper: era,
    diagnosaPrimer: codingState.diagnosaPrimer!,
    diagnosaSekunder: codingState.diagnosaSekunder.map((e) => ({
      ...e.icd,
      hospitalAcquired: e.hospitalAcquired,
    })),
    tindakanProsedur: [...codingState.tindakanProsedur],
    tipePelayanan: claim.tipePelayanan,
    kelas: claim.kelas,
    isKRIS: claim.isKRIS,
    tingkatKompetensiRS: claim.tingkatKompetensiRS,
    los: claim.los,
    age: claim.age,
    gender: claim.gender,
    caraPulang: claim.caraPulang,
  });

  const handleReGroup = async (era: EraGrouper) => {
    if (!canReGroup) return;
    setState((prev) => ({
      ...prev,
      loadingEra: era,
      errorEra: undefined,
      errorMsg: undefined,
    }));

    const result = await resolveGrouping(buildCtx(era));

    if (result.ok) {
      setState((prev) => ({
        ...prev,
        loadingEra: undefined,
        iDRGResult: era === "iDRG" ? (result.value as iDRGResult) : prev.iDRGResult,
        inaCbgResult:
          era === "INA_CBG_Legacy"
            ? (result.value as InaCbgLegacyResult)
            : prev.inaCbgResult,
      }));
    } else {
      const msg =
        result.error.type === "GrouperError"
          ? result.error.message
          : result.error.type === "NetworkError"
            ? result.error.message
            : "Grouper error — coba lagi";
      setState((prev) => ({
        ...prev,
        loadingEra: undefined,
        errorEra: era,
        errorMsg: msg,
      }));
    }
  };

  const isLoadingIDRG = state.loadingEra === "iDRG";
  const isLoadingLegacy = state.loadingEra === "INA_CBG_Legacy";
  const anyLoading = !!state.loadingEra;

  return (
    <div className="space-y-3">
      {/* Buttons row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* iDRG Button — primary */}
        <button
          type="button"
          onClick={() => handleReGroup("iDRG")}
          disabled={!canReGroup || anyLoading}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all",
            canReGroup && !anyLoading
              ? "bg-linear-to-r from-sky-500 to-sky-600 text-white shadow-sm hover:from-sky-600 hover:to-sky-700 active:scale-95"
              : "cursor-not-allowed bg-slate-100 text-slate-400",
          )}
          title={
            !codingState.diagnosaPrimer
              ? "Isi diagnosa primer terlebih dahulu"
              : undefined
          }
        >
          {isLoadingIDRG ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Zap size={14} strokeWidth={2.5} />
          )}
          {isLoadingIDRG ? "Grouping iDRG…" : "Re-Group iDRG"}
        </button>

        {/* INA-CBG Legacy Button — secondary */}
        <button
          type="button"
          onClick={() => handleReGroup("INA_CBG_Legacy")}
          disabled={!canReGroup || anyLoading}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-all",
            canReGroup && !anyLoading
              ? "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 active:scale-95"
              : "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400",
          )}
        >
          {isLoadingLegacy ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <RotateCcw size={14} strokeWidth={2.2} />
          )}
          {isLoadingLegacy ? "Grouping INA-CBG…" : "Re-Group INA-CBG Legacy"}
        </button>

        {!codingState.diagnosaPrimer && (
          <p className="text-[12px] text-slate-400">
            Isi diagnosa primer untuk mengaktifkan grouper
          </p>
        )}
      </div>

      {/* Error */}
      <AnimatePresence>
        {state.errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5"
          >
            <AlertCircle
              size={14}
              strokeWidth={2.2}
              className="mt-0.5 shrink-0 text-rose-600"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-rose-800">
                {state.errorEra === "iDRG"
                  ? "Grouper iDRG error"
                  : "Grouper INA-CBG Legacy error"}
              </p>
              <p className="text-[12.5px] text-rose-700">{state.errorMsg}</p>
            </div>
            <button
              type="button"
              onClick={() =>
                state.errorEra && handleReGroup(state.errorEra)
              }
              className="shrink-0 rounded-md bg-rose-100 px-2 py-0.5 text-[12px] font-medium text-rose-700 hover:bg-rose-200"
            >
              Coba Lagi
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* iDRG Result Card */}
      <AnimatePresence>
        {state.iDRGResult && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="rounded-xl border border-sky-200 bg-linear-to-br from-sky-50/60 to-teal-50/40 px-4 py-3.5"
          >
            {/* Header row */}
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="rounded-lg bg-sky-600 px-2.5 py-1 font-mono text-sm font-bold tracking-wider text-white shadow-sm">
                  {state.iDRGResult.code}
                </span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-600">
                    {state.iDRGResult.mdc}
                  </p>
                  <p className="text-sm font-medium text-slate-800">
                    {state.iDRGResult.group}
                  </p>
                </div>
              </div>
              <SeverityBadge level={state.iDRGResult.severity.level} label={state.iDRGResult.severity.label} />
            </div>

            {/* Tarif row */}
            <div className="mt-2.5 flex flex-wrap items-center gap-x-6 gap-y-1 border-t border-sky-100 pt-2.5">
              <div>
                <p className="text-[11px] text-slate-500">Tarif Aktual ({claim.tingkatKompetensiRS})</p>
                <p className="text-base font-bold text-emerald-700">
                  {formatRupiah(state.iDRGResult.tarifAktual)}
                </p>
              </div>
              <div className="hidden sm:block">
                <p className="text-[11px] text-slate-500">CC list</p>
                <p className="text-[12.5px] font-medium text-slate-700">
                  {state.iDRGResult.severity.ccList.length > 0
                    ? state.iDRGResult.severity.ccList.join(", ")
                    : "—"}
                </p>
              </div>
              <div className="hidden sm:block">
                <p className="text-[11px] text-slate-500">MCC list</p>
                <p className="text-[12.5px] font-medium text-slate-700">
                  {state.iDRGResult.severity.mccList.length > 0
                    ? state.iDRGResult.severity.mccList.join(", ")
                    : "—"}
                </p>
              </div>
            </div>

            {/* Footer */}
            <p className="mt-2 text-[11px] text-slate-400">
              Versi: {state.iDRGResult.versiGrouper} · Grouped:{" "}
              {new Date(state.iDRGResult.timestampGroup).toLocaleString("id-ID", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* INA-CBG Legacy Result — compact with watermark */}
      <AnimatePresence>
        {state.inaCbgResult && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-wrap items-center gap-3 rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2.5"
          >
            <span className="rounded-md bg-amber-200 px-1.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-amber-800">
              ESTIMASI · REFERENCE ONLY
            </span>
            <span className="font-mono text-sm font-bold text-amber-800">
              {state.inaCbgResult.code}
            </span>
            <span className="text-sm text-amber-900">{state.inaCbgResult.group}</span>
            <span className="text-[12.5px] text-amber-700">
              Severity {state.inaCbgResult.severity}
            </span>
            <span className="font-semibold text-amber-800">
              {formatRupiah(state.inaCbgResult.tarif.kelas3)} (kelas 3)
            </span>
            <span className="text-[11px] text-amber-500">
              {state.inaCbgResult.versiGrouper}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Severity Badge ─────────────────────────────────────

function SeverityBadge({
  level,
  label,
}: {
  level: 1 | 2 | 3;
  label: string;
}) {
  const style = {
    1: "bg-emerald-100 text-emerald-800 ring-emerald-200",
    2: "bg-amber-100 text-amber-800 ring-amber-200",
    3: "bg-rose-100 text-rose-800 ring-rose-200",
  }[level];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12.5px] font-semibold ring-1",
        style,
      )}
    >
      Severity {level} · {label}
    </span>
  );
}
