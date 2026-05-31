"use client";

// ANT7 — Daftar panggilan terakhir (di samping hero).

import { motion, AnimatePresence } from "framer-motion";
import { History, BellRing } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DisplayCall } from "./displayShared";

export function RecentCallsList({ calls }: { calls: DisplayCall[] }) {
  return (
    <aside className="flex h-full flex-col overflow-hidden rounded-[2rem] bg-white/5 ring-1 ring-white/10">
      <div className="flex items-center gap-2.5 border-b border-white/10 px-6 py-4 text-white">
        <History className="h-6 w-6 text-sky-300" />
        <h2 className="text-2xl font-bold">Panggilan Terakhir</h2>
      </div>

      <div className="flex-1 overflow-hidden px-4 py-4">
        {calls.length === 0 ? (
          <p className="px-2 py-8 text-center text-lg text-slate-500">Belum ada panggilan.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            <AnimatePresence initial={false}>
              {calls.map((c) => (
                <motion.li
                  key={c.kodebooking}
                  layout
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-white/10 px-5 py-3.5"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="font-mono text-4xl font-black tabular-nums text-sky-300">{c.nomorAntrean}</span>
                    <div className="min-w-0">
                      <p className="truncate text-lg font-semibold text-white">{c.loket}</p>
                      <p className="truncate text-sm text-slate-400">{c.poli}</p>
                    </div>
                  </div>
                  {c.recalls > 0 && (
                    <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-400/20 px-2.5 py-1 text-sm font-bold text-amber-300")}>
                      <BellRing className="h-3.5 w-3.5" /> {c.recalls + 1}×
                    </span>
                  )}
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </aside>
  );
}
