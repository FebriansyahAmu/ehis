"use client";

/**
 * AutoPullBar — bar atas Berkas Tab dengan 4 tombol auto-pull dari modul lain (EK3.2).
 *
 * Source modul:
 *  - Resume Medis  → /ehis-care/{ri,igd,rj}/[pasienId]/discharge
 *  - Hasil Lab     → /ehis-care/laboratorium (status Tervalidasi)
 *  - Hasil Rad     → /ehis-care/radiologi (status Tervalidasi)
 *  - Billing       → /ehis-billing/tagihan/[invoiceId] (charge items)
 *
 * Status per source: idle / pulled (jika berkas kategori sudah Siap).
 */

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Sparkles,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { KLAIM_TONE } from "../../../klaim/klaimBoardShared";
import {
  AUTO_PULL_KATEGORI,
  KATEGORI_CFG,
} from "./berkasShared";
import type { BerkasKategori, BerkasKlaim, ClaimRecord } from "@/lib/eklaim/eklaimShared";

interface Props {
  claim: ClaimRecord;
  berkas: ReadonlyArray<BerkasKlaim>;
  /** Auto-pull semua berkas dari kategori tertentu. */
  onPullKategori: (kategori: BerkasKategori) => void;
  /** Auto-pull semua kategori sekaligus. */
  onPullAll: () => void;
}

export default function AutoPullBar({
  claim,
  berkas,
  onPullKategori,
  onPullAll,
}: Props) {
  // Hitung berapa source sudah ter-pull (semua berkas di kategori itu Siap)
  const pulledStatus = AUTO_PULL_KATEGORI.map((kat) => {
    const items = berkas.filter((b) => b.kategori === kat);
    const ready = items.filter((b) => b.status === "Siap").length;
    return {
      kategori: kat,
      ready,
      total: items.length,
      isPulled: items.length > 0 && ready === items.length,
      hasItems: items.length > 0,
    };
  });

  const totalPulled = pulledStatus.filter((s) => s.isPulled).length;
  const totalEligible = pulledStatus.filter((s) => s.hasItems).length;

  return (
    <motion.section
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="rounded-xl border border-sky-200 bg-linear-to-br from-sky-50/70 via-white to-teal-50/40 px-3.5 py-3 ring-1 ring-sky-100"
    >
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-sky-100 ring-1 ring-sky-200">
            <Sparkles size={13} strokeWidth={2.2} className="text-sky-700" />
          </span>
          <div>
            <p className="text-[12.5px] font-bold text-slate-800">
              Auto-pull dari modul EHIS lain
            </p>
            <p className="text-[11px] text-slate-500">
              Tarik berkas otomatis dari sumber yang sudah ada di sistem
            </p>
          </div>
        </div>

        {/* Summary chip + Pull All */}
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-2 py-1 font-mono text-[11px] font-bold tabular-nums ring-1",
              totalPulled === totalEligible && totalEligible > 0
                ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                : "bg-white text-slate-600 ring-slate-200",
            )}
          >
            <span>
              {totalPulled}/{totalEligible}
            </span>
            <span className="text-slate-400">ter-pull</span>
          </span>
          <button
            type="button"
            onClick={onPullAll}
            disabled={totalPulled === totalEligible}
            title={
              totalPulled === totalEligible
                ? "Semua sumber sudah ter-pull"
                : "Auto-pull semua sumber sekaligus"
            }
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] font-semibold transition-all duration-150 active:scale-[0.97]",
              totalPulled === totalEligible
                ? "cursor-not-allowed bg-slate-50 text-slate-400 ring-1 ring-slate-200"
                : "bg-sky-600 text-white shadow-sm hover:bg-sky-700 hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40",
            )}
          >
            <RefreshCw size={11} strokeWidth={2.5} />
            Pull Semua
          </button>
        </div>
      </div>

      {/* Source buttons */}
      <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        {pulledStatus.map((s) => (
          <PullCard
            key={s.kategori}
            claim={claim}
            kategori={s.kategori}
            isPulled={s.isPulled}
            ready={s.ready}
            total={s.total}
            disabled={!s.hasItems}
            onPull={() => onPullKategori(s.kategori)}
          />
        ))}
      </div>
    </motion.section>
  );
}

// ── Pull Card ──────────────────────────────────────────

function PullCard({
  claim,
  kategori,
  isPulled,
  ready,
  total,
  disabled,
  onPull,
}: {
  claim: ClaimRecord;
  kategori: BerkasKategori;
  isPulled: boolean;
  ready: number;
  total: number;
  disabled: boolean;
  onPull: () => void;
}) {
  const cfg = KATEGORI_CFG[kategori];
  const tone = KLAIM_TONE[cfg.tone];
  const Icon = cfg.icon;
  const source = cfg.autoPull;

  if (!source) return null;

  return (
    <div
      className={cn(
        "group relative flex flex-col gap-1.5 rounded-md border bg-white p-2 transition-all duration-150",
        disabled
          ? "border-slate-100 opacity-50"
          : isPulled
            ? "border-emerald-300 ring-1 ring-emerald-100"
            : "border-slate-200 hover:border-sky-300 hover:shadow-sm",
      )}
    >
      <div className="flex items-start gap-1.5">
        <span
          className={cn(
            "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md ring-1",
            tone.iconBg,
            tone.iconText,
            tone.chipRing,
          )}
        >
          <Icon size={12} strokeWidth={2.4} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11.5px] font-semibold text-slate-800">
            {kategori === "ResumeMedis" ? "Resume Medis" : kategori}
          </p>
          <p className="truncate text-[10.5px] text-slate-500" title={source.label}>
            {source.label}
          </p>
        </div>
        {isPulled && (
          <CheckCircle2
            size={12}
            strokeWidth={2.6}
            className="shrink-0 text-emerald-500"
          />
        )}
      </div>

      <div className="flex items-center justify-between gap-1">
        <span className="font-mono text-[10.5px] tabular-nums text-slate-500">
          {disabled ? "Tidak ada" : `${ready}/${total} siap`}
        </span>
        <div className="flex items-center gap-1">
          <Link
            href={source.href(claim)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-5 w-5 items-center justify-center rounded text-slate-400 transition-colors hover:bg-slate-100 hover:text-teal-700"
            title={`Buka ${source.label}`}
            aria-label={`Buka ${source.label}`}
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink size={9} strokeWidth={2.5} />
          </Link>
          <button
            type="button"
            onClick={onPull}
            disabled={disabled || isPulled}
            title={
              disabled
                ? "Tidak ada berkas kategori ini"
                : isPulled
                  ? "Sudah ter-pull"
                  : `Auto-pull dari ${source.label}`
            }
            className={cn(
              "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10.5px] font-bold transition-all duration-150 active:scale-95",
              disabled || isPulled
                ? "cursor-not-allowed bg-slate-50 text-slate-400 ring-1 ring-slate-200"
                : "bg-sky-50 text-sky-700 ring-1 ring-sky-200 hover:bg-sky-100",
            )}
          >
            {isPulled ? "✓ Pulled" : "Pull"}
          </button>
        </div>
      </div>
    </div>
  );
}
