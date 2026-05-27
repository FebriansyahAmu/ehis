"use client";

/**
 * ComparatorView — Mode C dual-engine side-by-side (EK3.4 Mode C).
 *
 * Layout:
 *   [INFO BANNER]
 *   [iDRG Panel] | [INA-CBG Panel]   (lg:grid-cols-2)
 *   [Delta Card]                      (jika kedua hasil tersedia)
 *
 * Label: eraGrouper menentukan mana PRIMER vs REFERENCE ONLY.
 */

import { motion } from "framer-motion";
import {
  ArrowLeftRight,
  TrendingUp,
  TrendingDown,
  Loader2,
  TriangleAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRupiah } from "@/lib/eklaim/money";
import type {
  EraGrouper,
  iDRGResult,
  InaCbgLegacyResult,
  KelasRawat,
  TingkatKompetensiRS,
} from "@/lib/eklaim/eklaimShared";
import { getInaCbgTarifForKelas } from "./grouperShared";
import IDRGResultCard from "./IDRGResultCard";
import INACBGResultCard from "./INACBGResultCard";

interface Props {
  eraGrouper: EraGrouper;
  kelas: KelasRawat;
  tingkatRS: TingkatKompetensiRS;
  iDRGResult: iDRGResult | null;
  inaCbgResult: InaCbgLegacyResult | null;
  /** True saat auto-fetch secondary sedang berjalan. */
  loading: boolean;
  /** Error message secondary engine (non-blocking). */
  secondaryWarning: string | null;
}

export default function ComparatorView({
  eraGrouper,
  kelas,
  tingkatRS,
  iDRGResult,
  inaCbgResult,
  loading,
  secondaryWarning,
}: Props) {
  const isPrimaryIDRG = eraGrouper === "iDRG";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="flex flex-col gap-3"
    >
      {/* Info banner */}
      <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <ArrowLeftRight
          size={15}
          strokeWidth={2}
          className="mt-0.5 shrink-0 text-amber-600"
        />
        <div>
          <p className="text-[13px] font-bold text-amber-900">
            Mode Komparator — Dual Engine
          </p>
          <p className="text-[11.5px] text-amber-700">
            Panel sekunder adalah estimasi{" "}
            <strong>REFERENCE ONLY</strong> — tidak untuk submission.
            Tarif masing-masing dari era grouper yang berbeda.
          </p>
        </div>
      </div>

      {/* Side-by-side panels */}
      <div className="grid gap-3 lg:grid-cols-2">
        {/* iDRG panel */}
        <PanelWrapper
          label={isPrimaryIDRG ? "PRIMER · ERA AKTIF" : "ESTIMASI · iDRG"}
          labelClass={isPrimaryIDRG ? "bg-sky-600" : "bg-slate-500"}
        >
          {iDRGResult ? (
            <IDRGResultCard result={iDRGResult} tingkatRS={tingkatRS} />
          ) : loading ? (
            <LoadingPanel label="iDRG" />
          ) : (
            <PendingPanel label="iDRG" />
          )}
        </PanelWrapper>

        {/* INA-CBG panel */}
        <PanelWrapper
          label={!isPrimaryIDRG ? "PRIMER · ERA AKTIF" : "REFERENCE ONLY · LEGACY"}
          labelClass={!isPrimaryIDRG ? "bg-amber-600" : "bg-slate-500"}
        >
          {inaCbgResult ? (
            <INACBGResultCard
              result={inaCbgResult}
              kelas={kelas}
              isReference={isPrimaryIDRG}
            />
          ) : loading ? (
            <LoadingPanel label="INA-CBG" />
          ) : secondaryWarning ? (
            <WarningPanel message={secondaryWarning} />
          ) : (
            <PendingPanel label="INA-CBG" />
          )}
        </PanelWrapper>
      </div>

      {/* Delta card — hanya jika kedua hasil tersedia */}
      {iDRGResult && inaCbgResult && (
        <DeltaCard
          iDRGTarif={iDRGResult.tarifAktual}
          inaCbgTarif={getInaCbgTarifForKelas(inaCbgResult.tarif, kelas)}
        />
      )}
    </motion.div>
  );
}

// ── Panel Wrapper ──────────────────────────────────────

function PanelWrapper({
  label,
  labelClass,
  children,
}: {
  label: string;
  labelClass: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span
        className={cn(
          "self-start rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white",
          labelClass,
        )}
      >
        {label}
      </span>
      {children}
    </div>
  );
}

// ── Delta Card ─────────────────────────────────────────

function DeltaCard({
  iDRGTarif,
  inaCbgTarif,
}: {
  iDRGTarif: bigint;
  inaCbgTarif: bigint;
}) {
  const raw = iDRGTarif - inaCbgTarif;
  const abs = raw < 0n ? -raw : raw;
  const isIDRGHigher = raw >= 0n;
  const pct =
    inaCbgTarif === 0n
      ? 0
      : Math.abs(Math.round((Number(raw) / Number(inaCbgTarif)) * 1000) / 10);

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.18 }}
      className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white px-5 py-3.5 shadow-sm"
    >
      <ArrowLeftRight size={15} strokeWidth={2} className="shrink-0 text-slate-400" />
      <div className="min-w-[160px] flex-1">
        <p className="text-[12px] font-semibold text-slate-700">
          Selisih Tarif — iDRG vs INA-CBG
        </p>
        <p className="text-[11px] text-slate-400">
          Tarif iDRG aktual minus tarif INA-CBG untuk kelas pasien ini
        </p>
      </div>
      <div className="flex items-center gap-2">
        {isIDRGHigher ? (
          <TrendingUp size={16} className="text-emerald-600" />
        ) : (
          <TrendingDown size={16} className="text-rose-600" />
        )}
        <span
          className={cn(
            "font-mono text-lg font-black",
            isIDRGHigher ? "text-emerald-700" : "text-rose-700",
          )}
        >
          {isIDRGHigher ? "+" : "−"}{formatRupiah(abs)}
        </span>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[11px] font-bold",
            isIDRGHigher
              ? "bg-emerald-100 text-emerald-700"
              : "bg-rose-100 text-rose-700",
          )}
        >
          {pct}%
        </span>
      </div>
      <div className="hidden gap-3 text-[11.5px] text-slate-500 sm:flex">
        <span>
          iDRG:{" "}
          <strong className="text-slate-700">{formatRupiah(iDRGTarif)}</strong>
        </span>
        <span>·</span>
        <span>
          INA-CBG:{" "}
          <strong className="text-slate-700">{formatRupiah(inaCbgTarif)}</strong>
        </span>
      </div>
    </motion.div>
  );
}

// ── Sub-states ─────────────────────────────────────────

function LoadingPanel({ label }: { label: string }) {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white">
      <Loader2 size={22} className="animate-spin text-slate-300" />
      <p className="mt-2 text-[12px] text-slate-400">{label} sedang diproses…</p>
    </div>
  );
}

function PendingPanel({ label }: { label: string }) {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white px-6 text-center">
      <p className="text-[13px] font-semibold text-slate-600">
        Menunggu hasil {label}
      </p>
      <p className="mt-1 max-w-[220px] text-[12px] text-slate-400">
        Klik "Re-Group Komparator" untuk menjalankan kedua engine sekaligus
      </p>
    </div>
  );
}

function WarningPanel({ message }: { message: string }) {
  return (
    <div className="flex min-h-[120px] flex-col items-center justify-center rounded-xl border border-amber-200 bg-amber-50 px-5 text-center">
      <TriangleAlert size={18} className="mb-1.5 text-amber-500" />
      <p className="text-[12.5px] font-semibold text-amber-800">
        Secondary grouper gagal
      </p>
      <p className="mt-0.5 text-[11.5px] text-amber-600">{message}</p>
    </div>
  );
}
