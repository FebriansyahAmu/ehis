import type { RJStatus, RJPoli, TipePenjamin } from "@/lib/data";

// ── Status ────────────────────────────────────────────────

export interface StatusDef {
  label:  string;
  badge:  string;
  border: string;
  dot:    string;
  active: string;
}

export const STATUS_CFG: Record<RJStatus, StatusDef> = {
  Menunggu_Skrining: {
    label:  "Menunggu Skrining",
    badge:  "bg-amber-100 text-amber-700",
    border: "border-l-amber-400",
    dot:    "bg-amber-400",
    active: "bg-amber-500 text-white border-amber-500",
  },
  Skrining: {
    label:  "Skrining",
    badge:  "bg-sky-100 text-sky-700",
    border: "border-l-sky-400",
    dot:    "bg-sky-400",
    active: "bg-sky-500 text-white border-sky-500",
  },
  Menunggu_Dokter: {
    label:  "Menunggu Dokter",
    badge:  "bg-orange-100 text-orange-700",
    border: "border-l-orange-400",
    dot:    "bg-orange-400",
    active: "bg-orange-500 text-white border-orange-500",
  },
  Sedang_Diperiksa: {
    label:  "Sedang Diperiksa",
    badge:  "bg-sky-100 text-sky-700",
    border: "border-l-sky-400",
    dot:    "bg-sky-400",
    active: "bg-sky-600 text-white border-sky-600",
  },
  Selesai: {
    label:  "Selesai",
    badge:  "bg-emerald-100 text-emerald-700",
    border: "border-l-emerald-500",
    dot:    "bg-emerald-500",
    active: "bg-emerald-600 text-white border-emerald-600",
  },
};

// ── Poli ──────────────────────────────────────────────────

export interface PoliDef { label: string; badge: string; icon: string }

export const POLI_CFG: Record<RJPoli, PoliDef> = {
  Poli_Umum:    { label: "Poli Umum",      badge: "bg-slate-100 text-slate-600",   icon: "🏥" },
  Poli_Dalam:   { label: "Poli Dalam",     badge: "bg-sky-100 text-sky-700",       icon: "🩺" },
  Poli_Jantung: { label: "Poli Jantung",   badge: "bg-rose-100 text-rose-700",     icon: "❤️" },
  Poli_Paru:    { label: "Poli Paru",      badge: "bg-teal-100 text-teal-700",     icon: "🫁" },
  Poli_Bedah:   { label: "Poli Bedah",     badge: "bg-orange-100 text-orange-700", icon: "🔪" },
  Poli_Saraf:   { label: "Poli Saraf",     badge: "bg-violet-100 text-violet-700", icon: "🧠" },
  Poli_Anak:    { label: "Poli Anak",      badge: "bg-pink-100 text-pink-700",     icon: "👶" },
  Poli_THT:     { label: "Poli THT",       badge: "bg-indigo-100 text-indigo-700", icon: "👂" },
  Poli_Mata:    { label: "Poli Mata",      badge: "bg-cyan-100 text-cyan-700",     icon: "👁️" },
  Poli_Obgyn:   { label: "Poli Kandungan", badge: "bg-fuchsia-100 text-fuchsia-700", icon: "🌸" },
};

// ── Penjamin ──────────────────────────────────────────────

export const PENJAMIN_CFG: Record<TipePenjamin, { badge: string; label: string }> = {
  BPJS_PBI:     { badge: "bg-emerald-100 text-emerald-700", label: "BPJS PBI"     },
  BPJS_Non_PBI: { badge: "bg-sky-100 text-sky-700",         label: "BPJS Non-PBI" },
  Umum:         { badge: "bg-slate-100 text-slate-600",     label: "Umum"         },
  Asuransi:     { badge: "bg-violet-100 text-violet-700",   label: "Asuransi"     },
  Jamkesda:     { badge: "bg-teal-100 text-teal-700",       label: "Jamkesda"     },
};
