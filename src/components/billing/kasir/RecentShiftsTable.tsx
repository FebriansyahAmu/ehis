"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  History, TrendingUp, TrendingDown, CheckCircle2,
  MoreVertical, FileText, PiggyBank, Printer, Clock4,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtRupiah } from "../invoice/invoiceShared";
import {
  COUNTER_LIST, formatJam, formatTanggalShort, formatDuration, totalShiftAll,
  type KasirShift,
} from "@/lib/billing/kasirShiftMock";
import { COUNTER_TONE, SHIFT_STATUS_CFG } from "./kasirShared";

export type ShiftRowAction = "laporan" | "setoran-form" | "setoran-slip";

interface Props {
  shifts: KasirShift[];
  onAction?: (action: ShiftRowAction, shift: KasirShift) => void;
}

/**
 * Recent Shifts Table — list shift Closed terakhir (5-10) untuk audit & reference.
 * Kolom: Counter · Kasir · Buka → Tutup (durasi) · Total · Selisih · Setoran · Aksi
 *
 * Aksi (kebab):
 *   - "Cetak Laporan Tutup Kas" — selalu tersedia
 *   - "Catat Setoran" — jika belum di-setor
 *   - "Cetak Slip Setoran" — jika sudah di-setor
 */
export default function RecentShiftsTable({ shifts, onAction }: Props) {
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
              <th className="px-3 py-2 text-left font-semibold">Setoran</th>
              <th className="px-3 py-2 text-right font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {shifts.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center italic text-slate-400">
                  Belum ada shift selesai
                </td>
              </tr>
            )}
            {shifts.map((s, idx) => (
              <ShiftRow key={s.id} shift={s} delay={idx * 0.03} onAction={onAction} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ── Row ────────────────────────────────────────────────

function ShiftRow({
  shift, delay, onAction,
}: {
  shift: KasirShift;
  delay: number;
  onAction?: (action: ShiftRowAction, shift: KasirShift) => void;
}) {
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

      {/* Setoran */}
      <td className="px-3 py-2 align-top">
        <SetoranBadge shift={shift} />
        <p className="mt-0.5 inline-flex items-center gap-1 rounded-full px-1 py-0.5 text-[9px] font-medium text-slate-500">
          <span className={cn(
            "h-1 w-1 rounded-full",
            statusCfg.dot,
          )} />
          {statusCfg.label}
        </p>
        {shift.supervisor && (
          <p className="truncate text-[9.5px] text-slate-500" title={shift.supervisor}>
            {shift.supervisor.length > 22 ? shift.supervisor.slice(0, 20) + "…" : shift.supervisor}
          </p>
        )}
      </td>

      {/* Aksi */}
      <td className="px-3 py-2 align-top text-right">
        <ShiftRowActions shift={shift} onAction={onAction} />
      </td>
    </motion.tr>
  );
}

// ── Setoran badge ──────────────────────────────────────

function SetoranBadge({ shift }: { shift: KasirShift }) {
  if (shift.setoran) {
    return (
      <span
        title={`Disetor ${shift.setoran.noSetor} · ${shift.setoran.penerima}`}
        className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-900/60"
      >
        <PiggyBank size={10} />
        Disetor
      </span>
    );
  }
  return (
    <span
      title="Belum disetor ke bendahara"
      className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-900/60"
    >
      <Clock4 size={10} />
      Belum
    </span>
  );
}

// ── Row actions kebab ──────────────────────────────────

function ShiftRowActions({
  shift, onAction,
}: {
  shift: KasirShift;
  onAction?: (action: ShiftRowAction, shift: KasirShift) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  // Outside click + ESC close
  useEffect(() => {
    if (!open) return;
    const out = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", out);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", out);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const hasSetoran = !!shift.setoran;

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((p) => !p); }}
        aria-label="Aksi shift"
        className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
      >
        <MoreVertical size={14} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-9 z-20 w-52 overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg ring-1 ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <MenuItem
              icon={FileText}
              label="Cetak Laporan Tutup Kas"
              onClick={() => { setOpen(false); onAction?.("laporan", shift); }}
            />
            <div className="border-t border-slate-100 dark:border-slate-800" />
            {hasSetoran ? (
              <MenuItem
                icon={Printer}
                label="Cetak Slip Setoran"
                onClick={() => { setOpen(false); onAction?.("setoran-slip", shift); }}
              />
            ) : (
              <MenuItem
                icon={PiggyBank}
                label="Catat Setoran"
                accent="amber"
                onClick={() => { setOpen(false); onAction?.("setoran-form", shift); }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuItem({
  icon: Icon, label, onClick, accent,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  onClick: () => void;
  accent?: "amber";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 px-3 py-1.5 text-[12px] font-medium transition-colors",
        accent === "amber"
          ? "text-amber-700 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-950/30"
          : "text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800",
      )}
    >
      <Icon size={12} className="flex-none" />
      <span className="truncate">{label}</span>
    </button>
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
