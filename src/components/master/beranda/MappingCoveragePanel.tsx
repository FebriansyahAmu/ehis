"use client";

/**
 * Panel ringkasan Mapping Coverage di sidebar Beranda Master.
 *
 * Menampilkan 8 mini-meter per sub-page Mapping Hub:
 *   - icon + label
 *   - progress bar dengan warna tone (rose/amber/emerald)
 *   - angka filled/total + persentase
 *
 * Klik baris → deep-link ke sub-page Mapping Hub via `?sub=<key>`.
 */

import Link from "next/link";
import { motion } from "framer-motion";
import { Network, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  MAPPING_COVERAGE, getCoveragePercent, getCoverageTone,
  type MappingCoverageEntry,
} from "./berandaShared";

const TONE_BAR: Record<ReturnType<typeof getCoverageTone>, { bar: string; chip: string }> = {
  rose:    { bar: "bg-rose-500",    chip: "bg-rose-50 text-rose-700"    },
  amber:   { bar: "bg-amber-500",   chip: "bg-amber-50 text-amber-700"  },
  emerald: { bar: "bg-emerald-500", chip: "bg-emerald-50 text-emerald-700" },
};

export default function MappingCoveragePanel() {
  const totalFilled = MAPPING_COVERAGE.reduce((a, e) => a + e.filled, 0);
  const totalCells  = MAPPING_COVERAGE.reduce((a, e) => a + e.total, 0);
  const avgPercent  = Math.round((totalFilled / totalCells) * 100);

  return (
    <motion.section
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.05 }}
      className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
    >
      <header className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
            <Network size={13} />
          </span>
          <div>
            <h3 className="text-[12.5px] font-bold uppercase tracking-wide text-slate-800">
              Mapping Coverage
            </h3>
            <p className="text-[10.5px] text-slate-500">
              {totalFilled.toLocaleString("id-ID")} / {totalCells.toLocaleString("id-ID")} cell terisi
            </p>
          </div>
        </div>
        <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 font-mono text-[11px] font-black text-emerald-700">
          {avgPercent}%
        </span>
      </header>

      <ul className="flex flex-col gap-1.5">
        {MAPPING_COVERAGE.map((e, i) => (
          <CoverageRow key={e.key} entry={e} delay={i * 0.02} />
        ))}
      </ul>

      <Link
        href="/ehis-master/mapping"
        className="mt-3 flex items-center justify-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-[11px] font-bold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100"
      >
        Buka Mapping Hub
        <ChevronRight size={12} />
      </Link>
    </motion.section>
  );
}

function CoverageRow({ entry, delay }: { entry: MappingCoverageEntry; delay: number }) {
  const percent = getCoveragePercent(entry);
  const tone = getCoverageTone(percent);
  const t = TONE_BAR[tone];
  const Icon = entry.icon;

  return (
    <li>
      <Link
        href={entry.href}
        className="group flex items-center gap-2 rounded-lg p-1.5 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
      >
        <Icon size={13} className="shrink-0 text-slate-500" />
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex items-baseline justify-between gap-2">
            <p className="truncate text-[11px] font-semibold text-slate-700 group-hover:text-slate-900">
              {entry.label}
            </p>
            <p className="font-mono text-[10.5px] tabular-nums text-slate-500">
              {entry.filled}/{entry.total}
            </p>
          </div>
          {/* progress bar */}
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percent}%` }}
              transition={{ duration: 0.6, delay: 0.1 + delay, ease: "easeOut" }}
              className={cn("h-full rounded-full", t.bar)}
            />
          </div>
        </div>
        <span
          className={cn(
            "shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold",
            t.chip,
          )}
        >
          {percent}%
        </span>
      </Link>
    </li>
  );
}
