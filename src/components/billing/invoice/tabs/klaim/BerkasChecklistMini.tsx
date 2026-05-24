"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Circle, AlertCircle, FolderCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { berkasProgress, type ClaimBerkas } from "@/lib/billing/claimReadCache";

interface Props {
  berkas: ClaimBerkas[];
}

/**
 * Berkas checklist mini — progress bar (required-only basis) + list ringkas.
 * Required missing = badge rose. Optional missing = badge slate. Ready = emerald.
 * READ-ONLY (upload + edit di /ehis-eklaim).
 */
export default function BerkasChecklistMini({ berkas }: Props) {
  const progress = berkasProgress(berkas);
  const tone = toneByPct(progress.pct);

  // Sort: required-missing first (perlu attention), required-ready, optional-missing, optional-ready
  const sorted = [...berkas].sort((a, b) => {
    const score = (b: ClaimBerkas) =>
      (b.required && !b.ready ? 0 : b.required && b.ready ? 1 : !b.required && !b.ready ? 2 : 3);
    return score(a) - score(b);
  });

  return (
    <section
      aria-label="Checklist Berkas Klaim"
      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      {/* Header */}
      <div className="border-b border-slate-100 px-4 py-2.5 dark:border-slate-800">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={cn(
              "flex h-7 w-7 items-center justify-center rounded-md ring-1",
              tone.iconBg,
            )}>
              <FolderCheck size={13} />
            </span>
            <div>
              <h3 className="text-[12px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                Berkas Klaim
              </h3>
              <p className="text-[10.5px] text-slate-500">
                {progress.ready} dari {progress.required} berkas wajib siap
              </p>
            </div>
          </div>
          <span className={cn(
            "font-mono text-[13px] font-semibold tabular-nums",
            tone.pctText,
          )}>
            {progress.pct}%
          </span>
        </div>

        {/* Progress bar */}
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress.pct}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className={cn("h-full rounded-full", tone.bar)}
          />
        </div>
      </div>

      {/* List */}
      <ul className="divide-y divide-slate-100 dark:divide-slate-800/60">
        {sorted.map((item, idx) => (
          <BerkasRow key={item.kode} berkas={item} delay={idx * 0.03} />
        ))}
      </ul>

      {/* Footer hint */}
      <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-1.5 text-[10.5px] text-slate-500 dark:border-slate-800 dark:bg-slate-900/40">
        Upload & verifikasi berkas di{" "}
        <span className="font-mono text-slate-600 dark:text-slate-300">/ehis-eklaim</span>
      </div>
    </section>
  );
}

// ── Row ────────────────────────────────────────────────

function BerkasRow({ berkas, delay }: { berkas: ClaimBerkas; delay: number }) {
  const isRequired = berkas.required;
  const isReady = berkas.ready;

  // Visual tone
  const ItemIcon = isReady ? CheckCircle2 : isRequired ? AlertCircle : Circle;
  const iconTone = isReady
    ? "text-emerald-500"
    : isRequired
      ? "text-rose-500"
      : "text-slate-400";

  return (
    <motion.li
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay }}
      className="flex items-center gap-2.5 px-4 py-2"
    >
      <ItemIcon size={15} className={cn("flex-none", iconTone)} />
      <div className="min-w-0 flex-1">
        <p className={cn(
          "truncate text-[12px] font-medium",
          isReady
            ? "text-slate-700 dark:text-slate-300"
            : "text-slate-600 dark:text-slate-400",
        )}>
          {berkas.nama}
        </p>
        <p className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
          {berkas.kode}
        </p>
      </div>

      <span className={cn(
        "rounded-full px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider ring-1",
        isRequired
          ? "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/20 dark:text-rose-300 dark:ring-rose-900/40"
          : "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700",
      )}>
        {isRequired ? "Wajib" : "Opsional"}
      </span>
    </motion.li>
  );
}

// ── Tone palette by progress % ──────────────────────────

function toneByPct(pct: number): {
  iconBg: string;
  pctText: string;
  bar: string;
} {
  if (pct >= 100) return {
    iconBg:  "bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:ring-emerald-900/60",
    pctText: "text-emerald-700 dark:text-emerald-300",
    bar:     "bg-gradient-to-r from-emerald-400 to-emerald-500",
  };
  if (pct >= 70) return {
    iconBg:  "bg-amber-100 text-amber-700 ring-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:ring-amber-900/60",
    pctText: "text-amber-700 dark:text-amber-300",
    bar:     "bg-gradient-to-r from-amber-400 to-amber-500",
  };
  return {
    iconBg:  "bg-rose-100 text-rose-700 ring-rose-200 dark:bg-rose-900/40 dark:text-rose-300 dark:ring-rose-900/60",
    pctText: "text-rose-700 dark:text-rose-300",
    bar:     "bg-gradient-to-r from-rose-400 to-rose-500",
  };
}
