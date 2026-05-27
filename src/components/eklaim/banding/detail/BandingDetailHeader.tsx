"use client";

/**
 * BandingDetailHeader — sticky header halaman banding detail (EK6.3).
 *
 * Row 1: breadcrumb (← Banding Board) · Scale icon · Banding ID · status chip
 *         · tingkat badge · link ke klaim asli (right-aligned)
 * Row 2: Diajukan timestamp · oleh · reviewer BPJS (jika ada)
 *
 * Accent bar teal→sky→rose di top.
 */

import Link from "next/link";
import { ArrowLeft, Scale, Calendar, User } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  BANDING_TONE,
  BANDING_STATUS_CFG,
  fmtDatetime,
} from "../bandingShared";
import type { BandingRecord, BandingStatus } from "@/lib/eklaim/eklaimShared";

interface Props {
  banding: BandingRecord;
  /** Effective status — bisa di-override oleh mock review demo. */
  mockStatus: BandingStatus;
  /** No. klaim linked (untuk link ke klaim detail). */
  claimNoKlaim?: string;
}

export default function BandingDetailHeader({
  banding,
  mockStatus,
  claimNoKlaim,
}: Props) {
  const cfg = BANDING_STATUS_CFG[mockStatus];
  const tone = BANDING_TONE[cfg.tone];

  return (
    <div className="relative shrink-0 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
      {/* Gradient accent bar */}
      <div className="absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-teal-400 via-sky-300 to-rose-300" />

      <div className="flex flex-col gap-1.5">
        {/* Row 1 — nav + identifiers */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Back link */}
          <Link
            href="/ehis-eklaim/banding"
            className="inline-flex items-center gap-1 text-sm text-slate-500 transition hover:text-teal-600"
          >
            <ArrowLeft size={13} strokeWidth={2.5} />
            Banding Board
          </Link>

          <span className="text-slate-300 select-none">/</span>

          {/* Scale icon */}
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-teal-50">
            <Scale size={13} className="text-teal-600" />
          </span>

          {/* Banding ID */}
          <span className="font-mono text-sm font-bold text-slate-800">
            {banding.id}
          </span>

          {/* Status chip */}
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-sm font-semibold ring-1",
              tone.chipBg,
              tone.chipText,
              tone.chipRing,
            )}
          >
            <span
              className={cn("inline-block h-1.5 w-1.5 rounded-full", tone.dot)}
            />
            {cfg.label}
          </span>

          {/* Tingkat badge */}
          <span
            className={cn(
              "inline-flex items-center rounded-md px-2 py-0.5 text-sm font-bold ring-1",
              banding.tingkat === 1
                ? "bg-sky-50 text-sky-700 ring-sky-200"
                : "bg-amber-50 text-amber-700 ring-amber-200",
            )}
          >
            Tingkat {banding.tingkat}
          </span>

          {/* Klaim link — right-aligned */}
          {claimNoKlaim && (
            <Link
              href={`/ehis-eklaim/klaim/${banding.claimId}`}
              className="ml-auto text-sm font-medium text-teal-600 hover:underline"
            >
              Klaim {claimNoKlaim} →
            </Link>
          )}
        </div>

        {/* Row 2 — submit meta */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-slate-500">
          <span className="inline-flex items-center gap-1">
            <Calendar size={11} className="text-slate-400" />
            Diajukan {fmtDatetime(banding.submittedAt)}
          </span>
          <span className="select-none text-slate-300">·</span>
          <span className="inline-flex items-center gap-1">
            <User size={11} className="text-slate-400" />
            {banding.submittedBy}
          </span>
          {banding.reviewerBpjs && (
            <>
              <span className="select-none text-slate-300">·</span>
              <span className="inline-flex items-center gap-1">
                <User size={11} className="text-sky-400" />
                <span className="text-slate-500">Reviewer:</span>{" "}
                {banding.reviewerBpjs}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
