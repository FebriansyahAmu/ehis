"use client";

import { motion } from "framer-motion";
import {
  Clock, User, Banknote, ArrowDownLeft, Hash, Lock, MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtRupiah } from "../invoice/invoiceShared";
import {
  COUNTER_LIST, expectedCashOnHand, formatDuration, formatJam, totalShiftAll,
  type KasirShift,
} from "@/lib/billing/kasirShiftMock";
import { COUNTER_TONE, SHIFT_STATUS_CFG } from "./kasirShared";

interface Props {
  shift: KasirShift;
  onTutupShift: () => void;
}

/**
 * Active Shift Card — visualisasi shift Open milik kasir sesi sekarang.
 *
 * Layout:
 *   - Header strip: counter chip + kasir name + status + jam buka + durasi + CTA Tutup
 *   - Body grid 4-col: Saldo Awal · Total Tunai · Total Non-Tunai · Saldo Cash Current (highlighted)
 *   - Footer: total transaksi + refund + lokasi counter
 */
export default function ActiveShiftCard({ shift, onTutupShift }: Props) {
  const counter = COUNTER_LIST.find((c) => c.id === shift.counter);
  const counterTone = COUNTER_TONE[shift.counter];
  const statusCfg = SHIFT_STATUS_CFG.Open;
  const CounterIcon = counterTone.icon;
  const StatusIcon = statusCfg.icon;

  const expectedCash = expectedCashOnHand(shift);
  const totalSemuaMetode = totalShiftAll(shift.totalByMetode);
  const totalNonTunai = totalSemuaMetode - shift.totalByMetode.Tunai;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      aria-label="Active Shift"
      className="overflow-hidden rounded-xl border border-emerald-200 bg-gradient-to-br from-white via-emerald-50/30 to-white shadow-sm dark:border-emerald-900/40 dark:from-slate-900 dark:via-emerald-950/15 dark:to-slate-900"
    >
      {/* ── Header strip ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-100 px-4 py-3 dark:border-emerald-900/40">
        <div className="flex min-w-0 items-center gap-3">
          <div className={cn(
            "flex h-11 w-11 flex-none items-center justify-center rounded-xl ring-1",
            counterTone.bg, counterTone.text, counterTone.ring,
          )}>
            <CounterIcon size={20} strokeWidth={2.1} />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[13.5px] font-bold text-slate-800 dark:text-slate-100">
                {counter?.nama ?? shift.counter}
              </span>
              <span className={cn(
                "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ring-1",
                statusCfg.bg, statusCfg.text, statusCfg.ring,
              )}>
                <span className={cn("h-1.5 w-1.5 rounded-full animate-pulse", statusCfg.dot)} />
                <StatusIcon size={9} />
                {statusCfg.label}
              </span>
            </div>
            <p className="mt-0.5 inline-flex items-center gap-1 text-[11.5px] text-slate-600 dark:text-slate-400">
              <User size={11} className="text-slate-400" />
              <span className="font-medium">{shift.kasirNama}</span>
              {counter?.lokasi && (
                <>
                  <span className="text-slate-300">·</span>
                  <MapPin size={10} className="text-slate-400" />
                  <span className="truncate">{counter.lokasi}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Right: jam buka + durasi + CTA */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Dibuka</p>
            <p className="font-mono text-[12.5px] font-semibold tabular-nums text-slate-700 dark:text-slate-200">
              <Clock size={11} className="-mt-0.5 mr-0.5 inline text-slate-400" />
              {formatJam(shift.bukaAt)}
              <span className="ml-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9.5px] text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                {formatDuration(shift.bukaAt)}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onTutupShift}
            className="inline-flex items-center gap-1.5 rounded-md bg-rose-600 px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm transition-all hover:bg-rose-700 active:scale-[0.97]"
          >
            <Lock size={12} />
            Tutup Shift
          </button>
        </div>
      </div>

      {/* ── Body grid 4-col stat ── */}
      <div className="grid grid-cols-2 gap-px bg-emerald-100 dark:bg-emerald-900/30 sm:grid-cols-4">
        <StatCell
          label="Saldo Awal"
          value={fmtRupiah(shift.bukaSaldoAwal)}
          hint="Kas fisik saat buka"
          icon={<Banknote size={13} className="text-slate-400" />}
        />
        <StatCell
          label="Total Tunai"
          value={fmtRupiah(shift.totalByMetode.Tunai)}
          hint="Sesi ini"
          icon={<Banknote size={13} className="text-emerald-500" />}
          accent="emerald"
        />
        <StatCell
          label="Total Non-Tunai"
          value={fmtRupiah(totalNonTunai)}
          hint="Transfer + QRIS + EDC"
          icon={<Hash size={13} className="text-sky-500" />}
          accent="sky"
        />
        <StatCell
          label="Saldo Cash Current"
          value={fmtRupiah(expectedCash)}
          hint="Yang seharusnya di laci"
          icon={<Banknote size={13} className="text-amber-600" />}
          accent="amber"
          highlight
        />
      </div>

      {/* ── Footer meta ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-emerald-100 bg-white px-4 py-2 text-[11px] dark:border-emerald-900/40 dark:bg-slate-900/60">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400">
            <Hash size={11} className="text-slate-400" />
            <span className="font-mono font-semibold tabular-nums">{shift.totalTransaksi}</span>
            transaksi
          </span>
          {shift.totalRefund > 0 && (
            <span className="inline-flex items-center gap-1 text-rose-700">
              <ArrowDownLeft size={11} />
              Refund {fmtRupiah(shift.totalRefund)}
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-slate-500">
            Total semua metode:{" "}
            <span className="font-mono font-semibold tabular-nums text-slate-700 dark:text-slate-200">
              {fmtRupiah(totalSemuaMetode)}
            </span>
          </span>
        </div>
        <span className="font-mono text-[9.5px] tabular-nums text-slate-400">
          ID: {shift.id}
        </span>
      </div>
    </motion.section>
  );
}

// ── StatCell ───────────────────────────────────────────

function StatCell({
  label, value, hint, icon, accent = "slate", highlight,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
  accent?: "slate" | "emerald" | "sky" | "amber";
  highlight?: boolean;
}) {
  const valueTone = {
    slate:   "text-slate-800 dark:text-slate-100",
    emerald: "text-emerald-700 dark:text-emerald-300",
    sky:     "text-sky-700 dark:text-sky-300",
    amber:   "text-amber-700 dark:text-amber-300",
  }[accent];

  return (
    <div className={cn(
      "flex flex-col gap-1 px-4 py-3 transition-colors",
      highlight
        ? "bg-amber-50/70 ring-1 ring-inset ring-amber-200 dark:bg-amber-950/15 dark:ring-amber-900/40"
        : "bg-white dark:bg-slate-900",
    )}>
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </span>
      </div>
      <p className={cn("font-mono text-[15.5px] font-bold tabular-nums leading-tight", valueTone)}>
        {value}
      </p>
      <p className="text-[10px] text-slate-400">{hint}</p>
    </div>
  );
}
