"use client";

import { motion } from "framer-motion";
import {
  Stethoscope, Clock, PhoneCall, BellRing, FlaskConical,
  PackageCheck, Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  FARMASI_QUEUE_CFG,
  type FarmasiQueueEntry,
} from "@/lib/farmasi/farmasiQueueStore";

interface Props {
  entry: FarmasiQueueEntry;
  index: number;
  onPanggil: (e: FarmasiQueueEntry) => void;
  onPanggilUlang: (e: FarmasiQueueEntry) => void;
  onMulai: (e: FarmasiQueueEntry) => void;
  onSerah: (e: FarmasiQueueEntry) => void;
}

function fmtClock(ms?: number): string {
  if (!ms) return "—";
  return new Date(ms).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

export default function FarmasiQueueCard({
  entry: e, index, onPanggil, onPanggilUlang, onMulai, onSerah,
}: Props) {
  const qc = FARMASI_QUEUE_CFG[e.status];
  const dimmed = e.status === "Selesai";

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.2, ease: "easeOut" }}
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border border-l-4 border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md",
        qc.border,
        dimmed && "opacity-75",
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3 p-4 pb-2.5">
        <div className="flex h-10 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-slate-100">
          <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Antri</span>
          <span className="text-base font-black leading-none text-slate-700">{e.nomorAntrean}</span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-slate-900">{e.nama}</p>
          <p className="text-[10px] text-slate-400">
            <span className="font-mono">{e.noRM ?? "—"}</span>
            <span className="mx-1 text-slate-300">·</span>
            <span>{e.caraBayar}</span>
          </p>
        </div>

        <span className={cn("flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-bold", qc.badge)}>
          <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", qc.dot, e.status === "Dipanggil" && "animate-pulse")} />
          {qc.label}
        </span>
      </div>

      {/* Poli + recall */}
      <div className="flex flex-wrap items-center gap-1.5 px-4 pb-2.5">
        <span className="rounded-lg bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700">{e.poli}</span>
        {e.recalls > 0 && (
          <span className="inline-flex items-center gap-1 rounded-lg bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
            <BellRing size={10} /> {e.recalls + 1}×
          </span>
        )}
      </div>

      {/* Dokter + waktu selesai poli */}
      <div className="flex items-center gap-3 px-4 pb-2.5">
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <Stethoscope size={11} className="shrink-0 text-slate-400" />
          <p className="truncate text-[10px] text-slate-500">{e.dokter}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1 text-[10px] text-slate-400">
          <Clock size={10} />
          <span>selesai poli {fmtClock(e.t5At)}</span>
        </div>
      </div>

      {/* Action row */}
      <div className="flex items-center gap-1.5 border-t border-slate-100 bg-slate-50/60 px-3 py-2.5">
        {e.status === "Menunggu_Farmasi" && (
          <>
            <Btn icon={PhoneCall} label="Panggil" tone="sky" onClick={() => onPanggil(e)} />
            <Btn icon={FlaskConical} label="Mulai Siapkan" tone="ghost-sky" onClick={() => onMulai(e)} />
          </>
        )}
        {e.status === "Dipanggil" && (
          <>
            <Btn icon={FlaskConical} label="Mulai Siapkan" tone="sky" onClick={() => onMulai(e)} />
            <Btn icon={BellRing} label="Ulang" tone="ghost-amber" onClick={() => onPanggilUlang(e)} />
          </>
        )}
        {e.status === "Disiapkan" && (
          <Btn icon={PackageCheck} label="Serahkan Obat" tone="emerald" onClick={() => onSerah(e)} />
        )}
        {e.status === "Selesai" && (
          <span className="ml-auto inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">
            <Lock size={10} /> Diserahkan {fmtClock(e.t7At)}
          </span>
        )}
      </div>
    </motion.article>
  );
}

// ── Buttons ───────────────────────────────────────────────

const TONE: Record<string, string> = {
  sky: "bg-sky-600 text-white hover:bg-sky-700",
  emerald: "bg-emerald-600 text-white hover:bg-emerald-700",
  "ghost-sky": "bg-white text-sky-700 ring-1 ring-sky-200 hover:bg-sky-50",
  "ghost-amber": "bg-white text-amber-700 ring-1 ring-amber-200 hover:bg-amber-50",
};

function Btn({
  icon: Icon, label, tone, onClick,
}: {
  icon: typeof PhoneCall;
  label: string;
  tone: keyof typeof TONE;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition active:scale-95",
        TONE[tone],
      )}
    >
      <Icon size={13} />
      {label}
    </button>
  );
}
