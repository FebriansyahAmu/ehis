"use client";

/**
 * KlaimBoardPage — entry shell modul `/ehis-eklaim/klaim` (EK2.1).
 *
 * Layout (no page-level scroll):
 *   ┌──────────────────────────────────────────────────────┐
 *   │ KlaimHero            (slim · teal-accent)            │
 *   ├──────────────────────────────────────────────────────┤
 *   │ KlaimKPIStrip        (4 cards · animated stagger)    │
 *   ├──────────────┬───────────────────────────────────────┤
 *   │ FilterPanel  │ WorkspaceShell                        │
 *   │ (300px·left) │  ├─ Quick Tabs + Density toggle       │
 *   │              │  └─ Results pane (placeholder · EK2.2)│
 *   └──────────────┴───────────────────────────────────────┘
 *
 * Skeleton 500ms via `useSkeletonDelay`, lalu fade-in motion 0.2s.
 * All chips/tabs/density toggle animasi spring smooth.
 */

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { useSkeletonDelay } from "@/components/master/shared";
import KlaimHero from "./KlaimHero";
import KlaimKPIStrip from "./KlaimKPIStrip";
import KlaimFilterPanel from "./KlaimFilterPanel";
import KlaimWorkspaceShell from "./KlaimWorkspaceShell";
import {
  defaultFilters,
  type KlaimFilterState,
  type QuickTab,
  type Density,
} from "./klaimBoardShared";

export default function KlaimBoardPage() {
  const ready = useSkeletonDelay(500);
  const [filters, setFilters] = useState<KlaimFilterState>(() => defaultFilters());

  const timestamp = useMemo(() => formatTimestamp(new Date()), []);

  const handleQuickTab = (tab: QuickTab) => setFilters({ ...filters, quickTab: tab });
  const handleDensity = (density: Density) => setFilters({ ...filters, density });
  const handleReset = () => setFilters(defaultFilters());

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
            <KlaimHero timestamp={timestamp} />
            <KlaimKPIStrip filters={filters} />

            {/* 2-panel split: filter (left, sticky 300px) + workspace (right, fluid) */}
            <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 px-4 pt-4 pb-5 sm:px-6 lg:grid-cols-[300px_minmax(0,1fr)]">
              <div className="min-h-0 lg:sticky lg:top-0 lg:max-h-[calc(100vh-300px)]">
                <KlaimFilterPanel
                  filters={filters}
                  onChange={setFilters}
                  onReset={handleReset}
                />
              </div>
              <div className="min-h-0 lg:max-h-[calc(100vh-300px)]">
                <KlaimWorkspaceShell
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

// ── Skeleton ───────────────────────────────────────────

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
      <div className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
        <div className="space-y-2">
          <div className="h-3 w-40 animate-pulse rounded bg-slate-200" />
          <div className="h-5 w-56 animate-pulse rounded bg-slate-200" />
          <div className="h-3 w-72 animate-pulse rounded bg-slate-100" />
        </div>
      </div>

      {/* KPI placeholder */}
      <div className="grid gap-3 px-4 pt-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-[100px] animate-pulse rounded-xl bg-white ring-1 ring-slate-100"
          />
        ))}
      </div>

      {/* 2-panel placeholder */}
      <div className="grid flex-1 gap-4 px-4 pt-4 pb-5 sm:px-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <div className="h-full animate-pulse rounded-xl bg-white ring-1 ring-slate-100" />
        <div className="h-full animate-pulse rounded-xl bg-white ring-1 ring-slate-100" />
      </div>
    </motion.div>
  );
}

// ── Helpers ────────────────────────────────────────────

function formatTimestamp(d: Date): string {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const day = d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  return `${day} · ${hh}:${mm}`;
}
