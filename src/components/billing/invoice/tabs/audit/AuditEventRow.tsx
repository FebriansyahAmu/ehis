"use client";

import { motion } from "framer-motion";
import { Receipt, MessageSquareWarning, Hash } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AUDIT_ACTION_CFG, AUDIT_TONE_PALETTE, actorInitials, formatTime,
  type AuditEvent,
} from "@/lib/billing/auditTrail";
import { fmtRupiah } from "../../invoiceShared";
import AuditDiffBlock from "./AuditDiffBlock";

interface Props {
  event: AuditEvent;
  /** Delay animasi (untuk stagger di parent). */
  delay?: number;
}

/**
 * Satu event row di audit timeline.
 *
 * Layout: [waktu] [dot] [avatar+role] [action chip + summary + meta + diff]
 */
export default function AuditEventRow({ event, delay = 0 }: Props) {
  const cfg = AUDIT_ACTION_CFG[event.action];
  const palette = AUDIT_TONE_PALETTE[cfg.tone];
  const Icon = cfg.icon;

  return (
    <motion.li
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.22, delay }}
      className="relative grid grid-cols-[44px_24px_minmax(0,1fr)] gap-2 sm:gap-3"
    >
      {/* Col 1 — Time (mono right-align) */}
      <span className="pt-0.5 text-right font-mono text-[11px] font-semibold tabular-nums text-slate-500">
        {formatTime(event.at)}
      </span>

      {/* Col 2 — Dot (di atas timeline line) */}
      <div className="relative flex justify-center">
        <span
          className={cn(
            "z-10 mt-1 flex h-3.5 w-3.5 items-center justify-center rounded-full ring-4 ring-white dark:ring-slate-950",
            palette.dot,
          )}
        />
      </div>

      {/* Col 3 — Body */}
      <div className="min-w-0 pb-3">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
          {/* Header row */}
          <div className="flex flex-wrap items-start gap-2 px-3 py-2">
            {/* Avatar */}
            <div className={cn(
              "flex h-7 w-7 flex-none items-center justify-center rounded-full text-[10.5px] font-bold leading-none ring-2 ring-white dark:ring-slate-900",
              palette.avatarBg,
            )}>
              {actorInitials(event.actor.name)}
            </div>

            {/* Main */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[12px] font-semibold text-slate-800 dark:text-slate-100">
                  {event.actor.name}
                </span>
                <span className="text-[10.5px] text-slate-500 dark:text-slate-400">
                  · {event.actor.role}
                </span>
                {/* Action chip */}
                <span className={cn(
                  "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ring-1",
                  palette.bg, palette.text, palette.ring,
                )}>
                  <Icon size={9} />
                  {cfg.label}
                </span>
              </div>
              <p className="mt-0.5 text-[12.5px] leading-snug text-slate-700 dark:text-slate-300">
                {event.summary}
              </p>
            </div>

            {/* Right meta: amount mono */}
            {typeof event.amount === "number" && (
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wider text-slate-400">Nominal</p>
                <p className={cn(
                  "font-mono text-[12.5px] font-semibold tabular-nums",
                  event.action === "payment.refund" || event.action === "item.diskon" || event.action === "invoice.diskon"
                    ? "text-rose-700 dark:text-rose-300"
                    : "text-emerald-700 dark:text-emerald-300",
                )}>
                  {event.action === "payment.refund" ? "−" : ""}{fmtRupiah(event.amount)}
                </p>
              </div>
            )}
          </div>

          {/* Bottom strip — target + kwitansi + reason + diff */}
          {(event.target || event.noKwitansi || event.reason || (event.diff && event.diff.length > 0)) && (
            <div className="border-t border-slate-100 bg-slate-50/50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900/40">
              {/* Target + kwitansi inline row */}
              {(event.target || event.noKwitansi) && (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px]">
                  {event.target && (event.target.label || event.target.id) && (
                    <span className="inline-flex items-center gap-1 text-slate-500">
                      <Receipt size={10} className="text-slate-400" />
                      <span className="text-slate-700 dark:text-slate-300">
                        {event.target.label ?? event.target.id}
                      </span>
                      <span className="font-mono text-[9.5px] uppercase tracking-wider text-slate-400">
                        {event.target.type}
                      </span>
                    </span>
                  )}
                  {event.noKwitansi && (
                    <span className="inline-flex items-center gap-1 text-slate-500">
                      <Hash size={10} className="text-slate-400" />
                      <span className="font-mono text-[10.5px] tabular-nums text-slate-700 dark:text-slate-300">
                        {event.noKwitansi}
                      </span>
                    </span>
                  )}
                </div>
              )}

              {/* Reason (untuk void/diskon/refund) */}
              {event.reason && (
                <div className="mt-1.5 flex items-start gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                  <MessageSquareWarning size={11} className="mt-0.5 flex-none text-amber-500" />
                  <span className="italic">&ldquo;{event.reason}&rdquo;</span>
                </div>
              )}

              {/* Diff block */}
              {event.diff && event.diff.length > 0 && (
                <AuditDiffBlock diff={event.diff} />
              )}
            </div>
          )}
        </div>
      </div>
    </motion.li>
  );
}
