"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, CheckCircle2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { SBAR_DEF, SHIFT_CONFIG, type HandoverEntry, type SBARItem } from "./handoverShared";

// ── TTV quick row ─────────────────────────────────────────

function TTVRow({ ttv }: { ttv: HandoverEntry["ttvTerakhir"] }) {
  const items = [
    { label: "TD",   val: `${ttv.td} mmHg` },
    { label: "Nadi", val: `${ttv.nadi} ×/mnt` },
    { label: "Suhu", val: `${ttv.suhu} °C` },
    { label: "SpO₂", val: `${ttv.spo2}%` },
    { label: "NRS",  val: String(ttv.nrs) },
  ];
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map(({ label, val }) => (
        <div key={label} className="flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1">
          <span className="text-[10px] font-bold text-slate-400">{label}</span>
          <span className="text-[11px] font-semibold text-slate-700">{val}</span>
        </div>
      ))}
    </div>
  );
}

// ── SBAR section (expanded) ───────────────────────────────

function SBARSection({ item, entry }: { item: SBARItem; entry: HandoverEntry }) {
  const rows: { label: string; val: string }[] =
    item.key === "S"
      ? [
          { label: "Kondisi Umum",   val: entry.kondisiUmum },
          { label: "Keluhan Aktif",  val: entry.keluhanAktif },
        ]
      : item.key === "B"
      ? [
          { label: "Tindakan Shift", val: entry.tindakanShift },
          { label: "Obat Diberikan", val: entry.obatDiberikan },
        ]
      : item.key === "A"
      ? [
          { label: "Masalah Aktif",       val: entry.masalahAktif },
          { label: "Perubahan Kondisi",   val: entry.perubahanKondisi },
        ]
      : [
          { label: "Instruksi Pending",   val: entry.instruksiPending },
          { label: "Hal yang Dipantau",   val: entry.halDipantau },
          { label: "Tindakan Pending",    val: entry.tindakanPending },
        ];

  return (
    <div className={cn("rounded-xl border p-3", item.border, item.bg)}>
      {/* Section header */}
      <div className="mb-3 flex items-center gap-2">
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

      {/* TTV strip inside Background section */}
      {item.key === "B" && (
        <div className="mb-3">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            TTV Terakhir
          </p>
          <TTVRow ttv={entry.ttvTerakhir} />
        </div>
      )}

      {/* Content rows */}
      <div className="flex flex-col gap-2.5">
        {rows.map(({ label, val }) => (
          <div key={label}>
            <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              {label}
            </p>
            <p className="text-[12px] leading-relaxed text-slate-700">{val}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── HandoverCard ──────────────────────────────────────────

interface Props {
  entry: HandoverEntry;
}

export default function HandoverCard({ entry }: Props) {
  const [open, setOpen] = useState(false);
  const cfg = SHIFT_CONFIG[entry.shift];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      {/* Collapsed header — always visible */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition hover:bg-slate-50 active:bg-slate-100"
      >
        <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-500" />

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
              <ArrowRight size={11} className="text-slate-400" />
              <span className="font-medium text-slate-600">{entry.perawatMasuk}</span>
            </span>
          </div>

          {/* Kondisi snippet */}
          <p className="truncate text-[12px] text-slate-400">{entry.kondisiUmum}</p>

          {/* TTV strip (always visible) */}
          <div className="mt-2">
            <TTVRow ttv={entry.ttvTerakhir} />
          </div>
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
