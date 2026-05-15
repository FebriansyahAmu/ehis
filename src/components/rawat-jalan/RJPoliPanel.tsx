"use client";

import { motion } from "framer-motion";
import type { RJPatient, RJPoli } from "@/lib/data";
import { cn } from "@/lib/utils";
import { POLI_CFG } from "./rjShared";

// ── Types ─────────────────────────────────────────────────

interface PoliStat {
  poli:     RJPoli;
  label:    string;
  dokter:   string;
  menunggu: number;
  aktif:    number;
  selesai:  number;
  total:    number;
}

// ── Helpers ───────────────────────────────────────────────

function buildPoliStats(patients: RJPatient[]): PoliStat[] {
  const map = new Map<RJPoli, PoliStat>();

  for (const p of patients) {
    if (!map.has(p.poli)) {
      map.set(p.poli, {
        poli: p.poli, label: POLI_CFG[p.poli].label, dokter: p.dokter,
        menunggu: 0, aktif: 0, selesai: 0, total: 0,
      });
    }
    const s = map.get(p.poli)!;
    s.total++;
    if (p.status === "Menunggu_Skrining" || p.status === "Menunggu_Dokter") s.menunggu++;
    else if (p.status === "Skrining"     || p.status === "Sedang_Diperiksa") s.aktif++;
    else if (p.status === "Selesai") s.selesai++;
  }

  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

// ── PoliCard ──────────────────────────────────────────────

function PoliCard({
  stat, isSelected, onClick, delay,
}: { stat: PoliStat; isSelected: boolean; onClick: () => void; delay: number }) {
  const cfg = POLI_CFG[stat.poli];
  const pct = stat.total > 0 ? (stat.selesai / stat.total) * 100 : 0;

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.18, ease: "easeOut" }}
      onClick={onClick}
      className={cn(
        "flex w-48 shrink-0 flex-col rounded-xl border p-3 text-left transition-all duration-150",
        isSelected
          ? "border-indigo-300 bg-indigo-50 shadow-sm ring-1 ring-indigo-200"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
      )}
    >
      {/* Poli + total */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className={cn("rounded-lg px-1.5 py-0.5 text-[9px] font-bold", cfg.badge)}>
          {cfg.label}
        </span>
        <span className="text-xs font-black text-slate-600">{stat.total}</span>
      </div>

      {/* Dokter */}
      <p className="mb-2.5 truncate text-[10px] text-slate-400">{stat.dokter}</p>

      {/* Pipeline dots */}
      <div className="mb-2 flex items-center gap-2.5 text-[10px]">
        {stat.menunggu > 0 && (
          <span className="flex items-center gap-1 text-amber-600 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            {stat.menunggu} tunggu
          </span>
        )}
        {stat.aktif > 0 && (
          <span className="flex items-center gap-1 text-indigo-600 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
            {stat.aktif} aktif
          </span>
        )}
        {stat.selesai > 0 && (
          <span className="flex items-center gap-1 text-emerald-600 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {stat.selesai}
          </span>
        )}
      </div>

      {/* Progress bar — % selesai */}
      <div className="h-1 w-full overflow-hidden rounded-full bg-slate-100">
        <motion.div
          className="h-full rounded-full bg-emerald-500"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ delay: delay + 0.1, duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </motion.button>
  );
}

// ── Main ──────────────────────────────────────────────────

interface Props {
  patients: RJPatient[];
  selected: RJPoli | "Semua";
  onSelect: (poli: RJPoli | "Semua") => void;
}

export default function RJPoliPanel({ patients, selected, onSelect }: Props) {
  const stats = buildPoliStats(patients);

  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between">
        <p className="text-sm font-bold text-slate-700">Panel Poliklinik</p>
        <p className="text-[11px] text-slate-400">{stats.length} poli aktif hari ini</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1.5">
        {/* Semua */}
        <button
          onClick={() => onSelect("Semua")}
          className={cn(
            "flex h-full shrink-0 flex-col justify-center rounded-xl border px-4 py-3 text-left transition-all duration-150",
            selected === "Semua"
              ? "border-indigo-300 bg-indigo-600 text-white shadow-sm"
              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50",
          )}
        >
          <p className="text-xs font-bold">Semua Poli</p>
          <p className={cn(
            "text-[10px]",
            selected === "Semua" ? "text-indigo-200" : "text-slate-400",
          )}>
            {patients.length} pasien
          </p>
        </button>

        {/* Per poli */}
        {stats.map((s, i) => (
          <PoliCard
            key={s.poli}
            stat={s}
            isSelected={selected === s.poli}
            onClick={() => onSelect(selected === s.poli ? "Semua" : s.poli)}
            delay={i * 0.05}
          />
        ))}
      </div>
    </div>
  );
}
