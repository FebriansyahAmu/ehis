"use client";

/**
 * Beranda Billing — landing dashboard untuk modul `/ehis-billing`.
 *
 * Pattern mirror Beranda Master (Phase 3.1) tapi accent amber + data billing.
 * Layout 12-kolom:
 *   - Hero (eyebrow + title + description + timestamp pill)
 *   - KPIStripBilling (5 hero card amber/rose/sky/emerald/violet)
 *   - Grid 12: kiri (lg:col-span-8) = QuickNavGrid · kanan (lg:col-span-4) = 3 panel
 *
 * Loading state: skeleton 500ms → fade-in motion.
 */

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, Clock } from "lucide-react";
import { useSkeletonDelay } from "@/components/master/shared";
import { cn } from "@/lib/utils";
import {
  getBillingStats,
  getBillingQuickNavGroups,
} from "./berandaBillingShared";
import KPIStripBilling from "./KPIStripBilling";
import QuickNavGridBilling from "./QuickNavGridBilling";
import PasienSiapBayarPanel from "./PasienSiapBayarPanel";
import KlaimHariIniPanel from "./KlaimHariIniPanel";
import RecentPaymentsPanel from "./RecentPaymentsPanel";

// ── Skeleton ────────────────────────────────────────────

function Bone({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-slate-100", className)} />;
}

function PageSkeleton() {
  return (
    <div className="flex h-full flex-col gap-4 p-4 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <Bone className="h-3 w-32" />
          <Bone className="h-6 w-56" />
          <Bone className="h-3 w-80" />
        </div>
        <Bone className="h-8 w-28" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => <Bone key={i} className="h-24 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="flex flex-col gap-3 lg:col-span-8">
          {Array.from({ length: 3 }).map((_, i) => <Bone key={i} className="h-40 rounded-xl" />)}
        </div>
        <div className="flex flex-col gap-3 lg:col-span-4">
          <Bone className="h-72 rounded-xl" />
          <Bone className="h-72 rounded-xl" />
          <Bone className="h-72 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────

export default function BerandaBillingPage() {
  const loaded = useSkeletonDelay(500);
  const stats = useMemo(() => getBillingStats(), []);
  const groups = useMemo(() => getBillingQuickNavGroups(stats), [stats]);

  const timestamp = useMemo(() => {
    const d = new Date();
    return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  }, []);

  return (
    <div className="flex h-full flex-col">
      <AnimatePresence mode="wait">
        {!loaded ? (
          <motion.div key="skel" exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="h-full">
            <PageSkeleton />
          </motion.div>
        ) : (
          <motion.div
            key="page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto p-4 sm:p-6"
          >
            {/* ── Hero ──────────────────────────────────── */}
            <motion.header
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-start justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-50 ring-1 ring-amber-100">
                    <Wallet size={12} className="text-amber-600" />
                  </span>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-600">
                    EHIS Billing · Beranda
                  </p>
                </div>
                <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  Pusat Tagihan & Pembayaran
                </h1>
                <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-500 sm:text-[13px]">
                  Pantau tagihan harian, outstanding pasien, status klaim BPJS/Asuransi, dan
                  aktivitas counter kasir lintas unit. Setiap pelayanan klinis yang selesai
                  otomatis menjadi charge di tagihan kunjungan — kasir = aggregator, bukan re-entry.
                </p>
              </div>
              <div className="hidden shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10.5px] text-slate-600 shadow-sm sm:flex">
                <Clock size={11} className="text-slate-400" />
                <span className="font-medium">Snapshot</span>
                <span className="font-mono tabular-nums font-bold text-slate-800">{timestamp}</span>
              </div>
            </motion.header>

            {/* ── KPI Strip ─────────────────────────────── */}
            <KPIStripBilling stats={stats} />

            {/* ── Body Grid ─────────────────────────────── */}
            <div className="grid min-h-0 grid-cols-1 gap-4 lg:grid-cols-12">
              <div className="min-w-0 lg:col-span-8">
                <QuickNavGridBilling groups={groups} />
              </div>
              <aside className="flex min-w-0 flex-col gap-4 lg:col-span-4">
                <PasienSiapBayarPanel />
                <KlaimHariIniPanel />
                <RecentPaymentsPanel />
              </aside>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
