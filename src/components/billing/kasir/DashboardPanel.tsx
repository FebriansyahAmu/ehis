"use client";

import ActiveShiftCard from "./ActiveShiftCard";
import EmptyShiftState from "./EmptyShiftState";
import ShiftKPIStrip from "./ShiftKPIStrip";
import ShiftMethodBreakdown from "./ShiftMethodBreakdown";
import RecentShiftsTable, { type ShiftRowAction } from "./RecentShiftsTable";
import type { KasirShift } from "@/lib/billing/kasirShiftMock";
import { cn } from "@/lib/utils";

interface Props {
  activeShift: KasirShift | null;
  recents: KasirShift[];
  shifts: KasirShift[];
  excludeKasir: string;
  onBukaShift: () => void;
  onTutupShift: () => void;
  onShiftAction?: (action: ShiftRowAction, shift: KasirShift) => void;
}

/**
 * Dashboard Panel (BL3.1) — extracted dari `KasirCounterPage` agar tab body
 * modular. Layout 2-col: Left ActiveShift + Breakdown + Recent · Right KPI + OtherCounters.
 */
export default function DashboardPanel({
  activeShift, recents, shifts, excludeKasir, onBukaShift, onTutupShift, onShiftAction,
}: Props) {
  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      {/* Left column */}
      <div className="space-y-4">
        {activeShift ? (
          <>
            <ActiveShiftCard shift={activeShift} onTutupShift={onTutupShift} />
            <ShiftMethodBreakdown breakdown={activeShift.totalByMetode} />
          </>
        ) : (
          <EmptyShiftState onBukaShift={onBukaShift} />
        )}

        <RecentShiftsTable shifts={recents} onAction={onShiftAction} />
      </div>

      {/* Right column */}
      <aside className="space-y-4">
        <ShiftKPIStrip />
        <OtherCountersStrip shifts={shifts} excludeKasir={excludeKasir} />
      </aside>
    </div>
  );
}

// ── Other counters strip ───────────────────────────────

function OtherCountersStrip({
  shifts, excludeKasir,
}: {
  shifts: KasirShift[];
  excludeKasir: string;
}) {
  const others = shifts.filter((s) => s.status === "Open" && s.kasirNama !== excludeKasir);
  if (others.length === 0) return null;

  return (
    <section
      aria-label="Counter Lain"
      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="border-b border-slate-100 px-3 py-2 dark:border-slate-800">
        <h3 className="text-[11.5px] font-semibold text-slate-800 dark:text-slate-100">
          Counter Lain (sedang aktif)
        </h3>
        <p className="text-[10px] text-slate-500">
          {others.length} kasir lain juga sedang shift
        </p>
      </div>
      <ul className="divide-y divide-slate-100 dark:divide-slate-800/60">
        {others.map((s) => (
          <li key={s.id} className={cn("flex items-center justify-between gap-2 px-3 py-2")}>
            <div className="min-w-0">
              <p className="truncate text-[11.5px] font-semibold text-slate-700 dark:text-slate-200">
                {s.kasirNama}
              </p>
              <p className="font-mono text-[10px] text-slate-500">
                {s.counter} · {s.totalTransaksi} trx
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              <span className="h-1 w-1 animate-pulse rounded-full bg-emerald-500" />
              Open
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
