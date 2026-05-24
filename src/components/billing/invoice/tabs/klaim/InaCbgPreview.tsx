"use client";

import { Calculator, ExternalLink, TrendingDown, TrendingUp, Hash } from "lucide-react";
import { cn } from "@/lib/utils";
import { inaCbgMargin, type ClaimInaCbg } from "@/lib/billing/claimReadCache";
import { fmtRupiah } from "../../invoiceShared";

interface Props {
  inaCbg?: ClaimInaCbg;
}

/**
 * INA-CBG Preview — 1-row info: kode CBG · nama bundle · 3 stat (tarif vs RS vs selisih).
 * Hitungan riil ada di `/ehis-eklaim/calculator` (modul E-Klaim).
 * Read-only di sini.
 */
export default function InaCbgPreview({ inaCbg }: Props) {
  if (!inaCbg) return <EmptyCbg />;

  const margin = inaCbgMargin(inaCbg);

  return (
    <section
      aria-label="Preview INA-CBG"
      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-br from-sky-50/40 to-white px-4 py-2.5 dark:border-slate-800 dark:from-sky-950/15 dark:to-slate-900">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-sky-100 text-sky-700 ring-1 ring-sky-200 dark:bg-sky-900/40 dark:text-sky-300 dark:ring-sky-900/60">
            <Calculator size={13} />
          </span>
          <div>
            <h3 className="text-[12px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200">
              INA-CBG Preview
            </h3>
            <p className="text-[10.5px] text-slate-500">
              Resolusi bundle per PMK 76/2016
            </p>
          </div>
        </div>
        {typeof inaCbg.los === "number" && (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10.5px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            LOS {inaCbg.los} hari
          </span>
        )}
      </div>

      {/* Body: code + name + 3 stat */}
      <div className="grid grid-cols-1 gap-3 px-4 py-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        {/* Left: kode + nama */}
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-sky-50 text-sky-700 ring-1 ring-sky-200 dark:bg-sky-950/30 dark:text-sky-300 dark:ring-sky-900/40">
            <Hash size={16} />
          </span>
          <div className="min-w-0">
            <p className="font-mono text-[13.5px] font-semibold tabular-nums text-sky-700 dark:text-sky-300">
              {inaCbg.kode}
            </p>
            <p className="text-[12.5px] font-medium leading-snug text-slate-800 dark:text-slate-100">
              {inaCbg.nama}
            </p>
          </div>
        </div>

        {/* Right: 3-stat grid */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
          <StatCell label="Tarif CBG" value={fmtRupiah(inaCbg.tarif)} tone="sky" />
          <StatCell label="Total RS" value={fmtRupiah(inaCbg.totalRs)} tone="slate" />
          <SelisihCell margin={margin} />
        </div>
      </div>

      {/* Footnote */}
      <div className="flex items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/60 px-4 py-1.5 text-[10.5px] dark:border-slate-800 dark:bg-slate-900/40">
        <span className="text-slate-500">
          Detail kalkulasi di{" "}
          <span className="font-mono text-slate-600 dark:text-slate-300">/ehis-eklaim/calculator</span>
        </span>
        <span className="inline-flex items-center gap-1 text-slate-400">
          <ExternalLink size={10} />
          read-only
        </span>
      </div>
    </section>
  );
}

// ── Stat cells ──────────────────────────────────────────

function StatCell({
  label, value, tone,
}: {
  label: string;
  value: string;
  tone: "sky" | "slate";
}) {
  const palette = tone === "sky"
    ? "text-sky-700 dark:text-sky-300"
    : "text-slate-700 dark:text-slate-200";

  return (
    <div className="text-right lg:min-w-[120px]">
      <p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className={cn("mt-0.5 font-mono text-[13px] font-semibold tabular-nums leading-tight", palette)}>
        {value}
      </p>
    </div>
  );
}

function SelisihCell({
  margin,
}: {
  margin: { selisih: number; pct: number; isUntung: boolean };
}) {
  const Icon = margin.isUntung ? TrendingUp : TrendingDown;
  const tone = margin.isUntung
    ? "text-emerald-700 ring-emerald-200 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/20 dark:ring-emerald-900/40"
    : "text-rose-700 ring-rose-200 bg-rose-50 dark:text-rose-300 dark:bg-rose-950/20 dark:ring-rose-900/40";

  return (
    <div className="text-right lg:min-w-[140px]">
      <p className="text-[10px] uppercase tracking-wider text-slate-500">Selisih</p>
      <div className={cn(
        "mt-0.5 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 ring-1",
        tone,
      )}>
        <Icon size={11} />
        <span className="font-mono text-[12.5px] font-semibold tabular-nums">
          {margin.isUntung ? "+" : ""}{fmtRupiah(margin.selisih)}
        </span>
        <span className="font-mono text-[10px] opacity-80">
          ({margin.pct >= 0 ? "+" : ""}{margin.pct.toFixed(1)}%)
        </span>
      </div>
    </div>
  );
}

// ── Empty CBG ───────────────────────────────────────────

function EmptyCbg() {
  return (
    <section className="rounded-xl border border-dashed border-slate-200 bg-slate-50/30 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/30">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          <Calculator size={14} />
        </span>
        <div>
          <p className="text-[12.5px] font-semibold text-slate-700 dark:text-slate-200">
            INA-CBG belum dihitung
          </p>
          <p className="text-[11px] text-slate-500">
            Mulai kalkulasi di{" "}
            <span className="font-mono text-slate-600 dark:text-slate-300">
              /ehis-eklaim/calculator
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
