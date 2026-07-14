"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSkeletonDelay } from "@/components/master/shared";
import TagihanHero from "./TagihanHero";
import TagihanKPIStrip from "./TagihanKPIStrip";
import TagihanFilterPanel from "./TagihanFilterPanel";
import TagihanWorkspaceShell from "./TagihanWorkspaceShell";
import {
  defaultFilters, todayISO, type TagihanFilterState, type QuickTab, type Density,
} from "./tagihanShared";
import { listBillingKunjungan } from "@/lib/api/billing/projection";
import { mapProjectionRow } from "./realRows";
import type { TagihanRow } from "./tagihanBoardLogic";

// Board Tagihan = DATA NYATA (proyeksi order klinis), tampilan tetap seperti sebelumnya.
// Default periode diperlebar (bukan hanya "hari ini") karena data nyata lintas-tanggal.
function initialFilters(): TagihanFilterState {
  return { ...defaultFilters(), periodePreset: "custom", periodeFrom: "2000-01-01", periodeTo: todayISO() };
}

export default function TagihanBoardPage() {
  const ready = useSkeletonDelay(500);
  const [rows, setRows] = useState<TagihanRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [filters, setFilters] = useState<TagihanFilterState>(initialFilters);

  useEffect(() => {
    const ac = new AbortController();
    listBillingKunjungan(ac.signal)
      .then((data) => { if (!ac.signal.aborted) setRows(data.map(mapProjectionRow)); })
      .catch(() => { /* diam — board tetap render kosong bila gagal */ })
      .finally(() => { if (!ac.signal.aborted) setLoaded(true); });
    return () => ac.abort();
  }, []);

  const timestamp = useMemo(() => formatTimestamp(new Date()), []);

  const handleQuickTab = (tab: QuickTab) => setFilters({ ...filters, quickTab: tab });
  const handleDensity  = (density: Density) => setFilters({ ...filters, density });
  const handleReset    = () => setFilters(initialFilters());

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-50/60 dark:bg-slate-950">
      <AnimatePresence mode="wait">
        {!ready || !loaded ? (
          <SkeletonShell key="skeleton" />
        ) : (
          <motion.div
            key="ready"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="flex min-h-0 flex-1 flex-col"
          >
            <TagihanHero timestamp={timestamp} />
            <TagihanKPIStrip rows={rows} />

            {/* 2-panel split: filter (left, sticky) + workspace (right, fluid) */}
            <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 px-6 pt-4 pb-6 lg:grid-cols-[300px_minmax(0,1fr)]">
              <div className="min-h-0 lg:sticky lg:top-0 lg:max-h-[calc(100vh-340px)]">
                <TagihanFilterPanel
                  filters={filters}
                  onChange={setFilters}
                  onReset={handleReset}
                />
              </div>
              <div className="min-h-0 lg:max-h-[calc(100vh-340px)]">
                <TagihanWorkspaceShell
                  rows={rows}
                  filters={filters}
                  onQuickTab={handleQuickTab}
                  onDensity={handleDensity}
                  onResetFilters={handleReset}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Skeleton ────────────────────────────────────────────

function SkeletonShell() {
  return (
    <motion.div
      key="skeleton"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="flex h-full flex-col"
    >
      {/* Hero placeholder */}
      <div className="border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-950">
        <div className="space-y-2">
          <div className="h-3 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-5 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>

      {/* KPI placeholder */}
      <div className="grid gap-3 px-6 pt-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-23 animate-pulse rounded-xl bg-white ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800"
          />
        ))}
      </div>

      {/* 2-panel placeholder */}
      <div className="grid flex-1 gap-4 px-6 pt-4 pb-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <div className="h-full animate-pulse rounded-xl bg-white ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800" />
        <div className="h-full animate-pulse rounded-xl bg-white ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800" />
      </div>
    </motion.div>
  );
}

// ── Helpers ─────────────────────────────────────────────

function formatTimestamp(d: Date): string {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const day = d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
  return `${day} · ${hh}:${mm}`;
}
