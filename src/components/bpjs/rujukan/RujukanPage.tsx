"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Route, CheckCircle, BookMarked } from "lucide-react";
import { cn } from "@/lib/utils";
import { RUJUKAN_MOCK, RUJUKAN_KHUSUS_MOCK } from "@/lib/bpjs/mock/rujukanMock";
import type { SearchState } from "./rujukanShared";
import CariRujukanForm from "./CariRujukanForm";
import RujukanResultsPanel from "./RujukanResultsPanel";
import ReferensiPanel from "./ReferensiPanel";

// ── Skeleton ───────────────────────────────────────────

function Bone({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-slate-100", className)} />;
}

function PageSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-col gap-2">
        <Bone className="h-3 w-28" />
        <Bone className="h-5 w-40" />
        <Bone className="h-3 w-80" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => <Bone key={i} className="h-16 rounded-2xl" />)}
      </div>
      <div className="flex flex-col gap-4 lg:flex-row">
        <Bone className="h-135 w-full rounded-2xl lg:w-75" />
        <Bone className="h-135 flex-1 rounded-2xl" />
        <Bone className="h-135 flex-1 rounded-2xl" />
      </div>
    </div>
  );
}

// ── Stat Card ──────────────────────────────────────────

function StatCard({
  icon: Icon, label, value, sub, iconCls, delay = 0,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
  iconCls: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: "easeOut" }}
      className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm"
    >
      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", iconCls)}>
        <Icon size={15} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium text-slate-500">{label}</p>
        <p className="mt-0.5 text-xl font-black leading-none text-slate-900">{value}</p>
        <p className="mt-0.5 text-[10px] text-slate-400">{sub}</p>
      </div>
    </motion.div>
  );
}

// ── Page ───────────────────────────────────────────────

export default function RujukanPage() {
  const [loaded, setLoaded] = useState(false);
  const [searchState, setSearchState] = useState<SearchState>({ status: "idle" });

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 600);
    return () => clearTimeout(t);
  }, []);

  const stats = useMemo(() => {
    const total  = RUJUKAN_MOCK.length;
    const aktif  = RUJUKAN_MOCK.filter((r) => r.status === "Aktif").length;
    const khusus = RUJUKAN_KHUSUS_MOCK.length;
    return { total, aktif, khusus };
  }, []);

  return (
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
          className="flex h-full flex-col gap-4 p-6"
        >
          {/* Header */}
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-teal-600">
              EHIS BPJS · V-Claim
            </p>
            <h1 className="mt-0.5 text-base font-bold text-slate-900">Rujukan</h1>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Cari rujukan <span className="font-semibold">FKTP / FKRTL</span> by No. Rujukan atau No. Kartu ·
              List rujukan khusus kronik per bulan.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard
              icon={Route}
              label="Total Rujukan Masuk"
              value={`${stats.total}`}
              sub="FKTP + FKRTL seed mock"
              iconCls="bg-teal-100 text-teal-600"
              delay={0}
            />
            <StatCard
              icon={CheckCircle}
              label="Rujukan Aktif"
              value={`${stats.aktif}`}
              sub="masa berlaku belum habis"
              iconCls="bg-emerald-100 text-emerald-600"
              delay={0.07}
            />
            <StatCard
              icon={BookMarked}
              label="Rujukan Khusus"
              value={`${stats.khusus}`}
              sub="kronik terdaftar"
              iconCls="bg-amber-100 text-amber-600"
              delay={0.14}
            />
          </div>

          {/* Three-panel */}
          <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
            <CariRujukanForm
              isLoading={searchState.status === "loading"}
              onStateChange={setSearchState}
            />
            <RujukanResultsPanel state={searchState} />
            <ReferensiPanel />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
