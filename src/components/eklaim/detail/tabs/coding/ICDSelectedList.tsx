"use client";

/**
 * ICDSelectedList — daftar ICD terpilih dengan controls.
 * - Variant "sekunder": ICD-10-IM dengan toggle hospitalAcquired (HAC/MCC-CC PPI).
 * - Variant "tindakan": ICD-9-CM-IM tanpa toggle.
 * Font: text-sm (14px) untuk kode & deskripsi — per user pref "normal aja".
 */

import { X, Hospital } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { KodeICD9CMIM } from "@/lib/eklaim/eklaimShared";
import type { DiagnosaSekunderEntry } from "./codingShared";

// ── Prop variants ──────────────────────────────────────

interface SekunderProps {
  variant: "sekunder";
  entries: ReadonlyArray<DiagnosaSekunderEntry>;
  onRemove: (kode: string) => void;
  onToggleHA: (kode: string) => void;
  disabled?: boolean;
}

interface TindakanProps {
  variant: "tindakan";
  entries: ReadonlyArray<KodeICD9CMIM>;
  onRemove: (kode: string) => void;
  disabled?: boolean;
}

type Props = SekunderProps | TindakanProps;

// ── Main ───────────────────────────────────────────────

export default function ICDSelectedList(props: Props) {
  const isEmpty = props.entries.length === 0;

  if (isEmpty) {
    return (
      <p className="py-2 text-[12.5px] italic text-slate-400">
        {props.variant === "sekunder"
          ? "Belum ada diagnosa sekunder — tambah dari picker di atas"
          : "Belum ada tindakan/prosedur — tambah dari picker di atas"}
      </p>
    );
  }

  return (
    <ul className="space-y-1.5">
      <AnimatePresence initial={false}>
        {props.variant === "sekunder"
          ? props.entries.map((entry, idx) => (
              <SekunderRow
                key={entry.icd.kode}
                entry={entry}
                idx={idx}
                onRemove={props.onRemove}
                onToggleHA={props.onToggleHA}
                disabled={props.disabled}
              />
            ))
          : props.entries.map((icd, idx) => (
              <TindakanRow
                key={icd.kode}
                icd={icd}
                idx={idx}
                onRemove={props.onRemove}
                disabled={props.disabled}
              />
            ))}
      </AnimatePresence>
    </ul>
  );
}

// ── Sekunder Row (with hospitalAcquired toggle) ────────

function SekunderRow({
  entry,
  idx,
  onRemove,
  onToggleHA,
  disabled,
}: {
  entry: DiagnosaSekunderEntry;
  idx: number;
  onRemove: (kode: string) => void;
  onToggleHA: (kode: string) => void;
  disabled?: boolean;
}) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.18 }}
      className={cn(
        "flex items-start gap-2.5 rounded-lg border px-3 py-2.5 transition-colors",
        entry.hospitalAcquired
          ? "border-rose-200 bg-rose-50/50"
          : "border-slate-200 bg-white",
      )}
    >
      {/* Index badge */}
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[11px] font-bold text-slate-500">
        {idx + 1}
      </span>

      {/* ICD content */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
          <span className="font-mono text-sm font-bold text-teal-700">
            {entry.icd.kode}
          </span>
          <span className="text-sm leading-snug text-slate-800">
            {entry.icd.deskripsi}
          </span>
        </div>
        {entry.icd.hint && (
          <p className="mt-0.5 text-[12px] italic text-slate-400">
            {entry.icd.hint}
          </p>
        )}

        {/* HAC toggle */}
        <button
          type="button"
          onClick={() => !disabled && onToggleHA(entry.icd.kode)}
          title={
            entry.hospitalAcquired
              ? "Hospital-Acquired Condition (HAC) · MCC/CC PPI — klik untuk hapus flag"
              : "Klik untuk tandai sebagai Hospital-Acquired Condition (MCC/CC PPI per PMK 27/2017)"
          }
          className={cn(
            "mt-1.5 inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[12px] font-medium transition-colors",
            entry.hospitalAcquired
              ? "bg-rose-100 text-rose-700 ring-1 ring-rose-200 hover:bg-rose-200"
              : "bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600",
            disabled && "pointer-events-none",
          )}
        >
          <Hospital size={10} strokeWidth={2.5} />
          {entry.hospitalAcquired ? "HAC · MCC/CC PPI" : "Tandai Hospital-Acquired"}
        </button>
      </div>

      {/* Remove */}
      <button
        type="button"
        onClick={() => !disabled && onRemove(entry.icd.kode)}
        aria-label={`Hapus ${entry.icd.kode}`}
        className={cn(
          "mt-0.5 rounded-md p-1 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600",
          disabled && "pointer-events-none opacity-50",
        )}
      >
        <X size={13} strokeWidth={2.5} />
      </button>
    </motion.li>
  );
}

// ── Tindakan Row ───────────────────────────────────────

function TindakanRow({
  icd,
  idx,
  onRemove,
  disabled,
}: {
  icd: KodeICD9CMIM;
  idx: number;
  onRemove: (kode: string) => void;
  disabled?: boolean;
}) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.18 }}
      className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5"
    >
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[11px] font-bold text-slate-500">
        {idx + 1}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
          <span className="font-mono text-sm font-bold text-sky-700">
            {icd.kode}
          </span>
          <span className="text-sm leading-snug text-slate-800">
            {icd.deskripsi}
          </span>
        </div>
        {icd.hint && (
          <p className="mt-0.5 text-[12px] italic text-slate-400">{icd.hint}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => !disabled && onRemove(icd.kode)}
        aria-label={`Hapus ${icd.kode}`}
        className={cn(
          "mt-0.5 rounded-md p-1 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600",
          disabled && "pointer-events-none opacity-50",
        )}
      >
        <X size={13} strokeWidth={2.5} />
      </button>
    </motion.li>
  );
}
