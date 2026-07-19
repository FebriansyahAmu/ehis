"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtRupiah } from "../tagihanShared";
import type { TagihanFilterState, Density } from "../tagihanShared";
import {
  applyFilters, applySort, cycleSort, sisa,
  exportTagihanCsv,
  type SortKey, type SortState, type TagihanRow as TagihanRowData,
} from "../tagihanBoardLogic";
import TagihanRow from "./TagihanRow";
import TagihanEmptyState from "./TagihanEmptyState";
import TagihanBulkBar from "./TagihanBulkBar";
import type { ActionKey } from "./TagihanRowActions";

interface Props {
  rows: TagihanRowData[];
  filters: TagihanFilterState;
  onResetFilters: () => void;
}

interface Column {
  key: SortKey | "checkbox" | "unit" | "penjamin" | "lifecycle" | "aksi";
  label: string;
  align: "left" | "right" | "center";
  width: string;          // tailwind w-*
  sortable: boolean;
  hideOn?: "lg" | "xl";   // hide on narrower viewports
}

const COLUMNS: Column[] = [
  { key: "checkbox",  label: "",          align: "center", width: "w-9",    sortable: false },
  { key: "noTagihan", label: "No Tagihan",align: "left",   width: "w-[150px]", sortable: true  },
  { key: "pasien",    label: "Pasien",    align: "left",   width: "w-[180px]", sortable: true  },
  { key: "unit",      label: "Unit",      align: "left",   width: "w-[130px]", sortable: false },
  { key: "penjamin",  label: "Penjamin",  align: "left",   width: "w-[160px]", sortable: false, hideOn: "lg" },
  { key: "total",     label: "Total",     align: "right",  width: "w-[110px]", sortable: true  },
  { key: "dibayar",   label: "Dibayar",   align: "right",  width: "w-[100px]", sortable: true,  hideOn: "lg" },
  { key: "sisa",      label: "Sisa",      align: "right",  width: "w-[110px]", sortable: true  },
  { key: "status",    label: "Status",    align: "left",   width: "w-[140px]", sortable: true  },
  { key: "lifecycle", label: "Finalisasi",align: "center", width: "w-[108px]", sortable: false },
  { key: "aksi",      label: "",          align: "center", width: "w-12",   sortable: false },
];

export default function TagihanTable({ rows, filters, onResetFilters }: Props) {
  const router = useRouter();
  const [sort, setSort] = useState<SortState>({ key: "tanggal", dir: "desc" });
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => applyFilters(rows, filters), [rows, filters]);
  const sorted   = useMemo(() => applySort(filtered, sort), [filtered, sort]);

  const allSelected = sorted.length > 0 && sorted.every((r) => selected.has(r.id));
  const someSelected = !allSelected && sorted.some((r) => selected.has(r.id));

  const toggleAll = () => {
    if (allSelected || someSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(sorted.map((r) => r.id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSort = (key: SortKey) => setSort((prev) => cycleSort(prev, key));
  // Baris = kunjungan nyata → rincian proyeksi (id = kunjunganId).
  const handleOpenDetail = (row: TagihanRowData) => {
    router.push(`/ehis-billing/tagihan/kunjungan/${row.id}`);
  };
  const handleAction = (action: ActionKey, row: TagihanRowData) => {
    if (action === "detail") {
      router.push(`/ehis-billing/tagihan/kunjungan/${row.id}`);
      return;
    }
    console.log("[BL1.2] Action:", action, row.noTagihan);
  };

  // ── Bulk actions (BL1.3) ──
  const handlePrintBatch = (rows: TagihanRowData[]) => {
    console.log("[BL1.3] Print Batch:", rows.map((r) => r.noTagihan));
  };
  const handleSubmitKlaim = (rows: TagihanRowData[]) => {
    console.log("[BL1.3] Submit Klaim:", rows.map((r) => r.noTagihan));
  };
  const handleExportExcel = (rows: TagihanRowData[]) => {
    exportTagihanCsv(rows);
  };

  const hasActiveFilters =
    filters.search.trim() !== "" ||
    filters.units.length > 0 ||
    filters.kelas.length > 0 ||
    filters.penjamin !== "all" ||
    filters.status.length > 0 ||
    filters.quickTab !== "semua";

  const selRows = useMemo(
    () => sorted.filter((r) => selected.has(r.id)),
    [sorted, selected],
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Bulk-action bar (BL1.3) — conditional, animated */}
      <TagihanBulkBar
        selectedRows={selRows}
        onClear={() => setSelected(new Set())}
        onPrintBatch={handlePrintBatch}
        onSubmitKlaim={handleSubmitKlaim}
        onExportExcel={handleExportExcel}
      />

      {/* Table area (internal scroll) */}
      <div className="min-h-0 flex-1 overflow-auto">
        {sorted.length === 0 ? (
          <TagihanEmptyState hasActiveFilters={hasActiveFilters} onReset={onResetFilters} />
        ) : (
          <table className="w-full border-separate border-spacing-0">
            <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm dark:bg-slate-900/95">
              <tr>
                {COLUMNS.map((col) => (
                  <Th
                    key={col.key}
                    col={col}
                    sort={sort}
                    onSort={handleSort}
                    allSelected={allSelected}
                    someSelected={someSelected}
                    onToggleAll={toggleAll}
                  />
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((row, i) => (
                <TagihanRow
                  key={row.id}
                  row={row}
                  index={i}
                  density={filters.density}
                  selected={selected.has(row.id)}
                  onToggleSelect={toggleOne}
                  onOpenDetail={handleOpenDetail}
                  onAction={handleAction}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer summary */}
      <FooterSummary
        total={sorted.length}
        density={filters.density}
        totalRp={sorted.reduce((s, r) => s + r.total, 0)}
        sisaRp={sorted.reduce((s, r) => s + sisa(r), 0)}
      />
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────

function Th({
  col, sort, onSort, allSelected, someSelected, onToggleAll,
}: {
  col: Column;
  sort: SortState;
  onSort: (key: SortKey) => void;
  allSelected: boolean;
  someSelected: boolean;
  onToggleAll: () => void;
}) {
  if (col.key === "checkbox") {
    return (
      <th className={cn("border-b border-slate-200 px-3 py-2 dark:border-slate-700", col.width)}>
        <input
          type="checkbox"
          checked={allSelected}
          ref={(el) => { if (el) el.indeterminate = someSelected; }}
          onChange={onToggleAll}
          aria-label="Pilih semua"
          className="h-3.5 w-3.5 cursor-pointer rounded border-slate-300 text-amber-600 focus:ring-2 focus:ring-amber-500/40 focus:ring-offset-0"
        />
      </th>
    );
  }

  const isSorted = col.sortable && sort.key === col.key;
  const isClickable = col.sortable;
  const hideClass = col.hideOn === "lg" ? "hidden lg:table-cell" : col.hideOn === "xl" ? "hidden xl:table-cell" : "";

  return (
    <th
      className={cn(
        "border-b border-slate-200 px-2 py-2 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-slate-500",
        "dark:border-slate-700 dark:text-slate-400",
        col.align === "right" && "text-right",
        col.align === "center" && "text-center",
        col.width, hideClass,
      )}
    >
      {isClickable ? (
        <button
          type="button"
          onClick={() => onSort(col.key as SortKey)}
          className={cn(
            "inline-flex items-center gap-1 rounded px-1 py-0.5 transition-colors hover:text-amber-700 dark:hover:text-amber-400",
            isSorted && "text-amber-700 dark:text-amber-400",
          )}
        >
          <span>{col.label}</span>
          {isSorted ? (
            sort.dir === "asc" ? <ChevronUp size={11} /> : <ChevronDown size={11} />
          ) : (
            <ChevronsUpDown size={10} className="text-slate-300 dark:text-slate-600" />
          )}
        </button>
      ) : (
        col.label
      )}
    </th>
  );
}

function FooterSummary({
  total, density, totalRp, sisaRp,
}: {
  total: number;
  density: Density;
  totalRp: number;
  sisaRp: number;
}) {
  if (total === 0) return null;
  return (
    <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50/60 px-4 py-2 text-[11px] dark:border-slate-800 dark:bg-slate-900/60">
      <span className="text-slate-500 dark:text-slate-400">
        Menampilkan <span className="font-semibold text-slate-700 dark:text-slate-200">{total}</span> tagihan
        <span className="ml-1 text-slate-400">· density: {density}</span>
      </span>
      <div className="flex items-center gap-3 font-mono">
        <span className="text-slate-500 dark:text-slate-400">
          Total: <span className="font-semibold text-slate-700 dark:text-slate-200">{fmtRupiah(totalRp)}</span>
        </span>
        <span className="text-slate-300 dark:text-slate-600">|</span>
        <span className="text-slate-500 dark:text-slate-400">
          Sisa: <span className={cn("font-semibold", sisaRp === 0 ? "text-emerald-600" : "text-rose-600")}>{fmtRupiah(sisaRp)}</span>
        </span>
      </div>
    </footer>
  );
}
