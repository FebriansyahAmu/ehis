"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Clock, RefreshCw } from "lucide-react";

import { useSkeletonDelay } from "@/components/master/shared";
import { cn } from "@/lib/utils";
import {
  fmtClockId,
  getBPJSKPIs,
  getBPJSQuickNav,
  seedBerandaBPJSMocks,
} from "./berandaBPJSShared";
import SystemStatusStrip from "./SystemStatusStrip";
import BPJSKPIStrip from "./BPJSKPIStrip";
import QuickNavGridBPJS from "./QuickNavGridBPJS";
import BPJSSidebarPanel from "./BPJSSidebarPanel";

// ── Skeleton ─────────────────────────────────────────────

function Bone({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-slate-200/70", className)} />;
}

function PageSkeleton() {
  return (
    <div className="flex h-full flex-col">
      <div className="h-[72px] animate-pulse bg-gradient-to-br from-slate-800 to-emerald-950" />
      <div className="flex flex-col gap-3 p-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Bone key={i} className="h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
          <Bone className="col-span-7 h-80" />
          <Bone className="col-span-5 h-80" />
        </div>
      </div>
    </div>
  );
}

// ── Sync Button ──────────────────────────────────────────

function SyncButton() {
  const [syncing, setSyncing] = useState(false);
  function handleClick() {
    if (syncing) return;
    setSyncing(true);
    setTimeout(() => setSyncing(false), 1200);
  }
  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={syncing}
      className={cn(
        "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-1 active:scale-95",
        syncing
          ? "cursor-wait border border-sky-200 bg-white text-slate-400"
          : "border border-sky-200 bg-white text-slate-600 hover:border-sky-300 hover:bg-sky-100 hover:text-sky-700",
      )}
    >
      <RefreshCw
        size={13}
        strokeWidth={2.3}
        className={cn("transition-transform", syncing && "animate-spin")}
      />
      {syncing ? "Syncing…" : "Sync"}
    </button>
  );
}

// ── Dashboard Header ──────────────────────────────────────

function DashboardHeader({ timestamp }: { timestamp: string }) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="relative shrink-0 border-b border-sky-100 bg-sky-50 px-4 py-4"
    >
      <div className="flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 22 }}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500 shadow-sm shadow-emerald-200"
          >
            <ShieldCheck size={18} className="text-white" strokeWidth={2.2} />
          </motion.div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-slate-800">
                BPJS Integration Hub
              </span>
              <span className="hidden rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 sm:inline">
                V-Claim 5
              </span>
            </div>
            <p className="text-xs text-slate-500">
              EHIS BPJS · Surat Eligibilitas &amp; Kepesertaan
            </p>
          </div>
        </div>

        {/* Right: status pills + clock + sync */}
        <div className="flex items-center gap-2">
          <SystemStatusStrip />
          <div className="h-5 w-px bg-sky-200" aria-hidden />
          <div className="hidden items-center gap-1.5 rounded-lg border border-sky-200 bg-white px-2.5 py-1.5 text-xs text-slate-500 sm:flex">
            <Clock size={11} className="text-slate-400" />
            <span className="font-mono tabular-nums">{timestamp}</span>
          </div>
          <SyncButton />
        </div>
      </div>
    </motion.header>
  );
}

// ── Page ─────────────────────────────────────────────────

export default function BerandaBPJSPage() {
  const loaded    = useSkeletonDelay(500);

  useEffect(() => {
    seedBerandaBPJSMocks();
  }, []);

  const kpis      = useMemo(() => getBPJSKPIs(), []);
  const navCards  = useMemo(() => getBPJSQuickNav(), []);
  const timestamp = useMemo(() => fmtClockId(new Date()), []);

  return (
    <div className="flex h-full flex-col bg-slate-50">
      <AnimatePresence mode="wait">
        {!loaded ? (
          <motion.div
            key="skel"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
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
            className="flex h-full min-h-0 flex-col"
          >
            <DashboardHeader timestamp={timestamp} />

            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
              <BPJSKPIStrip kpis={kpis} />

              <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-12">
                {/* LEFT — nav modules */}
                <div className="flex min-h-0 flex-col lg:col-span-7">
                  <QuickNavGridBPJS cards={navCards} />
                </div>

                {/* RIGHT — activity sidebar */}
                <div className="min-h-120 lg:col-span-5 lg:min-h-0">
                  <BPJSSidebarPanel />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
