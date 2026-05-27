"use client";

/**
 * GrouperTab — Tab Grouper (EK3.4).
 *
 * Mode A: iDRG primary  (claim.eraGrouper === "iDRG")
 * Mode B: INA-CBG Legacy (claim.eraGrouper === "INA_CBG_Legacy")
 * Mode C: Comparator toggle — dual engine side-by-side
 *
 * State lokal: iDRGResult + inaCbgResult diinit dari claim field,
 * di-refresh via resolveGrouping (single) / resolveComparator (dual).
 * handleToggleComparator auto-fetch secondary jika belum tersedia.
 */

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Zap,
  AlertCircle,
  Clock,
  Layers,
  RefreshCw,
  ArrowLeftRight,
  TriangleAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  ClaimRecord,
  iDRGResult,
  InaCbgLegacyResult,
  ClaimError,
  EraGrouper,
} from "@/lib/eklaim/eklaimShared";
import {
  resolveGrouping,
  resolveComparator,
} from "@/lib/eklaim/groupingResolver";
import type { ClaimGrouperContext } from "@/lib/eklaim/groupingResolver";
import IDRGResultCard from "./grouper/IDRGResultCard";
import TarifBreakdownCard from "./grouper/TarifBreakdownCard";
import TopUpCmgCard from "./grouper/TopUpCmgCard";
import INACBGResultCard from "./grouper/INACBGResultCard";
import ComparatorView from "./grouper/ComparatorView";

interface Props {
  claim: ClaimRecord;
}

function mapError(err: ClaimError): string {
  if (err.type === "GrouperError" || err.type === "NetworkError") return err.message;
  return "Grouper error — coba lagi";
}

export default function GrouperTab({ claim }: Props) {
  const [iDRGResult, setIDRGResult] = useState<iDRGResult | null>(
    claim.iDRG ?? null,
  );
  const [inaCbgResult, setInaCbgResult] = useState<InaCbgLegacyResult | null>(
    claim.inaCbgLegacy ?? null,
  );
  const [comparatorMode, setComparatorMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [secondaryWarning, setSecondaryWarning] = useState<string | null>(null);

  const ctx: ClaimGrouperContext = useMemo(
    () => ({
      eraGrouper: claim.eraGrouper,
      diagnosaPrimer: claim.diagnosaPrimer,
      diagnosaSekunder: [...claim.diagnosaSekunder],
      tindakanProsedur: [...claim.tindakanProsedur],
      tipePelayanan: claim.tipePelayanan,
      kelas: claim.kelas,
      isKRIS: claim.isKRIS,
      tingkatKompetensiRS: claim.tingkatKompetensiRS,
      los: claim.los,
      age: claim.age,
      gender: claim.gender,
      caraPulang: claim.caraPulang,
    }),
    [claim],
  );

  const handleReGroup = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    setSecondaryWarning(null);

    if (comparatorMode) {
      const res = await resolveComparator(ctx);
      if (res.ok) {
        if (claim.eraGrouper === "iDRG") {
          setIDRGResult(res.value.primary as iDRGResult);
          if (res.value.secondary)
            setInaCbgResult(res.value.secondary as InaCbgLegacyResult);
        } else {
          setInaCbgResult(res.value.primary as InaCbgLegacyResult);
          if (res.value.secondary)
            setIDRGResult(res.value.secondary as iDRGResult);
        }
        if (res.value.secondaryError)
          setSecondaryWarning(mapError(res.value.secondaryError));
      } else {
        setErrorMsg(mapError(res.error));
      }
    } else {
      const res = await resolveGrouping(ctx);
      if (res.ok) {
        if (claim.eraGrouper === "iDRG")
          setIDRGResult(res.value as iDRGResult);
        else setInaCbgResult(res.value as InaCbgLegacyResult);
      } else {
        setErrorMsg(mapError(res.error));
      }
    }
    setLoading(false);
  }, [ctx, comparatorMode, claim.eraGrouper]);

  const handleToggleComparator = useCallback(async () => {
    const next = !comparatorMode;
    setComparatorMode(next);
    if (!next) return;

    // Auto-fetch secondary jika belum ada saat enable comparator
    const secondaryMissing =
      claim.eraGrouper === "iDRG" ? !inaCbgResult : !iDRGResult;
    if (!secondaryMissing) return;

    setLoading(true);
    setErrorMsg(null);
    setSecondaryWarning(null);
    const res = await resolveComparator(ctx);
    setLoading(false);

    if (res.ok) {
      if (claim.eraGrouper === "iDRG") {
        if (res.value.secondary)
          setInaCbgResult(res.value.secondary as InaCbgLegacyResult);
        if (res.value.secondaryError)
          setSecondaryWarning(mapError(res.value.secondaryError));
      } else {
        if (res.value.secondary)
          setIDRGResult(res.value.secondary as iDRGResult);
        if (res.value.secondaryError)
          setSecondaryWarning(mapError(res.value.secondaryError));
      }
    } else {
      setErrorMsg(mapError(res.error));
      setComparatorMode(false);
    }
  }, [comparatorMode, claim.eraGrouper, iDRGResult, inaCbgResult, ctx]);

  const lastGrouped =
    comparatorMode
      ? (iDRGResult?.timestampGroup ?? inaCbgResult?.timestampGroup)
      : claim.eraGrouper === "iDRG"
        ? iDRGResult?.timestampGroup
        : inaCbgResult?.timestampGroup;

  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="flex w-full flex-col gap-3"
    >
      <ActionBar
        eraGrouper={claim.eraGrouper}
        lastGrouped={lastGrouped}
        loading={loading}
        errorMsg={errorMsg}
        comparatorMode={comparatorMode}
        onReGroup={handleReGroup}
        onToggleComparator={handleToggleComparator}
        onDismissError={() => setErrorMsg(null)}
      />

      <AnimatePresence mode="wait">
        {/* Mode C — Comparator */}
        {comparatorMode ? (
          <ComparatorView
            key="comparator"
            eraGrouper={claim.eraGrouper}
            kelas={claim.kelas}
            tingkatRS={claim.tingkatKompetensiRS}
            iDRGResult={iDRGResult}
            inaCbgResult={inaCbgResult}
            loading={loading}
            secondaryWarning={secondaryWarning}
          />
        ) : claim.eraGrouper === "iDRG" ? (
          /* Mode A — iDRG primary */
          iDRGResult ? (
            <motion.div
              key="idrg-result"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="flex flex-col gap-3"
            >
              <IDRGResultCard
                result={iDRGResult}
                tingkatRS={claim.tingkatKompetensiRS}
              />
              <div className="grid gap-3 lg:grid-cols-2">
                <TarifBreakdownCard
                  tarifRS={claim.tarifRS}
                  tarifIDRG={iDRGResult.tarifAktual}
                />
                <TopUpCmgCard topUpCmg={iDRGResult.topUpCmg} />
              </div>
            </motion.div>
          ) : (
            <EmptyStateIDRG
              key="idrg-empty"
              loading={loading}
              onGroup={handleReGroup}
            />
          )
        ) : /* Mode B — INA-CBG primary */
        inaCbgResult ? (
          <motion.div
            key="inacbg-result"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            <INACBGResultCard result={inaCbgResult} kelas={claim.kelas} />
          </motion.div>
        ) : (
          <EmptyStateInaCbg
            key="inacbg-empty"
            loading={loading}
            onGroup={handleReGroup}
          />
        )}
      </AnimatePresence>

    </motion.section>
  );
}

// ── Action Bar ─────────────────────────────────────────

interface ActionBarProps {
  eraGrouper: EraGrouper;
  lastGrouped?: string;
  loading: boolean;
  errorMsg: string | null;
  comparatorMode: boolean;
  onReGroup: () => void;
  onToggleComparator: () => void;
  onDismissError: () => void;
}

function ActionBar({
  eraGrouper,
  lastGrouped,
  loading,
  errorMsg,
  comparatorMode,
  onReGroup,
  onToggleComparator,
  onDismissError,
}: ActionBarProps) {
  const isIDRG = eraGrouper === "iDRG";

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        {/* Left: labels */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {/* Primary engine label */}
            <p className="text-[13px] font-bold text-slate-800">
              {isIDRG ? "iDRG Grouper" : "INA-CBG Grouper"}
            </p>
            {isIDRG ? (
              <>
                <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-sky-700">
                  PRIMARY
                </span>
                <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10.5px] font-bold text-teal-700">
                  Mode A
                </span>
              </>
            ) : (
              <>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-amber-700">
                  LEGACY
                </span>
                <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10.5px] font-bold text-orange-700">
                  Mode B
                </span>
              </>
            )}

            {/* Comparator toggle chip */}
            <button
              type="button"
              onClick={onToggleComparator}
              disabled={loading}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10.5px] font-bold transition-all disabled:opacity-50",
                comparatorMode
                  ? "border-amber-300 bg-amber-100 text-amber-800"
                  : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100",
              )}
            >
              <ArrowLeftRight size={10} strokeWidth={2.5} />
              {comparatorMode ? "Komparator ON" : "Komparator"}
            </button>
          </div>

          {/* Sub-label */}
          {lastGrouped ? (
            <p className="mt-0.5 flex items-center gap-1 text-[11.5px] text-slate-400">
              <Clock size={10} strokeWidth={2} />
              Terakhir:{" "}
              {new Date(lastGrouped).toLocaleString("id-ID", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          ) : (
            <p className="mt-0.5 text-[11.5px] font-medium text-amber-600">
              {comparatorMode
                ? "Belum ada hasil — jalankan Re-Group Komparator"
                : `Belum pernah di-group — jalankan grouper untuk melihat hasil`}
            </p>
          )}
        </div>

        {/* Re-Group button */}
        <button
          type="button"
          onClick={onReGroup}
          disabled={loading}
          className={cn(
            "inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all",
            !loading
              ? comparatorMode
                ? "bg-linear-to-r from-amber-500 to-orange-500 text-white shadow-sm hover:from-amber-600 hover:to-orange-600 active:scale-95"
                : isIDRG
                  ? "bg-linear-to-r from-sky-500 to-sky-600 text-white shadow-sm hover:from-sky-600 hover:to-sky-700 active:scale-95"
                  : "bg-linear-to-r from-amber-500 to-orange-500 text-white shadow-sm hover:from-amber-600 hover:to-orange-600 active:scale-95"
              : "cursor-not-allowed bg-slate-100 text-slate-400",
          )}
        >
          {loading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : lastGrouped ? (
            <RefreshCw size={14} strokeWidth={2.2} />
          ) : (
            <Zap size={14} strokeWidth={2.5} />
          )}
          {loading
            ? "Grouping…"
            : comparatorMode
              ? lastGrouped
                ? "Re-Group Komparator"
                : "Group Komparator"
              : isIDRG
                ? lastGrouped
                  ? "Re-Group iDRG"
                  : "Group iDRG"
                : lastGrouped
                  ? "Re-Group INA-CBG"
                  : "Group INA-CBG"}
        </button>
      </div>

      {/* Error toast */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-2.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2"
          >
            <AlertCircle
              size={13}
              strokeWidth={2.2}
              className="shrink-0 text-rose-600"
            />
            <p className="flex-1 text-sm text-rose-800">{errorMsg}</p>
            <button
              type="button"
              onClick={onReGroup}
              className="shrink-0 rounded-md bg-rose-100 px-2 py-0.5 text-[12px] font-medium text-rose-700 hover:bg-rose-200"
            >
              Coba Lagi
            </button>
            <button
              type="button"
              onClick={onDismissError}
              className="shrink-0 text-[12px] text-rose-400 hover:text-rose-600"
              aria-label="Tutup error"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Empty States ───────────────────────────────────────

function EmptyStateIDRG({
  loading,
  onGroup,
}: {
  loading: boolean;
  onGroup: () => void;
}) {
  return (
    <motion.div
      key="idrg-empty"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex min-h-80 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center"
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-sky-100 to-teal-100 shadow-sm">
        <Layers size={28} strokeWidth={1.8} className="text-sky-600" />
      </div>
      <p className="text-base font-semibold text-slate-700">
        Grouper iDRG Belum Dijalankan
      </p>
      <p className="mt-1.5 max-w-xs text-sm text-slate-400">
        Klik tombol di bawah untuk menghitung iDRG group, severity, dan tarif
        aktual berdasarkan koding ICD-10-IM + ICD-9-CM-IM klaim ini.
      </p>
      <button
        type="button"
        onClick={onGroup}
        disabled={loading}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-sky-500 to-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-sky-600 hover:to-sky-700 active:scale-95 disabled:opacity-60"
      >
        {loading ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <Zap size={15} strokeWidth={2.5} />
        )}
        {loading ? "Menjalankan Grouper…" : "Group iDRG Sekarang"}
      </button>
    </motion.div>
  );
}

function EmptyStateInaCbg({
  loading,
  onGroup,
}: {
  loading: boolean;
  onGroup: () => void;
}) {
  return (
    <motion.div
      key="inacbg-empty"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex min-h-80 flex-col items-center justify-center rounded-xl border border-dashed border-amber-200 bg-amber-50/30 p-8 text-center"
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-amber-100 to-orange-100 shadow-sm">
        <TriangleAlert size={28} strokeWidth={1.8} className="text-amber-600" />
      </div>
      <p className="text-base font-semibold text-slate-700">
        Grouper INA-CBG Legacy Belum Dijalankan
      </p>
      <p className="mt-1.5 max-w-xs text-sm text-slate-400">
        Klik tombol di bawah untuk menghitung kode INA-CBG dan tarif per kelas
        berdasarkan koding klaim ini. Mode legacy pra-Oktober 2025.
      </p>
      <button
        type="button"
        onClick={onGroup}
        disabled={loading}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-amber-600 hover:to-orange-600 active:scale-95 disabled:opacity-60"
      >
        {loading ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <Zap size={15} strokeWidth={2.5} />
        )}
        {loading ? "Menjalankan Grouper…" : "Group INA-CBG Sekarang"}
      </button>
    </motion.div>
  );
}
