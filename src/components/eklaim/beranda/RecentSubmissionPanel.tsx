"use client";

/**
 * Tab content — submission terbaru lintas penjamin & status.
 *
 * Refactored ke flat list (no outer card · no footer) — wrapper di-handle
 * `ActivityTabPanel`. Sort by agoSec asc (paling baru dulu), max 10 entry.
 */

import Link from "next/link";
import { Inbox } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  EKLAIM_TONE,
  PENJAMIN_TIPE_CFG,
  RECENT_KIND_CFG,
  fmtAgo,
  fmtRupiahKpi,
  getRecentSubmissions,
} from "./berandaEklaimShared";

export default function RecentSubmissionPanel() {
  const entries = getRecentSubmissions(7);

  if (entries.length === 0) return <EmptyState />;

  return (
    <ul className="divide-y divide-slate-100">
      {entries.map((e) => {
        const kCfg = RECENT_KIND_CFG[e.kind];
        const kPal = EKLAIM_TONE[kCfg.tone];
        const tCfg = PENJAMIN_TIPE_CFG[e.claim.penjamin.tipe];
        const tPal = EKLAIM_TONE[tCfg.tone];
        const nominal = e.claim.approvedAmount ?? e.claim.tarifRS;
        return (
          <li key={e.claim.id}>
            <Link
              href={`/ehis-eklaim/klaim/${e.claim.id}`}
              className="group block px-3 py-2 transition hover:bg-teal-50/40 focus-visible:bg-teal-50/40 focus-visible:outline-none"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "rounded-md px-1.5 py-0.5 text-[9.5px] font-semibold ring-1",
                        kPal.badgeBg,
                        kPal.badgeText,
                        kPal.ring,
                      )}
                    >
                      {kCfg.label}
                    </span>
                    <span
                      className={cn(
                        "rounded-md px-1.5 py-0.5 text-[9.5px] font-semibold ring-1",
                        tPal.badgeBg,
                        tPal.badgeText,
                        tPal.ring,
                      )}
                    >
                      {tCfg.label}
                    </span>
                    <span className="ml-auto text-[10px] text-slate-400">{fmtAgo(e.agoSec)}</span>
                  </div>
                  <p className="mt-1 truncate text-[12px] font-semibold text-slate-800 group-hover:text-slate-900">
                    {e.claim.pasienId}
                  </p>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <span className="font-mono text-[9.5px] text-slate-400">{e.claim.noKlaim}</span>
                    <span className="text-[10px] text-slate-300">·</span>
                    <span className="truncate text-[10px] text-slate-500">{e.claim.penjamin.nama}</span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-mono text-[12px] font-bold tabular-nums text-slate-800">
                    {fmtRupiahKpi(nominal)}
                  </p>
                  {e.claim.approvedAmount !== undefined && (
                    <p className="font-mono text-[9.5px] text-emerald-600">disetujui</p>
                  )}
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
      <p className="text-[11px] font-semibold text-slate-500">Belum ada submission</p>
      <p className="text-[10px] text-slate-400">Klaim baru muncul setelah disubmit</p>
    </div>
  );
}
