"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Copy, Check, CalendarRange, Clock } from "lucide-react";
import {
  type BpjsRujukanItem, type RujukanStatus,
  getRujukanStatus, getDaysRemaining, getValidityProgress,
  getIcdName, fmtDate,
} from "./rujukanTypes";

// ─── Status config ────────────────────────────────────────────

const STATUS_CFG: Record<RujukanStatus, { badge: string; bar: string; label: string }> = {
  Aktif:           { badge: "bg-emerald-100 text-emerald-700", bar: "bg-emerald-400", label: "text-emerald-600" },
  Kadaluarsa:      { badge: "bg-rose-100 text-rose-700",       bar: "bg-rose-400",    label: "text-rose-600"    },
  "Belum Berlaku": { badge: "bg-amber-100 text-amber-700",     bar: "bg-amber-400",   label: "text-amber-600"   },
};

// ─── CopyButton ───────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="ml-1 flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[9.5px] font-semibold text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
    >
      {copied
        ? <Check size={9} className="text-emerald-500" />
        : <Copy size={9} />
      }
      {copied ? "Disalin" : "Salin"}
    </button>
  );
}

// ─── RujukanCard ──────────────────────────────────────────────

export function RujukanCard({
  rujukan,
  delay,
}: {
  rujukan: BpjsRujukanItem;
  delay: number;
}) {
  const status   = getRujukanStatus(rujukan.tglrujukan_awal, rujukan.tglrujukan_berakhir);
  const progress = getValidityProgress(rujukan.tglrujukan_awal, rujukan.tglrujukan_berakhir);
  const daysLeft = getDaysRemaining(rujukan.tglrujukan_berakhir);
  const cfg      = STATUS_CFG[status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
    >
      {/* Validity progress bar */}
      <div className="h-1 w-full bg-slate-100">
        <div
          className={cn("h-full transition-all duration-700", cfg.bar)}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>

      <div className="space-y-3 p-4">
        {/* Header: norujukan + status badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-0.5">
              <span className="font-mono text-[11px] font-bold tracking-wide text-slate-700">
                {rujukan.norujukan}
              </span>
              <CopyButton text={rujukan.norujukan} />
            </div>
            <p className="mt-0.5 text-[10px] text-slate-400">
              {rujukan.nmpst} · {rujukan.nokapst}
            </p>
          </div>
          <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[9.5px] font-bold", cfg.badge)}>
            {status}
          </span>
        </div>

        {/* Diagnosis */}
        <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
          <span className="shrink-0 rounded-md bg-sky-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-sky-700">
            {rujukan.diagppk}
          </span>
          <span className="text-[11px] text-slate-600">{getIcdName(rujukan.diagppk)}</span>
        </div>

        {/* Validity window */}
        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <div className="flex items-center gap-1">
            <CalendarRange size={10} className="text-slate-300" />
            <span>{fmtDate(rujukan.tglrujukan_awal)}</span>
            <span className="text-slate-300">→</span>
            <span>{fmtDate(rujukan.tglrujukan_berakhir)}</span>
          </div>
          <div className={cn("flex items-center gap-1 font-semibold", cfg.label)}>
            <Clock size={10} />
            {status === "Aktif"
              ? `${daysLeft} hari lagi`
              : status === "Kadaluarsa"
              ? `Kadaluarsa ${Math.abs(daysLeft)} hari lalu`
              : "Belum berlaku"
            }
          </div>
        </div>
      </div>
    </motion.div>
  );
}
