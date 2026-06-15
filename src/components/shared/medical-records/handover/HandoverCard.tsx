"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, CheckCircle2, ArrowRight, Clock, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { SBAR_DEF, SHIFT_CONFIG, type HandoverEntry, type SBARItem } from "./handoverShared";

// ── SBAR section (expanded) ───────────────────────────────

function SBARSection({ item, entry }: { item: SBARItem; entry: HandoverEntry }) {
  const content =
    item.key === "S"
      ? entry.situation
      : item.key === "B"
        ? entry.background
        : item.key === "A"
          ? entry.assessment
          : entry.recommendation;

  return (
    <div className={cn("rounded-xl border p-3", item.border, item.bg)}>
      {/* Section header */}
      <div className="mb-2.5 flex items-center gap-2">
        <span
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black ring-1",
            item.badge,
            item.ring,
          )}
        >
          {item.key}
        </span>
        <div>
          <p className={cn("text-[11px] font-bold uppercase tracking-wide", item.text)}>
            {item.label}
          </p>
          <p className="text-[10px] text-slate-400">{item.desc}</p>
        </div>
      </div>

      <p className="text-[12px] leading-relaxed text-slate-700">{content}</p>
    </div>
  );
}

// ── HandoverCard ──────────────────────────────────────────

interface Props {
  entry: HandoverEntry;
  /** Terima serah terima → penerima distempel sesi login pemanggil */
  onReceive: (id: string) => void;
}

export default function HandoverCard({ entry, onReceive }: Props) {
  const [open, setOpen] = useState(false);
  const cfg = SHIFT_CONFIG[entry.shift];
  const diterima = entry.perawatMasuk.trim() !== "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "overflow-hidden rounded-2xl border bg-white shadow-sm",
        diterima ? "border-slate-200" : "border-amber-200",
      )}
    >
      {/* Collapsed header — always visible */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition hover:bg-slate-50 active:bg-slate-100"
      >
        {diterima ? (
          <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-500" />
        ) : (
          <Clock size={18} className="mt-0.5 shrink-0 text-amber-500" />
        )}

        <div className="min-w-0 flex-1">
          {/* Shift badge + perawat */}
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1",
                cfg.badge,
                cfg.ring,
              )}
            >
              Shift {entry.shift} · {entry.jamSerahTerima}
            </span>
            <span className="flex items-center gap-1 text-[11px] text-slate-500">
              <span className="font-medium text-slate-600">{entry.perawatKeluar}</span>
              {diterima ? (
                <>
                  <ArrowRight size={11} className="text-slate-400" />
                  <span className="font-medium text-slate-600">{entry.perawatMasuk}</span>
                  {entry.jamTerima && (
                    <span className="text-[10px] text-slate-400">· {entry.jamTerima}</span>
                  )}
                </>
              ) : (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                  Belum diterima
                </span>
              )}
            </span>
          </div>

          {/* Situation snippet */}
          <p className="truncate text-[12px] text-slate-400">{entry.situation}</p>
        </div>

        {/* Chevron toggle */}
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="mt-1 shrink-0"
        >
          <ChevronDown size={16} className="text-slate-400" />
        </motion.div>
      </button>

      {/* Receive bar — hanya saat belum diterima (sibling, bukan nested button) */}
      {!diterima && (
        <div className="flex items-center justify-between gap-3 border-t border-amber-100 bg-amber-50/70 px-4 py-2.5">
          <p className="min-w-0 truncate text-[11px] font-medium text-amber-700">
            Menunggu diterima perawat shift berikutnya
          </p>
          <button
            type="button"
            onClick={() => onReceive(entry.id)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-1.5 text-[11px] font-bold text-white shadow-sm shadow-sky-200 transition hover:bg-sky-700 active:bg-sky-800"
          >
            <Check size={13} />
            Terima
          </button>
        </div>
      )}

      {/* Expanded SBAR detail */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-3 border-t border-slate-100 px-4 pb-4 pt-3">
              {SBAR_DEF.map((item) => (
                <SBARSection key={item.key} item={item} entry={entry} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
