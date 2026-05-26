"use client";

/**
 * KlaimWorkspaceShell — workspace pane kanan (EK2.1 + EK2.2).
 *
 * Layout:
 *  - Header: Quick Tabs (5) + Density toggle
 *  - Body: KlaimTable (sticky-header table) — EK2.2
 *  - Floating: KlaimBulkBar (slide-up dari bottom saat selected > 0)
 *
 * State yang dilift ke sini:
 *  - selected: Set<string>     (claim IDs)
 *  - sort: SortState            (key + dir)
 *  - Reset selected saat filter berubah (kecuali quickTab/density)
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
import {
  computeQuickTabCounts,
  applyAllFilters,
  applySort,
  cycleSort,
  defaultSort,
  KLAIM_BOARD_MOCK,
  type SortState,
  type SortKey,
  type KebabActionKey,
} from "./klaimBoardLogic";
import KlaimTable from "./parts/KlaimTable";
import KlaimBulkBar from "./parts/KlaimBulkBar";
import type { ClaimRecord } from "@/lib/eklaim/eklaimShared";

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
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [sort, setSort] = useState<SortState>(defaultSort);

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

  // Filtered + sorted rows
  const rows = useMemo(() => {
    const filtered = applyAllFilters(KLAIM_BOARD_MOCK, filters);
    return applySort(filtered, sort);
  }, [filters, sort]);

  // Reset selection saat filter penting berubah — selection terhadap rows yang
  // hilang dari view bisa misleading. Density/quickTab tidak trigger reset.
  const filterStampRef = useRef<string>("");
  const filterStamp = useMemo(
    () =>
      JSON.stringify({
        search: filters.search,
        periodeFrom: filters.periodeFrom,
        periodeTo: filters.periodeTo,
        units: filters.units,
        kelas: filters.kelas,
        penjamin: filters.penjamin,
        penjaminNama: filters.penjaminNama,
        status: filters.status,
        era: filters.era,
      }),
    [filters],
  );
  useEffect(() => {
    if (filterStampRef.current !== "" && filterStampRef.current !== filterStamp) {
      setSelected(new Set());
    }
    filterStampRef.current = filterStamp;
  }, [filterStamp]);

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleSelectAll = (select: boolean) => {
    setSelected(() => {
      if (!select) return new Set();
      return new Set(rows.map((r) => r.id));
    });
  };

  const handleClearSelection = () => setSelected(new Set());

  // Sort handler
  const handleSort = (key: SortKey) => {
    setSort((prev) => cycleSort(prev, key));
  };

  // Kebab action — TODO wire real handlers di EK3+ (saat detail page + modal exist)
  const handleKebabAction = (key: KebabActionKey, claim: ClaimRecord) => {
    switch (key) {
      case "buka-detail":
        router.push(`/ehis-eklaim/klaim/${claim.id}`);
        break;
      case "edit-koding":
      case "submit-klaim":
      case "cek-eligibility":
      case "generate-berkas":
      case "lihat-timeline":
      case "ajukan-banding":
      case "write-off":
      case "hapus-draft":
        // Placeholder feedback — replaced dengan modal/toast di EK3+
        if (typeof window !== "undefined") {
          // Soft notice — tidak blocking
          console.info(`[Klaim ${claim.noKlaim}] aksi "${key}" — pending EK3 implementation`);
        }
        break;
    }
  };

  // Bulk action handlers (mock stubs)
  const selectedClaims = useMemo(
    () => rows.filter((r) => selected.has(r.id)),
    [rows, selected],
  );

  const handleBulkSubmit = (claims: ReadonlyArray<ClaimRecord>) => {
    console.info(`[Bulk Submit] ${claims.length} klaim → V-Claim mock submission (EK0.4 ready)`);
    // EK0.4 adapter sudah ready, integration di EK3.5
  };

  const handleBulkEligibility = (claims: ReadonlyArray<ClaimRecord>) => {
    console.info(`[Bulk Eligibility] ${claims.length} klaim → V-Claim checkSEP mock`);
  };

  const handleBulkBerkas = (claims: ReadonlyArray<ClaimRecord>) => {
    console.info(`[Bulk Berkas] ${claims.length} klaim → generate PDF (mock)`);
  };

  return (
    <section
      aria-label="Workspace Klaim Board"
      className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-xl bg-white ring-1 ring-slate-200"
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

      {/* Body: KlaimTable */}
      <div className="min-h-0 flex-1 overflow-hidden">
        <KlaimTable
          rows={rows}
          density={filters.density}
          selected={selected}
          sort={sort}
          onToggleSelect={handleToggleSelect}
          onToggleSelectAll={handleToggleSelectAll}
          onSort={handleSort}
          onKebabAction={handleKebabAction}
          onResetFilters={onResetFilters}
        />
      </div>

      {/* Bulk bar (floating absolute) */}
      <KlaimBulkBar
        selectedClaims={selectedClaims}
        onClear={handleClearSelection}
        onSubmitBatch={handleBulkSubmit}
        onCekEligibility={handleBulkEligibility}
        onGenerateBerkas={handleBulkBerkas}
      />
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
          className={cn("absolute inset-x-2 -bottom-px h-0.5 rounded-full", palette.dot)}
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
