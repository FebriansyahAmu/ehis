"use client";

/**
 * KlaimBulkBar — action bar yang slide-up dari bawah saat selected > 0.
 *
 * Sky-accent (kontras dengan teal primary) supaya secara visual jelas
 * "ini mode batch action, bukan modal default".
 *
 * Actions (4):
 *  1. Submit Batch ke BPJS  — disabled if !canBulkSubmit (BPJS + Belum Submit + iDRG)
 *  2. Cek Eligibility       — disabled if !canBulkCekEligibility (any BPJS with SEP)
 *  3. Generate Berkas Batch — always enabled (mock generate)
 *  4. Export Excel/CSV      — always enabled
 *
 * Close button (X) deselect semua.
 */

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  ShieldCheck,
  FileDown,
  FileSpreadsheet,
  X,
  Sparkles,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  canBulkSubmit,
  canBulkCekEligibility,
  downloadKlaimCsv,
} from "../klaimBoardLogic";
import {
  fmtRupiahKpi,
  fmtRupiahFull,
} from "../klaimBoardShared";
import { addRupiah } from "@/lib/eklaim/money";
import type { ClaimRecord } from "@/lib/eklaim/eklaimShared";

interface Props {
  selectedClaims: ReadonlyArray<ClaimRecord>;
  onClear: () => void;
  onSubmitBatch: (claims: ReadonlyArray<ClaimRecord>) => void;
  onCekEligibility: (claims: ReadonlyArray<ClaimRecord>) => void;
  onGenerateBerkas: (claims: ReadonlyArray<ClaimRecord>) => void;
}

export default function KlaimBulkBar({
  selectedClaims,
  onClear,
  onSubmitBatch,
  onCekEligibility,
  onGenerateBerkas,
}: Props) {
  const submitCheck = useMemo(() => canBulkSubmit(selectedClaims), [selectedClaims]);
  const eligibilityCheck = useMemo(() => canBulkCekEligibility(selectedClaims), [selectedClaims]);
  const totalTarifRS = useMemo(
    () => addRupiah(...selectedClaims.map((c) => c.tarifRS)),
    [selectedClaims],
  );

  const visible = selectedClaims.length > 0;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
          className="absolute inset-x-3 bottom-3 z-20 rounded-xl border border-sky-200 bg-white shadow-lg ring-1 ring-sky-100"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            {/* Left: count + total */}
            <div className="flex items-center gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-sky-50 ring-1 ring-sky-200">
                <Sparkles size={13} className="text-sky-600" />
              </span>
              <div className="flex flex-col">
                <p className="text-[13px] font-semibold text-slate-800">
                  <span className="font-mono tabular-nums text-sky-700">
                    {selectedClaims.length}
                  </span>{" "}
                  klaim dipilih
                </p>
                <p
                  className="font-mono text-[11.5px] tabular-nums text-slate-500"
                  title={fmtRupiahFull(totalTarifRS)}
                >
                  Tarif RS {fmtRupiahKpi(totalTarifRS)}
                </p>
              </div>
            </div>

            {/* Center: actions */}
            <div className="flex flex-wrap items-center gap-1.5">
              <ActionBtn
                icon={Send}
                label="Submit Batch"
                onClick={() => onSubmitBatch(selectedClaims)}
                disabledReason={submitCheck.ok ? undefined : submitCheck.reason}
                primary
              />
              <ActionBtn
                icon={ShieldCheck}
                label="Cek Eligibility"
                onClick={() => onCekEligibility(selectedClaims)}
                disabledReason={eligibilityCheck.ok ? undefined : eligibilityCheck.reason}
              />
              <ActionBtn
                icon={FileDown}
                label="Generate Berkas"
                onClick={() => onGenerateBerkas(selectedClaims)}
              />
              <ActionBtn
                icon={FileSpreadsheet}
                label="Export CSV"
                onClick={() => downloadKlaimCsv(selectedClaims)}
              />
            </div>

            {/* Right: close */}
            <button
              type="button"
              onClick={onClear}
              aria-label="Batalkan pilihan"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Action Button ──────────────────────────────────────

function ActionBtn({
  icon: Icon,
  label,
  onClick,
  disabledReason,
  primary,
}: {
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  label: string;
  onClick: () => void;
  disabledReason?: string;
  primary?: boolean;
}) {
  const disabled = !!disabledReason;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={disabledReason}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12.5px] font-semibold transition-all duration-150 active:scale-[0.97]",
        disabled
          ? "cursor-not-allowed bg-slate-50 text-slate-400 ring-1 ring-slate-200"
          : primary
            ? "bg-sky-600 text-white shadow-sm hover:bg-sky-700 hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40"
            : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/30",
      )}
    >
      <Icon size={12} strokeWidth={2.4} />
      {label}
    </button>
  );
}
