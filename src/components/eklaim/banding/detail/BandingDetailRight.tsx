"use client";

/**
 * BandingDetailRight — panel kanan scrollable (EK6.3).
 *
 * Cards (stagger-in):
 *   1. Alasan Banding     — teal accent · full text
 *   2. Dokumen Pendukung  — list berkas atau empty state
 *   3. BandingTimeline    — status pipeline 3-stage
 *   4. Mock Review BPJS   — demo tombol Approve/Reject (amber accent)
 */

import { AnimatePresence, motion } from "framer-motion";
import {
  MessageSquare,
  Paperclip,
  FlaskConical,
  CheckCircle2,
  XCircle,
  Calendar,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { fmtDatetime } from "../bandingShared";
import BandingTimeline from "./BandingTimeline";
import type { BandingRecord, BandingStatus } from "@/lib/eklaim/eklaimShared";

// ── Section Card ──────────────────────────────────────────────────────────────

interface SectionCardProps {
  title: string;
  icon: React.ReactNode;
  accent?: string;
  delay?: number;
  children: React.ReactNode;
}

function SectionCard({
  title,
  icon,
  accent,
  delay = 0,
  children,
}: SectionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay, ease: "easeOut" }}
      className="overflow-hidden rounded-xl bg-white ring-1 ring-slate-200"
    >
      <div
        className={cn(
          "flex items-center gap-2 border-b px-4 py-2.5",
          accent ?? "border-slate-200 bg-slate-50",
        )}
      >
        <span className="shrink-0">{icon}</span>
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </motion.div>
  );
}

// ── Dokumen Section ───────────────────────────────────────────────────────────

function DokumenSection({ banding }: { banding: BandingRecord }) {
  const docs = banding.dokumenPendukung;

  return (
    <SectionCard
      title={`Dokumen Pendukung${docs.length > 0 ? ` (${docs.length})` : ""}`}
      icon={<Paperclip size={14} className="text-slate-500" />}
      delay={0.06}
    >
      {docs.length === 0 ? (
        <div className="flex flex-col items-center py-6 text-center">
          <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
            <Paperclip size={18} className="text-slate-400" />
          </span>
          <p className="text-sm font-semibold text-slate-500">
            Belum ada dokumen terlampir
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Dokumen diunggah melalui form pengajuan banding
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {docs.map((doc) => (
            <li key={doc.id} className="flex items-center gap-3 py-2.5">
              <Paperclip size={13} className="shrink-0 text-slate-400" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-700">
                  {doc.nama}
                </p>
                <p className="text-sm text-slate-400">{doc.kategori}</p>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded px-1.5 py-0.5 text-sm font-semibold ring-1",
                  doc.status === "Siap"
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                    : "bg-slate-100 text-slate-500 ring-slate-200",
                )}
              >
                {doc.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

// ── Mock Review BPJS Section ──────────────────────────────────────────────────

interface MockReviewProps {
  banding: BandingRecord;
  mockStatus: BandingStatus;
  mockHasil?: string;
  mockReviewedAt?: string;
  onMockReview: (result: "Approved" | "Rejected") => void;
}

function MockReviewSection({
  banding,
  mockStatus,
  mockHasil,
  mockReviewedAt,
  onMockReview,
}: MockReviewProps) {
  const canReview =
    mockStatus === "Submitted" || mockStatus === "Review";
  const isResolved =
    mockStatus === "Approved" || mockStatus === "Rejected";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: 0.12, ease: "easeOut" }}
      className="overflow-hidden rounded-xl bg-white ring-1 ring-slate-200"
    >
      {/* Card header */}
      <div className="flex items-center gap-2 border-b border-amber-100 bg-amber-50/50 px-4 py-2.5">
        <FlaskConical size={14} className="shrink-0 text-amber-500" />
        <h3 className="text-sm font-semibold text-slate-700">
          Simulasi Review BPJS
        </h3>
        <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-sm font-semibold text-amber-600">
          Demo
        </span>
      </div>

      <div className="p-4">
        <p className="mb-4 text-sm text-slate-500">
          Simulasi review verifikator BPJS untuk demonstrasi workflow banding.{" "}
          <span className="font-semibold text-slate-600">
            Perubahan tidak tersimpan ke database.
          </span>
        </p>

        <AnimatePresence mode="wait">
          {canReview ? (
            <motion.div
              key="actions"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="flex gap-3"
            >
              <button
                type="button"
                onClick={() => onMockReview("Approved")}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1"
              >
                <CheckCircle2 size={15} />
                Tandai Approved
              </button>
              <button
                type="button"
                onClick={() => onMockReview("Rejected")}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-1"
              >
                <XCircle size={15} />
                Tandai Rejected
              </button>
            </motion.div>
          ) : isResolved ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "flex items-start gap-3 rounded-lg p-4 ring-1",
                mockStatus === "Approved"
                  ? "bg-emerald-50 ring-emerald-200"
                  : "bg-rose-50 ring-rose-200",
              )}
            >
              {mockStatus === "Approved" ? (
                <CheckCircle2
                  size={20}
                  className="mt-0.5 shrink-0 text-emerald-500"
                />
              ) : (
                <XCircle
                  size={20}
                  className="mt-0.5 shrink-0 text-rose-500"
                />
              )}
              <div className="min-w-0">
                <p
                  className={cn(
                    "text-sm font-bold",
                    mockStatus === "Approved"
                      ? "text-emerald-700"
                      : "text-rose-700",
                  )}
                >
                  {mockStatus === "Approved"
                    ? "Banding Dikabulkan"
                    : "Banding Ditolak"}
                </p>
                {mockHasil && (
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">
                    {mockHasil}
                  </p>
                )}
                {mockReviewedAt && (
                  <p className="mt-2 flex items-center gap-1 text-sm text-slate-400">
                    <Calendar size={11} />
                    Direview: {fmtDatetime(mockReviewedAt)}
                  </p>
                )}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
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
  onMockReview: (result: "Approved" | "Rejected") => void;
}

export default function BandingDetailRight({
  banding,
  mockStatus,
  mockHasil,
  mockReviewedAt,
  onMockReview,
}: Props) {
  return (
    <>
      {/* 1. Alasan Banding */}
      <SectionCard
        title="Alasan Banding"
        icon={<MessageSquare size={14} className="text-teal-600" />}
        accent="border-teal-100 bg-teal-50/50"
        delay={0}
      >
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
          {banding.alasanBanding}
        </p>
      </SectionCard>

      {/* 2. Dokumen Pendukung */}
      <DokumenSection banding={banding} />

      {/* 3. Status Timeline */}
      <BandingTimeline
        banding={banding}
        mockStatus={mockStatus}
        mockHasil={mockHasil}
        mockReviewedAt={mockReviewedAt}
      />

      {/* 4. Mock Review BPJS */}
      <MockReviewSection
        banding={banding}
        mockStatus={mockStatus}
        mockHasil={mockHasil}
        mockReviewedAt={mockReviewedAt}
        onMockReview={onMockReview}
      />
    </>
  );
}
