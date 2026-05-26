"use client";

/**
 * Beranda E-Klaim V3 — true 2-panel single-viewport layout.
 *
 *   ┌─────────────────────────────────────────────────────────────┐
 *   │ HEADER (slim 1-line: icon · title · snapshot timestamp)     │
 *   ├───────────────────────────┬─────────────────────────────────┤
 *   │ LEFT  lg:col-span-7       │ RIGHT  lg:col-span-5            │
 *   │  HeroSummaryCard          │  ActivityTabPanel               │
 *   │  PipelinePanel            │  (h-full · no visible scroll)   │
 *   │  QuickNavGridEklaim       │                                 │
 *   └───────────────────────────┴─────────────────────────────────┘
 *
 * Skeleton 500ms via `useSkeletonDelay()` → AnimatePresence fade.
 */

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Clock } from "lucide-react";

import { useSkeletonDelay } from "@/components/master/shared";
import { cn } from "@/lib/utils";
import { getEklaimStats, getQuickNavCards } from "./berandaEklaimShared";
import HeroSummaryCard from "./HeroSummaryCard";
import PipelinePanel from "./PipelinePanel";
import QuickNavGridEklaim from "./QuickNavGridEklaim";
import ActivityTabPanel from "./ActivityTabPanel";

// ── Skeleton ────────────────────────────────────────────

function Bone({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-slate-100", className)} />;
}

function PageSkeleton() {
  return (
    <div className="flex h-full flex-col gap-3 p-3 sm:p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Bone className="h-8 w-8 rounded-lg" />
          <div className="flex flex-col gap-1">
            <Bone className="h-2.5 w-16" />
            <Bone className="h-3.5 w-44" />
          </div>
        </div>
        <Bone className="h-7 w-28 rounded-lg" />
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-12">
        <div className="flex flex-col gap-2.5 lg:col-span-7">
          <Bone className="h-[112px] rounded-xl" />
          <Bone className="h-[88px] rounded-xl" />
          <Bone className="flex-1 rounded-xl" />
        </div>
        <Bone className="min-h-[180px] rounded-xl lg:col-span-5" />
      </div>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────

export default function BerandaEklaimPage() {
  const loaded = useSkeletonDelay(500);
  const stats  = useMemo(() => getEklaimStats(), []);
  const navCards = useMemo(() => getQuickNavCards(stats), [stats]);

  const timestamp = useMemo(() => {
    const d = new Date();
    return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  }, []);

  return (
    <div className="flex h-full flex-col">
      <AnimatePresence mode="wait">
        {!loaded ? (
          <motion.div
            key="skel"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            <PageSkeleton />
          </motion.div>
        ) : (
          <motion.div
            key="page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="flex h-full min-h-0 flex-col gap-3 p-3 sm:gap-3.5 sm:p-4"
          >
            {/* ── HEADER ──────────────────────────────────── */}
            <motion.header
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex shrink-0 items-center justify-between gap-3"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-600 shadow-sm shadow-teal-200/60">
                  <ShieldCheck size={15} className="text-white" />
                </span>
                <div className="min-w-0">
                  <p className="text-[9.5px] font-bold uppercase tracking-widest text-teal-600">
                    EHIS E-Klaim
                  </p>
                  <h1 className="truncate text-[14px] font-bold leading-tight text-slate-900">
                    Pusat Klaim BPJS &amp; Asuransi
                  </h1>
                </div>
              </div>
              <div className="hidden shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] text-slate-600 shadow-sm sm:flex">
                <Clock size={10} className="text-slate-400" />
                <span className="font-semibold uppercase tracking-wider">Snapshot</span>
                <span className="font-mono font-bold tabular-nums text-slate-800">
                  {timestamp}
                </span>
              </div>
            </motion.header>

            {/* ── MAIN 2-COL GRID ─────────────────────────── */}
            <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-12">

              {/* LEFT: HeroSummaryCard + PipelinePanel + QuickNav */}
              <div className="flex min-h-0 flex-col gap-2.5 lg:col-span-7">
                <HeroSummaryCard stats={stats} />
                <PipelinePanel />
                <QuickNavGridEklaim cards={navCards} />
              </div>

              {/* RIGHT: Activity Tabs (full height, no visible scroll) */}
              <aside className="min-h-0 lg:col-span-5">
                <ActivityTabPanel />
              </aside>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
