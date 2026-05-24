/**
 * Kasir Counter (BL3) — shared configs untuk modul `/ehis-billing/pembayaran`.
 *
 * Re-export METODE_CFG / METODE_ORDER dari invoice biar konsisten ikon & warna
 * lintas modul (form pembayaran di BL2.3 + counter breakdown di BL3.1).
 */

import type { LucideIcon } from "lucide-react";
import {
  Building, BedDouble, Stethoscope, Siren, LockOpen, Lock,
} from "lucide-react";
import type { CounterId, ShiftStatus } from "@/lib/billing/kasirShiftMock";

// ── Counter display config ──────────────────────────────

export const COUNTER_TONE: Record<CounterId, {
  icon: LucideIcon;
  bg: string;
  text: string;
  ring: string;
  dot: string;
}> = {
  "Kasir-1":   { icon: Building,     bg: "bg-amber-50",   text: "text-amber-700",   ring: "ring-amber-200",   dot: "bg-amber-500" },
  "Kasir-2":   { icon: BedDouble,    bg: "bg-teal-50",    text: "text-teal-700",    ring: "ring-teal-200",    dot: "bg-teal-500" },
  "Kasir-3":   { icon: Stethoscope,  bg: "bg-sky-50",     text: "text-sky-700",     ring: "ring-sky-200",     dot: "bg-sky-500" },
  "Kasir-IGD": { icon: Siren,        bg: "bg-rose-50",    text: "text-rose-700",    ring: "ring-rose-200",    dot: "bg-rose-500" },
};

// ── Shift status display ────────────────────────────────

export const SHIFT_STATUS_CFG: Record<ShiftStatus, {
  label: string;
  icon: LucideIcon;
  bg: string;
  text: string;
  ring: string;
  dot: string;
}> = {
  Open: {
    label: "Sedang Berjalan",
    icon: LockOpen,
    bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-300", dot: "bg-emerald-500",
  },
  Closed: {
    label: "Ditutup",
    icon: Lock,
    bg: "bg-slate-100", text: "text-slate-600", ring: "ring-slate-300", dot: "bg-slate-400",
  },
};

// ── Format helpers ──────────────────────────────────────

export {
  totalShiftAll, totalShiftNonTunai, expectedCashOnHand, computeSelisih,
  formatDuration, formatJam, formatTanggalShort,
} from "@/lib/billing/kasirShiftMock";
