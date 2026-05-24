"use client";

import { ShieldCheck, Calendar, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ClaimRecordRead } from "@/lib/billing/claimReadCache";

interface Props {
  claim: ClaimRecordRead;
}

/**
 * SEP (Surat Eligibilitas Pasien) info — read-only.
 * Tampilkan noSEP + validitas + kelas dijamin.
 */
export default function SepInfoCard({ claim }: Props) {
  const validity = computeValidity(claim.sepValidUntil);

  return (
    <section
      aria-label="Informasi SEP"
      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-slate-100 bg-gradient-to-br from-sky-50/40 to-white px-4 py-2.5 dark:border-slate-800 dark:from-sky-950/15 dark:to-slate-900">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-sky-100 text-sky-700 ring-1 ring-sky-200 dark:bg-sky-900/40 dark:text-sky-300 dark:ring-sky-900/60">
          <ShieldCheck size={13} />
        </span>
        <div>
          <h3 className="text-[12px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200">
            Surat Eligibilitas Pasien
          </h3>
          <p className="text-[10.5px] text-slate-500">
            Diterbitkan {claim.penjaminNama}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="space-y-2.5 px-4 py-3">
        {/* No SEP */}
        <Row label="No SEP">
          {claim.noSEP ? (
            <span className="font-mono text-[13px] font-semibold tabular-nums text-slate-800 dark:text-slate-100">
              {claim.noSEP}
            </span>
          ) : (
            <span className="text-[12px] italic text-slate-400">Belum terbit</span>
          )}
        </Row>

        {/* Validitas */}
        <Row label="Validitas">
          {validity ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 font-mono text-[12px] tabular-nums text-slate-700 dark:text-slate-300">
                <Calendar size={11} className="text-slate-400" />
                {validity.label}
              </span>
              <span className={cn(
                "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ring-1",
                validity.tone,
              )}>
                <span className={cn("h-1.5 w-1.5 rounded-full", validity.dot)} />
                {validity.status}
              </span>
            </div>
          ) : (
            <span className="text-[12px] italic text-slate-400">—</span>
          )}
        </Row>

        {/* Kelas dijamin */}
        <Row label="Kelas Dijamin">
          {claim.kelasDijamin ? (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-sky-50 px-2 py-0.5 text-[12px] font-semibold text-sky-700 ring-1 ring-sky-200 dark:bg-sky-950/30 dark:text-sky-300 dark:ring-sky-900/40">
              <Layers size={11} />
              {claim.kelasDijamin}
            </span>
          ) : (
            <span className="text-[12px] italic text-slate-400">—</span>
          )}
        </Row>
      </div>
    </section>
  );
}

// ── Sub: row layout ─────────────────────────────────────

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2 last:border-0 last:pb-0 dark:border-slate-800/60">
      <span className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <div className="min-w-0 text-right">{children}</div>
    </div>
  );
}

// ── Validity computation ────────────────────────────────

function computeValidity(validUntil?: string): {
  label: string;
  status: string;
  tone: string;
  dot: string;
} | null {
  if (!validUntil) return null;
  const due = new Date(validUntil);
  if (Number.isNaN(due.getTime())) return null;

  const now = new Date();
  const days = Math.floor((due.getTime() - now.getTime()) / 86_400_000);
  const label = due.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

  if (days < 0) {
    return {
      label,
      status: "Expired",
      tone: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/20 dark:text-rose-300 dark:ring-rose-900/40",
      dot: "bg-rose-500",
    };
  }
  if (days <= 7) {
    return {
      label: `${label} · ${days}h lagi`,
      status: "Hampir Expired",
      tone: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/20 dark:text-amber-300 dark:ring-amber-900/40",
      dot: "bg-amber-500",
    };
  }
  return {
    label,
    status: "Valid",
    tone: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-300 dark:ring-emerald-900/40",
    dot: "bg-emerald-500",
  };
}
