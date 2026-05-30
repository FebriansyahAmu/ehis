"use client";

/**
 * BPJS Sidebar Panel — Live Calls + Reference Status (pill-tab design).
 *
 * Calls: timeline rows with check/x icon + method badge + actor.
 * Reference: summary bar (fresh/stale/expired counts) + per-kind rows.
 * Tab nav: segmented pill (white card on slate-100 bg) with spring animation.
 */

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Database,
  RefreshCw,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  Clock,
  Settings2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { getAuditEntries, subscribeAudit } from "@/lib/bpjs/auditStore";
import { invalidateAll } from "@/lib/bpjs/referenceCache";
import {
  BPJS_TONE,
  fmtAgo,
  getRecentCalls,
  getReferenceRows,
  toneForMethod,
  truncateMiddle,
  type ReferenceRowVm,
} from "./berandaBPJSShared";

type SidebarTab = "calls" | "reference";

// ── Recent Calls ──────────────────────────────────────────

const METHOD_CLS: Record<string, string> = {
  GET:    "bg-sky-100 text-sky-700",
  POST:   "bg-emerald-100 text-emerald-700",
  PUT:    "bg-amber-100 text-amber-700",
  DELETE: "bg-rose-100 text-rose-700",
};

function RecentCallsList() {
  useSyncExternalStore(subscribeAudit, getAuditEntries, () => []);
  const rows = getRecentCalls(12);

  if (rows.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
          <Activity size={18} className="text-slate-400" strokeWidth={2} />
        </div>
        <p className="text-sm font-medium text-slate-600">Belum ada audit call</p>
        <p className="text-xs text-slate-400">API call akan muncul di sini</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100">
      {rows.map(({ entry, agoSec }, rowIdx) => {
        const methodCls  = METHOD_CLS[entry.method] ?? "bg-slate-100 text-slate-600";
        const methodTone = BPJS_TONE[toneForMethod(entry.method)];
        void methodTone;
        return (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.15, delay: rowIdx * 0.025 }}
            className="flex gap-3 px-4 py-3 transition-colors hover:bg-slate-50/80"
          >
            {/* Status icon */}
            <div className="mt-0.5 shrink-0">
              {entry.success ? (
                <CheckCircle2 size={13} className="text-emerald-500" strokeWidth={2.5} />
              ) : (
                <XCircle size={13} className="text-rose-500" strokeWidth={2.5} />
              )}
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "shrink-0 rounded-md px-1.5 py-0.5 font-mono text-xs font-bold",
                    methodCls,
                  )}
                >
                  {entry.method}
                </span>
                <span
                  title={entry.endpoint}
                  className="min-w-0 flex-1 truncate font-mono text-xs text-slate-500"
                >
                  {truncateMiddle(entry.endpoint, 30)}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                <span className="truncate">{entry.actor}</span>
                <span className="text-slate-200">·</span>
                <span className="shrink-0 font-mono tabular-nums">{entry.durationMs}ms</span>
                {entry.errorType && (
                  <>
                    <span className="text-slate-200">·</span>
                    <span className="shrink-0 font-semibold text-rose-500">
                      {entry.errorType}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Ago */}
            <div className="shrink-0 pt-0.5">
              <span className="flex items-center gap-0.5 font-mono text-xs tabular-nums text-slate-400">
                <Clock size={10} strokeWidth={2.5} />
                {fmtAgo(agoSec)}
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ── Reference Status ──────────────────────────────────────

const STALENESS_CFG = {
  fresh:   { dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", label: "Fresh"   },
  stale:   { dot: "bg-amber-500",   badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",       label: "Stale"   },
  expired: { dot: "bg-rose-500",    badge: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",           label: "Expired" },
} as const;

function ReferenceRow({ row, index }: { row: ReferenceRowVm; index: number }) {
  const cfg = STALENESS_CFG[row.status.staleness as keyof typeof STALENESS_CFG] ?? STALENESS_CFG.expired;
  const sub = row.status.lastSyncISO
    ? `${(row.status.entryCount ?? 0).toLocaleString("id-ID")} entri · ${fmtAgo(Math.floor((row.status.ageMs ?? 0) / 1000))} lalu`
    : "Belum di-sync";

  return (
    <motion.li
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.15, delay: index * 0.04 }}
      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50/80"
    >
      <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full shadow-sm", cfg.dot)} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-slate-700">{row.label}</p>
          <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold", cfg.badge)}>
            {cfg.label}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-slate-400">{sub}</p>
      </div>
    </motion.li>
  );
}

const SYNC_INTERVALS = ["1j", "4j", "12j", "24j"] as const;
type SyncInterval = (typeof SYNC_INTERVALS)[number];

function ReferenceList({
  refreshKey,
  onRefresh,
}: {
  refreshKey: number;
  onRefresh: () => void;
}) {
  const rows    = getReferenceRows();
  void refreshKey;

  const fresh   = rows.filter((r) => r.status.staleness === "fresh").length;
  const stale   = rows.filter((r) => r.status.staleness === "stale").length;
  const expired = rows.filter((r) => r.status.staleness === "expired").length;

  const [syncInterval, setSyncInterval] = useState<SyncInterval>("24j");
  const [showIntervalPicker, setShowIntervalPicker] = useState(false);

  return (
    <div className="flex h-full flex-col">
      {/* Summary bar */}
      <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1.5 border-b border-slate-100 px-4 py-2.5 text-xs">
        <span className="flex items-center gap-1 font-semibold text-emerald-600">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {fresh} Fresh
        </span>
        <span className="flex items-center gap-1 font-semibold text-amber-600">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          {stale} Stale
        </span>
        <span className="flex items-center gap-1 font-semibold text-rose-600">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
          {expired} Expired
        </span>
        {/* Auto-sync interval config */}
        <div className="relative ml-auto">
          <button
            type="button"
            onClick={() => setShowIntervalPicker((v) => !v)}
            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-500 transition hover:border-sky-300 hover:text-sky-600"
            title="Konfigurasi interval auto-sync referensi"
          >
            <Settings2 size={9} />
            Auto-sync: {syncInterval}
          </button>
          {showIntervalPicker && (
            <div className="absolute right-0 top-full z-20 mt-1 flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
              {SYNC_INTERVALS.map((iv) => (
                <button
                  key={iv}
                  type="button"
                  onClick={() => { setSyncInterval(iv); setShowIntervalPicker(false); }}
                  className={cn(
                    "px-4 py-1.5 text-left text-[11px] font-medium transition hover:bg-sky-50",
                    iv === syncInterval ? "bg-sky-50 text-sky-700" : "text-slate-600",
                  )}
                >
                  Setiap {iv}
                </button>
              ))}
              <p className="border-t border-slate-100 px-3 py-1.5 text-[9px] text-slate-400">
                Backend scheduled job diperlukan
              </p>
            </div>
          )}
        </div>
      </div>

      <ul className="flex-1 divide-y divide-slate-100 overflow-y-auto">
        {rows.map((row, i) => (
          <ReferenceRow key={row.status.kind} row={row} index={i} />
        ))}
      </ul>

      <div className="shrink-0 border-t border-slate-100 p-3">
        <button
          type="button"
          onClick={onRefresh}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition-all hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
        >
          <RefreshCw size={13} strokeWidth={2.4} />
          Refresh Semua Referensi
        </button>
      </div>
    </div>
  );
}

// ── Segmented Tab Nav ─────────────────────────────────────

const TABS: ReadonlyArray<{
  key: SidebarTab;
  label: string;
  icon: typeof Activity;
}> = [
  { key: "calls",     label: "Live Calls",  icon: Activity  },
  { key: "reference", label: "Referensi",   icon: Database  },
];

// ── Main ──────────────────────────────────────────────────

export default function BPJSSidebarPanel() {
  const [tab, setTab]             = useState<SidebarTab>("calls");
  const [refreshKey, setRefreshKey] = useState(0);

  function handleRefreshAll() {
    invalidateAll();
    setRefreshKey((k) => k + 1);
  }

  return (
    <aside className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-3 py-2.5">
        {/* Segmented pill tabs */}
        <div
          role="tablist"
          aria-label="Sidebar BPJS"
          className="flex items-center gap-0.5 rounded-xl bg-slate-100 p-1"
        >
          {TABS.map((t) => {
            const active = tab === t.key;
            const TIcon  = t.icon;
            return (
              <button
                key={t.key}
                role="tab"
                aria-selected={active}
                type="button"
                onClick={() => setTab(t.key)}
                className="relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
              >
                {active && (
                  <motion.span
                    layoutId="bpjs-sidebar-pill"
                    className="absolute inset-0 rounded-lg bg-white shadow-sm"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <TIcon
                  size={11}
                  strokeWidth={2.5}
                  className={cn(
                    "relative shrink-0 transition-colors",
                    active ? "text-emerald-600" : "text-slate-400",
                  )}
                />
                <span
                  className={cn(
                    "relative transition-colors",
                    active ? "font-semibold text-slate-800" : "text-slate-500",
                  )}
                >
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>

        <Link
          href={
            tab === "calls"
              ? "/ehis-bpjs/audit"
              : "/ehis-bpjs/aplicares/referensi-kamar"
          }
          className="flex items-center gap-0.5 rounded-lg px-2 py-1 text-xs text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        >
          Semua
          <ArrowUpRight size={11} />
        </Link>
      </div>

      {/* Body */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          {tab === "calls" ? (
            <motion.div
              key="calls"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="flex min-h-0 flex-1 flex-col overflow-y-auto"
            >
              <RecentCallsList />
            </motion.div>
          ) : (
            <motion.div
              key="reference"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="flex min-h-0 flex-1 flex-col"
            >
              <ReferenceList refreshKey={refreshKey} onRefresh={handleRefreshAll} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </aside>
  );
}
