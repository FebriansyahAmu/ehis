"use client";

/**
 * KlaimTable — sticky-header table untuk Klaim Board (EK2.2).
 *
 * Struktur:
 *  - Sticky thead (z-10 · bg slate-50)
 *  - Body: tr per claim via KlaimRow
 *  - Footer summary outside (KlaimTableFooter)
 *  - Empty state inline (KlaimEmptyState)
 *
 * Sort 3-state via header button (asc → desc → null) untuk 7 kolom sortable.
 * Selection state: lifted ke parent (KlaimWorkspaceShell) — table jadi controlled.
 */

import { useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ClaimRecord } from "@/lib/eklaim/eklaimShared";
import type { Density } from "../klaimBoardShared";
import type { KebabActionKey, SortKey, SortState } from "../klaimBoardLogic";

import KlaimRow from "./KlaimRow";
import KlaimEmptyState from "./KlaimEmptyState";
import KlaimTableFooter from "./KlaimTableFooter";
import {
  ALIGN_CLASS,
  COLUMN_DEFS,
  DENSITY_TOKENS,
  TABLE_MIN_WIDTH,
  type ColumnDef,
} from "./tableTokens";

interface Props {
  rows: ReadonlyArray<ClaimRecord>;
  density: Density;
  selected: ReadonlySet<string>;
  sort: SortState;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: (select: boolean) => void;
  onSort: (key: SortKey) => void;
  onKebabAction: (key: KebabActionKey, claim: ClaimRecord) => void;
  onResetFilters: () => void;
}

export default function KlaimTable({
  rows,
  density,
  selected,
  sort,
  onToggleSelect,
  onToggleSelectAll,
  onSort,
  onKebabAction,
  onResetFilters,
}: Props) {
  const tokens = DENSITY_TOKENS[density];

  // Select-all state
  const allSelected = useMemo(
    () => rows.length > 0 && rows.every((r) => selected.has(r.id)),
    [rows, selected],
  );
  const partialSelected = useMemo(
    () => !allSelected && rows.some((r) => selected.has(r.id)),
    [rows, selected, allSelected],
  );

  if (rows.length === 0) {
    return <KlaimEmptyState onResetFilters={onResetFilters} />;
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Scrollable table container — vertical scroll inside, horizontal scroll fallback */}
      <div className="min-h-0 flex-1 overflow-auto [scrollbar-width:thin]">
        <table
          className="w-full border-collapse text-left"
          style={{ minWidth: TABLE_MIN_WIDTH }}
        >
          {/* Sticky header */}
          <thead className="sticky top-0 z-10 bg-slate-50 backdrop-blur-sm">
            <tr className="border-b border-slate-200">
              {COLUMN_DEFS.map((col) => (
                <HeaderCell
                  key={col.key}
                  col={col}
                  tokens={tokens}
                  sort={sort}
                  allSelected={allSelected}
                  partialSelected={partialSelected}
                  onSort={onSort}
                  onToggleSelectAll={onToggleSelectAll}
                />
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {rows.map((claim, idx) => (
              <KlaimRow
                key={claim.id}
                claim={claim}
                density={density}
                selected={selected.has(claim.id)}
                index={idx}
                onToggleSelect={onToggleSelect}
                onKebabAction={onKebabAction}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer summary */}
      <KlaimTableFooter rows={rows} density={density} />
    </div>
  );
}

// ── Header Cell ────────────────────────────────────────

function HeaderCell({
  col,
  tokens,
  sort,
  allSelected,
  partialSelected,
  onSort,
  onToggleSelectAll,
}: {
  col: ColumnDef;
  tokens: ReturnType<typeof getTokens>;
  sort: SortState;
  allSelected: boolean;
  partialSelected: boolean;
  onSort: (key: SortKey) => void;
  onToggleSelectAll: (select: boolean) => void;
}) {
  // Select-all checkbox cell
  if (col.key === "select") {
    return (
      <th
        scope="col"
        className={cn(
          "sticky top-0 bg-slate-50 align-middle font-semibold text-slate-700",
          tokens.rowPy,
          tokens.rowPx,
          ALIGN_CLASS[col.align],
        )}
        style={{ width: col.width, maxWidth: col.width }}
      >
        <div className="inline-flex items-center justify-center">
          <input
            type="checkbox"
            checked={allSelected}
            ref={(el) => {
              if (el) el.indeterminate = partialSelected;
            }}
            onChange={(e) => onToggleSelectAll(e.target.checked)}
            aria-label={allSelected ? "Batalkan pilih semua" : "Pilih semua"}
            className="h-3.5 w-3.5 cursor-pointer rounded border-slate-300 text-teal-600 focus:ring-2 focus:ring-teal-500/30"
          />
        </div>
      </th>
    );
  }

  // Actions placeholder (no label)
  if (col.key === "actions") {
    return (
      <th
        scope="col"
        className={cn("bg-slate-50", tokens.rowPy, tokens.rowPx)}
        style={{ width: col.width }}
        aria-label="Aksi"
      />
    );
  }

  // Hidden on small breakpoints
  const hideClass = col.hideOnSmall ? "hidden lg:table-cell" : "";

  // Sortable header
  if (col.sortable && col.sortKey) {
    const isActive = sort.key === col.sortKey;
    const dir = isActive ? sort.dir : null;
    const Icon = dir === "asc" ? ArrowUp : dir === "desc" ? ArrowDown : ArrowUpDown;
    const ariaSort: "ascending" | "descending" | "none" =
      dir === "asc" ? "ascending" : dir === "desc" ? "descending" : "none";

    return (
      <th
        scope="col"
        aria-sort={ariaSort}
        className={cn(
          "bg-slate-50 align-middle",
          tokens.rowPy,
          tokens.rowPx,
          hideClass,
        )}
        style={{ width: col.width, maxWidth: col.width }}
      >
        <button
          type="button"
          onClick={() => onSort(col.sortKey as SortKey)}
          className={cn(
            "group inline-flex items-center gap-1 text-left font-semibold uppercase tracking-wide text-slate-600 transition-colors hover:text-teal-700",
            tokens.fontHint,
            col.align === "right" && "flex-row-reverse",
          )}
        >
          <span className="flex flex-col items-start">
            <span>{col.label}</span>
            {col.sublabel && (
              <span className={cn("font-normal normal-case text-slate-400", tokens.fontHint)}>
                {col.sublabel}
              </span>
            )}
          </span>
          <Icon
            size={11}
            strokeWidth={2.4}
            className={cn(
              "transition-colors",
              isActive ? "text-teal-600" : "text-slate-400 group-hover:text-teal-500",
            )}
          />
          {isActive && (
            <motion.span
              layoutId="klaim-sort-indicator"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="ml-0.5 inline-block h-1 w-1 rounded-full bg-teal-500"
            />
          )}
        </button>
      </th>
    );
  }

  // Non-sortable header
  return (
    <th
      scope="col"
      className={cn(
        "bg-slate-50 align-middle font-semibold uppercase tracking-wide text-slate-600",
        tokens.rowPy,
        tokens.rowPx,
        tokens.fontHint,
        ALIGN_CLASS[col.align],
        hideClass,
      )}
      style={{ width: col.width, maxWidth: col.width }}
    >
      <div className="flex flex-col items-start">
        <span>{col.label}</span>
        {col.sublabel && (
          <span className={cn("font-normal normal-case text-slate-400", tokens.fontHint)}>
            {col.sublabel}
          </span>
        )}
      </div>
    </th>
  );
}

function getTokens(density: Density) {
  return DENSITY_TOKENS[density];
}
