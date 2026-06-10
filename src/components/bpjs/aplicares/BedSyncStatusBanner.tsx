"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle, XCircle, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────

export interface BedSyncStatusBannerProps {
  lastSyncISO: string | null;
  onForceRefresh?: () => void;
  isRefreshing?: boolean;
}

type SyncLevel = "fresh" | "stale" | "expired" | "unknown";

// ── Helpers ────────────────────────────────────────────

function getSyncLevel(ageMinutes: number | null): SyncLevel {
  if (ageMinutes === null) return "unknown";
  if (ageMinutes <= 5)  return "fresh";
  if (ageMinutes <= 15) return "stale";
  return "expired";
}

function fmtAge(ageMinutes: number | null): string {
  if (ageMinutes === null) return "";
  if (ageMinutes < 1)  return "< 1 menit lalu";
  if (ageMinutes < 60) return `${ageMinutes} menit lalu`;
  const h = Math.floor(ageMinutes / 60);
  return `${h} jam ${ageMinutes % 60} menit lalu`;
}

// ── Level config ───────────────────────────────────────

const LEVEL_CFG = {
  fresh: {
    bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700",
    icon: CheckCircle2,
    label: "Tersinkronisasi",
    sub:   "Data bed terkini — synced dalam 5 menit terakhir",
  },
  stale: {
    bg: "bg-amber-50",   border: "border-amber-200",   text: "text-amber-700",
    icon: AlertCircle,
    label: "Perlu Refresh",
    sub:   "Sync terakhir > 5 menit — data mungkin sudah berubah",
  },
  expired: {
    bg: "bg-rose-50",    border: "border-rose-200",    text: "text-rose-700",
    icon: XCircle,
    label: "Data Kadaluarsa",
    sub:   "Sync terakhir > 15 menit — segera refresh untuk keakuratan",
  },
  unknown: {
    bg: "bg-slate-50",   border: "border-slate-200",   text: "text-slate-500",
    icon: AlertCircle,
    label: "Belum Tersinkron",
    sub:   "Belum ada data sync Aplicares — klik Force Refresh",
  },
} satisfies Record<SyncLevel, {
  bg: string; border: string; text: string;
  icon: IconComponent; label: string; sub: string;
}>;

// ── Component ──────────────────────────────────────────

export default function BedSyncStatusBanner({
  lastSyncISO, onForceRefresh, isRefreshing = false,
}: BedSyncStatusBannerProps) {
  const [tick, setTick] = useState(0);

  // Re-render every 30 s so age text stays accurate
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  // suppress unused-variable lint — tick forces re-render
  void tick;

  const ageMinutes = lastSyncISO
    ? Math.floor((Date.now() - new Date(lastSyncISO).getTime()) / 60_000)
    : null;

  const level = getSyncLevel(ageMinutes);
  const cfg   = LEVEL_CFG[level];
  const Icon  = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        "flex items-center gap-3 rounded-2xl border px-4 py-3",
        cfg.bg, cfg.border,
      )}
    >
      <Icon size={16} className={cn("shrink-0", cfg.text)} />

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("text-[11px] font-bold", cfg.text)}>{cfg.label}</span>
          {lastSyncISO && (
            <span className="font-mono text-[10px] text-slate-400">
              {new Date(lastSyncISO).toLocaleString("id-ID", {
                day: "2-digit", month: "short", year: "numeric",
                hour: "2-digit", minute: "2-digit",
              })}
              {" · "}
              {fmtAge(ageMinutes)}
            </span>
          )}
        </div>
        <p className="text-[10px] text-slate-500">{cfg.sub}</p>
      </div>

      {onForceRefresh && (
        <button
          onClick={onForceRefresh}
          disabled={isRefreshing}
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white",
            "px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition",
            "hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          <RotateCw size={11} className={isRefreshing ? "animate-spin" : ""} />
          {isRefreshing ? "Refreshing…" : "Force Refresh"}
        </button>
      )}
    </motion.div>
  );
}
