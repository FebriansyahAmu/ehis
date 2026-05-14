"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  STATUS_CFG,
  type PhaseData, type PhaseStatus, type PhaseDef, type PPASection,
} from "./carePlanShared";

// ── Color map per phase ────────────────────────────────────────

const PHASE_COLORS = {
  sky: {
    iconBg:   "bg-sky-100",
    iconText: "text-sky-600",
    label:    "text-sky-800",
    openBg:   "bg-sky-50/60 border-b border-sky-100",
  },
  indigo: {
    iconBg:   "bg-indigo-100",
    iconText: "text-indigo-600",
    label:    "text-indigo-800",
    openBg:   "bg-indigo-50/60 border-b border-indigo-100",
  },
  emerald: {
    iconBg:   "bg-emerald-100",
    iconText: "text-emerald-600",
    label:    "text-emerald-800",
    openBg:   "bg-emerald-50/60 border-b border-emerald-100",
  },
} as const;

// ── PPAPanel ──────────────────────────────────────────────────

function PPAPanel({
  title, data, onChange,
}: {
  title:    string;
  data:     PPASection;
  onChange: (d: PPASection) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{title}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <p className="mb-1 text-[10px] font-medium text-slate-400">Target Outcome</p>
          <textarea
            rows={3}
            value={data.target}
            onChange={(e) => onChange({ ...data, target: e.target.value })}
            placeholder="Target yang ingin dicapai pada fase ini..."
            className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-indigo-400 focus:bg-white"
          />
        </div>
        <div>
          <p className="mb-1 text-[10px] font-medium text-slate-400">Rencana Intervensi</p>
          <textarea
            rows={3}
            value={data.intervensi}
            onChange={(e) => onChange({ ...data, intervensi: e.target.value })}
            placeholder="Rencana tindakan / intervensi yang dilakukan..."
            className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-indigo-400 focus:bg-white"
          />
        </div>
      </div>
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────

interface Props {
  def:      PhaseDef;
  data:     PhaseData;
  onChange: (d: PhaseData) => void;
  isOpen:   boolean;
  onToggle: () => void;
}

// ── PhaseSection ──────────────────────────────────────────────

export default function PhaseSection({ def, data, onChange, isOpen, onToggle }: Props) {
  const c    = PHASE_COLORS[def.color];
  const Icon = def.icon;
  const cfg  = STATUS_CFG[data.status];

  const set = <K extends keyof PhaseData>(k: K, v: PhaseData[K]) =>
    onChange({ ...data, [k]: v });

  return (
    <div>
      {/* ── Accordion header ── */}
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors",
          isOpen ? c.openBg : "hover:bg-slate-50/80",
        )}
      >
        <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", c.iconBg)}>
          <Icon size={14} className={c.iconText} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={cn("text-xs font-semibold", c.label)}>{def.label}</span>

            <motion.span
              key={data.status}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", cfg.cls)}
            >
              {cfg.label}
            </motion.span>

            <AnimatePresence>
              {data.status === "selesai" && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 28 }}
                >
                  <Check size={12} className="text-emerald-500" />
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          <p className="truncate text-[11px] text-slate-400">{def.desc}</p>

          {data.tanggalMulai && (
            <p className="mt-0.5 text-[10px] text-slate-400">
              {data.tanggalMulai}
              {data.tanggalSelesai ? ` → ${data.tanggalSelesai}` : ""}
            </p>
          )}
        </div>

        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.18 }}
          className="shrink-0 text-slate-300"
        >
          <ChevronDown size={14} />
        </motion.div>
      </button>

      {/* ── Animated panel ── */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.04, 0.62, 0.23, 0.98] }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-4 px-4 py-4">

              {/* Date range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Tanggal Mulai</p>
                  <input
                    type="date"
                    value={data.tanggalMulai}
                    onChange={(e) => set("tanggalMulai", e.target.value)}
                    className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-1 focus:ring-indigo-100"
                  />
                </div>
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Tanggal Selesai</p>
                  <input
                    type="date"
                    value={data.tanggalSelesai}
                    onChange={(e) => set("tanggalSelesai", e.target.value)}
                    className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-1 focus:ring-indigo-100"
                  />
                </div>
              </div>

              {/* DPJP */}
              <PPAPanel
                title="DPJP"
                data={data.dpjp}
                onChange={(d) => onChange({ ...data, dpjp: d })}
              />

              <div className="h-px bg-slate-100" />

              {/* Perawat */}
              <PPAPanel
                title="Perawat"
                data={data.perawat}
                onChange={(d) => onChange({ ...data, perawat: d })}
              />

              <div className="h-px bg-slate-100" />

              {/* Evaluasi */}
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Evaluasi & Catatan Bersama</p>
                <textarea
                  rows={2}
                  value={data.evaluasi}
                  onChange={(e) => set("evaluasi", e.target.value)}
                  placeholder="Evaluasi ketercapaian target, hambatan, tindak lanjut..."
                  className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-indigo-400 focus:bg-white"
                />
              </div>

              {/* Footer: status + petugas + Simpan */}
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Status</span>
                  <select
                    value={data.status}
                    onChange={(e) => set("status", e.target.value as PhaseStatus)}
                    className="h-6 rounded border border-slate-200 bg-white px-1.5 text-[11px] text-slate-700 outline-none"
                  >
                    {(["belum", "berjalan", "selesai"] as PhaseStatus[]).map((s) => (
                      <option key={s} value={s}>{STATUS_CFG[s].label}</option>
                    ))}
                  </select>
                </div>

                <input
                  value={data.updatedBy}
                  onChange={(e) => set("updatedBy", e.target.value)}
                  placeholder="Nama petugas..."
                  className="h-6 min-w-[120px] flex-1 rounded border border-slate-200 bg-white px-2 text-[11px] text-slate-700 placeholder:text-slate-400 outline-none focus:border-slate-300"
                />

                <button
                  type="button"
                  onClick={onToggle}
                  className="h-6 rounded bg-indigo-600 px-3 text-[11px] font-semibold text-white transition hover:bg-indigo-700"
                >
                  Simpan
                </button>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
