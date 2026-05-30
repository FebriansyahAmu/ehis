"use client";

/**
 * TransferList — panel kiri daftar transfer bank (EK7).
 *
 * Contents (top→bottom):
 *   1. Header: judul + "Import CSV" button
 *   2. KPI strip: 4 mini-card stagger-up
 *   3. Divider
 *   4. Scrollable transfer item list
 *   5. Footer summary
 */

import { motion } from "framer-motion";
import { Upload, ArrowDownUp, CheckCircle2, AlertCircle, Clock, FileText } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatRupiah } from "@/lib/eklaim/money";
import type { ReconciliationRecord } from "@/lib/eklaim/eklaimShared";
import type { LucideIcon } from "lucide-react";

import {
  BANDING_TONE,
  RECON_STATUS_CFG,
  getReconViewStatus,
  getPenjaminDisplay,
  fmtDateShort,
  type ReconKPI,
} from "./reconciliationShared";

// ── KPI Mini Card ─────────────────────────────────────────────

const TONE_ICON: Record<string, LucideIcon> = {
  teal:    ArrowDownUp,
  emerald: CheckCircle2,
  amber:   AlertCircle,
  rose:    Clock,
  sky:     CheckCircle2,
  slate:   Clock,
};

function KPICard({ kpi, idx }: { kpi: ReconKPI; idx: number }) {
  const tone = BANDING_TONE[kpi.tone];
  const Icon = TONE_ICON[kpi.tone] ?? ArrowDownUp;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: idx * 0.06, ease: "easeOut" }}
      className={cn(
        "relative overflow-hidden rounded-xl bg-white p-3 ring-1",
        tone.ringIdle,
      )}
    >
      {/* Left accent bar */}
      <div
        className={cn(
          "absolute inset-y-0 left-0 w-0.5 rounded-l-xl",
          `bg-linear-to-b ${tone.barFrom} to-transparent`,
        )}
      />
      <div className="flex items-center gap-1.5 pl-1.5">
        <span
          className={cn(
            "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md",
            tone.iconBg,
          )}
        >
          <Icon size={13} className={tone.iconText} />
        </span>
        <span className="truncate text-sm text-slate-500">{kpi.label}</span>
      </div>
      <p
        className={cn(
          "mt-1.5 pl-1.5 text-xl font-bold tabular-nums leading-none",
          tone.valueText,
        )}
      >
        {kpi.value}
      </p>
      <p className="mt-0.5 truncate pl-1.5 text-sm text-slate-400">{kpi.sub}</p>
    </motion.div>
  );
}

// ── Transfer Item ─────────────────────────────────────────────

function TransferItem({
  record,
  isSelected,
  onClick,
}: {
  record: ReconciliationRecord;
  isSelected: boolean;
  onClick: () => void;
}) {
  const status    = getReconViewStatus(record);
  const statusCfg = RECON_STATUS_CFG[status];
  const tone      = BANDING_TONE[statusCfg.tone];
  const penjamin  = getPenjaminDisplay(record.penjaminId);
  const matchCount = record.matchedClaims.length;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full border-b border-slate-100 px-4 py-3 text-left transition-colors hover:bg-teal-50/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-400",
        isSelected && "bg-teal-50/60 ring-inset ring-1 ring-teal-200",
      )}
    >
      {/* Row 1: noTransfer + nominal */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-mono text-sm font-semibold text-slate-800">
            {record.noTransfer}
          </p>
          <p className="text-sm text-slate-500">{fmtDateShort(record.tanggalTransfer)}</p>
        </div>
        <p className="shrink-0 font-mono text-sm font-bold text-slate-800">
          {formatRupiah(record.nominalTransfer)}
        </p>
      </div>

      {/* Row 2: badges */}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {/* Bank */}
        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-sm font-medium text-slate-600">
          {record.bank}
        </span>

        {/* Penjamin */}
        <span
          className={cn(
            "rounded-md px-1.5 py-0.5 text-sm font-medium ring-1",
            BANDING_TONE[penjamin.tone].chipBg,
            BANDING_TONE[penjamin.tone].chipText,
            BANDING_TONE[penjamin.tone].chipRing,
          )}
        >
          {penjamin.label}
        </span>

        {/* Match count */}
        {matchCount > 0 && (
          <span className="rounded-md bg-sky-50 px-1.5 py-0.5 text-sm font-medium text-sky-700 ring-1 ring-sky-200">
            {matchCount} klaim
          </span>
        )}

        {/* Status chip */}
        <span
          className={cn(
            "ml-auto rounded-full px-2 py-0.5 text-sm font-semibold ring-1",
            tone.chipBg,
            tone.chipText,
            tone.chipRing,
          )}
        >
          {statusCfg.label}
        </span>

        {/* Laporan link — only for completed records */}
        {record.completedAt && (
          <Link
            href={`/ehis-eklaim/reconciliation/${record.id}`}
            onClick={(e) => e.stopPropagation()}
            className="ml-1 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-teal-600 ring-1 ring-teal-200 transition hover:bg-teal-50 focus:outline-none"
            title="Lihat laporan detail"
          >
            <FileText size={10} />
            Laporan
          </Link>
        )}
      </div>
    </button>
  );
}

// ── Main Component ────────────────────────────────────────────

interface Props {
  records: ReconciliationRecord[];
  kpis: ReconKPI[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onImport: () => void;
}

export default function TransferList({
  records,
  kpis,
  selectedId,
  onSelect,
  onImport,
}: Props) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5">
        <h2 className="text-sm font-semibold text-slate-700">Transfer Bank</h2>
        <button
          type="button"
          onClick={onImport}
          className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-2.5 py-1.5 text-sm font-semibold text-white transition hover:bg-teal-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-1"
        >
          <Upload size={13} />
          Import CSV
        </button>
      </div>

      {/* KPI Strip (2×2 grid) */}
      <div className="grid shrink-0 grid-cols-2 gap-2 p-3">
        {kpis.map((kpi, idx) => (
          <KPICard key={kpi.id} kpi={kpi} idx={idx} />
        ))}
      </div>

      {/* Divider */}
      <div className="mx-4 shrink-0 border-t border-slate-100" />

      {/* Transfer list (scrollable) */}
      <div className="flex-1 overflow-y-auto [scrollbar-width:thin]">
        {records.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <ArrowDownUp size={28} className="mb-3 text-slate-300" />
            <p className="text-sm font-semibold text-slate-500">Belum ada transfer</p>
            <p className="mt-1 text-sm text-slate-400">
              Klik &quot;Import CSV&quot; untuk memulai
            </p>
          </div>
        ) : (
          records.map((rec) => (
            <TransferItem
              key={rec.id}
              record={rec}
              isSelected={selectedId === rec.id}
              onClick={() => onSelect(rec.id)}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <footer className="shrink-0 border-t border-slate-200 bg-slate-50/60 px-4 py-2">
        <p className="text-sm text-slate-400">
          {records.length} transfer · PMK 76/2016 · Permenkes rekonsiliasi bulanan
        </p>
      </footer>
    </div>
  );
}
