"use client";

import { motion } from "framer-motion";
import {
  ArrowRight, BedDouble, Stethoscope, Activity,
  AlarmClock, AlertTriangle, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PasienAdmisi, AdmisiUrgensi, AdmisiKategori } from "@/lib/billing/depositMock";

interface Props {
  pasien: PasienAdmisi;
  selected: boolean;
  onSelect: () => void;
  delay?: number;
}

const KATEGORI_ICON: Record<AdmisiKategori, typeof BedDouble> = {
  "RI Baru":      BedDouble,
  "Pre-Op Major": Stethoscope,
  "ICU Admisi":   Activity,
};

const URGENSI_CFG: Record<AdmisiUrgensi, { label: string; bg: string; text: string; ring: string; icon: typeof Clock }> = {
  Rutin:     { label: "Rutin",     bg: "bg-slate-100",  text: "text-slate-600",  ring: "ring-slate-200",  icon: Clock },
  Cito:      { label: "Cito",      bg: "bg-amber-100",  text: "text-amber-700",  ring: "ring-amber-200",  icon: AlarmClock },
  Emergency: { label: "Emergency", bg: "bg-rose-100",   text: "text-rose-700",   ring: "ring-rose-300",   icon: AlertTriangle },
};

export default function AdmisiResultRow({
  pasien, selected, onSelect, delay = 0,
}: Props) {
  const KategoriIcon = KATEGORI_ICON[pasien.kategori];
  const urgensiCfg = URGENSI_CFG[pasien.urgensi];
  const UrgensiIcon = urgensiCfg.icon;
  const rencana = formatRencana(pasien.rencanaAdmisi);

  return (
    <motion.button
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay }}
      type="button"
      onClick={onSelect}
      className={cn(
        "group grid w-full grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border bg-white px-3 py-2.5 text-left transition-all",
        selected
          ? "border-amber-400 bg-amber-50/40 ring-2 ring-amber-200 shadow-sm dark:border-amber-700 dark:bg-amber-950/15 dark:ring-amber-900/60"
          : "border-slate-200 hover:border-amber-300 hover:bg-amber-50/30 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-amber-800 dark:hover:bg-amber-950/10",
      )}
    >
      {/* Kategori icon */}
      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-100 text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700">
        <KategoriIcon size={16} />
      </span>

      {/* Main */}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="truncate text-[13px] font-bold text-slate-800 dark:text-slate-100">
            {pasien.pasien.nama}
          </span>
          <span className="font-mono text-[10.5px] text-slate-500">
            {pasien.pasien.noRM}
          </span>
          <span className="text-[10px] text-slate-400">
            {pasien.pasien.gender} · {pasien.pasien.age}t
          </span>
          <span className={cn(
            "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0 text-[9.5px] font-semibold ring-1",
            urgensiCfg.bg, urgensiCfg.text, urgensiCfg.ring,
          )}>
            <UrgensiIcon size={9} />
            {urgensiCfg.label}
          </span>
        </div>
        <p className="mt-0.5 truncate text-[11.5px] text-slate-700 dark:text-slate-300">
          {pasien.diagnosaSementara ?? pasien.kategori}
          {pasien.rencanaTindakan && (
            <span className="text-slate-500"> · {pasien.rencanaTindakan}</span>
          )}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-slate-500">
          <span className="font-mono">{pasien.noKunjungan}</span>
          <span>· {pasien.kelas} · {pasien.penjamin.nama}</span>
          <span>· {pasien.dpjp}</span>
        </div>
      </div>

      {/* Right: rencana admisi + CTA */}
      <div className="flex items-center gap-2">
        <div className="text-right">
          <p className="text-[9.5px] uppercase tracking-wider text-slate-500">Rencana</p>
          <p className={cn(
            "font-mono text-[11px] tabular-nums leading-tight",
            rencana.isUrgent ? "font-semibold text-rose-700 dark:text-rose-300" : "text-slate-700 dark:text-slate-200",
          )}>
            {rencana.label}
          </p>
        </div>
        <span className={cn(
          "flex h-9 w-9 flex-none items-center justify-center rounded-md transition-all",
          selected
            ? "bg-amber-600 text-white"
            : "bg-slate-100 text-slate-500 group-hover:bg-amber-600 group-hover:text-white dark:bg-slate-800 dark:text-slate-400",
        )}>
          <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </motion.button>
  );
}

// ── Format helpers ─────────────────────────────────────

function formatRencana(iso: string): { label: string; isUrgent: boolean } {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { label: iso, isUrgent: false };
  const now = new Date();
  const diffH = Math.floor((d.getTime() - now.getTime()) / 3_600_000);
  const todayStr = now.toISOString().slice(0, 10);
  const dStr = d.toISOString().slice(0, 10);
  const hhmm = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  const isUrgent = diffH >= 0 && diffH <= 6;  // <6h dari sekarang = urgent
  if (dStr === todayStr) return { label: `Hari ini · ${hhmm}`, isUrgent };
  return {
    label: `${d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" })} · ${hhmm}`,
    isUrgent: false,
  };
}
