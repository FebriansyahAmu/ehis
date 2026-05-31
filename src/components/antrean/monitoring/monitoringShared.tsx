"use client";

// ANT5 — Helper Monitoring: badge status kirim outbox + formatter waktu/durasi.

import { CheckCircle2, AlertTriangle, Clock3 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { KirimStatus } from "@/lib/antrean/types";

export const KIRIM_META: Record<KirimStatus, { label: string; badge: string; icon: typeof CheckCircle2 }> = {
  terkirim: { label: "Terkirim", badge: "bg-emerald-50 text-emerald-700", icon: CheckCircle2 },
  gagal: { label: "Gagal", badge: "bg-rose-50 text-rose-700", icon: AlertTriangle },
  pending: { label: "Pending", badge: "bg-amber-50 text-amber-700", icon: Clock3 },
};

export function KirimBadge({ status }: { status: KirimStatus }) {
  const m = KIRIM_META[status];
  const Icon = m.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 m-mini font-semibold", m.badge)}>
      <Icon className="h-3 w-3" /> {m.label}
    </span>
  );
}

export function fmtClock(ms: number): string {
  return new Date(ms).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

/** Durasi ms → "1j 12m" / "8m" / "45d". */
export function fmtDur(ms: number): string {
  if (ms <= 0) return "0d";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}d`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}j ${m % 60}m`;
}

/** datetime-local string (local time) dari timestamp ms. */
export function toLocalInput(ms: number): string {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
