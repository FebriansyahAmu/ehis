"use client";

import { motion } from "framer-motion";
import { Receipt, Wallet, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtRupiah } from "../../invoiceShared";

interface Props {
  grand: number;
  dibayar: number;
  sisa: number;
}

export default function PaymentSummaryCard({ grand, dibayar, sisa }: Props) {
  const pct = grand > 0 ? Math.min(100, Math.round((dibayar / grand) * 100)) : 0;
  const isLunas = sisa === 0 && grand > 0;

  return (
    <section
      aria-label="Ringkasan pembayaran"
      className="grid grid-cols-1 gap-2.5 sm:grid-cols-3"
    >
      <Card
        label="Grand Total"
        value={grand}
        icon={Receipt}
        tone="amber"
        delay={0}
      />
      <Card
        label="Sudah Dibayar"
        value={dibayar}
        icon={Wallet}
        tone="sky"
        delay={0.05}
        progress={pct}
        progressLabel={`${pct}% dari Grand Total`}
      />
      <Card
        label={isLunas ? "Lunas" : "Sisa Tagihan"}
        value={sisa}
        icon={isLunas ? CheckCircle2 : AlertTriangle}
        tone={isLunas ? "emerald" : "rose"}
        delay={0.1}
        prominent
      />
    </section>
  );
}

// ── Sub-component ──────────────────────────────────────

function Card({
  label, value, icon: Icon, tone, delay = 0, progress, progressLabel, prominent,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  tone: "amber" | "sky" | "emerald" | "rose";
  delay?: number;
  progress?: number;
  progressLabel?: string;
  prominent?: boolean;
}) {
  const T = TONES[tone];
  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay, ease: "easeOut" }}
      className={cn(
        "relative overflow-hidden rounded-xl border bg-white p-3 shadow-sm transition-all hover:shadow-md dark:bg-slate-950",
        T.border,
      )}
    >
      {/* accent stripe */}
      <span className={cn("absolute inset-y-0 left-0 w-1", T.accent)} />

      <div className="flex items-start gap-2.5 pl-2">
        <div className={cn("flex h-9 w-9 flex-none items-center justify-center rounded-lg", T.iconBg)}>
          <Icon size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className={cn(
            "mt-0.5 font-mono font-bold tabular-nums leading-tight",
            prominent ? "text-[18px]" : "text-[16px]",
            T.valueText,
          )}>
            {fmtRupiah(value)}
          </p>
          {typeof progress === "number" && (
            <div className="mt-1.5">
              <div className="h-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, delay: delay + 0.1, ease: "easeOut" }}
                  className={cn("h-full", T.accent)}
                />
              </div>
              {progressLabel && (
                <p className="mt-0.5 text-[10px] text-slate-400">{progressLabel}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.article>
  );
}

const TONES = {
  amber:   { border: "border-amber-200 dark:border-amber-900/40",     iconBg: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300",       valueText: "text-amber-900 dark:text-amber-200",   accent: "bg-amber-500" },
  sky:     { border: "border-sky-200 dark:border-sky-900/40",         iconBg: "bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-300",               valueText: "text-sky-900 dark:text-sky-200",       accent: "bg-sky-500" },
  emerald: { border: "border-emerald-200 dark:border-emerald-900/40", iconBg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300", valueText: "text-emerald-900 dark:text-emerald-200", accent: "bg-emerald-500" },
  rose:    { border: "border-rose-200 dark:border-rose-900/40",       iconBg: "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300",           valueText: "text-rose-900 dark:text-rose-200",     accent: "bg-rose-500" },
} as const;
