"use client";

/**
 * BandingBoardPage — shell halaman `/ehis-eklaim/banding` (EK6.1).
 *
 * Layout (no page-level scroll):
 *   ┌─ BandingHero        (slim · teal accent) ──────────────────┐
 *   ├─ BandingKPIStrip    (3 cards · stagger-up) ────────────────┤
 *   ├──────────────────────────────────────────────────────────────┤
 *   │ FilterPanel (260px) │ BandingTable (fluid · scroll-in)     │
 *   │ sticky left          │  QuickTabs + worklist rows            │
 *   └──────────────────────┴──────────────────────────────────────┘
 *
 * Skeleton 500ms via useSkeletonDelay · fade-in AnimatePresence.
 */

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { useSkeletonDelay } from "@/components/master/shared";
import BandingHero from "./BandingHero";
import BandingKPIStrip from "./BandingKPIStrip";
import BandingFilterPanel from "./BandingFilterPanel";
import BandingTable from "./BandingTable";
import {
  buildViewItems,
  filterViewItems,
  computeBandingKPIs,
  defaultBandingFilters,
  type BandingFilterState,
  type QuickTab,
} from "./bandingShared";

// ── Helpers ───────────────────────────────────────────────

function formatTimestamp(d: Date): string {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })} · ${hh}:${mm}`;
}

// ── Main Page ─────────────────────────────────────────────

export default function BandingBoardPage() {
  const ready = useSkeletonDelay(500);
  const [filters, setFilters] = useState<BandingFilterState>(() => defaultBandingFilters());
  const [quickTab, setQuickTab] = useState<QuickTab>("all");
  const timestamp = useMemo(() => formatTimestamp(new Date()), []);

  // All banding view items (joined: BandingRecord + ClaimRecord)
  const allItems = useMemo(() => buildViewItems(), []);

  // KPIs always computed on full list (unfiltered)
  const kpis = useMemo(() => computeBandingKPIs(allItems), [allItems]);

  // Filtered items (sidebar filter applied; quick-tab applied inside BandingTable)
  const filteredItems = useMemo(
    () => filterViewItems(allItems, filters, quickTab),
    [allItems, filters, quickTab],
  );

  const totalBanding = allItems.length;
  const pendingCount = allItems.filter(
    (i) => i.banding.status === "Submitted" || i.banding.status === "Review",
  ).length;

  const handleReset = () => setFilters(defaultBandingFilters());

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-50/60">
      <AnimatePresence mode="wait">
        {!ready ? (
          <SkeletonShell key="skeleton" />
        ) : (
          <motion.div
            key="ready"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="flex min-h-0 flex-1 flex-col"
          >
            <BandingHero
              timestamp={timestamp}
              totalBanding={totalBanding}
              pendingCount={pendingCount}
            />

            <BandingKPIStrip kpis={kpis} />

            {/* 2-panel: filter left (260px) + table right (fluid) */}
            <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 px-4 pt-4 pb-5 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)]">
              {/* Left — sticky filter */}
              <div className="min-h-0 lg:sticky lg:top-0 lg:max-h-[calc(100vh-280px)]">
                <BandingFilterPanel
                  filters={filters}
                  onChange={setFilters}
                  onReset={handleReset}
                />
              </div>

              {/* Right — table (scroll internal) */}
              <div className="min-h-0 lg:max-h-[calc(100vh-280px)]">
                <BandingTable
                  items={filteredItems}
                  quickTab={quickTab}
                  onQuickTab={setQuickTab}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Skeleton Shell ─────────────────────────────────────────

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
      <div className="relative border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
        <div className="absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-teal-200 via-sky-200 to-emerald-200" />
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1.5">
            <div className="h-3 w-36 animate-pulse rounded bg-slate-200" />
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 animate-pulse rounded-lg bg-teal-100" />
              <div className="space-y-1">
                <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
                <div className="h-3 w-64 animate-pulse rounded bg-slate-100" />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="h-6 w-20 animate-pulse rounded-full bg-teal-100" />
            <div className="h-6 w-24 animate-pulse rounded-full bg-amber-100" />
          </div>
        </div>
      </div>

      {/* KPI placeholder */}
      <div className="grid gap-3 px-4 pt-4 sm:grid-cols-3 sm:px-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-[100px] animate-pulse rounded-xl bg-white ring-1 ring-slate-100"
          />
        ))}
      </div>

      {/* 2-panel placeholder */}
      <div className="grid flex-1 gap-4 px-4 pt-4 pb-5 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <div className="h-full animate-pulse rounded-xl bg-white ring-1 ring-slate-100" />
        <div className="h-full animate-pulse rounded-xl bg-white ring-1 ring-slate-100" />
      </div>
    </motion.div>
  );
}
