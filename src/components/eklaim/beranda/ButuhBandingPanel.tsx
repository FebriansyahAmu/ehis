"use client";

/**
 * Tab content — klaim Rejected/Banding Rejected yang berhak banding.
 *
 * Refactored ke flat list (no outer card · no footer) — wrapper di-handle
 * `ActivityTabPanel`. Sort by hari sejak rejection desc (paling lama dulu).
 */

import Link from "next/link";
import { Inbox } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  EKLAIM_TONE,
  PENJAMIN_TIPE_CFG,
  fmtRupiahKpi,
  getButuhBanding,
} from "./berandaEklaimShared";

export default function ButuhBandingPanel() {
  const entries = getButuhBanding(7);

  if (entries.length === 0) return <EmptyState />;

  return (
    <ul className="divide-y divide-slate-100">
      {entries.map((e) => {
        const t = PENJAMIN_TIPE_CFG[e.claim.penjamin.tipe];
        const palette = EKLAIM_TONE[t.tone];
        return (
          <li key={e.claim.id}>
            <Link
              href={`/ehis-eklaim/klaim/${e.claim.id}`}
              className="group block px-3 py-2 transition hover:bg-rose-50/40 focus-visible:bg-rose-50/40 focus-visible:outline-none"
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
                    <span className="truncate text-[10px] text-slate-500">{e.claim.penjamin.nama}</span>
                    <span className="text-[10px] text-slate-300">·</span>
                    <span className="text-[10px] font-semibold text-rose-600">
                      {e.hariSejakRejection} hari lalu
                    </span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[9px] uppercase tracking-widest text-slate-400">Selisih</p>
                  <p className="font-mono text-[12px] font-bold tabular-nums text-rose-700">
                    {fmtRupiahKpi(e.selisihMinus)}
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
      <Inbox size={22} className="text-slate-300" />
      <p className="text-[11px] font-semibold text-slate-500">Tidak ada klaim ditolak</p>
      <p className="text-[10px] text-slate-400">Approval rate aman bulan ini</p>
    </div>
  );
}
