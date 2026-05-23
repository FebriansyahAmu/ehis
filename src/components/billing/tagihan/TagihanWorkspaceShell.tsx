"use client";

import { motion } from "framer-motion";
import { Rows3, Rows2, AlignJustify } from "lucide-react";
import { QUICK_TABS, type TagihanFilterState, type QuickTab, type Density } from "./tagihanShared";
import TagihanTable from "./parts/TagihanTable";
import { cn } from "@/lib/utils";

interface Props {
  filters: TagihanFilterState;
  onQuickTab: (tab: QuickTab) => void;
  onDensity: (density: Density) => void;
  onResetFilters: () => void;
}

export default function TagihanWorkspaceShell({ filters, onQuickTab, onDensity, onResetFilters }: Props) {
  return (
    <section
      aria-label="Workspace Tagihan"
      className="flex h-full min-h-0 flex-col overflow-hidden bg-white ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-slate-800 lg:rounded-xl"
    >
      {/* Toolbar: Quick Tabs + Density toggle */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-2.5 dark:border-slate-800">
        <nav aria-label="Quick filter tabs" className="flex flex-wrap gap-1">
          {QUICK_TABS.map((t) => (
            <QuickTabBtn
              key={t.value}
              active={filters.quickTab === t.value}
              onClick={() => onQuickTab(t.value)}
              label={t.label}
              count={t.count}
            />
          ))}
        </nav>

        <DensityToggle density={filters.density} onChange={onDensity} />
      </header>

      {/* Body: TagihanTable (BL1.2) */}
      <div className="min-h-0 flex-1 overflow-hidden">
        <TagihanTable filters={filters} onResetFilters={onResetFilters} />
      </div>
    </section>
  );
}

// ── Quick Tab ───────────────────────────────────────────

function QuickTabBtn({
  active, onClick, label, count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "group relative inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12.5px] font-medium transition-all duration-200",
        active
          ? "bg-amber-50 text-amber-800 ring-1 ring-amber-200"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-800 dark:text-slate-300 dark:hover:bg-slate-900",
      )}
    >
      <span>{label}</span>
      {typeof count === "number" && (
        <span
          className={cn(
            "rounded-full px-1.5 py-0.5 font-mono text-[10px] font-semibold transition-colors",
            active
              ? "bg-amber-200/70 text-amber-800"
              : "bg-slate-100 text-slate-500 group-hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400",
          )}
        >
          {count}
        </span>
      )}
      {active && (
        <motion.span
          layoutId="quick-tab-underline"
          className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-amber-500"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}
    </button>
  );
}

// ── Density Toggle ──────────────────────────────────────

const DENSITY_OPTIONS: { value: Density; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { value: "compact",     label: "Compact",     icon: AlignJustify },
  { value: "comfortable", label: "Comfortable", icon: Rows3        },
  { value: "cozy",        label: "Cozy",        icon: Rows2        },
];

function DensityToggle({ density, onChange }: { density: Density; onChange: (d: Density) => void }) {
  return (
    <div
      role="radiogroup"
      aria-label="Density tabel"
      className="inline-flex items-center gap-0.5 rounded-md bg-slate-100 p-0.5 dark:bg-slate-900"
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
                ? "bg-white text-slate-800 shadow-sm ring-1 ring-slate-200 dark:bg-slate-700 dark:text-slate-100 dark:ring-slate-600"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200",
            )}
          >
            <Icon size={13} />
          </button>
        );
      })}
    </div>
  );
}

