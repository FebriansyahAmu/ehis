"use client";

import { motion } from "framer-motion";
import { Inbox, SearchX } from "lucide-react";
import { groupAuditByDate, type AuditEvent } from "@/lib/billing/auditTrail";
import AuditEventRow from "./AuditEventRow";

interface Props {
  events: AuditEvent[];
  hasActiveFilters: boolean;
  onResetFilters: () => void;
}

/**
 * Timeline vertikal grouped per date. Vertical line di kolom-2 (di belakang dot).
 *
 * Empty states: different copy untuk "filter empty" vs "initial empty".
 */
export default function AuditTimeline({ events, hasActiveFilters, onResetFilters }: Props) {
  if (events.length === 0) {
    return <EmptyState hasActiveFilters={hasActiveFilters} onReset={onResetFilters} />;
  }

  const groups = groupAuditByDate(events);

  return (
    <div className="space-y-5">
      {groups.map((group, groupIdx) => (
        <section key={group.dateISO} aria-label={group.dateLabel}>
          {/* Date header — sticky inside scroll container */}
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="sticky top-0 z-10 -mx-1 mb-2 flex items-center gap-2 bg-gradient-to-b from-white via-white/95 to-white/0 px-1 pb-2 pt-1 backdrop-blur-sm dark:from-slate-950 dark:via-slate-950/95"
          >
            <div className="flex h-7 items-center gap-2 rounded-full bg-slate-100 px-2.5 ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
              <span className="font-mono text-[10.5px] font-semibold tabular-nums text-slate-500">
                {group.dateISO}
              </span>
              <span className="h-3 w-px bg-slate-300 dark:bg-slate-600" />
              <span className="text-[11.5px] font-semibold text-slate-700 dark:text-slate-200">
                {group.dateLabel}
              </span>
              <span className="ml-1 rounded-full bg-white px-1.5 py-0.5 font-mono text-[9.5px] font-semibold tabular-nums text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700">
                {group.events.length}
              </span>
            </div>
          </motion.div>

          {/* Events list with vertical line behind col 2 */}
          <ul className="relative ml-0">
            {/* Vertical line — di kolom-2 (44px col-1 + 8px gap + 12px center-of-24px-col2) */}
            <span
              aria-hidden
              className="absolute bottom-0 left-[calc(44px+0.75rem+12px)] top-2 w-px bg-gradient-to-b from-slate-200 via-slate-200 to-transparent dark:from-slate-700 dark:via-slate-700 sm:left-[calc(44px+0.875rem+12px)]"
              style={{ marginLeft: "-0.5px" }}
            />
            {group.events.map((ev, idx) => (
              <AuditEventRow
                key={ev.id}
                event={ev}
                delay={Math.min(0.3, groupIdx * 0.08 + idx * 0.03)}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

// ── Empty states ───────────────────────────────────────

function EmptyState({
  hasActiveFilters, onReset,
}: {
  hasActiveFilters: boolean;
  onReset: () => void;
}) {
  const Icon = hasActiveFilters ? SearchX : Inbox;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col items-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/40 px-6 py-12 text-center dark:border-slate-800 dark:bg-slate-900/30"
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-500 ring-4 ring-slate-100 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-800">
        <Icon size={20} />
      </div>
      <h3 className="text-[13.5px] font-semibold text-slate-700 dark:text-slate-200">
        {hasActiveFilters ? "Tidak ada event dengan filter ini" : "Belum ada event tercatat"}
      </h3>
      <p className="mt-1 max-w-sm text-[11.5px] text-slate-500">
        {hasActiveFilters
          ? "Coba longgarkan filter aktif atau reset ke default."
          : "Event akan otomatis tercatat saat ada mutasi pada invoice (tambah item, pembayaran, finalize, dll)."}
      </p>
      {hasActiveFilters && (
        <button
          type="button"
          onClick={onReset}
          className="mt-3 inline-flex items-center gap-1 rounded-md bg-amber-600 px-3 py-1.5 text-[11.5px] font-semibold text-white shadow-sm transition-all hover:bg-amber-700 active:scale-[0.97]"
        >
          Reset semua filter
        </button>
      )}
    </motion.div>
  );
}
