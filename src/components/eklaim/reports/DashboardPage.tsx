"use client";

import { useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart2,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Timer,
  Printer,
  LayoutDashboard,
  Users,
} from "lucide-react";
import { useSkeletonDelay } from "@/components/master/shared";
import {
  buildDashboardKPIs,
  type ReportTab,
  type DashboardKPIs,
} from "@/lib/eklaim/dashboardShared";
import ApprovalRatePanel from "./ApprovalRatePanel";
import AgingKlaimPanel from "./AgingKlaimPanel";
import MarginAnalysisPanel from "./MarginAnalysisPanel";
import CoderProductivityPanel from "./CoderProductivityPanel";
import DashboardPrintTemplate from "./DashboardPrintTemplate";

// ── Tab Config ─────────────────────────────────────────

interface TabCfg {
  id: ReportTab;
  label: string;
  sub: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  tone: string;
}

const TABS: TabCfg[] = [
  {
    id: "approval",
    label: "Approval Rate",
    sub: "Tren bulanan & alasan ditolak",
    Icon: TrendingUp,
    tone: "teal",
  },
  {
    id: "aging",
    label: "Aging Klaim",
    sub: "Durasi proses & stuck claims",
    Icon: Clock,
    tone: "sky",
  },
  {
    id: "margin",
    label: "Margin iDRG",
    sub: "Over/under per MDC group",
    Icon: BarChart2,
    tone: "emerald",
  },
  {
    id: "coder",
    label: "Produktivitas Coder",
    sub: "Output koding & turnaround",
    Icon: Users,
    tone: "sky",
  },
];

const PANEL_FADE = {
  initial:   { opacity: 0, y: 8 },
  animate:   { opacity: 1, y: 0 },
  exit:      { opacity: 0, y: -6 },
  transition: { duration: 0.18 },
};

// ── KPI Card types ─────────────────────────────────────

type KPITone = "emerald" | "teal" | "sky" | "amber" | "rose";

const TONE_CLS: Record<KPITone, { icon: string; value: string; bg: string; border: string }> = {
  emerald: { icon: "text-emerald-600 bg-emerald-50", value: "text-emerald-700", bg: "bg-emerald-50/40", border: "border-emerald-100" },
  teal:    { icon: "text-teal-600 bg-teal-50",       value: "text-teal-700",    bg: "bg-teal-50/40",    border: "border-teal-100" },
  sky:     { icon: "text-sky-600 bg-sky-50",          value: "text-sky-700",     bg: "bg-sky-50/40",     border: "border-sky-100" },
  amber:   { icon: "text-amber-600 bg-amber-50",      value: "text-amber-700",   bg: "bg-amber-50/40",   border: "border-amber-100" },
  rose:    { icon: "text-rose-600 bg-rose-50",        value: "text-rose-700",    bg: "bg-rose-50/40",    border: "border-rose-100" },
};

// ── Main Page ──────────────────────────────────────────

export default function DashboardPage() {
  const ready = useSkeletonDelay(500);
  const [activeTab, setActiveTab] = useState<ReportTab>("approval");
  const kpis = useMemo(() => buildDashboardKPIs(), []);

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-50/60">
      <AnimatePresence mode="wait">
        {!ready ? (
          <SkeletonShell key="sk" />
        ) : (
          <motion.div
            key="ready"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="flex min-h-0 flex-1 flex-col"
          >
            <DashboardHero />
            <KPIStrip kpis={kpis} />

            {/* Two-panel body */}
            <div className="flex min-h-0 flex-1 overflow-hidden border-t border-slate-200">
              {/* Left nav */}
              <nav
                aria-label="Pilih laporan"
                className="flex w-52 shrink-0 flex-col border-r border-slate-200 bg-white"
              >
                <p className="px-4 pt-4 pb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Laporan
                </p>
                <div className="flex flex-col gap-0.5 px-2">
                  {TABS.map(t => (
                    <NavTabButton
                      key={t.id}
                      tab={t}
                      active={activeTab === t.id}
                      onClick={() => setActiveTab(t.id)}
                    />
                  ))}
                </div>

                <div className="mt-auto border-t border-slate-100 p-3">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
                  >
                    <Printer size={15} className="shrink-0" />
                    <span>Cetak PDF</span>
                  </button>
                </div>
              </nav>

              {/* Right content area */}
              <div className="min-h-0 flex-1 overflow-y-auto">
                <AnimatePresence mode="wait">
                  {activeTab === "approval" && (
                    <motion.div key="approval" {...PANEL_FADE}>
                      <ApprovalRatePanel />
                    </motion.div>
                  )}
                  {activeTab === "aging" && (
                    <motion.div key="aging" {...PANEL_FADE}>
                      <AgingKlaimPanel />
                    </motion.div>
                  )}
                  {activeTab === "margin" && (
                    <motion.div key="margin" {...PANEL_FADE}>
                      <MarginAnalysisPanel />
                    </motion.div>
                  )}
                  {activeTab === "coder" && (
                    <motion.div key="coder" {...PANEL_FADE}>
                      <CoderProductivityPanel />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Print-only: A4 report for all 4 sections */}
            <DashboardPrintTemplate />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Hero ──────────────────────────────────────────────

function DashboardHero() {
  const timestamp = new Date().toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="relative border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-teal-400 via-emerald-300 to-sky-400" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 ring-1 ring-teal-200">
            <LayoutDashboard size={18} className="text-teal-600" />
          </span>
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-teal-600">
              E-Klaim · Analytics
            </p>
            <h1 className="text-base font-bold text-slate-800">
              Dashboard Analitik Klaim
            </h1>
          </div>
        </div>
        <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-sm font-medium text-teal-600 ring-1 ring-teal-200">
          {timestamp}
        </span>
      </div>
    </div>
  );
}

// ── KPI Strip ─────────────────────────────────────────

function KPIStrip({ kpis }: { kpis: DashboardKPIs }) {
  const cards: {
    label: string;
    value: string;
    sub: string;
    Icon: React.ComponentType<{ size?: number; className?: string }>;
    tone: KPITone;
  }[] = [
    {
      label: "Approval Rate",
      value: `${kpis.approvalRatePct}%`,
      sub: "Klaim bulan ini (decisive)",
      Icon: CheckCircle2,
      tone: kpis.approvalRatePct >= 85 ? "emerald" : kpis.approvalRatePct >= 75 ? "amber" : "rose",
    },
    {
      label: "Klaim Bulan Ini",
      value: kpis.klaimBulanIni.toString(),
      sub: "Total terdaftar Mei 2026",
      Icon: BarChart2,
      tone: "teal",
    },
    {
      label: "Avg. Hari Pending",
      value: `${kpis.avgDaysPending} hr`,
      sub: "Rata-rata verifikasi BPJS",
      Icon: Timer,
      tone: kpis.avgDaysPending <= 30 ? "sky" : kpis.avgDaysPending <= 45 ? "amber" : "rose",
    },
    {
      label: "Stuck > 30 Hari",
      value: kpis.stuckCount.toString(),
      sub: "Perlu follow-up segera",
      Icon: AlertCircle,
      tone: kpis.stuckCount === 0 ? "emerald" : kpis.stuckCount <= 5 ? "amber" : "rose",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:grid-cols-4 sm:px-6">
      {cards.map((c, idx) => {
        const cls = TONE_CLS[c.tone];
        return (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05, duration: 0.2 }}
            className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${cls.bg} ${cls.border}`}
          >
            <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${cls.icon}`}>
              <c.Icon size={16} />
            </span>
            <div className="min-w-0">
              <p className={`text-lg font-bold leading-tight tabular-nums ${cls.value}`}>
                {c.value}
              </p>
              <p className="truncate text-sm text-slate-500">{c.label}</p>
              <p className="truncate text-xs text-slate-400">{c.sub}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ── Nav Tab Button ─────────────────────────────────────

function NavTabButton({
  tab,
  active,
  onClick,
}: {
  tab: TabCfg;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-start gap-2.5 rounded-lg px-3 py-2.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 ${
        active
          ? "bg-teal-50 ring-1 ring-teal-200"
          : "hover:bg-slate-50"
      }`}
    >
      <span
        className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
          active
            ? "bg-teal-100 text-teal-600"
            : "bg-slate-100 text-slate-400"
        }`}
      >
        <tab.Icon size={13} />
      </span>
      <div className="min-w-0">
        <p className={`text-sm font-semibold leading-tight ${active ? "text-teal-700" : "text-slate-700"}`}>
          {tab.label}
        </p>
        <p className="mt-0.5 truncate text-xs text-slate-400">{tab.sub}</p>
      </div>
    </button>
  );
}

// ── Skeleton Shell ─────────────────────────────────────

function SkeletonShell() {
  return (
    <motion.div
      key="sk"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="flex h-full flex-col"
    >
      {/* Hero */}
      <div className="relative border-b border-slate-200 bg-white px-6 py-3">
        <div className="absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-teal-200 via-emerald-200 to-sky-200" />
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 animate-pulse rounded-lg bg-teal-100" />
          <div className="space-y-1.5">
            <div className="h-3 w-32 animate-pulse rounded bg-slate-200" />
            <div className="h-5 w-64 animate-pulse rounded bg-slate-200" />
          </div>
        </div>
      </div>
      {/* KPI strip */}
      <div className="grid grid-cols-4 gap-3 border-b border-slate-200 bg-white px-6 py-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
      {/* Body */}
      <div className="flex flex-1 gap-0 overflow-hidden border-t border-slate-200">
        <div className="w-52 shrink-0 animate-pulse border-r border-slate-200 bg-white" />
        <div className="flex-1 p-6">
          <div className="space-y-4">
            <div className="h-6 w-48 animate-pulse rounded bg-slate-200" />
            <div className="h-48 animate-pulse rounded-xl bg-slate-100" />
            <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
            <div className="h-32 animate-pulse rounded-xl bg-slate-100" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
