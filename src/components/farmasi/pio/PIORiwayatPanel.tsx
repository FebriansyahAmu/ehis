"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Clock, CheckCircle2, AlertCircle,
  User, BookMarked, Plus, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getPIOLogsForRM,
  KATEGORI_CFG, STATUS_PIO_CFG, URGENSI_CFG, SUMBER_CFG,
  type LogPIO,
} from "./pioShared";

// ── Stats ─────────────────────────────────────────────────

function StatsStrip({ logs }: { logs: LogPIO[] }) {
  const terjawab = logs.filter((l) => l.status === "Terjawab").length;
  const pending  = logs.filter((l) => l.status === "Pending").length;
  const withTime = logs.filter((l) => l.waktuResponsMenit);
  const avgMenit = withTime.length
    ? Math.round(withTime.reduce((s, l) => s + (l.waktuResponsMenit ?? 0), 0) / withTime.length)
    : null;

  return (
    <div className="grid grid-cols-4 gap-2">
      {[
        { label: "Pertanyaan", val: `${logs.length}`,                       cls: "text-slate-800"   },
        { label: "Terjawab",   val: `${terjawab}`,                          cls: "text-emerald-700" },
        { label: "Menunggu",   val: `${pending}`,                           cls: pending > 0 ? "text-amber-600" : "text-slate-400" },
        { label: "Rata Respons",val: avgMenit ? `${avgMenit} mnt` : "—",   cls: "text-sky-700"     },
      ].map(({ label, val, cls }) => (
        <div key={label} className="rounded-xl border border-slate-200 bg-white p-3 text-center">
          <p className={cn("text-lg font-bold tabular-nums leading-none", cls)}>{val}</p>
          <p className="mt-1 text-[10px] text-slate-400">{label}</p>
        </div>
      ))}
    </div>
  );
}

// ── Request card (left panel) ─────────────────────────────

function RequestCard({
  entry, active, onClick,
}: {
  entry: LogPIO; active: boolean; onClick: () => void;
}) {
  const kCfg = KATEGORI_CFG[entry.kategori];
  const sCfg = STATUS_PIO_CFG[entry.status];

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full rounded-xl border p-3 text-left transition-all",
        active
          ? "border-sky-300 bg-sky-50 ring-1 ring-sky-200"
          : "border-slate-200 bg-white hover:bg-slate-50",
      )}
    >
      <div className="flex items-start gap-2.5">
        <span className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", kCfg.dot)} />
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            {entry.urgensi === "Urgent" && (
              <span className={cn("rounded-md px-1.5 py-0.5 text-[9px] font-bold", URGENSI_CFG.Urgent.badge)}>
                URGENT
              </span>
            )}
            <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-semibold", kCfg.badge)}>
              {entry.kategori}
            </span>
            <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-semibold", sCfg.badge)}>
              {entry.status}
            </span>
          </div>
          <p className="line-clamp-2 text-xs font-medium leading-relaxed text-slate-700">
            {entry.pertanyaan}
          </p>
          <p className="mt-1.5 text-[10px] text-slate-400">
            {entry.jam} · {entry.tanggal}
          </p>
        </div>
        <ChevronRight size={12} className={cn("mt-1 shrink-0", active ? "text-sky-500" : "text-slate-300")} />
      </div>
    </button>
  );
}

// ── Detail view (right panel) ─────────────────────────────

function DetailView({ entry }: { entry: LogPIO }) {
  const kCfg = KATEGORI_CFG[entry.kategori];
  const sCfg = STATUS_PIO_CFG[entry.status];

  return (
    <motion.div
      key={entry.id}
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -6 }}
      transition={{ duration: 0.15 }}
      className="space-y-4"
    >
      {/* Badges + tanggal */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-bold", kCfg.badge)}>{entry.kategori}</span>
        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", sCfg.badge)}>{entry.status}</span>
        {entry.urgensi === "Urgent" && (
          <span className={cn("rounded-md px-1.5 py-0.5 text-[9px] font-bold", URGENSI_CFG.Urgent.badge)}>URGENT</span>
        )}
        <div className="ml-auto flex items-center gap-1.5 text-[11px] text-slate-400">
          <span>{entry.tanggal} · {entry.jam}</span>
          {entry.waktuResponsMenit && (
            <>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Clock size={10} />
                {entry.waktuResponsMenit} mnt
              </span>
            </>
          )}
        </div>
      </div>

      {/* Penanya */}
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
        <User size={13} className="shrink-0 text-slate-400" />
        <div>
          <p className="text-xs font-semibold text-slate-700">{entry.namaPenanya}</p>
          <p className="text-[10px] text-slate-400">
            {entry.sumber}{entry.unitAsal ? ` · ${entry.unitAsal}` : ""}
          </p>
        </div>
        <span className={cn("ml-auto rounded-md px-2 py-0.5 text-[10px] font-semibold", SUMBER_CFG[entry.sumber])}>
          {entry.sumber}
        </span>
      </div>

      {/* Pertanyaan */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Pertanyaan</p>
        <p className="text-sm leading-relaxed text-slate-700">{entry.pertanyaan}</p>
      </div>

      {/* Jawaban — Terjawab */}
      {entry.status === "Terjawab" && entry.jawaban && (
        <>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <CheckCircle2 size={13} className="text-emerald-600" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">Jawaban Apoteker</p>
              <span className="ml-auto text-[10px] font-medium text-emerald-600">{entry.apoteker}</span>
            </div>
            <p className="text-sm leading-relaxed text-emerald-800">{entry.jawaban}</p>
          </div>

          {entry.referensi && entry.referensi.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="mb-2 flex items-center gap-2">
                <BookMarked size={12} className="text-slate-400" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Referensi</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {entry.referensi.map((r) => (
                  <span key={r} className="rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">
                    {r}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Jawaban — Pending */}
      {entry.status === "Pending" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100">
              <motion.div
                animate={{ scale: [1, 1.25, 1] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              >
                <AlertCircle size={17} className="text-amber-500" />
              </motion.div>
            </div>
            <div>
              <p className="text-xs font-semibold text-amber-800">Menunggu jawaban apoteker</p>
              <p className="mt-0.5 text-[10px] text-amber-600">
                {entry.urgensi === "Urgent" ? "Target respons ≤ 15 menit" : "Target respons ≤ 60 menit"}
              </p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ── Main ──────────────────────────────────────────────────

interface Props {
  noRM:          string;
  onNewRequest:  () => void;
}

export default function PIORiwayatPanel({ noRM, onNewRequest }: Props) {
  const [logs]     = useState(() => getPIOLogsForRM(noRM));
  const [selected, setSelected] = useState<LogPIO | null>(logs[0] ?? null);

  // Empty state
  if (logs.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-slate-300 py-16"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50">
          <BookOpen size={24} className="text-sky-400" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-700">Belum ada pertanyaan informasi obat</p>
          <p className="mt-1 text-xs text-slate-400">
            Kirim pertanyaan ke apoteker untuk mendapat informasi berbasis evidens
          </p>
        </div>
        <button
          onClick={onNewRequest}
          className="flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-700"
        >
          <Plus size={14} />
          Minta Informasi Obat
        </button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">

      <StatsStrip logs={logs} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_340px]">

        {/* Left — list */}
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {logs.map((entry, i) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <RequestCard
                  entry={entry}
                  active={selected?.id === entry.id}
                  onClick={() => setSelected(entry)}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          <button
            onClick={onNewRequest}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-sky-300 py-2.5 text-xs font-semibold text-sky-600 transition-colors hover:bg-sky-50"
          >
            <Plus size={12} />
            Minta Informasi Baru
          </button>
        </div>

        {/* Right — detail */}
        <aside className="sticky top-0 self-start">
          <AnimatePresence mode="wait">
            {selected ? (
              <DetailView key={selected.id} entry={selected} />
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 py-16 text-center"
              >
                <BookOpen size={20} className="text-slate-300" />
                <p className="text-xs text-slate-400">Pilih pertanyaan untuk melihat jawaban</p>
              </motion.div>
            )}
          </AnimatePresence>
        </aside>
      </div>
    </div>
  );
}
