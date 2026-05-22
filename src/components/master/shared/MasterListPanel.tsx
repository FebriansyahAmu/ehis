"use client";

/**
 * Panel kiri untuk halaman master.
 *
 * Menyediakan chrome reusable:
 *   - Search input
 *   - Filter toggle + collapsible filter slot (opsional)
 *   - Add CTA (dashed border)
 *   - Scroll container untuk rows (`children`)
 *   - Empty state ketika `isEmpty=true`
 *   - Footer opsional
 *
 * Rendering rows tetap di tangan page (karena tiap master beda layout row).
 * Page passes `children` (ReactNode) berisi `<li>` / `<button>` / dll.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getAccent,
  SEARCH_FOCUS_WITHIN,
  ADD_CTA_HOVER,
  ADD_CTA_BORDER,
  type MasterAccent,
} from "./masterAccent";

export interface MasterListPanelProps {
  /** Aksen warna untuk filter active state, focus ring, add CTA dashed. */
  accent?: MasterAccent;

  // ── Search ────────────────────────────────────────────
  query: string;
  onQueryChange: (q: string) => void;
  searchPlaceholder?: string;

  // ── Filter (opsional) ─────────────────────────────────
  /** Konten filter di dalam panel collapsible. Jika undefined, filter toggle tidak muncul. */
  filterSlot?: React.ReactNode;
  /** Indikator filter sedang aktif (untuk badge titik di tombol Filter). */
  hasActiveFilter?: boolean;

  // ── Counters ──────────────────────────────────────────
  /** Jumlah item yang lolos filter (ditampilkan di kanan tombol Filter). */
  visibleCount: number;
  /** Total item sebelum filter. */
  totalCount: number;

  // ── Add CTA ───────────────────────────────────────────
  onAddNew: () => void;
  addLabel?: string;

  // ── Rows ──────────────────────────────────────────────
  /** Konten list rows (ul/ol/div) yang di-scroll. */
  children: React.ReactNode;
  /** Jika true, tampilkan empty state alih-alih children. */
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDesc?: string;

  // ── Footer ────────────────────────────────────────────
  footer?: React.ReactNode;

  // ── Styling ───────────────────────────────────────────
  /** Lebar panel. Default `w-[340px]`. */
  widthClass?: string;
  className?: string;
}

export default function MasterListPanel({
  accent = "rose",
  query,
  onQueryChange,
  searchPlaceholder = "Cari...",
  filterSlot,
  hasActiveFilter = false,
  visibleCount,
  totalCount,
  onAddNew,
  addLabel = "Tambah Baru",
  children,
  isEmpty = false,
  emptyTitle = "Tidak ada hasil",
  emptyDesc = "Coba ubah filter atau kata kunci",
  footer,
  widthClass = "w-[340px]",
  className,
}: MasterListPanelProps) {
  const [showFilter, setShowFilter] = useState(false);
  const a = getAccent(accent);

  return (
    <div className={cn(
      "flex h-full shrink-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm",
      widthClass,
      className,
    )}>
      {/* Header: Search + Filter Toggle */}
      <div className="shrink-0 border-b border-slate-100 px-3 pt-3 pb-2">
        {/* Search */}
        <div className={cn(
          "flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 transition",
          "focus-within:bg-white focus-within:ring-1",
          SEARCH_FOCUS_WITHIN[accent],
        )}>
          <Search size={13} className="shrink-0 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="flex-1 bg-transparent text-xs text-slate-700 placeholder:text-slate-400 outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => onQueryChange("")}
              className="text-slate-300 hover:text-slate-500"
              aria-label="Bersihkan"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Filter Toggle + Count */}
        {filterSlot ? (
          <div className="mt-1.5 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowFilter((v) => !v)}
              className={cn(
                "flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium transition",
                showFilter || hasActiveFilter
                  ? cn(a.softBg, a.textAccent)
                  : "text-slate-400 hover:text-slate-600",
              )}
            >
              <ChevronDown size={11} className={cn("transition-transform", showFilter && "rotate-180")} />
              Filter
              {hasActiveFilter && (
                <span className={cn("ml-0.5 rounded-full px-1 text-[9px] text-white", a.bgSolid)}>•</span>
              )}
            </button>
            <span className="text-[11px] text-slate-400">
              {visibleCount}/{totalCount}
            </span>
          </div>
        ) : (
          <div className="mt-1.5 flex justify-end">
            <span className="text-[11px] text-slate-400">
              {visibleCount}/{totalCount}
            </span>
          </div>
        )}

        {/* Filter Panel */}
        {filterSlot && (
          <AnimatePresence>
            {showFilter && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="overflow-hidden"
              >
                <div className="mt-2 space-y-2.5 pb-1">{filterSlot}</div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Add CTA */}
      <div className="shrink-0 border-b border-slate-100 px-3 py-2">
        <button
          type="button"
          onClick={onAddNew}
          className={cn(
            "flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed py-1.5 text-xs font-medium transition outline-none focus-visible:ring-2",
            ADD_CTA_BORDER[accent],
            ADD_CTA_HOVER[accent],
            a.textAccent,
            a.ringFocus,
          )}
        >
          <Plus size={13} />
          {addLabel}
        </button>
      </div>

      {/* Body: List / Empty */}
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <p className="text-xs font-medium text-slate-400">{emptyTitle}</p>
            <p className="text-[11px] text-slate-300">{emptyDesc}</p>
          </div>
        ) : (
          children
        )}
      </div>

      {/* Footer */}
      {footer && (
        <div className="shrink-0 border-t border-slate-100 bg-slate-50/60 px-3 py-1.5 text-center">
          <p className="text-[10px] text-slate-500">{footer}</p>
        </div>
      )}
    </div>
  );
}
