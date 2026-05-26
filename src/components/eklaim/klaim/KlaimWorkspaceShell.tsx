"use client";

/**
 * KlaimWorkspaceShell — workspace pane kanan (EK2.1).
 *
 * Layout:
 *  - Header: Quick Tabs (5) + Density toggle + bulk indicator slot
 *  - Body: results pane (currently `KlaimResultsPlaceholder`, akan diganti `KlaimTable` di EK2.2)
 *
 * Quick tab counts computed dinamis terhadap filter sidebar aktif
 * (lihat `computeQuickTabCounts` di klaimBoardLogic).
 */

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Rows3, Rows2, AlignJustify } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  QUICK_TABS,
  KLAIM_TONE,
  type KlaimFilterState,
  type QuickTab,
  type Density,
  type KlaimTone,
} from "./klaimBoardShared";
import { computeQuickTabCounts, KLAIM_BOARD_MOCK } from "./klaimBoardLogic";
import KlaimResultsPlaceholder from "./parts/KlaimResultsPlaceholder";

interface Props {
  filters: KlaimFilterState;
  onQuickTab: (tab: QuickTab) => void;
  onDensity: (density: Density) => void;
  onResetFilters: () => void;
}

export default function KlaimWorkspaceShell({
  filters,
  onQuickTab,
  onDensity,
  onResetFilters,
}: Props) {
  const quickTabCounts = useMemo(
    () => computeQuickTabCounts(KLAIM_BOARD_MOCK, filters),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      filters.search,
      filters.periodeFrom,
      filters.periodeTo,
      filters.units,
      filters.kelas,
      filters.penjamin,
      filters.penjaminNama,
      filters.status,
      filters.era,
    ],
  );

  return (
    <section
      aria-label="Workspace Klaim Board"
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl bg-white ring-1 ring-slate-200"
    >
      {/* Toolbar: Quick Tabs + Density */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-2.5">
        <nav aria-label="Quick filter tabs" className="flex flex-wrap gap-1">
          {QUICK_TABS.map((t) => (
            <QuickTabBtn
              key={t.value}
              active={filters.quickTab === t.value}
              onClick={() => onQuickTab(t.value)}
              label={t.label}
              count={quickTabCounts[t.value]}
              tone={t.tone}
            />
          ))}
        </nav>

        <DensityToggle density={filters.density} onChange={onDensity} />
      </header>

      {/* Body: results pane */}
      <div className="min-h-0 flex-1 overflow-hidden">
        <KlaimResultsPlaceholder filters={filters} onResetFilters={onResetFilters} />
      </div>
    </section>
  );
}

// ── Quick Tab Button ───────────────────────────────────

function QuickTabBtn({
  active,
  onClick,
  label,
  count,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  tone: KlaimTone;
}) {
  const isEmpty = count === 0;
  const palette = KLAIM_TONE[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={isEmpty ? `Tidak ada klaim "${label}" pada filter saat ini` : undefined}
      className={cn(
        "group relative inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12.5px] font-medium transition-all duration-200",
        active
          ? cn(palette.chipBg, palette.chipText, "ring-1", palette.chipRing)
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-800",
        !active && isEmpty && "opacity-55",
      )}
    >
      <span>{label}</span>
      <span
        className={cn(
          "rounded-full px-1.5 py-0.5 font-mono text-[11px] font-semibold tabular-nums transition-colors",
          active
            ? cn("ring-1", palette.chipRing, "bg-white", palette.chipText)
            : isEmpty
              ? "bg-slate-50 text-slate-400 ring-1 ring-slate-100"
              : "bg-slate-100 text-slate-500 group-hover:bg-slate-200",
        )}
      >
        {count}
      </span>
      {active && (
        <motion.span
          layoutId="klaim-quick-tab-underline"
          className={cn(
            "absolute inset-x-2 -bottom-px h-0.5 rounded-full",
            palette.dot,
          )}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}
    </button>
  );
}

// ── Density Toggle ─────────────────────────────────────

const DENSITY_OPTIONS: {
  value: Density;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}[] = [
  { value: "compact",     label: "Compact",     icon: AlignJustify },
  { value: "comfortable", label: "Comfortable", icon: Rows3        },
  { value: "cozy",        label: "Cozy",        icon: Rows2        },
];

function DensityToggle({
  density,
  onChange,
}: {
  density: Density;
  onChange: (d: Density) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Density tabel"
      className="inline-flex items-center gap-0.5 rounded-md bg-slate-100 p-0.5"
    >
      {DENSITY_OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = density === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(value)}
            title={label}
            className={cn(
              "inline-flex h-7 w-7 items-center justify-center rounded transition-all duration-150",
              active
                ? "bg-white text-teal-700 shadow-sm ring-1 ring-teal-200"
                : "text-slate-500 hover:text-slate-700",
            )}
          >
            <Icon size={13} />
          </button>
        );
      })}
    </div>
  );
}
