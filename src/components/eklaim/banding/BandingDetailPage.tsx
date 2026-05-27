"use client";

/**
 * BandingDetailPage — shell halaman `/ehis-eklaim/banding/[id]` (EK6.3).
 *
 * Layout (no page-level scroll):
 *   ┌── BandingDetailHeader  (sticky · breadcrumb · status · tingkat) ──┐
 *   ├────────────────────────────────────────────────────────────────────┤
 *   │  Left (360px sticky)          │  Right (fluid · internal scroll)  │
 *   │  · Klaim Context Card         │  · Alasan Banding Card            │
 *   │  · Alasan Rejection Asli      │  · Dokumen Pendukung List         │
 *   │                               │  · Status Timeline                │
 *   │                               │  · Mock Review BPJS (demo)        │
 *   └───────────────────────────────┴───────────────────────────────────┘
 *
 * Skeleton 500ms via `useSkeletonDelay` · AnimatePresence fade.
 * mockStatus/mockHasil/mockReviewedAt = local demo state (tidak persist).
 */

import { useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";

import { useSkeletonDelay } from "@/components/master/shared";
import { BANDING_MOCK } from "@/lib/eklaim/bandingMock";
import { CLAIM_BOARD_MOCK } from "@/lib/eklaim/claimsMock";
import type { BandingStatus } from "@/lib/eklaim/eklaimShared";
import BandingDetailHeader from "./detail/BandingDetailHeader";
import BandingDetailLeft from "./detail/BandingDetailLeft";
import BandingDetailRight from "./detail/BandingDetailRight";

interface Props {
  /** Banding ID dari URL `/ehis-eklaim/banding/[id]`. */
  id: string;
}

export default function BandingDetailPage({ id }: Props) {
  const ready = useSkeletonDelay(500);

  const banding = useMemo(
    () => BANDING_MOCK.find((b) => b.id === id),
    [id],
  );

  const claim = useMemo(
    () =>
      banding
        ? (CLAIM_BOARD_MOCK.find((c) => c.id === banding.claimId) ?? null)
        : null,
    [banding],
  );

  // ── Local mock review state (demo only — tidak persist) ──
  const [mockStatus, setMockStatus] = useState<BandingStatus>(
    () => banding?.status ?? "Submitted",
  );
  const [mockHasil, setMockHasil] = useState<string | undefined>(
    () => banding?.hasilBanding,
  );
  const [mockReviewedAt, setMockReviewedAt] = useState<string | undefined>(
    () => banding?.reviewedAt,
  );

  function handleMockReview(result: "Approved" | "Rejected") {
    setMockStatus(result);
    setMockHasil(
      result === "Approved"
        ? "Banding dikabulkan — klaim diterima sesuai koding RS (Simulasi Demo)"
        : "Banding ditolak — verifikator BPJS tetap tidak menyetujui klaim (Simulasi Demo)",
    );
    setMockReviewedAt(new Date().toISOString());
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-50/60">
      <AnimatePresence mode="wait">
        {!ready ? (
          <SkeletonShell key="skeleton" />
        ) : !banding ? (
          <NotFoundState key="not-found" id={id} />
        ) : (
          <motion.div
            key="ready"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="flex min-h-0 flex-1 flex-col"
          >
            {/* Sticky header */}
            <BandingDetailHeader
              banding={banding}
              mockStatus={mockStatus}
              claimNoKlaim={claim?.noKlaim}
            />

            {/* 2-panel grid */}
            <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden px-4 pt-4 pb-5 sm:px-6 lg:grid-cols-[360px_minmax(0,1fr)]">
              {/* Left — sticky context panels */}
              <div className="flex min-h-0 flex-col gap-4 overflow-y-auto [scrollbar-width:thin] lg:sticky lg:top-0 lg:max-h-[calc(100vh-228px)]">
                <BandingDetailLeft banding={banding} claim={claim} />
              </div>

              {/* Right — scrollable content */}
              <div className="flex min-h-0 flex-col gap-4 overflow-y-auto [scrollbar-width:thin] lg:max-h-[calc(100vh-228px)]">
                <BandingDetailRight
                  banding={banding}
                  mockStatus={mockStatus}
                  mockHasil={mockHasil}
                  mockReviewedAt={mockReviewedAt}
                  onMockReview={handleMockReview}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Not Found State ───────────────────────────────────────────────────────────

function NotFoundState({ id }: { id: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="flex flex-1 flex-col items-center justify-center px-4 text-center"
    >
      <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50">
        <AlertTriangle size={26} className="text-rose-500" />
      </span>
      <h2 className="text-lg font-bold text-slate-800">Banding tidak ditemukan</h2>
      <p className="mt-1 text-sm text-slate-500">
        ID{" "}
        <span className="font-mono font-semibold text-slate-700">{id}</span>{" "}
        tidak ada di sistem.
      </p>
      <Link
        href="/ehis-eklaim/banding"
        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
      >
        <ArrowLeft size={14} />
        Kembali ke Banding Board
      </Link>
    </motion.div>
  );
}

// ── Skeleton Shell ────────────────────────────────────────────────────────────

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
      <div className="relative border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
        <div className="absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-teal-200 via-sky-200 to-rose-200" />
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-7 w-24 animate-pulse rounded-lg bg-slate-200" />
            <div className="h-4 w-4 animate-pulse rounded bg-slate-100" />
            <div className="h-5 w-8 animate-pulse rounded-lg bg-teal-100" />
            <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />
            <div className="h-5 w-20 animate-pulse rounded-full bg-sky-100" />
            <div className="h-5 w-16 animate-pulse rounded-md bg-sky-100" />
            <div className="ml-auto h-4 w-36 animate-pulse rounded bg-teal-100" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-4 w-48 animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-32 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      </div>

      {/* 2-panel placeholder */}
      <div className="grid flex-1 gap-4 px-4 pt-4 pb-5 sm:px-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="h-64 animate-pulse rounded-xl bg-white ring-1 ring-slate-100" />
          <div className="h-36 animate-pulse rounded-xl bg-white ring-1 ring-slate-100" />
        </div>
        <div className="space-y-4">
          <div className="h-40 animate-pulse rounded-xl bg-white ring-1 ring-slate-100" />
          <div className="h-28 animate-pulse rounded-xl bg-white ring-1 ring-slate-100" />
          <div className="h-56 animate-pulse rounded-xl bg-white ring-1 ring-slate-100" />
          <div className="h-36 animate-pulse rounded-xl bg-white ring-1 ring-slate-100" />
        </div>
      </div>
    </motion.div>
  );
}
