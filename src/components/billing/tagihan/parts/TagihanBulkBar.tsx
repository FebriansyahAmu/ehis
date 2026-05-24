"use client";

import { motion } from "framer-motion";
import { Printer, Send, FileSpreadsheet, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtRupiah } from "../tagihanShared";
import { sisa, type TagihanRow } from "@/lib/billing/tagihanBoardMock";

interface Props {
  selectedRows: TagihanRow[];
  onClear: () => void;
  onPrintBatch: (rows: TagihanRow[]) => void;
  onSubmitKlaim: (rows: TagihanRow[]) => void;
  onExportExcel: (rows: TagihanRow[]) => void;
}

/** Tagihan eligible untuk Submit Klaim: penjamin selain Umum,
 *  dan status memungkinkan submit/resubmit. */
function isKlaimEligible(row: TagihanRow): boolean {
  if (row.penjamin.tipe === "umum") return false;
  return (
    row.status === "Final" ||
    row.status === "Belum Lunas" ||
    row.status === "Lunas Sebagian" ||
    row.status === "Klaim Ditolak"
  );
}

/** Tagihan eligible untuk Print Batch: bukan Draft / Void. */
function isPrintEligible(row: TagihanRow): boolean {
  return row.status !== "Draft" && row.status !== "Void";
}

export default function TagihanBulkBar({
  selectedRows, onClear, onPrintBatch, onSubmitKlaim, onExportExcel,
}: Props) {
  const count = selectedRows.length;
  if (count === 0) return null;

  const total  = selectedRows.reduce((s, r) => s + r.total, 0);
  const sisaT  = selectedRows.reduce((s, r) => s + sisa(r), 0);

  const printRows = selectedRows.filter(isPrintEligible);
  const klaimRows = selectedRows.filter(isKlaimEligible);

  const printDisabled = printRows.length === 0;
  const klaimDisabled = klaimRows.length === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200 bg-amber-50/70 px-4 py-2 dark:border-amber-900/50 dark:bg-amber-950/30"
    >
      {/* Summary */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]">
        <span className="inline-flex items-center gap-1.5 font-semibold text-amber-800 dark:text-amber-300">
          <span className="inline-flex h-4 min-w-[18px] items-center justify-center rounded-full bg-amber-200 px-1 font-mono text-[10.5px] text-amber-900 dark:bg-amber-800 dark:text-amber-100">
            {count}
          </span>
          tagihan dipilih
        </span>
        <span className="hidden text-slate-500 sm:inline dark:text-slate-400">
          · Total <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">{fmtRupiah(total)}</span>
        </span>
        <span className="hidden text-slate-500 sm:inline dark:text-slate-400">
          · Sisa <span className={cn("font-mono font-semibold", sisaT === 0 ? "text-emerald-600" : "text-rose-600")}>{fmtRupiah(sisaT)}</span>
        </span>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-1.5">
        <BulkBtn
          icon={Printer}
          label="Print Batch"
          eligibleCount={printRows.length}
          totalCount={count}
          disabled={printDisabled}
          disabledHint="Tidak ada tagihan yang bisa dicetak (Draft / Void tidak didukung)"
          onClick={() => !printDisabled && onPrintBatch(printRows)}
        />
        <BulkBtn
          icon={FileSpreadsheet}
          label="Export Excel"
          eligibleCount={count}
          totalCount={count}
          disabled={false}
          onClick={() => onExportExcel(selectedRows)}
        />
        <BulkBtn
          icon={Send}
          label="Submit Klaim"
          eligibleCount={klaimRows.length}
          totalCount={count}
          disabled={klaimDisabled}
          disabledHint="Pilih minimal 1 tagihan penjamin BPJS/Asuransi/Jamkesda dengan status Final / Belum Lunas / Klaim Ditolak"
          primary
          onClick={() => !klaimDisabled && onSubmitKlaim(klaimRows)}
        />
        <button
          type="button"
          onClick={onClear}
          aria-label="Batal pilihan"
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-white hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <X size={14} />
        </button>
      </div>
    </motion.div>
  );
}

// ── Bulk action button ──────────────────────────────────

function BulkBtn({
  icon: Icon, label, eligibleCount, totalCount, disabled, disabledHint, primary, onClick,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  eligibleCount: number;
  totalCount: number;
  disabled: boolean;
  disabledHint?: string;
  primary?: boolean;
  onClick: () => void;
}) {
  const showCount = eligibleCount > 0 && eligibleCount < totalCount;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={disabled ? disabledHint : `${eligibleCount} dari ${totalCount} tagihan akan diproses`}
      className={cn(
        "group inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11.5px] font-medium transition-all duration-150",
        "active:scale-[0.97]",
        disabled && "cursor-not-allowed opacity-50",
        !disabled && primary && "bg-amber-600 text-white shadow-sm hover:bg-amber-700",
        !disabled && !primary && "border border-slate-200 bg-white text-slate-700 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-amber-950/30",
        disabled && primary && "bg-amber-300 text-white",
        disabled && !primary && "border border-slate-200 bg-white text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500",
      )}
    >
      <Icon size={12} />
      <span>{label}</span>
      {showCount && (
        <span
          className={cn(
            "ml-0.5 rounded px-1 py-0 font-mono text-[10px] font-semibold tabular-nums",
            primary
              ? "bg-amber-800/30 text-amber-50"
              : "bg-slate-100 text-slate-500 group-hover:bg-amber-100 group-hover:text-amber-700 dark:bg-slate-800 dark:text-slate-400",
          )}
        >
          {eligibleCount}/{totalCount}
        </span>
      )}
    </button>
  );
}
