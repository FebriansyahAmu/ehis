"use client";

/**
 * Activity feed Recent Edits di sidebar Beranda Master.
 *
 * Sumber data: mock `RECENT_EDITS_MOCK` (akan diganti dengan audit log saat backend ready).
 *
 * Setiap baris menampilkan:
 *   - action chip (Tambah/Edit/Hapus) dengan warna semantik
 *   - entity master + record label
 *   - user inisial avatar + waktu relatif
 *   - klik → deep-link ke route master terkait
 */

import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, Plus, Pencil, Trash2, History } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  RECENT_EDITS_MOCK, ACTION_CFG, fmtAgo,
  type RecentEditEntry, type EditAction,
} from "./berandaShared";

const ACTION_ICON: Record<EditAction, typeof Plus> = {
  Tambah: Plus,
  Edit: Pencil,
  Hapus: Trash2,
};

function initials(s: string): string {
  const clean = s.replace(/^dr\.?\s+/i, "").trim();
  const parts = clean.split(/[\s.-]+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function RecentEditsPanel() {
  return (
    <motion.section
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
    >
      <header className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50 text-violet-600 ring-1 ring-violet-100">
            <History size={13} />
          </span>
          <div>
            <h3 className="text-[12.5px] font-bold uppercase tracking-wide text-slate-800">
              Aktivitas Terakhir
            </h3>
            <p className="text-[10.5px] text-slate-500">
              {RECENT_EDITS_MOCK.length} perubahan terbaru
            </p>
          </div>
        </div>
        <Clock size={13} className="text-slate-400" />
      </header>

      <ol className="relative flex flex-col">
        {/* timeline rail */}
        <span aria-hidden className="absolute bottom-3 left-[15px] top-3 w-px bg-slate-100" />

        {RECENT_EDITS_MOCK.map((e, i) => (
          <EditRow key={e.id} entry={e} delay={i * 0.03} isLast={i === RECENT_EDITS_MOCK.length - 1} />
        ))}
      </ol>

      <p className="mt-3 border-t border-slate-100 pt-2 text-center text-[10px] italic text-slate-400">
        Audit trail otomatis tersimpan tiap perubahan master.
      </p>
    </motion.section>
  );
}

function EditRow({ entry, delay }: { entry: RecentEditEntry; delay: number; isLast: boolean }) {
  const cfg = ACTION_CFG[entry.action];
  const Icon = ACTION_ICON[entry.action];

  const inner = (
    <motion.div
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: 0.1 + delay }}
      className="group relative flex items-start gap-2.5 rounded-lg p-1.5 transition hover:bg-slate-50"
    >
      {/* action dot */}
      <span
        className={cn(
          "relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ring-2 ring-white",
          cfg.chip.split(" ").slice(0, 1).join(" "),
        )}
      >
        <Icon size={11} className={cfg.iconCls} />
      </span>

      <div className="min-w-0 flex-1">
        <p className="flex items-baseline gap-1.5 text-[11px] leading-tight">
          <span className={cn(
            "rounded px-1 py-px font-mono text-[9.5px] font-bold uppercase ring-1",
            cfg.chip,
          )}>
            {entry.action}
          </span>
          <span className="truncate text-slate-500">{entry.entity}</span>
        </p>
        <p className="mt-0.5 truncate text-[11.5px] font-semibold text-slate-800 group-hover:text-slate-900">
          {entry.recordLabel}
        </p>
        <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-slate-400">
          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-slate-100 font-mono text-[8.5px] font-bold text-slate-600">
            {initials(entry.by)}
          </span>
          <span>{entry.by}</span>
          <span>·</span>
          <span className="font-mono tabular-nums">{fmtAgo(entry.agoSec)}</span>
        </div>
      </div>
    </motion.div>
  );

  return (
    <li className="relative">
      {entry.href ? (
        <Link
          href={entry.href}
          className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 rounded-lg"
        >
          {inner}
        </Link>
      ) : (
        inner
      )}
    </li>
  );
}
