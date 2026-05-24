"use client";

import { ArrowRight, Equal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AuditDiff } from "@/lib/billing/auditTrail";
import { fmtRupiah } from "../../invoiceShared";

interface Props {
  diff: AuditDiff[];
}

/**
 * Diff block before → after untuk edit events.
 * Setiap row: field label · before (strikethrough rose) · arrow · after (emerald bold).
 * Format money jika `isMoney=true`.
 */
export default function AuditDiffBlock({ diff }: Props) {
  if (diff.length === 0) return null;

  return (
    <dl className="mt-2 grid grid-cols-1 gap-1 rounded-md border border-slate-200 bg-slate-50/60 p-2 text-[11.5px] dark:border-slate-800 dark:bg-slate-900/40">
      {diff.map((d, idx) => {
        const beforeText = formatValue(d.before, d.isMoney);
        const afterText = formatValue(d.after, d.isMoney);
        const isAddOnly = d.before === null || d.before === undefined || d.before === "";
        const isRemoveOnly = d.after === null || d.after === undefined || d.after === "";
        return (
          <div
            key={`${d.field}-${idx}`}
            className="grid grid-cols-[minmax(70px,110px)_minmax(0,1fr)] items-baseline gap-2"
          >
            <dt className="truncate text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
              {d.field}
            </dt>
            <dd className="flex flex-wrap items-center gap-1.5">
              {!isAddOnly && (
                <span className={cn(
                  "font-mono tabular-nums",
                  "rounded bg-rose-50 px-1.5 py-0.5 text-rose-700 line-through ring-1 ring-rose-200/70",
                  "dark:bg-rose-950/20 dark:text-rose-300 dark:ring-rose-900/40",
                )}>
                  {beforeText}
                </span>
              )}
              {!isAddOnly && !isRemoveOnly && (
                <ArrowRight size={11} className="flex-none text-slate-400" />
              )}
              {isAddOnly && !isRemoveOnly && (
                <Equal size={11} className="flex-none text-slate-300 opacity-0" aria-hidden />
              )}
              {!isRemoveOnly && (
                <span className={cn(
                  "font-mono font-semibold tabular-nums",
                  "rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-700 ring-1 ring-emerald-200/70",
                  "dark:bg-emerald-950/20 dark:text-emerald-300 dark:ring-emerald-900/40",
                )}>
                  {afterText}
                </span>
              )}
              {isRemoveOnly && (
                <span className="text-[10px] italic text-slate-400">(dihapus)</span>
              )}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

function formatValue(v: string | number | null | undefined, isMoney?: boolean): string {
  if (v === null || v === undefined || v === "") return "—";
  if (isMoney && typeof v === "number") return fmtRupiah(v);
  return String(v);
}
