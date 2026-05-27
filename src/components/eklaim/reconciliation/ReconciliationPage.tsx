"use client";

/**
 * ReconciliationPage — shell halaman `/ehis-eklaim/reconciliation` (EK7).
 *
 * Layout (no page-level scroll):
 *   ┌─ ReconciliationHero (teal · slim) ─────────────────────────────────────┐
 *   ├─────────────────────────────────────────────────────────────────────────┤
 *   │ TransferList (380px · scroll-in) │ MatchingPanel (fluid · scroll-in)  │
 *   │  KPI strip + items list          │  Transfer detail + engine results   │
 *   └──────────────────────────────────┴────────────────────────────────────┘
 *
 * State machine:
 *   - localRecords:     mutable copy of RECONCILIATION_MOCK + newly imported
 *   - selectedId:       which transfer is open in the right panel
 *   - matchResultsMap:  MatchResult cache per transfer ID (from running engine)
 *   - runningId:        transfer ID currently being matched (loading spinner)
 *   - importOpen:       ImportTransferModal visibility
 */

import { useState, useMemo, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { GitBranch } from "lucide-react";

import { useSkeletonDelay } from "@/components/master/shared";
import { RECONCILIATION_MOCK } from "@/lib/eklaim/reconciliationMock";
import { matchTransfer } from "@/lib/eklaim/reconciliationMatcher";
import type { MatchResult } from "@/lib/eklaim/reconciliationMatcher";
import type { ReconciliationRecord, SelisihStatus } from "@/lib/eklaim/eklaimShared";

import TransferList from "./TransferList";
import MatchingPanel from "./MatchingPanel";
import ImportTransferModal from "./ImportTransferModal";
import SelisihWriteOffModal from "./SelisihWriteOffModal";
import { getApprovedClaimPool, computeReconKPIs } from "./reconciliationShared";

// ── Main Page ─────────────────────────────────────────────────

export default function ReconciliationPage() {
  const ready = useSkeletonDelay(500);

  const [records, setRecords] = useState<ReconciliationRecord[]>(() => [
    ...RECONCILIATION_MOCK,
  ]);
  const [selectedId, setSelectedId] = useState<string | null>(
    "RECON-2026-0521-001",
  );
  const [importOpen, setImportOpen]     = useState(false);
  const [writeOffOpen, setWriteOffOpen] = useState(false);
  const [matchResultsMap, setMatchResultsMap] = useState<
    Record<string, MatchResult | undefined>
  >({});
  const [runningId, setRunningId] = useState<string | null>(null);

  const approvedPool = useMemo(() => getApprovedClaimPool(), []);
  const kpis = useMemo(() => computeReconKPIs(records), [records]);
  const selectedRecord = records.find((r) => r.id === selectedId) ?? null;

  // ── Run matching engine ───────────────────────────────────

  const handleRunMatch = useCallback(
    async (transferId: string) => {
      const rec = records.find((r) => r.id === transferId);
      if (!rec || runningId) return;
      setRunningId(transferId);
      // Simulate 1.5 s async latency (real: REST call to matching service)
      await new Promise<void>((res) => setTimeout(res, 1500));
      const result = matchTransfer(
        {
          noTransfer:       rec.noTransfer,
          tanggalTransfer:  rec.tanggalTransfer,
          nominalTransfer:  rec.nominalTransfer,
          penjaminId:       rec.penjaminId,
          periodeKlaim:     rec.periodeKlaim,
        },
        approvedPool,
      );
      setMatchResultsMap((prev) => ({ ...prev, [transferId]: result }));
      setRunningId(null);
    },
    [records, approvedPool, runningId],
  );

  // ── Save match result to record ───────────────────────────

  const handleSaveMatch = useCallback(
    (transferId: string) => {
      const result = matchResultsMap[transferId];
      if (!result) return;
      const now = new Date().toISOString();
      setRecords((prev) =>
        prev.map((r) => {
          if (r.id !== transferId) return r;
          const isAuto = result.recommendedStatus === "AutoMatched";
          return {
            ...r,
            matchedClaims: [...result.matched].map((m) => ({
              ...m,
              matchedBy: isAuto ? "Sistem Auto-Matcher" : "Tim Klaim",
            })),
            selisih:       result.selisih,
            statusSelisih: result.selisih > 0n ? ("Pending" as const) : undefined,
            completedAt:   isAuto ? now : undefined,
            completedBy:   isAuto ? "Sistem Auto-Matcher" : undefined,
          };
        }),
      );
      // Clear cached result so panel switches to CompletedView
      setMatchResultsMap((prev) => ({ ...prev, [transferId]: undefined }));
    },
    [matchResultsMap],
  );

  // ── Import new transfer from CSV ──────────────────────────

  const handleImport = useCallback(
    (newRecord: ReconciliationRecord) => {
      setRecords((prev) => [newRecord, ...prev]);
      setSelectedId(newRecord.id);
      setImportOpen(false);
    },
    [],
  );

  // ── Handle write-off / refund / pending selisih ───────────

  const handleWriteOff = useCallback(
    (status: SelisihStatus, alasan: string, approver: string) => {
      if (!selectedId) return;
      const now = new Date().toISOString();
      setRecords((prev) =>
        prev.map((r) => {
          if (r.id !== selectedId) return r;
          return {
            ...r,
            statusSelisih: status,
            completedAt:   r.completedAt ?? now,
            completedBy:   approver,
          };
        }),
      );
      // alasan saat ini disimpan client-side; saat backend: POST /reconciliation/{id}/selisih
      void alasan;
      setWriteOffOpen(false);
    },
    [selectedId],
  );

  const timestamp = useMemo(
    () =>
      new Date().toLocaleDateString("id-ID", {
        day: "2-digit", month: "long", year: "numeric",
      }),
    [],
  );

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-50/60">
      <AnimatePresence mode="wait">
        {!ready ? (
          <SkeletonShell key="skeleton" />
        ) : (
          <motion.div
            key="ready"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="flex min-h-0 flex-1 flex-col"
          >
            {/* Hero */}
            <ReconciliationHero timestamp={timestamp} count={records.length} />

            {/* Two-panel grid */}
            <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 px-4 pt-4 pb-5 sm:px-6 lg:grid-cols-[380px_minmax(0,1fr)]">
              {/* Left — transfer list */}
              <div className="min-h-0 overflow-hidden lg:max-h-[calc(100vh-220px)]">
                <TransferList
                  records={records}
                  kpis={kpis}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  onImport={() => setImportOpen(true)}
                />
              </div>

              {/* Right — matching panel */}
              <div className="min-h-0 overflow-hidden lg:max-h-[calc(100vh-220px)]">
                <MatchingPanel
                  record={selectedRecord}
                  matchResult={
                    selectedRecord
                      ? (matchResultsMap[selectedRecord.id] ?? null)
                      : null
                  }
                  runningId={runningId}
                  onRunMatch={handleRunMatch}
                  onSaveMatch={handleSaveMatch}
                  onOpenWriteOff={(id) => { setSelectedId(id); setWriteOffOpen(true); }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Import modal */}
      <AnimatePresence>
        {importOpen && (
          <ImportTransferModal
            onClose={() => setImportOpen(false)}
            onImport={handleImport}
          />
        )}
      </AnimatePresence>

      {/* Write-off / Refund / Pending selisih modal */}
      <AnimatePresence>
        {writeOffOpen && selectedRecord && (
          <SelisihWriteOffModal
            record={selectedRecord}
            onClose={() => setWriteOffOpen(false)}
            onSave={handleWriteOff}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Hero ──────────────────────────────────────────────────────

function ReconciliationHero({
  timestamp,
  count,
}: {
  timestamp: string;
  count: number;
}) {
  return (
    <div className="relative border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-teal-400 via-emerald-300 to-sky-400" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 ring-1 ring-teal-200">
            <GitBranch size={18} className="text-teal-600" />
          </span>
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-teal-600">
              E-Klaim · Rekonsiliasi Transfer
            </p>
            <h1 className="text-base font-bold text-slate-800">
              Rekonsiliasi Pembayaran BPJS & Asuransi
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-sm text-slate-500">
            {count} transfer
          </span>
          <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-sm font-medium text-teal-600 ring-1 ring-teal-200">
            {timestamp}
          </span>
        </div>
      </div>
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
      {/* Hero placeholder */}
      <div className="relative border-b border-slate-200 bg-white px-6 py-3">
        <div className="absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-teal-200 via-emerald-200 to-sky-200" />
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 animate-pulse rounded-lg bg-teal-100" />
          <div className="space-y-1.5">
            <div className="h-3 w-36 animate-pulse rounded bg-slate-200" />
            <div className="h-5 w-72 animate-pulse rounded bg-slate-200" />
          </div>
        </div>
      </div>
      {/* 2-panel placeholder */}
      <div className="grid flex-1 gap-4 px-6 pt-4 pb-5 lg:grid-cols-[380px_minmax(0,1fr)]">
        <div className="animate-pulse rounded-xl bg-white ring-1 ring-slate-100" />
        <div className="animate-pulse rounded-xl bg-white ring-1 ring-slate-100" />
      </div>
    </motion.div>
  );
}
