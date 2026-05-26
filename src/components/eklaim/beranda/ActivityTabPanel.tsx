"use client";

/**
 * Activity Tab Panel — sidebar tabbed orchestrator.
 *
 * Replaces 3 stacked panels (Butuh Banding · Akan Expired · Recent Submission)
 * dengan single tabbed container untuk eliminate vertical scroll.
 *
 * Features:
 *  - 3 tab dengan count badge dinamis
 *  - Active indicator via `motion.layoutId`
 *  - Content fade-slide transition antar tab
 *  - Footer aksi yang adaptif per tab
 *  - Single scrollable area (max-h fixed) — content fit dalam panel
 */

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  AlertTriangle,
  History,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  getButuhBanding,
  getAkanExpired,
  getRecentSubmissions,
  type EklaimTone,
} from "./berandaEklaimShared";
import ButuhBandingPanel from "./ButuhBandingPanel";
import AkanExpiredPanel from "./AkanExpiredPanel";
import RecentSubmissionPanel from "./RecentSubmissionPanel";

// ── Tab Definition ─────────────────────────────────────

type TabKey = "banding" | "expired" | "recent";

interface TabDef {
  key: TabKey;
  label: string;
  icon: LucideIcon;
  count: number;
  tone: EklaimTone;
  footerLabel: string;
  footerHref: string;
  footerSoon?: boolean;
}

function getTabs(): TabDef[] {
  return [
    {
      key: "banding",
      label: "Banding",
      icon: FileText,
      count: getButuhBanding(99).length,
      tone: "rose",
      footerLabel: "Buka modul Banding",
      footerHref: "/ehis-eklaim/banding",
      footerSoon: true,
    },
    {
      key: "expired",
      label: "Expired",
      icon: AlertTriangle,
      count: getAkanExpired(99).length,
      tone: "amber",
      footerLabel: "Buka belum submit",
      footerHref: "/ehis-eklaim/klaim?status=belum-submit",
      footerSoon: true,
    },
    {
      key: "recent",
      label: "Recent",
      icon: History,
      count: getRecentSubmissions(99).length,
      tone: "teal",
      footerLabel: "Buka Klaim Board",
      footerHref: "/ehis-eklaim/klaim",
      footerSoon: true,
    },
  ];
}

// ── Tab Button ─────────────────────────────────────────

const TONE_TEXT: Record<EklaimTone, string> = {
  teal: "text-teal-700",
  amber: "text-amber-700",
  rose: "text-rose-700",
  emerald: "text-emerald-700",
  sky: "text-sky-700",
  slate: "text-slate-700",
};

const TONE_BADGE: Record<EklaimTone, string> = {
  teal: "bg-teal-100 text-teal-700",
  amber: "bg-amber-100 text-amber-700",
  rose: "bg-rose-100 text-rose-700",
  emerald: "bg-emerald-100 text-emerald-700",
  sky: "bg-sky-100 text-sky-700",
  slate: "bg-slate-100 text-slate-700",
};

const TONE_FOOTER: Record<EklaimTone, string> = {
  teal: "text-teal-700 hover:text-teal-800",
  amber: "text-amber-700 hover:text-amber-800",
  rose: "text-rose-700 hover:text-rose-800",
  emerald: "text-emerald-700 hover:text-emerald-800",
  sky: "text-sky-700 hover:text-sky-800",
  slate: "text-slate-700 hover:text-slate-800",
};

function TabButton({
  def,
  active,
  onClick,
}: {
  def: TabDef;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = def.icon;
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className="group relative flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[11.5px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
    >
      {active && (
        <motion.span
          layoutId="activity-tab-active"
          className="absolute inset-0 rounded-lg bg-white shadow-sm ring-1 ring-slate-200"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}
      <span className={cn("relative flex items-center gap-1.5", active ? TONE_TEXT[def.tone] : "text-slate-500 group-hover:text-slate-700")}>
        <Icon size={12} strokeWidth={2.4} />
        <span>{def.label}</span>
        <span
          className={cn(
            "ml-0.5 rounded-full px-1.5 py-px text-[9.5px] font-bold tabular-nums",
            active ? TONE_BADGE[def.tone] : "bg-slate-200 text-slate-600",
          )}
        >
          {def.count}
        </span>
      </span>
    </button>
  );
}

// ── Tab Content Renderer ───────────────────────────────

function TabContent({ tab }: { tab: TabKey }) {
  switch (tab) {
    case "banding":
      return <ButuhBandingPanel />;
    case "expired":
      return <AkanExpiredPanel />;
    case "recent":
    default:
      return <RecentSubmissionPanel />;
  }
}

// ── Main ───────────────────────────────────────────────

export default function ActivityTabPanel() {
  const [active, setActive] = useState<TabKey>("banding");
  const tabs = getTabs();
  const activeTab = tabs.find((t) => t.key === active) ?? tabs[0];

  return (
    <motion.section
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: 0.15 }}
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
    >
      {/* Tab Bar */}
      <div
        role="tablist"
        className="flex items-center gap-0.5 border-b border-slate-200/80 bg-slate-50/50 p-1.5"
      >
        {tabs.map((tab) => (
          <TabButton
            key={tab.key}
            def={tab}
            active={tab.key === active}
            onClick={() => setActive(tab.key)}
          />
        ))}
      </div>

      {/* Tab Content — hidden scrollbar keeps layout clean */}
      <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, x: 6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            transition={{ duration: 0.18 }}
          >
            <TabContent tab={active} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-slate-100 bg-slate-50/60 px-3 py-2">
        <Link
          href={activeTab.footerHref}
          className={cn(
            "flex items-center justify-between text-[10.5px] font-semibold transition",
            TONE_FOOTER[activeTab.tone],
          )}
        >
          <span>{activeTab.footerLabel}</span>
          <span className="flex items-center gap-1">
            {activeTab.footerSoon && (
              <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-slate-600">
                Soon
              </span>
            )}
            <ChevronRight size={12} />
          </span>
        </Link>
      </div>
    </motion.section>
  );
}
