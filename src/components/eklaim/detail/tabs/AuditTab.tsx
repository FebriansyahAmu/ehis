"use client";

/**
 * AuditTab — Tab Audit/Timeline (EK3.6).
 *
 * Timeline vertikal append-only semua ClaimTimelineEntry.
 * Per UU PDP 27/2022 + PMK 269/2008 — audit integrity hard requirement.
 *
 * Filter: event type chips + actor dropdown.
 * Export: CSV RFC 4180 + BOM UTF-8 (kompatibel Excel Indonesia).
 */

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  History,
  Filter,
  Download,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Scale,
  Send,
  MessageSquare,
  Wallet,
  Edit3,
  Plus,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRupiah } from "@/lib/eklaim/money";
import type { ClaimRecord, ClaimTimelineEntry } from "@/lib/eklaim/eklaimShared";
import { fmtDateTimeShort, avatarInitials } from "../claimDetailShared";

// ── Filter types ───────────────────────────────────────────

type EventTypeFilter =
  | "all"
  | "claim-created"
  | "coding-changed"
  | "berkas"
  | "grouper-resolved"
  | "submitted-batch"
  | "status-transition"
  | "verifikator-comment"
  | "banding-submitted"
  | "payment-received";

const FILTER_CHIPS: ReadonlyArray<{ key: EventTypeFilter; label: string }> = [
  { key: "all", label: "Semua" },
  { key: "status-transition", label: "Status" },
  { key: "berkas", label: "Berkas" },
  { key: "coding-changed", label: "Koding" },
  { key: "grouper-resolved", label: "Grouper" },
  { key: "submitted-batch", label: "Submit" },
  { key: "payment-received", label: "Bayar" },
  { key: "verifikator-comment", label: "Komentar" },
  { key: "claim-created", label: "Dibuat" },
];

function matchesType(e: ClaimTimelineEntry, f: EventTypeFilter): boolean {
  if (f === "all") return true;
  if (f === "berkas") return e.type === "berkas-uploaded" || e.type === "berkas-rejected";
  return e.type === f;
}

// ── Entry style ────────────────────────────────────────────

interface EntryStyle {
  Icon: LucideIcon;
  color: string;
  bg: string;
  label: string;
}

function getEntryStyle(entry: ClaimTimelineEntry): EntryStyle {
  switch (entry.type) {
    case "claim-created":
      return { Icon: Plus, color: "text-teal-700", bg: "bg-teal-100", label: "Klaim Dibuat" };
    case "coding-changed":
      return { Icon: Edit3, color: "text-sky-700", bg: "bg-sky-100", label: "Koding Diubah" };
    case "berkas-uploaded":
      return { Icon: FileText, color: "text-sky-700", bg: "bg-sky-100", label: "Berkas Diupload" };
    case "berkas-rejected":
      return { Icon: XCircle, color: "text-rose-700", bg: "bg-rose-100", label: "Berkas Ditolak" };
    case "grouper-resolved":
      return {
        Icon: Scale,
        color: "text-emerald-700",
        bg: "bg-emerald-100",
        label: "Grouper Resolved",
      };
    case "status-transition":
      return {
        Icon: CheckCircle2,
        color: "text-slate-700",
        bg: "bg-slate-100",
        label: "Status Berubah",
      };
    case "submitted-batch":
      return { Icon: Send, color: "text-sky-700", bg: "bg-sky-100", label: "Submitted ke BPJS" };
    case "verifikator-comment":
      return {
        Icon: MessageSquare,
        color: "text-amber-700",
        bg: "bg-amber-100",
        label: "Komentar Verifikator",
      };
    case "banding-submitted":
      return {
        Icon: AlertCircle,
        color: "text-amber-700",
        bg: "bg-amber-100",
        label: "Banding Diajukan",
      };
    case "payment-received":
      return {
        Icon: Wallet,
        color: "text-emerald-700",
        bg: "bg-emerald-100",
        label: "Pembayaran Diterima",
      };
  }
}

// ── CSV helper ─────────────────────────────────────────────

function describeEntry(entry: ClaimTimelineEntry): string {
  switch (entry.type) {
    case "claim-created":
      return "Klaim dibuat";
    case "coding-changed":
      return `${entry.before.primer} → ${entry.after.primer}`;
    case "berkas-uploaded":
      return `${entry.kategori} (${entry.sumber.type})`;
    case "berkas-rejected":
      return `${entry.berkasId}: ${entry.alasan}`;
    case "grouper-resolved":
      return `${entry.eraGrouper} ${entry.result.code}`;
    case "status-transition":
      return `${entry.from} → ${entry.to}${entry.alasan ? ` (${entry.alasan})` : ""}`;
    case "submitted-batch":
      return `Batch ${entry.batchId}`;
    case "verifikator-comment":
      return entry.komentar;
    case "banding-submitted":
      return `Tingkat ${entry.tingkat}, ID ${entry.bandingId}`;
    case "payment-received":
      return `${entry.nominal} - ${entry.reconciliationId}`;
  }
}

// ── Main ───────────────────────────────────────────────────

interface Props {
  claim: ClaimRecord;
}

export default function AuditTab({ claim }: Props) {
  const [typeFilter, setTypeFilter] = useState<EventTypeFilter>("all");
  const [actorFilter, setActorFilter] = useState("all");

  const actors = useMemo(() => {
    const set = new Set(claim.timeline.map((e) => e.by));
    return ["all", ...Array.from(set)];
  }, [claim.timeline]);

  const filtered = useMemo(
    () =>
      [...claim.timeline]
        .reverse()
        .filter(
          (e) =>
            matchesType(e, typeFilter) &&
            (actorFilter === "all" || e.by === actorFilter),
        ),
    [claim.timeline, typeFilter, actorFilter],
  );

  const handleExportCSV = useCallback(() => {
    const header = "Waktu,Tipe,Aktor,Detail\n";
    const rows = [...claim.timeline]
      .reverse()
      .map((e) => {
        const detail = describeEntry(e).replace(/"/g, '""');
        return `"${e.at}","${e.type}","${e.by}","${detail}"`;
      })
      .join("\n");
    const bom = "﻿";
    const blob = new Blob([bom + header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit_${claim.noKlaim}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [claim]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col gap-4"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-bold text-slate-800">Audit Trail</h2>
          <p className="mt-0.5 text-[12.5px] text-slate-500">
            {claim.timeline.length} event tercatat · append-only per UU PDP 27/2022.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExportCSV}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-600 hover:bg-slate-50"
        >
          <Download size={12} strokeWidth={2.5} />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1.5">
          {FILTER_CHIPS.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => setTypeFilter(chip.key)}
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[12px] font-semibold transition-colors",
                typeFilter === chip.key
                  ? "bg-teal-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200",
              )}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {actors.length > 2 && (
          <div className="ml-auto flex items-center gap-1.5">
            <Filter size={12} strokeWidth={2} className="text-slate-400" />
            <select
              value={actorFilter}
              onChange={(e) => setActorFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-[12px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-300"
            >
              <option value="all">Semua aktor</option>
              {actors
                .filter((a) => a !== "all")
                .map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
            </select>
          </div>
        )}
      </div>

      {/* Timeline */}
      {filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="relative flex flex-col gap-0">
          {/* Vertical line connector */}
          <div className="absolute bottom-5 left-[19px] top-5 w-px bg-slate-200" />

          {filtered.map((entry, i) => (
            <motion.div
              key={`${entry.type}-${entry.at}-${i}`}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(i * 0.05, 0.4), duration: 0.18 }}
            >
              <TimelineRow entry={entry} />
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ── TimelineRow ────────────────────────────────────────────

function TimelineRow({ entry }: { entry: ClaimTimelineEntry }) {
  const { Icon, color, bg, label } = getEntryStyle(entry);

  return (
    <div className="flex gap-4 pb-4">
      {/* Dot icon */}
      <div className="relative z-10 shrink-0">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full border-2 border-white shadow-sm",
            bg,
          )}
        >
          <Icon size={14} strokeWidth={2.2} className={color} />
        </div>
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 pt-1.5">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-[13px] font-bold text-slate-800">{label}</span>
          <span className="text-[11.5px] text-slate-400">{fmtDateTimeShort(entry.at)}</span>
        </div>

        {/* Actor */}
        <div className="flex items-center gap-1.5">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[9px] font-bold text-slate-600">
            {avatarInitials(entry.by)}
          </div>
          <span className="text-[12px] text-slate-500">{entry.by}</span>
        </div>

        {/* Per-type detail */}
        <EntryDetail entry={entry} />
      </div>
    </div>
  );
}

// ── EntryDetail ────────────────────────────────────────────

function EntryDetail({ entry }: { entry: ClaimTimelineEntry }) {
  switch (entry.type) {
    case "claim-created":
      return null;

    case "coding-changed":
      return (
        <div className="flex flex-col gap-1.5 rounded-lg border border-sky-100 bg-sky-50/60 px-3 py-2">
          <DiffRow label="Primer" before={entry.before.primer} after={entry.after.primer} />
          {(entry.before.sekunder.length > 0 || entry.after.sekunder.length > 0) && (
            <DiffRow
              label="Sekunder"
              before={entry.before.sekunder.join(", ") || "—"}
              after={entry.after.sekunder.join(", ") || "—"}
            />
          )}
          {(entry.before.prosedur.length > 0 || entry.after.prosedur.length > 0) && (
            <DiffRow
              label="Prosedur"
              before={entry.before.prosedur.join(", ") || "—"}
              after={entry.after.prosedur.join(", ") || "—"}
            />
          )}
        </div>
      );

    case "berkas-uploaded":
      return (
        <div className="flex items-center gap-2 text-[12px] text-slate-600">
          <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-bold text-sky-700">
            {entry.kategori}
          </span>
          <span className="text-slate-400">·</span>
          <span>
            {entry.sumber.type === "auto-pull"
              ? `Auto-pull dari ${entry.sumber.sumberType}`
              : "Upload manual"}
          </span>
        </div>
      );

    case "berkas-rejected":
      return (
        <div className="flex flex-wrap items-center gap-2 text-[12px]">
          <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-700">
            ID: {entry.berkasId}
          </span>
          <span className="text-rose-600">{entry.alasan}</span>
        </div>
      );

    case "grouper-resolved":
      return (
        <div className="flex items-center gap-2 text-[12px] text-slate-600">
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
            {entry.eraGrouper}
          </span>
          <span className="font-mono">{entry.result.code}</span>
        </div>
      );

    case "status-transition":
      return (
        <div className="flex flex-wrap items-center gap-1.5 text-[12px]">
          <span className="rounded-md bg-slate-100 px-2 py-0.5 font-semibold text-slate-600">
            {entry.from}
          </span>
          <span className="text-slate-400">→</span>
          <span className="rounded-md bg-teal-100 px-2 py-0.5 font-semibold text-teal-700">
            {entry.to}
          </span>
          {entry.alasan && (
            <span className="text-slate-500">· {entry.alasan}</span>
          )}
        </div>
      );

    case "submitted-batch":
      return (
        <p className="font-mono text-[12px] text-slate-500">Batch ID: {entry.batchId}</p>
      );

    case "verifikator-comment":
      return (
        <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-[12.5px] text-amber-800">
          {entry.komentar}
        </div>
      );

    case "banding-submitted":
      return (
        <div className="flex items-center gap-2 text-[12px] text-slate-600">
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">
            Tingkat {entry.tingkat}
          </span>
          <span>
            Banding ID: <span className="font-mono">{entry.bandingId}</span>
          </span>
        </div>
      );

    case "payment-received":
      return (
        <div className="flex items-center gap-3 text-[12.5px]">
          <span className="font-bold text-emerald-700">{formatRupiah(entry.nominal)}</span>
          <span className="text-slate-400">·</span>
          <span className="font-mono text-slate-500">{entry.reconciliationId}</span>
        </div>
      );
  }
}

// ── DiffRow ────────────────────────────────────────────────

function DiffRow({
  label,
  before,
  after,
}: {
  label: string;
  before: string;
  after: string;
}) {
  const changed = before !== after;
  return (
    <div className="grid grid-cols-[60px_1fr_1fr] gap-1.5 text-[12px]">
      <span className="text-slate-400">{label}</span>
      <span
        className={cn(
          "font-mono",
          changed ? "text-rose-400 line-through" : "text-slate-600",
        )}
      >
        {before}
      </span>
      {changed && <span className="font-mono text-emerald-600">{after}</span>}
    </div>
  );
}

// ── Empty State ────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <History size={28} className="mb-2 text-slate-300" />
      <p className="text-[13.5px] font-semibold text-slate-600">
        Tidak ada event sesuai filter
      </p>
      <p className="mt-1 text-[12px] text-slate-400">
        Ubah filter type atau aktor untuk melihat lebih banyak.
      </p>
    </div>
  );
}
