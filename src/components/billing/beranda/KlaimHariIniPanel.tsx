"use client";

/**
 * Sidebar panel — aktivitas klaim hari ini (Submitted/Approved/Rejected/Paid).
 *
 * Prop-driven (`entries`). Backend E-Klaim belum ada → dipanggil dengan `[]`
 * (empty state). Siap terima feed NYATA saat modul E-Klaim di-backend-kan.
 */

import Link from "next/link";
import { motion } from "framer-motion";
import { ShieldCheck, ChevronRight, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtRupiahShort } from "@/lib/master/penjaminMock";
import {
  KLAIM_KIND_CFG,
  PENJAMIN_TIPE_CFG,
  TONE_PALETTE,
  fmtAgo,
  type KlaimActivityEntry,
} from "./berandaBillingShared";

export default function KlaimHariIniPanel({ entries }: { entries: KlaimActivityEntry[] }) {
  const approvedTotal = entries
    .filter((e) => e.kind === "Approved" || e.kind === "Paid")
    .reduce((a, e) => a + e.nominal, 0);

  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: 0.1 }}
      className="rounded-xl border border-slate-200 bg-white shadow-sm"
    >
      <header className="flex items-start justify-between gap-2 border-b border-slate-200/80 px-3 py-2.5">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-50 ring-1 ring-sky-100">
            <ShieldCheck size={13} className="text-sky-600" />
          </span>
          <div>
            <h3 className="text-[12.5px] font-bold uppercase tracking-wide text-slate-800">
              Klaim Hari Ini
            </h3>
            <p className="mt-0.5 text-[10.5px] text-slate-500">
              Aktivitas approval lintas penjamin
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[9.5px] uppercase tracking-widest text-slate-400">Disetujui</p>
          <p className="font-mono text-[11.5px] font-bold tabular-nums text-emerald-700">
            {fmtRupiahShort(approvedTotal)}
          </p>
        </div>
      </header>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center gap-1 py-8 text-center">
          <Inbox size={20} className="text-slate-300" />
          <p className="text-[11px] font-semibold text-slate-500">Belum ada aktivitas</p>
          <p className="text-[10px] text-slate-400">Klaim baru muncul setelah submit</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {entries.map((e) => {
            const kindCfg = KLAIM_KIND_CFG[e.kind];
            const kindPalette = TONE_PALETTE[kindCfg.tone];
            const tipeCfg = PENJAMIN_TIPE_CFG[e.penjaminTipe];
            const tipePalette = TONE_PALETTE[tipeCfg.tone];

            return (
              <li key={e.id} className="px-3 py-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          "rounded-md px-1.5 py-0.5 text-[9.5px] font-semibold ring-1",
                          kindPalette.badgeBg,
                          kindPalette.badgeText,
                          kindPalette.ring,
                        )}
                      >
                        {kindCfg.label}
                      </span>
                      <span
                        className={cn(
                          "rounded-md px-1.5 py-0.5 text-[9.5px] font-semibold ring-1",
                          tipePalette.badgeBg,
                          tipePalette.badgeText,
                          tipePalette.ring,
                        )}
                      >
                        {tipeCfg.label}
                      </span>
                      <span className="ml-auto text-[10px] text-slate-400">{fmtAgo(e.agoSec)}</span>
                    </div>
                    <p className="mt-1 truncate text-[12px] font-semibold text-slate-800">
                      {e.pasienNama}
                    </p>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <span className="font-mono text-[9.5px] text-slate-400">{e.invoiceNo}</span>
                      <span className="text-[10px] text-slate-300">·</span>
                      <span className="truncate text-[10px] text-slate-500">{e.penjamin}</span>
                    </div>
                    <p className="mt-0.5 text-[9.5px] italic text-slate-400">
                      <span className="not-italic">{kindCfg.verb}</span> oleh {e.actor}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-mono text-[12px] font-bold tabular-nums text-slate-800">
                      {fmtRupiahShort(e.nominal)}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <footer className="border-t border-slate-100 px-3 py-2">
        <Link
          href="/ehis-eklaim"
          className="flex items-center justify-between text-[10.5px] font-semibold text-sky-600 transition hover:text-sky-700"
        >
          <span>Buka modul E-Klaim</span>
          <span className="flex items-center gap-1">
            <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-slate-500">
              Soon
            </span>
            <ChevronRight size={12} />
          </span>
        </Link>
      </footer>
    </motion.section>
  );
}
