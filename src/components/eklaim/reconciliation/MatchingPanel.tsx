"use client";

/**
 * MatchingPanel — panel kanan rekonsiliasi (EK7.2).
 *
 * View states per transfer:
 *   1. Empty      — tidak ada transfer dipilih
 *   2. Completed  — completedAt set, matchedClaims stored → read-only view
 *   3. PendingRun — matchedClaims kosong, belum pernah di-run → CTA "Jalankan Matching"
 *   4. HasResult  — matchResult dari engine (lokal) → tampil hasil + "Simpan"
 *
 * EK7.2 Matching Strategies (via reconciliationMatcher.ts):
 *   · Exact (confidence 1.0)        — sum klaim = nominal transfer persis
 *   · Periode+Count (0.9)           — sum within ±2% dengan count & periode cocok
 *   · Fuzzy ±5% (0.7)               — greedy sum within ±5% toleransi
 *   · Unmatched                     → CTA manual match picker
 */

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  GitBranch, Play, Loader2, CheckCircle2, AlertTriangle, XCircle,
  Save, Calendar, User, ChevronDown, ChevronUp, Plus, Pencil,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { formatRupiah } from "@/lib/eklaim/money";
import type { ReconciliationRecord, ReconciliationMatch, ClaimRecord } from "@/lib/eklaim/eklaimShared";
import type { MatchResult } from "@/lib/eklaim/reconciliationMatcher";

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

// ── Confidence Badge ──────────────────────────────────────────

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const cfg  = getConfidenceCfg(confidence);
  const tone = BANDING_TONE[cfg.tone];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-sm font-semibold ring-1",
        tone.chipBg, tone.chipText, tone.chipRing,
      )}
    >
      {cfg.label}
    </span>
  );
}

// ── Matched Claim Row ─────────────────────────────────────────

function MatchedClaimRow({ match, idx }: { match: ReconciliationMatch; idx: number }) {
  const claim = findClaimById(match.claimId);
  return (
    <motion.tr
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.14, delay: idx * 0.04 }}
      className="border-b border-slate-100 hover:bg-slate-50/60"
    >
      <td className="px-3 py-2.5">
        <p className="font-mono text-sm font-semibold text-slate-800">
          {claim?.noKlaim ?? match.claimId}
        </p>
        {claim && (
          <p className="text-sm text-slate-500">
            {claim.pasienId}
            {claim.penjamin.nama && (
              <> · {claim.penjamin.nama}</>
            )}
          </p>
        )}
      </td>
      <td className="px-3 py-2.5">
        <ConfidenceBadge confidence={match.matchingConfidence} />
      </td>
      <td className="px-3 py-2.5 font-mono text-sm font-bold text-teal-700">
        {formatRupiah(match.amount)}
      </td>
      <td className="px-3 py-2.5">
        <p
          className="max-w-[180px] truncate text-sm text-slate-500"
          title={match.matchingReason}
        >
          {match.matchingReason}
        </p>
      </td>
    </motion.tr>
  );
}

// ── Matched Claims Table ──────────────────────────────────────

function MatchedClaimsTable({
  matches,
  totalMatched,
  title,
}: {
  matches: ReadonlyArray<ReconciliationMatch>;
  totalMatched: bigint;
  title: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
      <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
        <CheckCircle2 size={14} className="text-emerald-500" />
        <h4 className="text-sm font-semibold text-slate-700">
          {title} ({matches.length})
        </h4>
        <span className="ml-auto font-mono text-sm font-bold text-teal-700">
          {formatRupiah(totalMatched)}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              {["Klaim", "Confidence", "Nominal", "Alasan Match"].map((h) => (
                <th
                  key={h}
                  className="px-3 py-2 text-sm font-semibold uppercase tracking-wider text-slate-400"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matches.map((m, idx) => (
              <MatchedClaimRow key={m.claimId} match={m} idx={idx} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Transfer Detail Card ──────────────────────────────────────

function TransferDetailCard({ record }: { record: ReconciliationRecord }) {
  const status   = getReconViewStatus(record);
  const cfg      = RECON_STATUS_CFG[status];
  const tone     = BANDING_TONE[cfg.tone];
  const penjamin = getPenjaminDisplay(record.penjaminId);

  return (
    <div className="overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
      <div className="flex items-center gap-2 border-b border-teal-100 bg-teal-50/50 px-4 py-2.5">
        <GitBranch size={14} className="shrink-0 text-teal-600" />
        <h3 className="text-sm font-semibold text-slate-700">Detail Transfer</h3>
        <span
          className={cn(
            "ml-auto inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-semibold ring-1",
            tone.chipBg, tone.chipText, tone.chipRing,
          )}
        >
          {cfg.label}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 p-4 sm:grid-cols-3">
        <div>
          <p className="text-sm text-slate-500">No. Transfer</p>
          <p className="font-mono text-sm font-semibold text-slate-800">{record.noTransfer}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Nominal</p>
          <p className="font-mono text-sm font-bold text-teal-700">
            {formatRupiah(record.nominalTransfer)}
          </p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Bank</p>
          <p className="text-sm font-medium text-slate-800">{record.bank}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Penjamin</p>
          <span
            className={cn(
              "inline-flex items-center rounded-md px-1.5 py-0.5 text-sm font-medium ring-1",
              BANDING_TONE[penjamin.tone].chipBg,
              BANDING_TONE[penjamin.tone].chipText,
              BANDING_TONE[penjamin.tone].chipRing,
            )}
          >
            {penjamin.label}
          </span>
        </div>
        <div>
          <p className="text-sm text-slate-500">Tanggal</p>
          <p className="flex items-center gap-1 text-sm text-slate-700">
            <Calendar size={11} className="text-slate-400" />
            {fmtDateShort(record.tanggalTransfer)}
          </p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Periode Klaim</p>
          <p className="text-sm font-medium text-slate-800">{record.periodeKlaim}</p>
        </div>
      </div>
    </div>
  );
}

// ── Run Match Engine CTA ──────────────────────────────────────

function RunMatchSection({
  isRunning,
  onRun,
}: {
  isRunning: boolean;
  onRun: () => void;
}) {
  const STRATEGIES = [
    { label: "Exact",          desc: "Sum klaim = nominal transfer persis", tone: "emerald" as const },
    { label: "Periode+Count",  desc: "Sum klaim dalam ±2% nominal",         tone: "sky"     as const },
    { label: "Fuzzy ±5%",      desc: "Greedy match dalam ±5% toleransi",    tone: "amber"   as const },
  ];
  return (
    <div className="overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
      <div className="flex items-center gap-2 border-b border-amber-100 bg-amber-50/50 px-4 py-2.5">
        <GitBranch size={14} className="text-amber-600" />
        <h4 className="text-sm font-semibold text-slate-700">Matching Engine</h4>
        <span className="ml-auto rounded-full bg-rose-100 px-2 py-0.5 text-sm font-semibold text-rose-700">
          Belum Dicocokkan
        </span>
      </div>
      <div className="p-6 text-center">
        <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-amber-50 ring-1 ring-amber-200">
          <GitBranch size={24} className="text-amber-500" />
        </div>
        <p className="text-sm font-semibold text-slate-700">Transfer belum dicocokkan ke klaim</p>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
          Auto-matching mencocokkan nominal transfer ke klaim dengan status Approved,
          <br />menggunakan 3 strategi berurutan:
        </p>

        {/* Strategy legend */}
        <div className="mx-auto mt-4 max-w-xs space-y-1.5 text-left">
          {STRATEGIES.map((s) => {
            const t = BANDING_TONE[s.tone];
            return (
              <div key={s.label} className="flex items-center gap-2">
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-sm font-semibold ring-1",
                    t.chipBg, t.chipText, t.chipRing,
                  )}
                >
                  {s.label}
                </span>
                <span className="text-sm text-slate-500">{s.desc}</span>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onRun}
          disabled={isRunning}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
        >
          {isRunning ? (
            <><Loader2 size={16} className="animate-spin" /> Mencocokkan…</>
          ) : (
            <><Play size={15} /> Jalankan Matching Engine</>
          )}
        </button>
      </div>
    </div>
  );
}

// ── Match Result View (from engine output) ────────────────────

function MatchResultView({
  result,
  onSave,
}: {
  result: MatchResult;
  onSave: () => void;
}) {
  const [showUnmatched, setShowUnmatched] = useState(false);
  const hasUnmatched   = result.unmatched.claimsLeft.length > 0;
  const totalMatched   = result.matched.reduce((acc, m) => acc + m.amount, 0n);

  const isAuto      = result.recommendedStatus === "AutoMatched";
  const isNeedsReview = result.recommendedStatus === "NeedsReview";

  const bannerClasses = isAuto
    ? "bg-emerald-50 ring-emerald-200"
    : isNeedsReview
    ? "bg-amber-50 ring-amber-200"
    : "bg-rose-50 ring-rose-200";

  const bannerTitle = isAuto
    ? "Auto-Match Berhasil"
    : isNeedsReview
    ? "Partial Match — Perlu Review"
    : "Tidak Cocok — Cocokkan Manual";

  const BannerIcon = isAuto ? CheckCircle2 : isNeedsReview ? AlertTriangle : XCircle;
  const bannerIconCls = isAuto
    ? "text-emerald-500"
    : isNeedsReview
    ? "text-amber-500"
    : "text-rose-500";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      {/* Result banner */}
      <div className={cn("flex items-center gap-3 rounded-xl p-4 ring-1", bannerClasses)}>
        <BannerIcon size={20} className={cn("shrink-0", bannerIconCls)} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-800">{bannerTitle}</p>
          <p className="text-sm text-slate-600">
            {result.matched.length} klaim cocok
            {hasUnmatched && ` · ${result.unmatched.claimsLeft.length} klaim belum cocok`}
            {result.selisih > 0n && ` · Selisih ${formatRupiah(result.selisih)}`}
          </p>
        </div>
        {result.matched.length > 0 && (
          <button
            type="button"
            onClick={onSave}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-teal-700"
          >
            <Save size={13} />
            Simpan
          </button>
        )}
      </div>

      {/* Matched claims */}
      {result.matched.length > 0 && (
        <MatchedClaimsTable
          matches={result.matched}
          totalMatched={totalMatched}
          title="Klaim Tercocokkan"
        />
      )}

      {/* Unmatched claims (collapsible) */}
      {hasUnmatched && (
        <UnmatchedSection
          unmatched={result.unmatched.claimsLeft}
          show={showUnmatched}
          onToggle={() => setShowUnmatched((p) => !p)}
        />
      )}
    </motion.div>
  );
}

// ── Completed View (from stored record) ───────────────────────

function CompletedView({
  record,
  onWriteOff,
}: {
  record:     ReconciliationRecord;
  onWriteOff: () => void;
}) {
  const totalMatched      = record.matchedClaims.reduce((acc, m) => acc + m.amount, 0n);
  const hasSelisih        = record.selisih !== undefined && record.selisih > 0n;
  const selisihTertangani =
    record.statusSelisih === "Write-off" || record.statusSelisih === "Refund";
  const showWriteOffCta   = hasSelisih && !selisihTertangani;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      {/* Summary banner */}
      <div
        className={cn(
          "flex items-start gap-3 rounded-xl p-4 ring-1",
          hasSelisih ? "bg-amber-50 ring-amber-200" : "bg-emerald-50 ring-emerald-200",
        )}
      >
        {hasSelisih ? (
          <AlertTriangle size={20} className="mt-0.5 shrink-0 text-amber-500" />
        ) : (
          <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-500" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-800">
            {hasSelisih
              ? selisihTertangani
                ? `Selesai — Selisih ${record.statusSelisih}`
                : "Selesai dengan Selisih Pending"
              : "Rekonsiliasi Selesai"}
          </p>
          <p className="text-sm text-slate-600">
            {record.matchedClaims.length} klaim tercocokkan
            {hasSelisih &&
              ` · Selisih ${formatRupiah(record.selisih!)} (${record.statusSelisih ?? "Pending"})`}
          </p>
          {record.completedAt && (
            <p className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-slate-400">
              <span className="flex items-center gap-1">
                <Calendar size={10} />
                {fmtDatetime(record.completedAt)}
              </span>
              {record.completedBy && (
                <span className="flex items-center gap-1">
                  <User size={10} />
                  {record.completedBy}
                </span>
              )}
            </p>
          )}
        </div>
        {/* CTA: tangani selisih pending */}
        {showWriteOffCta && (
          <button
            type="button"
            onClick={onWriteOff}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-amber-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            <Pencil size={12} />
            Tangani Selisih
          </button>
        )}
      </div>

      {/* Matched claims */}
      {record.matchedClaims.length > 0 && (
        <MatchedClaimsTable
          matches={record.matchedClaims}
          totalMatched={totalMatched}
          title="Klaim Tercocokkan"
        />
      )}
    </motion.div>
  );
}

// ── Unmatched Section (manual match) ─────────────────────────

function UnmatchedSection({
  unmatched,
  show,
  onToggle,
}: {
  unmatched: ReadonlyArray<ClaimRecord>;
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-2 border-b border-slate-200 bg-rose-50/50 px-4 py-2.5 text-left transition hover:bg-rose-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-rose-400"
      >
        <AlertTriangle size={14} className="text-rose-500" />
        <h4 className="text-sm font-semibold text-slate-700">
          Klaim Belum Cocok ({unmatched.length}) — Cocokkan Manual
        </h4>
        <span className="ml-auto text-slate-400">
          {show ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>
      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="divide-y divide-slate-100">
            {unmatched.map((claim) => (
              <div
                key={claim.id}
                className="flex items-center gap-3 px-4 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-sm font-semibold text-slate-700">
                    {claim.noKlaim}
                  </p>
                  <p className="text-sm text-slate-500">
                    {claim.pasienId} · {claim.penjamin.nama}
                  </p>
                </div>
                <p className="shrink-0 font-mono text-sm font-semibold text-rose-600">
                  {claim.approvedAmount !== undefined
                    ? formatRupiah(claim.approvedAmount)
                    : "—"}
                </p>
                <button
                  type="button"
                  title="Tambah ke match manual"
                  className="shrink-0 rounded-md p-1 text-slate-400 transition hover:bg-teal-50 hover:text-teal-600 focus:outline-none"
                >
                  <Plus size={14} />
                </button>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-100 bg-amber-50/40 px-4 py-2.5">
            <p className="text-sm text-amber-700">
              ⚠️ Klaim di atas tidak tercocokkan otomatis. Konfirmasi manual dengan Tim Klaim
              sebelum menandai selesai.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────

interface Props {
  record:          ReconciliationRecord | null;
  matchResult:     MatchResult | null;
  runningId:       string | null;
  onRunMatch:      (id: string) => void;
  onSaveMatch:     (id: string) => void;
  onOpenWriteOff:  (id: string) => void;
}

export default function MatchingPanel({
  record,
  matchResult,
  runningId,
  onRunMatch,
  onSaveMatch,
  onOpenWriteOff,
}: Props) {
  // Empty state
  if (!record) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-xl bg-white ring-1 ring-slate-200">
        <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100">
          <GitBranch size={26} className="text-slate-400" />
        </span>
        <p className="text-sm font-semibold text-slate-600">
          Pilih transfer untuk melihat detail
        </p>
        <p className="mt-1 text-sm text-slate-400">
          Klik item transfer di panel kiri untuk memulai rekonsiliasi
        </p>
      </div>
    );
  }

  const isRunning   = runningId === record.id;
  // CompletedView: completedAt set AND no fresh matchResult (cleared after save)
  const isCompleted = Boolean(record.completedAt) && !matchResult;
  // PendingRun: no existing matches AND no engine result
  const isPending   = record.matchedClaims.length === 0 && !matchResult && !isCompleted;

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto [scrollbar-width:thin]">
      {/* Transfer detail always shown at top */}
      <TransferDetailCard record={record} />

      {/* Content area — mutually exclusive views */}
      <AnimatePresence mode="wait">
        {isCompleted ? (
          <motion.div
            key="completed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <CompletedView
              record={record}
              onWriteOff={() => onOpenWriteOff(record.id)}
            />
          </motion.div>
        ) : matchResult ? (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <MatchResultView
              result={matchResult}
              onSave={() => onSaveMatch(record.id)}
            />
          </motion.div>
        ) : isPending ? (
          <motion.div
            key="pending"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <RunMatchSection
              isRunning={isRunning}
              onRun={() => onRunMatch(record.id)}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
