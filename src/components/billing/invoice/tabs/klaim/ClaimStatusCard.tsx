"use client";

import { motion } from "framer-motion";
import { Clock, User, MessageSquareText, AlertCircle, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { CLAIM_STATUS_CFG, type ClaimRecordRead } from "@/lib/billing/claimReadCache";
import { fmtRupiah } from "../../invoiceShared";

interface Props {
  claim: ClaimRecordRead;
}

/**
 * Card status klaim besar — chip status + meta + last update event + (conditional)
 * banner rejection alasan / approved nominal / banding deadline.
 *
 * READ-ONLY. Semua edit action ada di `/ehis-eklaim/klaim/[id]`.
 */
export default function ClaimStatusCard({ claim }: Props) {
  const cfg = CLAIM_STATUS_CFG[claim.status];
  const Icon = cfg.icon;
  const update = claim.lastUpdate;

  return (
    <section
      aria-label="Status Klaim Penjamin"
      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      {/* Status header strip */}
      <div className="grid grid-cols-1 gap-3 px-4 py-3.5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        {/* Left: status chip + label */}
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 360, damping: 26 }}
            className={cn(
              "flex h-12 w-12 flex-none items-center justify-center rounded-xl ring-1",
              cfg.bg, cfg.text, cfg.ring,
            )}
          >
            <Icon size={22} strokeWidth={2.1} />
          </motion.div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1",
                cfg.bg, cfg.text, cfg.ring,
              )}>
                <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
                {cfg.label}
              </span>
              <span className="text-[10.5px] uppercase tracking-wider text-slate-400">
                {cfg.hint}
              </span>
            </div>
            <p className="mt-1 text-[13px] font-semibold text-slate-800 dark:text-slate-100">
              Klaim {claim.penjaminNama}
            </p>
          </div>
        </div>

        {/* Right: no klaim mono */}
        <dl className="grid grid-cols-2 gap-x-4 gap-y-0.5 rounded-lg bg-slate-50 px-3 py-2 text-right dark:bg-slate-800/50 md:flex md:flex-col md:items-end">
          <dt className="text-[10px] uppercase tracking-wider text-slate-500">No Klaim</dt>
          <dd className="font-mono text-[12.5px] font-semibold tabular-nums text-slate-800 dark:text-slate-100">
            {claim.noKlaim ?? <span className="text-slate-400">—</span>}
          </dd>
          <dt className="text-[10px] uppercase tracking-wider text-slate-500">ID Internal</dt>
          <dd className="font-mono text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
            {claim.id}
          </dd>
        </dl>
      </div>

      {/* Last update event line */}
      {update && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-slate-100 bg-slate-50/60 px-4 py-2 text-[11.5px] dark:border-slate-800 dark:bg-slate-900/40">
          <span className="inline-flex items-center gap-1 text-slate-500">
            <Clock size={11} />
            {formatTanggalLong(update.at)}
          </span>
          <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300">
            <User size={11} className="text-slate-400" />
            <span className="font-medium">{update.by}</span>
          </span>
          {update.note && (
            <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400">
              <MessageSquareText size={11} className="text-slate-400" />
              <span className="italic">&ldquo;{update.note}&rdquo;</span>
            </span>
          )}
        </div>
      )}

      {/* Conditional rejection / approved / banding banners */}
      {claim.status === "Rejected" && claim.alasanRejection && (
        <ConditionalBanner
          tone="rose"
          icon={<AlertCircle size={14} />}
          title="Alasan penolakan"
          body={claim.alasanRejection}
        />
      )}

      {claim.status === "Approved" && typeof claim.nominalDisetujui === "number" && (
        <ConditionalBanner
          tone="emerald"
          icon={<BadgeCheck size={14} />}
          title="Nominal disetujui"
          body={fmtRupiah(claim.nominalDisetujui)}
        />
      )}

      {claim.status === "Banding" && claim.bandingDeadline && (
        <ConditionalBanner
          tone="amber"
          icon={<AlertCircle size={14} />}
          title="Deadline banding"
          body={formatTanggalLong(claim.bandingDeadline)}
        />
      )}
    </section>
  );
}

// ── Sub: conditional banner ─────────────────────────────

function ConditionalBanner({
  tone, icon, title, body,
}: {
  tone: "rose" | "emerald" | "amber";
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  const palette = {
    rose:    "border-rose-200 bg-rose-50/70 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300",
    emerald: "border-emerald-200 bg-emerald-50/70 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300",
    amber:   "border-amber-200 bg-amber-50/70 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300",
  }[tone];

  return (
    <div className={cn("flex items-start gap-2 border-t px-4 py-2.5", palette)}>
      <span className="mt-0.5 flex-none">{icon}</span>
      <div className="min-w-0">
        <span className="text-[11px] font-semibold uppercase tracking-wider opacity-90">{title}</span>
        <p className="mt-0.5 text-[12.5px] font-medium">{body}</p>
      </div>
    </div>
  );
}

// ── Format helper ───────────────────────────────────────

function formatTanggalLong(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
