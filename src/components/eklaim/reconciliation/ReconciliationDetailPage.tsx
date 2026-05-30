"use client";

/**
 * ReconciliationDetailPage — EK7.4 detail per rekonsiliasi transfer.
 *
 * Layout:
 *   ┌─ DetailHeader (breadcrumb + status + Export CSV + Cetak PDF) ──────────┐
 *   ├────────────────────────────────────────────────────────────────────────┤
 *   │ TransferSummaryCard (300px) │ KPIStrip 3-card + (spacer)              │
 *   ├────────────────────────────────────────────────────────────────────────┤
 *   │ MatchedClaimsDetailTable (full width, 9 kolom akuntansi)               │
 *   ├────────────────────────────────────────────────────────────────────────┤
 *   │ SelisihCard (conditional — hanya tampil jika selisih > 0)              │
 *   └────────────────────────────────────────────────────────────────────────┘
 */

import { useMemo, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  GitBranch,
  FileDown,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  User,
  Bot,
  UserCheck,
  XCircle,
  AlignJustify,
  Rows3,
  Rows2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { formatRupiah } from "@/lib/eklaim/money";
import { useSkeletonDelay } from "@/components/master/shared";
import { findReconciliation } from "@/lib/eklaim/reconciliationMock";
import type {
  ReconciliationRecord,
  ReconciliationMatch,
} from "@/lib/eklaim/eklaimShared";

import {
  BANDING_TONE,
  RECON_STATUS_CFG,
  getReconViewStatus,
  getConfidenceCfg,
  getPenjaminDisplay,
  findClaimById,
  fmtDateShort,
  fmtDatetime,
} from "./reconciliationShared";
import ReconciliationPrintTemplate from "./ReconciliationPrintTemplate";

// ── Density ───────────────────────────────────────────────────

type ReconDensity = "compact" | "comfortable" | "cozy";

const DENSITY_OPTS: { value: ReconDensity; icon: typeof AlignJustify; label: string }[] = [
  { value: "compact",     icon: AlignJustify, label: "Compact" },
  { value: "comfortable", icon: Rows3,        label: "Comfortable" },
  { value: "cozy",        icon: Rows2,        label: "Cozy" },
];

const ROW_TOKENS: Record<ReconDensity, { py: string; fontBody: string; fontMono: string; fontHint: string }> = {
  compact:     { py: "py-1.5", fontBody: "text-[11px]",   fontMono: "text-[10.5px]", fontHint: "text-[10px]"  },
  comfortable: { py: "py-2.5", fontBody: "text-xs",       fontMono: "text-[11.5px]", fontHint: "text-[11px]"  },
  cozy:        { py: "py-3.5", fontBody: "text-[12.5px]", fontMono: "text-xs",       fontHint: "text-[11.5px]" },
};

// ── CSV Export ────────────────────────────────────────────────

function exportReconCSV(record: ReconciliationRecord): void {
  const headers = [
    "No Klaim",
    "Pasien",
    "Penjamin",
    "Diagnosa",
    "Confidence",
    "Tarif RS",
    "Nominal Disetujui",
    "Nominal Dibayar",
    "Selisih",
    "Metode",
    "Tanggal Match",
  ].join(",");

  const rows = record.matchedClaims.map((match) => {
    const claim = findClaimById(match.claimId);
    const selisih =
      claim?.approvedAmount !== undefined
        ? (claim.approvedAmount ?? 0n) - match.amount
        : undefined;
    const confidenceCfg = getConfidenceCfg(match.matchingConfidence);
    return [
      claim?.noKlaim ?? match.claimId,
      claim?.pasienId ?? "-",
      claim?.penjamin.nama ?? "-",
      claim?.diagnosaPrimer?.kode ?? "-",
      confidenceCfg.label,
      claim ? String(claim.tarifRS) : "-",
      claim?.approvedAmount !== undefined ? String(claim.approvedAmount) : "-",
      String(match.amount),
      selisih !== undefined ? String(selisih) : "-",
      match.autoMatched ? "Auto" : `Manual (${match.matchedBy ?? "-"})`,
      match.matchedAt ? fmtDatetime(match.matchedAt) : "-",
    ].join(",");
  });

  const csv = [headers, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `rekon-${record.noTransfer}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Confidence Badge ──────────────────────────────────────────

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const cfg = getConfidenceCfg(confidence);
  const tone = BANDING_TONE[cfg.tone];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1",
        tone.chipBg,
        tone.chipText,
        tone.chipRing,
      )}
    >
      {cfg.label}
    </span>
  );
}

// ── Detail Header ─────────────────────────────────────────────

function DetailHeader({
  record,
  onExportCSV,
  onPrint,
}: {
  record: ReconciliationRecord;
  onExportCSV: () => void;
  onPrint: () => void;
}) {
  const router = useRouter();
  const status = getReconViewStatus(record);
  const cfg = RECON_STATUS_CFG[status];
  const tone = BANDING_TONE[cfg.tone];

  return (
    <div className="relative border-b border-slate-200 bg-white px-4 py-3 sm:px-6 print:hidden">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-teal-400 via-emerald-300 to-sky-400" />
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Breadcrumb */}
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
        >
          <ArrowLeft size={14} />
          Rekonsiliasi
        </button>
        <span className="text-slate-300">/</span>
        <div className="flex items-center gap-1.5">
          <GitBranch size={14} className="text-teal-600" />
          <span className="font-mono text-sm font-semibold text-slate-800">
            {record.noTransfer}
          </span>
        </div>
        <span
          className={cn(
            "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1",
            tone.chipBg,
            tone.chipText,
            tone.chipRing,
          )}
        >
          {cfg.label}
        </span>

        {/* Actions */}
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onExportCSV}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
          >
            <FileDown size={14} />
            Export CSV
          </button>
          <button
            type="button"
            onClick={onPrint}
            className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-teal-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
          >
            <Printer size={14} />
            Cetak PDF
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Transfer Summary Card ─────────────────────────────────────

function TransferSummaryCard({ record }: { record: ReconciliationRecord }) {
  const penjamin = getPenjaminDisplay(record.penjaminId);
  const pTone = BANDING_TONE[penjamin.tone];

  return (
    <div className="overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
      <div className="flex items-center gap-2 border-b border-teal-100 bg-teal-50/50 px-4 py-2.5">
        <GitBranch size={14} className="text-teal-600" />
        <h3 className="text-sm font-semibold text-slate-700">Detail Transfer</h3>
      </div>

      {/* Big nominal */}
      <div className="border-b border-slate-100 px-4 py-3 text-center">
        <p className="text-[11px] text-slate-400">Nominal Transfer</p>
        <p className="font-mono text-2xl font-bold text-teal-700">
          {formatRupiah(record.nominalTransfer)}
        </p>
      </div>

      {/* Meta grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 p-4">
        <div>
          <p className="text-[11px] text-slate-400">No. Transfer</p>
          <p className="font-mono text-xs font-semibold text-slate-800">
            {record.noTransfer}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-slate-400">Bank</p>
          <p className="text-xs font-medium text-slate-800">{record.bank}</p>
        </div>
        <div>
          <p className="text-[11px] text-slate-400">Penjamin</p>
          <span
            className={cn(
              "inline-flex rounded-md px-1.5 py-0.5 text-[11px] font-semibold ring-1",
              pTone.chipBg,
              pTone.chipText,
              pTone.chipRing,
            )}
          >
            {penjamin.label}
          </span>
        </div>
        <div>
          <p className="text-[11px] text-slate-400">Periode Klaim</p>
          <p className="text-xs font-medium text-slate-800">
            {record.periodeKlaim}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-slate-400">Tanggal Transfer</p>
          <p className="flex items-center gap-1 text-xs text-slate-700">
            <Calendar size={10} className="text-slate-400" />
            {fmtDateShort(record.tanggalTransfer)}
          </p>
        </div>
        {record.completedAt && (
          <div>
            <p className="text-[11px] text-slate-400">Diselesaikan</p>
            <p className="text-xs text-slate-700">
              {fmtDatetime(record.completedAt)}
            </p>
            {record.completedBy && (
              <p className="flex items-center gap-1 text-[11px] text-slate-400">
                <User size={9} />
                {record.completedBy}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── KPI Strip ─────────────────────────────────────────────────

function KPIStrip({ record }: { record: ReconciliationRecord }) {
  const totalMatched = useMemo(
    () => record.matchedClaims.reduce((acc, m) => acc + m.amount, 0n),
    [record.matchedClaims],
  );

  const coverage =
    record.nominalTransfer > 0n
      ? Number((totalMatched * 100n) / record.nominalTransfer)
      : 0;

  const selisih = record.selisih ?? 0n;
  const hasSelisih = selisih > 0n;
  const selisihTertangani =
    record.statusSelisih === "Write-off" ||
    record.statusSelisih === "Refund";

  const items = [
    {
      label: "Klaim Dicocokkan",
      value: String(record.matchedClaims.length),
      sub: formatRupiah(totalMatched),
      tone: "teal" as const,
    },
    {
      label: "Coverage Transfer",
      value: `${coverage.toFixed(1)}%`,
      sub:
        coverage >= 100
          ? "Lunas penuh"
          : `Sisa ${formatRupiah(record.nominalTransfer - totalMatched)}`,
      tone: (coverage >= 100 ? "emerald" : "amber") as "emerald" | "amber",
    },
    {
      label: "Selisih",
      value: hasSelisih ? formatRupiah(selisih) : "Nihil",
      sub: hasSelisih
        ? selisihTertangani
          ? `${record.statusSelisih} ✓`
          : "Pending penanganan"
        : "Transfer sesuai",
      tone: (
        !hasSelisih
          ? "emerald"
          : selisihTertangani
            ? "slate"
            : "amber"
      ) as "emerald" | "slate" | "amber",
    },
  ] as const;

  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((item, idx) => {
        const tone = BANDING_TONE[item.tone];
        return (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, delay: idx * 0.06 }}
            className={cn(
              "relative overflow-hidden rounded-xl bg-white p-3.5 ring-1",
              tone.ringIdle,
            )}
          >
            <div
              className={cn(
                "absolute inset-y-0 left-0 w-0.5 rounded-l-xl bg-linear-to-b to-transparent",
                tone.barFrom,
              )}
            />
            <p className="text-[11px] text-slate-400">{item.label}</p>
            <p className={cn("font-mono text-lg font-bold", tone.chipText)}>
              {item.value}
            </p>
            <p className="text-[11px] text-slate-500">{item.sub}</p>
          </motion.div>
        );
      })}
    </div>
  );
}

// ── Matched Claim Row ─────────────────────────────────────────

function MatchedClaimRow({
  match,
  idx,
  density,
}: {
  match: ReconciliationMatch;
  idx: number;
  density: ReconDensity;
}) {
  const tok = ROW_TOKENS[density];
  const claim = findClaimById(match.claimId);
  const approvedAmount = claim?.approvedAmount;
  // Selisih: approved - paid (positive = penjamin underpaid, rare: negative = overpaid)
  const selisihKlaim =
    approvedAmount !== undefined ? approvedAmount - match.amount : undefined;

  const selisihColor =
    selisihKlaim === undefined || selisihKlaim === 0n
      ? "text-slate-400"
      : selisihKlaim > 0n
        ? "text-amber-600"
        : "text-emerald-600";

  return (
    <motion.tr
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.14, delay: Math.min(idx * 0.04, 0.3) }}
      className="border-b border-slate-100 hover:bg-teal-50/30"
    >
      {/* No. Klaim */}
      <td className={cn("px-3", tok.py)}>
        <p className={cn("whitespace-nowrap font-mono font-semibold text-slate-800", tok.fontMono)}>
          {claim?.noKlaim ?? match.claimId}
        </p>
      </td>

      {/* Pasien · Diagnosa */}
      <td className={cn("px-3", tok.py)}>
        <p className={cn("font-medium text-slate-800", tok.fontBody)}>
          {claim?.pasienId ?? "—"}
        </p>
        {claim?.diagnosaPrimer && (
          <p className={cn("text-slate-400", tok.fontHint)}>
            {claim.diagnosaPrimer.kode}
            {claim.diagnosaPrimer.deskripsi
              ? ` · ${claim.diagnosaPrimer.deskripsi.slice(0, 30)}…`
              : ""}
          </p>
        )}
      </td>

      {/* Penjamin */}
      <td className={cn("px-3", tok.py)}>
        {claim ? (
          <p className={cn("whitespace-nowrap text-slate-600", tok.fontBody)}>
            {claim.penjamin.nama}
          </p>
        ) : (
          <span className={cn("text-slate-400", tok.fontBody)}>—</span>
        )}
      </td>

      {/* Confidence */}
      <td className={cn("px-3", tok.py)}>
        <ConfidenceBadge confidence={match.matchingConfidence} />
      </td>

      {/* Tarif RS */}
      <td className={cn("px-3 text-right", tok.py)}>
        <p className={cn("font-mono text-slate-500", tok.fontMono)}>
          {claim ? formatRupiah(claim.tarifRS) : "—"}
        </p>
      </td>

      {/* Nominal Disetujui */}
      <td className={cn("px-3 text-right", tok.py)}>
        <p className={cn("font-mono text-slate-700", tok.fontMono)}>
          {approvedAmount !== undefined ? formatRupiah(approvedAmount) : "—"}
        </p>
      </td>

      {/* Nominal Dibayar */}
      <td className={cn("px-3 text-right", tok.py)}>
        <p className={cn("font-mono font-bold text-teal-700", tok.fontMono)}>
          {formatRupiah(match.amount)}
        </p>
      </td>

      {/* Selisih per klaim */}
      <td className={cn("px-3 text-right", tok.py)}>
        <p className={cn("font-mono font-semibold", tok.fontMono, selisihColor)}>
          {selisihKlaim === undefined
            ? "—"
            : selisihKlaim === 0n
              ? "Nihil"
              : (selisihKlaim > 0n ? "+" : "-") +
                formatRupiah(
                  selisihKlaim < 0n ? -selisihKlaim : selisihKlaim,
                )}
        </p>
      </td>

      {/* Metode · Tanggal */}
      <td className={cn("px-3", tok.py)}>
        <div className="flex items-center gap-1">
          {match.autoMatched ? (
            <Bot size={11} className="shrink-0 text-sky-500" />
          ) : (
            <UserCheck size={11} className="shrink-0 text-slate-500" />
          )}
          <p className={cn("text-slate-600", tok.fontHint)}>
            {match.autoMatched ? "Auto" : (match.matchedBy ?? "Manual")}
          </p>
        </div>
        {match.matchedAt && (
          <p className={cn("text-slate-400", tok.fontHint)}>
            {fmtDateShort(match.matchedAt)}
          </p>
        )}
      </td>
    </motion.tr>
  );
}

// ── Matched Claims Detail Table ───────────────────────────────

function MatchedClaimsDetailTable({
  record,
  density,
  onDensity,
}: {
  record: ReconciliationRecord;
  density: ReconDensity;
  onDensity: (d: ReconDensity) => void;
}) {
  const totalMatched = record.matchedClaims.reduce(
    (acc, m) => acc + m.amount,
    0n,
  );
  const totalTarifRS = record.matchedClaims.reduce((acc, m) => {
    const c = findClaimById(m.claimId);
    return acc + (c?.tarifRS ?? 0n);
  }, 0n);
  const totalApproved = record.matchedClaims.reduce((acc, m) => {
    const c = findClaimById(m.claimId);
    return acc + (c?.approvedAmount ?? 0n);
  }, 0n);

  const COLS = [
    "No. Klaim",
    "Pasien · Diagnosa",
    "Penjamin",
    "Confidence",
    "Tarif RS",
    "Disetujui",
    "Dibayar",
    "Selisih",
    "Metode · Tanggal",
  ];

  if (record.matchedClaims.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-xl bg-white py-12 ring-1 ring-slate-200">
        <p className="text-sm text-slate-400">
          Tidak ada klaim yang dicocokkan
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl bg-white ring-1 ring-slate-200" data-density={density}>
      <div className="flex items-center gap-2 border-b border-teal-100 bg-teal-50/40 px-4 py-2.5">
        <CheckCircle2 size={14} className="text-teal-600" />
        <h3 className="text-sm font-semibold text-slate-700">
          Klaim Tercocokkan ({record.matchedClaims.length})
        </h3>
        <span className="ml-auto font-mono text-sm font-bold text-teal-700">
          Total {formatRupiah(totalMatched)}
        </span>
        {/* Density toggle */}
        <div
          role="radiogroup"
          aria-label="Density tabel"
          className="ml-2 flex items-center gap-0.5 rounded-lg bg-slate-100 p-0.5"
        >
          {DENSITY_OPTS.map(({ value, icon: Icon, label }) => {
            const active = density === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={active}
                aria-label={label}
                onClick={() => onDensity(value)}
                className={cn(
                  "flex items-center justify-center rounded-md p-1 transition",
                  active
                    ? "bg-white text-teal-600 shadow-sm ring-1 ring-slate-200"
                    : "text-slate-400 hover:text-slate-600",
                )}
              >
                <Icon size={13} />
              </button>
            );
          })}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              {COLS.map((h) => (
                <th
                  key={h}
                  className={cn(
                    "whitespace-nowrap px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400",
                    h === "Tarif RS" || h === "Disetujui" || h === "Dibayar" || h === "Selisih"
                      ? "text-right"
                      : "",
                  )}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {record.matchedClaims.map((match, idx) => (
              <MatchedClaimRow key={match.claimId} match={match} idx={idx} density={density} />
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-teal-200 bg-teal-50/30">
              <td
                colSpan={4}
                className="px-3 py-2.5 text-xs font-semibold text-slate-600"
              >
                Total ({record.matchedClaims.length} klaim)
              </td>
              <td className="px-3 py-2.5 text-right font-mono text-xs text-slate-500">
                {formatRupiah(totalTarifRS)}
              </td>
              <td className="px-3 py-2.5 text-right font-mono text-xs text-slate-700">
                {totalApproved > 0n ? formatRupiah(totalApproved) : "—"}
              </td>
              <td className="px-3 py-2.5 text-right font-mono text-sm font-bold text-teal-700">
                {formatRupiah(totalMatched)}
              </td>
              <td className="px-3 py-2.5 text-right font-mono text-xs font-semibold text-amber-600">
                {record.selisih && record.selisih > 0n
                  ? formatRupiah(record.selisih)
                  : "Nihil"}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ── Selisih Resolution Card ───────────────────────────────────

function SelisihCard({ record }: { record: ReconciliationRecord }) {
  const selisih = record.selisih ?? 0n;
  if (selisih === 0n) return null;

  const totalMatched = record.matchedClaims.reduce(
    (acc, m) => acc + m.amount,
    0n,
  );
  const isTertangani =
    record.statusSelisih === "Write-off" ||
    record.statusSelisih === "Refund";

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl ring-1",
        isTertangani
          ? "bg-slate-50 ring-slate-200"
          : "bg-amber-50 ring-amber-200",
      )}
    >
      <div className="flex items-center gap-2 border-b border-current/10 px-4 py-2.5">
        {isTertangani ? (
          <CheckCircle2 size={14} className="text-slate-400" />
        ) : (
          <AlertTriangle size={14} className="text-amber-500" />
        )}
        <h3 className="text-sm font-semibold text-slate-700">
          Selisih & Penanganan
        </h3>
        <span
          className={cn(
            "ml-auto rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1",
            isTertangani
              ? "bg-slate-100 text-slate-600 ring-slate-300"
              : "bg-amber-100 text-amber-700 ring-amber-300",
          )}
        >
          {record.statusSelisih ?? "Pending"}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-4 p-4">
        <div className="text-center">
          <p className="text-[11px] text-slate-400">Nominal Transfer</p>
          <p className="font-mono text-sm font-bold text-slate-800">
            {formatRupiah(record.nominalTransfer)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[11px] text-slate-400">Total Dicocokkan</p>
          <p className="font-mono text-sm font-bold text-teal-700">
            {formatRupiah(totalMatched)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[11px] text-slate-400">Selisih</p>
          <p
            className={cn(
              "font-mono text-sm font-bold",
              isTertangani ? "text-slate-400 line-through" : "text-amber-600",
            )}
          >
            {formatRupiah(selisih)}
          </p>
          {isTertangani && (
            <p className="text-[11px] font-semibold text-emerald-600">
              {record.statusSelisih}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Not Found ─────────────────────────────────────────────────

function NotFound({ id }: { id: string }) {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <XCircle size={40} className="text-slate-300" />
      <p className="text-sm font-semibold text-slate-600">
        Rekonsiliasi tidak ditemukan
      </p>
      <p className="font-mono text-xs text-slate-400">{id}</p>
      <button
        type="button"
        onClick={() => router.back()}
        className="mt-2 flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 focus:outline-none"
      >
        <ArrowLeft size={14} />
        Kembali
      </button>
    </div>
  );
}

// ── Skeleton Shell ────────────────────────────────────────────

function SkeletonShell() {
  return (
    <motion.div
      key="skeleton"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="flex h-full flex-col"
    >
      {/* Header placeholder */}
      <div className="relative border-b border-slate-200 bg-white px-6 py-3">
        <div className="absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-teal-200 via-emerald-200 to-sky-200" />
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="h-7 w-24 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-48 animate-pulse rounded bg-slate-200" />
            <div className="h-5 w-16 animate-pulse rounded-full bg-slate-200" />
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-28 animate-pulse rounded-lg bg-slate-200" />
            <div className="h-8 w-24 animate-pulse rounded-lg bg-slate-200" />
          </div>
        </div>
      </div>
      {/* Content placeholder */}
      <div className="space-y-4 p-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
          <div className="h-52 animate-pulse rounded-xl bg-white ring-1 ring-slate-100" />
          <div className="grid grid-cols-3 gap-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-xl bg-white ring-1 ring-slate-100"
              />
            ))}
          </div>
        </div>
        <div className="h-56 animate-pulse rounded-xl bg-white ring-1 ring-slate-100" />
      </div>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────

export default function ReconciliationDetailPage({ id }: { id: string }) {
  const ready = useSkeletonDelay(500);
  const record = useMemo(() => findReconciliation(id), [id]);
  const [density, setDensity] = useState<ReconDensity>("comfortable");

  const handleExportCSV = useCallback(() => {
    if (record) exportReconCSV(record);
  }, [record]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-50/60">
      <AnimatePresence mode="wait">
        {!ready ? (
          <SkeletonShell key="skeleton" />
        ) : !record ? (
          <motion.div
            key="notfound"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <NotFound id={id} />
          </motion.div>
        ) : (
          <motion.div
            key="ready"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="flex min-h-0 flex-1 flex-col"
          >
            <DetailHeader
              record={record}
              onExportCSV={handleExportCSV}
              onPrint={handlePrint}
            />

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto p-4 [scrollbar-width:thin] sm:p-6">
              <div className="mx-auto max-w-screen-xl space-y-4">
                {/* Row 1: Transfer summary + KPI strip */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
                  <TransferSummaryCard record={record} />
                  <KPIStrip record={record} />
                </div>

                {/* Row 2: Matched claims detail table */}
                <MatchedClaimsDetailTable record={record} density={density} onDensity={setDensity} />

                {/* Row 3: Selisih resolution card (conditional) */}
                <SelisihCard record={record} />
              </div>
            </div>

            {/* Print-only A4 template */}
            <ReconciliationPrintTemplate record={record} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
