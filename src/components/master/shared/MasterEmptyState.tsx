"use client";

/**
 * Empty state untuk panel detail master saat belum ada item terpilih.
 *
 * Pemakaian:
 *   <MasterEmptyState
 *     accent="rose"
 *     icon={Radiation}
 *     title="Pilih pemeriksaan di kiri"
 *     description="Atau tambah pemeriksaan radiologi baru..."
 *     totalCount={items.length}
 *     totalLabel="pemeriksaan tersedia"
 *     onAddNew={handleAddNew}
 *     addLabel="Tambah Pemeriksaan Baru"
 *   />
 */

import { motion } from "framer-motion";
import { Plus, MousePointer2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getAccent,
  EMPTY_GRADIENT,
  EMPTY_ICON_RING,
  type MasterAccent,
} from "./masterAccent";

export interface MasterEmptyStateProps {
  accent?: MasterAccent;
  /** Icon hero besar di tengah. */
  icon: LucideIcon;
  /** Judul "Pilih ... di kiri". */
  title: string;
  /** Deskripsi singkat di bawah judul. */
  description?: string;
  /** Total item tersedia (untuk chip "X tersedia"). */
  totalCount?: number;
  /** Label setelah totalCount, mis. "pemeriksaan tersedia". */
  totalLabel?: string;
  /** Tombol primary add — kalau undefined, tombol disembunyikan. */
  onAddNew?: () => void;
  /** Label tombol add. */
  addLabel?: string;
}

export default function MasterEmptyState({
  accent = "rose",
  icon: Icon,
  title,
  description,
  totalCount,
  totalLabel = "item tersedia",
  onAddNew,
  addLabel = "Tambah Baru",
}: MasterEmptyStateProps) {
  const a = getAccent(accent);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex h-full flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-slate-200 p-10 text-center bg-gradient-to-br",
        EMPTY_GRADIENT[accent],
      )}
    >
      <motion.span
        initial={{ rotate: -8, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className={cn(
          "flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm ring-4",
          EMPTY_ICON_RING[accent],
        )}
      >
        <Icon size={28} className={a.textAccent} />
      </motion.span>

      <div className="max-w-sm">
        <p className="flex items-center justify-center gap-1.5 text-sm font-bold text-slate-800">
          <MousePointer2 size={13} className="text-slate-400" />
          {title}
        </p>
        {description && (
          <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
            {description}
          </p>
        )}
      </div>

      {totalCount !== undefined && (
        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[10px] font-semibold text-slate-500">
          <span className={cn("h-1.5 w-1.5 rounded-full", a.dot)} />
          {totalCount} {totalLabel}
        </span>
      )}

      {onAddNew && (
        <button
          type="button"
          onClick={onAddNew}
          className={cn(
            "mt-1 inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-white shadow-sm transition active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
            a.bgSolid, a.bgSolidHover, a.ringFocus,
          )}
        >
          <Plus size={12} />
          {addLabel}
        </button>
      )}
    </motion.div>
  );
}
