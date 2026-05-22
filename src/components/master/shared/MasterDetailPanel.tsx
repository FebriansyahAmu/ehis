"use client";

/**
 * Panel kanan untuk halaman master.
 *
 * Layout:
 *   ┌─ Header (avatar+meta slot + actions slot — animated bg saat isNew/isDirty)
 *   ├─ Tab Nav (optional, via `tabs` + `activeTab`)
 *   └─ Content (scrollable, AnimatePresence)
 *
 * Halaman menyediakan:
 *   - `headerContent`: avatar/icon + nama + chips meta
 *   - `tabs` + `activeTab` + `onTabChange` (optional)
 *   - `renderTabBadge` (optional)
 *   - `children`: konten tab yang aktif
 *   - flags: `isNew`, `isDirty`, `valid`
 *   - callbacks: `onSave`, `onCancel`, `onDelete?`
 *
 * Pattern action buttons: Hapus (ghost) · Batal · Simpan/Tambah (primary).
 */

import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAccent, type MasterAccent } from "./masterAccent";
import MasterTabNav, { type MasterTab } from "./MasterTabNav";

export interface MasterDetailPanelProps<K extends string> {
  accent?: MasterAccent;

  // ── Header ────────────────────────────────────────────
  /** Konten header (biasanya avatar + nama + chip meta). */
  headerContent: React.ReactNode;
  /** Tampilkan style "entry baru" (emerald header bg). */
  isNew: boolean;
  /** Dirty flag — enable tombol Batal & Simpan. */
  isDirty: boolean;
  /** Valid flag — enable tombol Simpan. */
  valid: boolean;

  // ── Actions ───────────────────────────────────────────
  onSave: () => void;
  onCancel: () => void;
  /** Hide delete bila undefined (mis. saat isNew). */
  onDelete?: () => void;
  /** Override label tombol simpan. Default "Simpan" / "Tambah" (isNew). */
  saveLabel?: string;
  newSaveLabel?: string;

  // ── Tabs ──────────────────────────────────────────────
  tabs?: ReadonlyArray<MasterTab<K>>;
  activeTab?: K;
  onTabChange?: (k: K) => void;
  renderTabBadge?: (k: K) => React.ReactNode;
  tabsAriaLabel?: string;

  // ── Content ───────────────────────────────────────────
  /** Konten tab aktif. Wrapped dengan AnimatePresence pakai `activeTab` sebagai key. */
  children: React.ReactNode;

  // ── Styling ───────────────────────────────────────────
  className?: string;
}

export default function MasterDetailPanel<K extends string>({
  accent = "rose",
  headerContent,
  isNew,
  isDirty,
  valid,
  onSave,
  onCancel,
  onDelete,
  saveLabel = "Simpan",
  newSaveLabel = "Tambah",
  tabs,
  activeTab,
  onTabChange,
  renderTabBadge,
  tabsAriaLabel,
  children,
  className,
}: MasterDetailPanelProps<K>) {
  const a = getAccent(accent);

  return (
    <div className={cn(
      "flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm",
      className,
    )}>
      {/* Header — soft slate normal, emerald saat entry baru */}
      <motion.div
        animate={{
          backgroundColor: isNew ? "rgb(240 253 244)" : "rgb(248 250 252 / 0.6)",
          borderColor:     isNew ? "rgb(187 247 208)" : "rgb(241 245 249)",
        }}
        transition={{ duration: 0.25 }}
        className="shrink-0 border-b px-4 py-3"
      >
        <div className="flex items-start justify-between gap-3">
          {/* Caller-provided header content (avatar + nama + chips) */}
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {headerContent}
          </div>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-1.5">
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="rounded-lg p-1.5 text-slate-300 transition hover:bg-rose-50 hover:text-rose-500 outline-none focus-visible:ring-2 focus-visible:ring-rose-200"
                title="Hapus"
                aria-label="Hapus item"
              >
                <Trash2 size={14} />
              </button>
            )}
            <button
              type="button"
              onClick={onCancel}
              disabled={!isDirty}
              className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-30 outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
            >
              <X size={11} /> Batal
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={!isDirty || !valid}
              className={cn(
                "flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-sm transition disabled:opacity-40 outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
                isNew
                  ? "bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-emerald-300"
                  : cn(a.bgSolid, a.bgSolidHover, a.ringFocus),
              )}
            >
              <Check size={11} /> {isNew ? newSaveLabel : saveLabel}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Tab Nav (optional) */}
      {tabs && activeTab !== undefined && onTabChange && (
        <MasterTabNav
          accent={accent}
          tabs={tabs}
          active={activeTab}
          onChange={onTabChange}
          renderBadge={renderTabBadge}
          ariaLabel={tabsAriaLabel}
        />
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab !== undefined ? String(activeTab) : "single"}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="p-4"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
