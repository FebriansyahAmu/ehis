import type { RIShift, StatusMAR, MAREntry } from "@/lib/data";

export type { RIShift as MARShift, StatusMAR, MAREntry };

// ── Shift config ──────────────────────────────────────────

export const SHIFT_CFG: Record<RIShift, {
  label: string; hours: string;
  badge: string; activeBadge: string; dot: string;
}> = {
  Pagi:  { label: "Pagi",  hours: "07:00–14:59", badge: "border-amber-200 bg-amber-50 text-amber-700",    activeBadge: "bg-amber-500 text-white border-amber-500",   dot: "bg-amber-400"   },
  Siang: { label: "Siang", hours: "15:00–21:59", badge: "border-sky-200 bg-sky-50 text-sky-700",          activeBadge: "bg-sky-600 text-white border-sky-600",        dot: "bg-sky-500"     },
  Malam: { label: "Malam", hours: "22:00–06:59", badge: "border-violet-200 bg-violet-50 text-violet-700", activeBadge: "bg-violet-600 text-white border-violet-600",  dot: "bg-violet-500"  },
};

// ── MAR status config ─────────────────────────────────────

export const STATUS_MAR_CFG: Record<StatusMAR, {
  label: string; badge: string; dot: string; icon: string;
}> = {
  Diberikan:     { label: "Diberikan",     badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", dot: "bg-emerald-500", icon: "✓" },
  Ditunda:       { label: "Ditunda",       badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",       dot: "bg-amber-400",   icon: "⏸" },
  Ditolak:       { label: "Ditolak",       badge: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",          dot: "bg-rose-500",    icon: "✕" },
  TidakTersedia: { label: "Stok Habis",    badge: "bg-slate-100 text-slate-500 ring-1 ring-slate-200",      dot: "bg-slate-400",   icon: "○" },
  NA:            { label: "Tidak Berlaku", badge: "bg-slate-50 text-slate-300 ring-1 ring-slate-100",        dot: "bg-slate-200",   icon: "—" },
};

// ── HAM detection ─────────────────────────────────────────

const HAM_KW = [
  "morfin", "heparin", "warfarin", "norepinefrin", "norepinephrine",
  "epinefrin", "dobutamin", "dobutamine", "isdn", "nitrogliserin",
  "kcl", "kalium klorid", "insulin", "oksitosin", "magnesium sulfat",
];

export function isHAMDrug(name: string): boolean {
  const low = name.toLowerCase();
  return HAM_KW.some((kw) => low.includes(kw));
}

// ── Shift detection ───────────────────────────────────────

export function getCurrentShift(): RIShift {
  const h = new Date().getHours();
  if (h >= 7 && h <= 14) return "Pagi";
  if (h >= 15 && h <= 21) return "Siang";
  return "Malam";
}

function getSlotShift(waktu: string): RIShift {
  const h = parseInt(waktu.split(":")[0], 10);
  if (h >= 7 && h <= 14) return "Pagi";
  if (h >= 15 && h <= 21) return "Siang";
  return "Malam";
}

// ── Time slot derivation ──────────────────────────────────

export interface TimeSlot { waktu: string; shift: RIShift }

const SIGNA_MAP: Record<string, string[]> = {
  "1×1": ["08:00"],
  "2×1": ["08:00", "20:00"],
  "3×1": ["08:00", "16:00", "22:00"],
  "4×1": ["06:00", "12:00", "18:00", "00:00"],
  "6×1": ["04:00", "08:00", "12:00", "16:00", "20:00", "00:00"],
  "1×2": ["08:00"],
  "2×2": ["08:00", "20:00"],
  "3×2": ["08:00", "16:00", "22:00"],
};

export function deriveTimeSlots(signa: string): TimeSlot[] {
  if (isFlexibleSigna(signa)) return [];
  const clean = signa.trim().split(/\s+/)[0];
  const known = SIGNA_MAP[clean];
  if (known) return known.map((w) => ({ waktu: w, shift: getSlotShift(w) }));
  const m = clean.match(/^(\d+)×/);
  const n = m ? parseInt(m[1], 10) : 1;
  const fallback: Record<number, string[]> = {
    1: ["08:00"],
    2: ["08:00", "20:00"],
    3: ["08:00", "16:00", "22:00"],
    4: ["06:00", "12:00", "18:00", "00:00"],
  };
  const ws = fallback[Math.min(n, 4)] ?? ["08:00"];
  return ws.map((w) => ({ waktu: w, shift: getSlotShift(w) }));
}

export function isFlexibleSigna(signa: string): boolean {
  return /titrasi|k\/p|prn|kontinu|drip/i.test(signa);
}

// ── Date helpers ──────────────────────────────────────────

export function getRecentDates(n = 7): string[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split("T")[0];
  });
}

export function fmtTanggalShort(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" });
}
