"use client";

/**
 * BandingDetailLeft — panel kiri sticky: klaim context + rejection reason (EK6.3).
 *
 * Panels:
 *   1. Klaim Context Card — identitas klaim, diagnosa, grouper, tarif, link ke detail
 *   2. Alasan Rejection Asli — rose-50 full text card
 */

import Link from "next/link";
import { ExternalLink, AlertTriangle, FileText } from "lucide-react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { CLAIM_STATUS_LABEL } from "@/lib/eklaim/eklaimShared";
import { formatRupiah } from "@/lib/eklaim/money";
import type { BandingRecord, ClaimRecord } from "@/lib/eklaim/eklaimShared";

interface Props {
  banding: BandingRecord;
  claim: ClaimRecord | null;
}

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

// ── Info Row ──────────────────────────────────────────────────────────────────

function InfoRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[100px_minmax(0,1fr)] items-baseline gap-x-2 py-1.5">
      <span className="shrink-0 text-sm text-slate-500">{label}</span>
      <span className="min-w-0 text-sm font-medium text-slate-800">
        {children}
      </span>
    </div>
  );
}

// ── Divider Label ─────────────────────────────────────────────────────────────

function DividerLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 mt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
      {children}
    </p>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function BandingDetailLeft({ banding, claim }: Props) {
  return (
    <>
      {/* 1. Klaim Context Card */}
      <SectionCard
        title="Konteks Klaim"
        icon={<FileText size={14} className="text-teal-600" />}
        accent="border-teal-100 bg-teal-50/50"
        delay={0}
      >
        {claim ? (
          <div className="divide-y divide-slate-100">
            {/* Identitas */}
            <div className="pb-3">
              <InfoRow label="No. Klaim">
                <Link
                  href={`/ehis-eklaim/klaim/${claim.id}`}
                  className="inline-flex items-center gap-1 font-mono text-teal-700 hover:underline"
                >
                  {claim.noKlaim}
                  <ExternalLink size={11} />
                </Link>
              </InfoRow>
              <InfoRow label="Pasien ID">
                <span className="font-mono">{claim.pasienId}</span>
              </InfoRow>
              <InfoRow label="Penjamin">
                <span>{claim.penjamin.nama}</span>
              </InfoRow>
              <InfoRow label="Pelayanan">
                <span className="font-semibold uppercase">
                  {claim.tipePelayanan}
                </span>
              </InfoRow>
              <InfoRow label="LOS">
                <span>{claim.los} hari</span>
              </InfoRow>
              <InfoRow label="Status Klaim">
                <span
                  className={cn(
                    "inline-flex items-center rounded-md px-1.5 py-0.5 text-sm font-semibold",
                    claim.statusPenjamin === "Rejected" ||
                      claim.statusPenjamin === "Banding Rejected"
                      ? "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
                      : claim.statusPenjamin === "Banding Submitted" ||
                          claim.statusPenjamin === "Banding Approved"
                        ? "bg-sky-50 text-sky-700 ring-1 ring-sky-200"
                        : "bg-slate-100 text-slate-600",
                  )}
                >
                  {CLAIM_STATUS_LABEL[claim.statusPenjamin]}
                </span>
              </InfoRow>
            </div>

            {/* Diagnosa */}
            <div className="py-3">
              <DividerLabel>Diagnosa Primer</DividerLabel>
              <p className="font-mono text-sm font-bold text-slate-800">
                {claim.diagnosaPrimer.kode}
              </p>
              <p className="mt-0.5 text-sm leading-snug text-slate-600">
                {claim.diagnosaPrimer.deskripsi}
              </p>
              {claim.diagnosaSekunder.length > 0 && (
                <p className="mt-2 text-sm text-slate-500">
                  +{claim.diagnosaSekunder.length} sekunder:{" "}
                  <span className="font-mono font-medium text-slate-700">
                    {claim.diagnosaSekunder
                      .slice(0, 3)
                      .map((d) => d.kode)
                      .join(", ")}
                    {claim.diagnosaSekunder.length > 3 && "…"}
                  </span>
                </p>
              )}
            </div>

            {/* Grouper */}
            <div className="py-3">
              <DividerLabel>
                Grouper —{" "}
                {claim.eraGrouper === "iDRG" ? "iDRG (primary)" : "INA-CBG Legacy"}
              </DividerLabel>
              {claim.iDRG ? (
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 rounded-md bg-teal-50 px-2 py-1 font-mono text-sm font-bold text-teal-700 ring-1 ring-teal-200">
                    {claim.iDRG.code}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">
                      {claim.iDRG.group}
                    </p>
                    <p className="text-sm text-slate-500">
                      Severity {claim.iDRG.severity.level} —{" "}
                      {claim.iDRG.severity.label}
                    </p>
                  </div>
                </div>
              ) : claim.inaCbgLegacy ? (
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 rounded-md bg-amber-50 px-2 py-1 font-mono text-sm font-bold text-amber-700 ring-1 ring-amber-200">
                    {claim.inaCbgLegacy.code}
                  </span>
                  <p className="text-sm font-semibold text-slate-700">
                    {claim.inaCbgLegacy.group}
                  </p>
                </div>
              ) : (
                <p className="text-sm italic text-slate-400">
                  Grouper belum di-resolve
                </p>
              )}
            </div>

            {/* Tarif */}
            <div className="pt-3">
              <DividerLabel>Tarif</DividerLabel>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Tarif RS</span>
                  <span className="font-mono text-sm font-bold text-slate-800">
                    {formatRupiah(claim.tarifRS)}
                  </span>
                </div>
                {claim.iDRG && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Tarif iDRG</span>
                    <span className="font-mono text-sm font-bold text-teal-700">
                      {formatRupiah(claim.iDRG.tarifAktual)}
                    </span>
                  </div>
                )}
                {claim.selisih !== undefined && (
                  <div className="flex items-center justify-between border-t border-slate-100 pt-1">
                    <span className="text-sm text-slate-500">Selisih</span>
                    <span
                      className={cn(
                        "font-mono text-sm font-bold",
                        claim.selisih >= 0n
                          ? "text-emerald-600"
                          : "text-rose-600",
                      )}
                    >
                      {formatRupiah(claim.selisih)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm italic text-slate-400">
            Klaim tidak ditemukan di sistem
          </p>
        )}
      </SectionCard>

      {/* 2. Alasan Rejection Asli */}
      <SectionCard
        title="Alasan Rejection Asli"
        icon={<AlertTriangle size={14} className="text-rose-500" />}
        accent="border-rose-100 bg-rose-50/50"
        delay={0.06}
      >
        <p className="text-sm leading-relaxed text-slate-700">
          {banding.alasanRejectionAsli}
        </p>
      </SectionCard>
    </>
  );
}
