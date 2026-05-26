"use client";

/**
 * Tab content — klaim belum-submit yang mendekati deadline tgl 10 next month.
 *
 * Refactored ke flat list (no outer card · no footer) — wrapper di-handle
 * `ActivityTabPanel`. Sort by hari sejak kunjungan desc, urgency bar terlihat.
 */

import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  EKLAIM_TONE,
  PENJAMIN_TIPE_CFG,
  fmtRupiahKpi,
  getAkanExpired,
} from "./berandaEklaimShared";

export default function AkanExpiredPanel() {
  const entries = getAkanExpired(7);

  if (entries.length === 0) return <EmptyState />;

  return (
    <ul className="divide-y divide-slate-100">
      {entries.map((e, idx) => {
        const t = PENJAMIN_TIPE_CFG[e.claim.penjamin.tipe];
        const palette = EKLAIM_TONE[t.tone];
        const urgency = Math.min(100, Math.round((e.hariSinceKunjungan / 30) * 100));
        const urgent = e.hariSinceKunjungan >= 20;

        return (
          <li key={e.claim.id}>
            <Link
              href={`/ehis-eklaim/klaim/${e.claim.id}`}
              className="group block px-3 py-2 transition hover:bg-amber-50/40 focus-visible:bg-amber-50/40 focus-visible:outline-none"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[12px] font-semibold text-slate-800 group-hover:text-slate-900">
                      {e.claim.pasienId}
                    </p>
                    <span className="font-mono text-[10px] text-slate-400">{e.claim.noKlaim}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span
                      className={cn(
                        "rounded-md px-1.5 py-0.5 text-[9.5px] font-semibold ring-1",
                        palette.badgeBg,
                        palette.badgeText,
                        palette.ring,
                      )}
                    >
                      {t.label}
                    </span>
                    <span
                      className={cn(
                        "rounded-md px-1.5 py-0.5 text-[9.5px] font-semibold",
                        urgent
                          ? "bg-rose-50 text-rose-700 ring-1 ring-rose-100"
                          : "bg-slate-50 text-slate-600 ring-1 ring-slate-200",
                      )}
                    >
                      {e.hariSinceKunjungan}h lalu
                    </span>
                    <span className="text-[10px] text-slate-400">· sisa {e.hariSampaiDeadline}h</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <motion.span
                        initial={{ width: 0 }}
                        animate={{ width: `${urgency}%` }}
                        transition={{ duration: 0.5, delay: 0.1 + idx * 0.04 }}
                        className={cn("block h-full", urgent ? "bg-rose-400" : "bg-amber-400")}
                      />
                    </div>
                    <span className="font-mono text-[9.5px] text-slate-400">{urgency}%</span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[9px] uppercase tracking-widest text-slate-400">Tarif</p>
                  <p className="font-mono text-[12px] font-bold tabular-nums text-slate-800">
                    {fmtRupiahKpi(e.claim.tarifRS)}
                  </p>
                </div>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-1 px-3 py-10 text-center">
      <CheckCircle2 size={22} className="text-emerald-400" />
      <p className="text-[11px] font-semibold text-slate-500">Semua sudah disubmit</p>
      <p className="text-[10px] text-slate-400">Tidak ada klaim mendekati deadline</p>
    </div>
  );
}
