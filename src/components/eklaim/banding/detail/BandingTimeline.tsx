"use client";

/**
 * BandingTimeline — status pipeline banding 3-stage (EK6.3).
 *
 * Stages (vertical, dengan connector line):
 *   1. Diajukan     — sky    (Submitted initial)
 *   2. Dalam Review — amber  (BPJS review phase)
 *   3. Selesai      — emerald (Approved) / rose (Rejected)
 *
 * Stage states:
 *   - done   = stage ini sudah dilewati (teal connector ke bawah)
 *   - active = stage ini sedang berlangsung (pulse indicator)
 *   - idle   = belum dicapai (muted)
 *   - error  = rejected/failed (rose)
 *
 * `mockStatus` dan `mockReviewedAt` mendukung demo override dari Mock Review BPJS.
 */

import { motion } from "framer-motion";
import {
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  Circle,
  Calendar,
  User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { fmtDatetime } from "../bandingShared";
import type { BandingRecord, BandingStatus } from "@/lib/eklaim/eklaimShared";

// ── Types ─────────────────────────────────────────────────────────────────────

type StageState = "done" | "active" | "idle" | "error";

interface StageConfig {
  key: "submitted" | "review" | "selesai";
  label: string;
  icon: LucideIcon;
  /* Tailwind class strings per state */
  activeClasses: string;
  doneClasses: string;
  errorClasses: string;
}

const STAGES: StageConfig[] = [
  {
    key: "submitted",
    label: "Diajukan",
    icon: Send,
    activeClasses: "text-sky-600 bg-sky-50 ring-sky-200",
    doneClasses: "text-sky-700 bg-sky-100 ring-sky-200",
    errorClasses: "text-rose-600 bg-rose-50 ring-rose-200",
  },
  {
    key: "review",
    label: "Dalam Review BPJS",
    icon: Clock,
    activeClasses: "text-amber-600 bg-amber-50 ring-amber-200",
    doneClasses: "text-amber-700 bg-amber-100 ring-amber-200",
    errorClasses: "text-rose-600 bg-rose-50 ring-rose-200",
  },
  {
    key: "selesai",
    label: "Selesai",
    icon: CheckCircle2,
    activeClasses: "text-emerald-600 bg-emerald-50 ring-emerald-200",
    doneClasses: "text-emerald-700 bg-emerald-100 ring-emerald-200",
    errorClasses: "text-rose-600 bg-rose-50 ring-rose-200",
  },
];

// ── Stage State Resolver ──────────────────────────────────────────────────────

function resolveStageStates(
  status: BandingStatus,
): Record<"submitted" | "review" | "selesai", StageState> {
  switch (status) {
    case "Submitted":
      return { submitted: "active", review: "idle", selesai: "idle" };
    case "Review":
      return { submitted: "done", review: "active", selesai: "idle" };
    case "Approved":
      return { submitted: "done", review: "done", selesai: "done" };
    case "Rejected":
      return { submitted: "done", review: "done", selesai: "error" };
  }
}

// ── Stage Icon ────────────────────────────────────────────────────────────────

function StageIcon({
  cfg,
  state,
}: {
  cfg: StageConfig;
  state: StageState;
}) {
  const classes =
    state === "done"
      ? cfg.doneClasses
      : state === "active"
        ? cfg.activeClasses
        : state === "error"
          ? cfg.errorClasses
          : "text-slate-300 bg-slate-50 ring-slate-200";

  const IconEl =
    state === "error"
      ? XCircle
      : state === "idle"
        ? Circle
        : cfg.icon;

  return (
    <span
      className={cn(
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-1",
        classes,
      )}
    >
      <IconEl
        size={15}
        strokeWidth={state === "idle" ? 1.5 : 2}
      />
    </span>
  );
}

// ── Timeline Item ─────────────────────────────────────────────────────────────

interface TimelineItemProps {
  cfg: StageConfig;
  state: StageState;
  banding: BandingRecord;
  mockStatus: BandingStatus;
  mockHasil?: string;
  mockReviewedAt?: string;
  idx: number;
  isLast: boolean;
}

function TimelineItem({
  cfg,
  state,
  banding,
  mockStatus,
  mockHasil,
  mockReviewedAt,
  idx,
  isLast,
}: TimelineItemProps) {
  const labelText =
    cfg.key === "selesai" && mockStatus === "Approved"
      ? "Selesai — Dikabulkan"
      : cfg.key === "selesai" && mockStatus === "Rejected"
        ? "Selesai — Ditolak"
        : cfg.label;

  return (
    <motion.div
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: idx * 0.08, ease: "easeOut" }}
      className="flex gap-3"
    >
      {/* Icon + vertical connector */}
      <div className="flex flex-col items-center">
        <StageIcon cfg={cfg} state={state} />
        {!isLast && (
          <div
            className={cn(
              "mt-1 min-h-[24px] w-0.5 flex-1",
              state === "done" ? "bg-teal-200" : "bg-slate-100",
            )}
          />
        )}
      </div>

      {/* Content */}
      <div className={cn("flex-1", isLast ? "pb-0" : "pb-5")}>
        {/* Stage label */}
        <p
          className={cn(
            "text-sm font-semibold",
            state === "active"
              ? "text-slate-800"
              : state === "done"
                ? "text-slate-700"
                : state === "error"
                  ? "text-rose-700"
                  : "text-slate-400",
          )}
        >
          {labelText}
        </p>

        {/* Active pulse indicator */}
        {state === "active" && (
          <div className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-sm font-medium text-amber-600 ring-1 ring-amber-200">
            <Clock size={10} strokeWidth={2.5} />
            Menunggu
          </div>
        )}

        {/* Submitted stage meta */}
        {cfg.key === "submitted" && state !== "idle" && (
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1">
              <Calendar size={10} className="text-slate-400" />
              {fmtDatetime(banding.submittedAt)}
            </span>
            <span className="inline-flex items-center gap-1">
              <User size={10} className="text-slate-400" />
              {banding.submittedBy}
            </span>
          </div>
        )}

        {/* Review stage meta */}
        {cfg.key === "review" &&
          (state === "active" || state === "done") &&
          banding.reviewerBpjs && (
            <div className="mt-1 flex items-center gap-1 text-sm text-slate-500">
              <User size={10} className="text-sky-400" />
              {banding.reviewerBpjs}
            </div>
          )}

        {/* Selesai stage meta */}
        {cfg.key === "selesai" && state !== "idle" && (
          <div className="mt-1.5 space-y-1">
            {mockReviewedAt && (
              <div className="flex items-center gap-1 text-sm text-slate-500">
                <Calendar size={10} className="text-slate-400" />
                {fmtDatetime(mockReviewedAt)}
              </div>
            )}
            {mockHasil && (
              <p
                className={cn(
                  "text-sm leading-relaxed",
                  state === "error" ? "text-rose-600" : "text-slate-600",
                )}
              >
                {mockHasil}
              </p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface Props {
  banding: BandingRecord;
  mockStatus: BandingStatus;
  mockHasil?: string;
  mockReviewedAt?: string;
}

export default function BandingTimeline({
  banding,
  mockStatus,
  mockHasil,
  mockReviewedAt,
}: Props) {
  const states = resolveStageStates(mockStatus);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: 0.09, ease: "easeOut" }}
      className="overflow-hidden rounded-xl bg-white ring-1 ring-slate-200"
    >
      {/* Card header */}
      <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
        <CheckCircle2 size={14} className="text-teal-600" />
        <h3 className="text-sm font-semibold text-slate-700">
          Status Timeline Banding
        </h3>
        {/* Live badge for active statuses */}
        {(mockStatus === "Submitted" || mockStatus === "Review") && (
          <span className="ml-auto inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-sm font-semibold text-amber-600 ring-1 ring-amber-200">
            Proses
          </span>
        )}
        {mockStatus === "Approved" && (
          <span className="ml-auto inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-sm font-semibold text-emerald-600 ring-1 ring-emerald-200">
            Dikabulkan
          </span>
        )}
        {mockStatus === "Rejected" && (
          <span className="ml-auto inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-sm font-semibold text-rose-600 ring-1 ring-rose-200">
            Ditolak
          </span>
        )}
      </div>

      <div className="p-4">
        {STAGES.map((cfg, idx) => (
          <TimelineItem
            key={cfg.key}
            cfg={cfg}
            state={states[cfg.key]}
            banding={banding}
            mockStatus={mockStatus}
            mockHasil={mockHasil}
            mockReviewedAt={mockReviewedAt}
            idx={idx}
            isLast={idx === STAGES.length - 1}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-2">
        <p className="text-sm text-slate-400">
          Referensi: PMK 26/2021 · Batas banding 30 hari setelah notif rejection
        </p>
      </div>
    </motion.div>
  );
}
