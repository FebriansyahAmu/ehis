"use client";

import { motion } from "framer-motion";
import { History, TrendingUp, TrendingDown, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtRupiah } from "../invoice/invoiceShared";
import {
  COUNTER_LIST, formatJam, formatTanggalShort, formatDuration, totalShiftAll,
  type KasirShift,
} from "@/lib/billing/kasirShiftMock";
import { COUNTER_TONE, SHIFT_STATUS_CFG } from "./kasirShared";

interface Props {
  shifts: KasirShift[];
}

/**
 * Recent Shifts Table — list shift Closed terakhir (5-10) untuk audit & reference.
 * Kolom: Counter · Kasir · Buka → Tutup (durasi) · Total · Selisih · Status · Supervisor
 */
export default function RecentShiftsTable({ shifts }: Props) {
  return (
    <section
      aria-label="Recent Shifts"
      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-2.5 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700">
            <History size={13} />
          </span>
          <div>
            <h3 className="text-[12.5px] font-semibold text-slate-800 dark:text-slate-100">
              Shift Terakhir
            </h3>
            <p className="text-[10.5px] text-slate-500">
              <span className="font-mono tabular-nums">{shifts.length}</span> shift selesai · sort terbaru dulu
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[11.5px]">
          <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 dark:bg-slate-800/40">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">Counter</th>
              <th className="px-3 py-2 text-left font-semibold">Kasir</th>
              <th className="px-3 py-2 text-left font-semibold">Buka → Tutup</th>
              <th className="px-3 py-2 text-right font-semibold">Total</th>
              <th className="px-3 py-2 text-right font-semibold">Selisih</th>
              <th className="px-3 py-2 text-left font-semibold">Supervisor</th>
            </tr>
          </thead>
          <tbody>
            {shifts.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center italic text-slate-400">
                  Belum ada shift selesai
                </td>
              </tr>
            )}
            {shifts.map((s, idx) => (
              <ShiftRow key={s.id} shift={s} delay={idx * 0.03} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ── Row ────────────────────────────────────────────────

function ShiftRow({ shift, delay }: { shift: KasirShift; delay: number }) {
  const counter = COUNTER_LIST.find((c) => c.id === shift.counter);
  const counterTone = COUNTER_TONE[shift.counter];
  const statusCfg = SHIFT_STATUS_CFG[shift.status];
  const CounterIcon = counterTone.icon;
  const total = totalShiftAll(shift.totalByMetode);
  const selisihTone = selisihPalette(shift.selisih ?? 0);
  const duration = shift.tutupAt ? formatDuration(shift.bukaAt, shift.tutupAt) : "—";

  return (
    <motion.tr
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: Math.min(0.2, delay) }}
      className="border-b border-slate-100 hover:bg-slate-50/70 dark:border-slate-800/60 dark:hover:bg-slate-800/30"
    >
      {/* Counter */}
      <td className="px-3 py-2 align-top">
        <div className="flex items-center gap-2">
          <span className={cn(
            "flex h-7 w-7 flex-none items-center justify-center rounded-md ring-1",
            counterTone.bg, counterTone.text, counterTone.ring,
          )}>
            <CounterIcon size={12} />
          </span>
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-100">
              {counter?.nama ?? shift.counter}
            </p>
            <p className="font-mono text-[9.5px] text-slate-400">{shift.counter}</p>
          </div>
        </div>
      </td>

      {/* Kasir */}
      <td className="px-3 py-2 align-top text-slate-700 dark:text-slate-300">
        {shift.kasirNama}
      </td>

      {/* Buka → Tutup */}
      <td className="px-3 py-2 align-top">
        <div className="font-mono text-[11px] tabular-nums text-slate-700 dark:text-slate-300">
          {formatTanggalShort(shift.bukaAt)} · {formatJam(shift.bukaAt)}
          <span className="mx-1 text-slate-300">→</span>
          {shift.tutupAt ? formatJam(shift.tutupAt) : <span className="italic text-slate-400">—</span>}
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-[9.5px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {duration}
        </span>
      </td>

      {/* Total */}
      <td className="px-3 py-2 align-top text-right">
        <p className="font-mono text-[12px] font-semibold tabular-nums text-slate-800 dark:text-slate-100">
          {fmtRupiah(total)}
        </p>
        <p className="font-mono text-[9.5px] text-slate-400">
          {shift.totalTransaksi} trx
        </p>
      </td>

      {/* Selisih */}
      <td className="px-3 py-2 align-top text-right">
        <span className={cn(
          "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[11px] font-semibold tabular-nums ring-1",
          selisihTone.bg, selisihTone.text, selisihTone.ring,
        )}>
          {selisihTone.icon}
          {shift.selisih !== undefined
            ? (shift.selisih === 0 ? "Balance" : `${shift.selisih > 0 ? "+" : ""}${fmtRupiah(shift.selisih)}`)
            : "—"}
        </span>
      </td>

      {/* Supervisor */}
      <td className="px-3 py-2 align-top">
        <p className="truncate text-[10.5px] text-slate-600 dark:text-slate-400">
          {shift.supervisor ?? "—"}
        </p>
        <span className={cn(
          "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9.5px] font-semibold ring-1",
          statusCfg.bg, statusCfg.text, statusCfg.ring,
        )}>
          {statusCfg.label}
        </span>
      </td>
    </motion.tr>
  );
}

// ── Selisih palette ────────────────────────────────────

function selisihPalette(selisih: number): {
  bg: string; text: string; ring: string; icon: React.ReactNode;
} {
  if (selisih === 0) return {
    bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200",
    icon: <CheckCircle2 size={10} />,
  };
  if (selisih > 0) return {
    bg: "bg-sky-50", text: "text-sky-700", ring: "ring-sky-200",
    icon: <TrendingUp size={10} />,
  };
  return {
    bg: "bg-rose-50", text: "text-rose-700", ring: "ring-rose-200",
    icon: <TrendingDown size={10} />,
  };
}
