"use client";

/**
 * Pipeline Panel V3 — compact horizontal 5-stage funnel.
 *
 * Stage: Draft → Belum Submit → Pending → Approved → Paid.
 * Fits in ~90px height. Stage cards link to deep-filter worklist.
 */

import Link from "next/link";
import { motion } from "framer-motion";
import { Activity, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  EKLAIM_TONE,
  fmtRupiahKpi,
  getPipelineStages,
  type PipelineStage,
} from "./berandaEklaimShared";

// ── Stage Card ─────────────────────────────────────────

function StageCard({
  stage,
  maxCount,
  index,
}: {
  stage: PipelineStage;
  maxCount: number;
  index: number;
}) {
  const t       = EKLAIM_TONE[stage.tone];
  const fillPct = maxCount > 0 ? Math.max(6, Math.round((stage.count / maxCount) * 100)) : 0;
  const empty   = stage.count === 0;

  return (
    <motion.li
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: 0.06 + index * 0.05 }}
    >
      <Link
        href={stage.href}
        aria-label={`Filter klaim ${stage.label}: ${stage.count} klaim`}
        className={cn(
          "group block rounded-lg border bg-white px-2.5 py-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300",
          empty
            ? "cursor-default border-slate-200 opacity-60"
            : "border-slate-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md",
        )}
      >
        <div className="flex items-center justify-between gap-1">
          <div className="flex min-w-0 items-center gap-1">
            <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", t.dot)} />
            <p className="truncate text-[9.5px] font-semibold uppercase tracking-wide text-slate-500">
              {stage.label}
            </p>
          </div>
          {!empty && (
            <ChevronRight
              size={9}
              className="shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500"
            />
          )}
        </div>

        <div className="mt-1 flex items-baseline gap-1">
          <p className="text-[18px] font-black leading-none tabular-nums text-slate-900">
            {stage.count}
          </p>
          <p className="text-[9px] font-medium uppercase tracking-wide text-slate-400">klaim</p>
        </div>

        <p className="mt-0.5 font-mono text-[9.5px] tabular-nums text-slate-500">
          {fmtRupiahKpi(stage.total)}
        </p>

        <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-100">
          <motion.span
            initial={{ width: 0 }}
            animate={{ width: `${fillPct}%` }}
            transition={{ duration: 0.5, delay: 0.2 + index * 0.05 }}
            className={cn("block h-full rounded-full", t.bar)}
          />
        </div>
      </Link>
    </motion.li>
  );
}

// ── Main ───────────────────────────────────────────────

export default function PipelinePanel() {
  const stages      = getPipelineStages();
  const maxCount    = Math.max(...stages.map((s) => s.count));
  const totalKlaim  = stages.reduce((a, s) => a + s.count, 0);
  const totalNominal = stages.reduce<bigint>((a, s) => a + s.total, 0n);

  return (
    <motion.section
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: 0.08 }}
      className="rounded-xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-3 py-2">
        <div className="flex items-center gap-1.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-teal-50 ring-1 ring-teal-100">
            <Activity size={11} className="text-teal-600" />
          </span>
          <p className="text-[11.5px] font-bold uppercase tracking-wide text-slate-700">Pipeline</p>
        </div>
        <p className="text-[9.5px] text-slate-400">
          {totalKlaim} klaim · {fmtRupiahKpi(totalNominal)}
        </p>
      </div>

      <ol className="grid grid-cols-2 gap-2 p-2.5 sm:grid-cols-5">
        {stages.map((stage, i) => (
          <StageCard key={stage.key} stage={stage} maxCount={maxCount} index={i} />
        ))}
      </ol>
    </motion.section>
  );
}
