"use client";

import { motion } from "framer-motion";
import { Receipt, Banknote, CreditCard, ArrowDownLeft, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtRupiah } from "../invoice/invoiceShared";

/** Agregat KPI hari ini (dari pembayaran NYATA — getPaymentSummary by date). */
export interface ShiftKpiAgg {
  totalTransaksi: number;
  totalTunai: number;
  totalNonTunai: number;
  totalRefund: number;
  countersAktif: number;
}

interface Props {
  agg: ShiftKpiAgg;
}

/**
 * KPI Strip hari ini — 4 card aggregate pembayaran NYATA hari ini (lintas shift).
 * Dipakai di kanan ActiveShiftCard sebagai konteks operasional.
 */
export default function ShiftKPIStrip({ agg }: Props) {
  const isEmpty = agg.totalTransaksi === 0;

  const cards: KPICardCfg[] = [
    {
      label: "Total Transaksi Hari Ini",
      value: agg.totalTransaksi.toString(),
      hint: `${agg.countersAktif} counter aktif`,
      icon: Receipt,
      tone: "amber",
      isMoney: false,
    },
    {
      label: "Pemasukan Tunai",
      value: fmtRupiah(agg.totalTunai),
      hint: "Yang masuk laci kasir",
      icon: Banknote,
      tone: "emerald",
      isMoney: true,
    },
    {
      label: "Pemasukan Non-Tunai",
      value: fmtRupiah(agg.totalNonTunai),
      hint: "Transfer + QRIS + EDC",
      icon: CreditCard,
      tone: "sky",
      isMoney: true,
    },
    {
      label: "Refund Hari Ini",
      value: fmtRupiah(agg.totalRefund),
      hint: agg.totalRefund > 0 ? "Yang dikembalikan" : "Tidak ada refund",
      icon: ArrowDownLeft,
      tone: "rose",
      isMoney: true,
      muted: agg.totalRefund === 0,
    },
  ];

  return (
    <div className="space-y-2">
      {isEmpty && (
        <div className="flex items-center gap-2 rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-3 py-2 text-[10.5px] text-slate-500 dark:border-slate-800 dark:bg-slate-900/40">
          <Inbox size={13} className="text-slate-400" />
          Belum ada transaksi pembayaran hari ini.
        </div>
      )}
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-1 lg:gap-2.5">
        {cards.map((c, i) => (
          <KPICard key={c.label} cfg={c} delay={i * 0.05} />
        ))}
      </div>
    </div>
  );
}

// ── KPI card ───────────────────────────────────────────

interface KPICardCfg {
  label: string;
  value: string;
  hint: string;
  icon: typeof Receipt;
  tone: "amber" | "emerald" | "sky" | "rose";
  isMoney: boolean;
  muted?: boolean;
}

function KPICard({ cfg, delay }: { cfg: KPICardCfg; delay: number }) {
  const Icon = cfg.icon;
  const palette = {
    amber:   { stripe: "from-amber-400 to-amber-500",     ringBg: "bg-amber-100 text-amber-700 ring-amber-200" },
    emerald: { stripe: "from-emerald-400 to-emerald-500", ringBg: "bg-emerald-100 text-emerald-700 ring-emerald-200" },
    sky:     { stripe: "from-sky-400 to-sky-500",         ringBg: "bg-sky-100 text-sky-700 ring-sky-200" },
    rose:    { stripe: "from-rose-400 to-rose-500",       ringBg: "bg-rose-100 text-rose-700 ring-rose-200" },
  }[cfg.tone];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay }}
      whileHover={{ y: -2 }}
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-white px-3 py-2.5 shadow-sm transition-shadow hover:shadow-md dark:bg-slate-900",
        cfg.muted
          ? "border-slate-200 dark:border-slate-800"
          : "border-slate-200 dark:border-slate-800",
      )}
    >
      {/* Accent stripe kiri */}
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-2 left-0 w-1 rounded-r-full bg-gradient-to-b",
          palette.stripe,
          cfg.muted && "opacity-30",
        )}
      />

      <div className="flex items-start gap-2 pl-1.5">
        <span className={cn(
          "flex h-8 w-8 flex-none items-center justify-center rounded-md ring-1",
          palette.ringBg,
          cfg.muted && "opacity-50",
        )}>
          <Icon size={14} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 leading-tight">
            {cfg.label}
          </p>
          <p className={cn(
            "mt-0.5 font-mono font-bold tabular-nums leading-tight text-slate-800 dark:text-slate-100",
            cfg.isMoney ? "text-[13.5px]" : "text-[18px]",
            cfg.muted && "text-slate-400",
          )}>
            {cfg.value}
          </p>
          <p className="mt-0.5 text-[10px] text-slate-400">{cfg.hint}</p>
        </div>
      </div>
    </motion.div>
  );
}
