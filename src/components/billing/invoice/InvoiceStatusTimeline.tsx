"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { TIMELINE_STEP_CFG } from "./invoiceShared";
import type { TimelineEntry } from "./invoiceShared";

interface Props {
  timeline: TimelineEntry[];
}

export default function InvoiceStatusTimeline({ timeline }: Props) {
  return (
    <ol
      aria-label="Status timeline tagihan"
      className="flex w-full items-center gap-0 overflow-clip px-2 py-1"
    >
      {timeline.map((entry, i) => {
        const cfg = TIMELINE_STEP_CFG[entry.step];
        const Icon = cfg.icon;
        const isLast = i === timeline.length - 1;
        const nextDone = !isLast && timeline[i + 1].status === "done";
        const isCurrent = entry.status === "current";
        const isDone    = entry.status === "done";

        const dotBg =
          isCurrent ? cfg.currentBg : isDone ? cfg.doneBg : cfg.pendingBg;
        const dotText =
          isCurrent ? cfg.currentText : isDone ? cfg.doneText : cfg.pendingText;

        return (
          <li key={entry.step} className="flex flex-1 items-center gap-2 first:flex-initial">
            {/* Dot */}
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.06, type: "spring", stiffness: 380, damping: 22 }}
              className="flex flex-none items-center gap-2"
            >
              <div
                className={cn(
                  "relative flex h-6 w-6 items-center justify-center rounded-full ring-2 transition-all",
                  dotBg, dotText,
                  isCurrent ? "ring-amber-200" : "ring-white dark:ring-slate-950",
                )}
              >
                {isCurrent && (
                  <motion.span
                    aria-hidden
                    initial={{ scale: 1, opacity: 0 }}
                    animate={{ scale: 1.6, opacity: [0, 0.4, 0] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
                    className={cn(
                      "pointer-events-none absolute inset-0 rounded-full",
                      dotBg,
                    )}
                  />
                )}
                <Icon size={12} className="relative z-10" />
              </div>

              <div className="flex flex-col leading-tight">
                <span
                  className={cn(
                    "text-[11.5px] font-semibold",
                    isCurrent || isDone
                      ? "text-slate-800 dark:text-slate-100"
                      : "text-slate-400 dark:text-slate-500",
                  )}
                >
                  {entry.label}
                </span>
                {entry.at && (
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    {formatShort(entry.at)}
                    {entry.by ? ` · ${entry.by}` : ""}
                  </span>
                )}
                {!entry.at && entry.detail && (
                  <span className="text-[10px] italic text-slate-400 dark:text-slate-500">
                    {entry.detail}
                  </span>
                )}
              </div>
            </motion.div>

            {/* Connector */}
            {!isLast && (
              <div className="relative h-px min-w-[24px] flex-1 bg-slate-200 dark:bg-slate-800">
                {nextDone && (
                  <motion.span
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.4, delay: 0.2 + i * 0.06 }}
                    style={{ transformOrigin: "left" }}
                    className="absolute inset-0 bg-emerald-400"
                  />
                )}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function formatShort(iso: string): string {
  const d = new Date(iso);
  const tgl = d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
  const jam = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return `${tgl} · ${jam}`;
}
