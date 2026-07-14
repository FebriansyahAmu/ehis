"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Wallet, User, Building, Hash, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtRupiah } from "../../invoice/invoiceShared";
import type { OutstandingResult } from "@/lib/billing/outstandingSearch";

interface Props {
  row: OutstandingResult;
  selected: boolean;
  onSelect: () => void;
  delay?: number;
}

/**
 * Row hasil search outstanding — pasien card dengan sisa tagihan + 2 aksi:
 *   - Primary: "Bayar" → open Quick Payment Form di kolom kiri
 *   - Secondary: "Detail" → buka invoice detail page (full management view)
 *
 * Active state ring amber saat selected. Detail link memakai stopPropagation
 * supaya tidak trigger main onSelect saat user klik link.
 */
export default function OutstandingResultRow({
  row, selected, onSelect, delay = 0,
}: Props) {
  const sisaTone = row.sisaTagihan > 5_000_000
    ? "text-rose-700 dark:text-rose-300"
    : "text-amber-700 dark:text-amber-300";

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay }}
      className={cn(
        "group grid w-full grid-cols-[1fr_auto_auto] items-center gap-3 rounded-lg border bg-white px-3 py-2.5 transition-all",
        selected
          ? "border-amber-400 bg-amber-50/40 ring-2 ring-amber-200 shadow-sm dark:border-amber-700 dark:bg-amber-950/15 dark:ring-amber-900/60"
          : "border-slate-200 hover:border-amber-300 hover:bg-amber-50/30 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-amber-800 dark:hover:bg-amber-950/10",
      )}
    >
      {/* Main (klik area utk pilih) */}
      <button
        type="button"
        onClick={onSelect}
        className="min-w-0 text-left"
      >
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="truncate text-[13px] font-bold text-slate-800 dark:text-slate-100">
            {row.pasien.nama}
          </span>
          <span className="font-mono text-[10.5px] text-slate-500">
            {row.pasien.noRM}
          </span>
          <span className="text-[10px] text-slate-400">
            {row.pasien.gender} · {row.pasien.age}t
          </span>
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10.5px] text-slate-500">
          <span className="inline-flex items-center gap-1">
            <Hash size={9} className="text-slate-400" />
            <span className="font-mono">{row.noTagihan}</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <Building size={9} className="text-slate-400" />
            {row.unit} · {row.kelas}
          </span>
          <span className="inline-flex items-center gap-1">
            <User size={9} className="text-slate-400" />
            <span className="truncate">{row.penjamin.nama}</span>
          </span>
        </div>
      </button>

      {/* Sisa (juga clickable supaya area klik lebar) */}
      <button
        type="button"
        onClick={onSelect}
        className="text-right"
      >
        <p className="text-[9.5px] uppercase tracking-wider text-slate-500">Sisa</p>
        <p className={cn(
          "font-mono text-[13.5px] font-bold tabular-nums leading-tight",
          sisaTone,
        )}>
          {fmtRupiah(row.sisaTagihan)}
        </p>
        <p className="text-[9.5px] text-slate-400">
          dari {fmtRupiah(row.total)}
        </p>
      </button>

      {/* Actions: Bayar (primary) + Detail (secondary link) */}
      <div className="flex flex-col items-stretch gap-1">
        <button
          type="button"
          onClick={onSelect}
          className={cn(
            "flex items-center justify-center gap-1 rounded-md px-2.5 py-1.5 text-[11.5px] font-semibold shadow-sm transition-all",
            selected
              ? "bg-amber-600 text-white"
              : "bg-amber-100 text-amber-800 hover:bg-amber-600 hover:text-white dark:bg-amber-900/40 dark:text-amber-200",
          )}
        >
          <Wallet size={11} />
          Bayar
          <ArrowRight size={11} className="transition-transform group-hover:translate-x-0.5" />
        </button>
        <Link
          href={`/ehis-billing/tagihan/kunjungan/${row.id}`}
          onClick={(e) => e.stopPropagation()}
          target="_blank"
          rel="noopener noreferrer"
          title="Buka detail invoice di tab baru (refund / void / cicilan terstruktur)"
          className="inline-flex items-center justify-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-medium text-slate-600 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-indigo-800 dark:hover:bg-indigo-950/30 dark:hover:text-indigo-300"
        >
          <ExternalLink size={9} />
          Detail
        </Link>
      </div>
    </motion.div>
  );
}
