// ── Types ─────────────────────────────────────────────────

export type Tekstur          = "biasa" | "lunak" | "saring" | "cair";
export type MonitoringStatus = "baik"  | "kurang" | "buruk";

export interface DietOrder {
  tipeDiet:  string;
  kalori:    number | "";
  tekstur:   Tekstur;
  batasan:   string;
  orderedBy: string;
  orderedAt: string;
}

export interface DietitianAddendum {
  nama:    string;
  catatan: string;
  tanggal: string;
}

export interface MealEntry {
  persen:  number;
  catatan: string;
}

export interface DailyMonitoring {
  tanggal: string; // YYYY-MM-DD
  pagi:    MealEntry;
  siang:   MealEntry;
  malam:   MealEntry;
  inputBy: string;
}

export interface GiziNutrisiData {
  dietOrder:      DietOrder | null;
  addendum:       DietitianAddendum | null;
  rujukDietitian: boolean;
  monitoring:     DailyMonitoring[];
}

export interface SkriningSummary {
  score:   number;
  level:   "low" | "mid" | "high";
  tanggal: string;
  petugas: string;
}

// ── Constants ─────────────────────────────────────────────

export const TIPE_DIET_OPTIONS = [
  "Diet Jantung Rendah Garam I",
  "Diet Jantung Rendah Garam II",
  "Diet Jantung Rendah Garam III",
  "Diet Diabetes Melitus",
  "Diet Rendah Protein",
  "Diet Rendah Lemak",
  "Diet Tinggi Protein",
  "Diet Ginjal Kronik",
  "Diet Hati",
  "Diet Pasca Operasi",
  "Diet Biasa (MB)",
  "Lainnya",
] as const;

export const TEKSTUR_CFG = {
  biasa:  { label: "Biasa",  cls: "bg-slate-100  text-slate-700  ring-slate-200"  },
  lunak:  { label: "Lunak",  cls: "bg-sky-100    text-sky-700    ring-sky-200"    },
  saring: { label: "Saring", cls: "bg-amber-100  text-amber-700  ring-amber-200"  },
  cair:   { label: "Cair",   cls: "bg-indigo-100 text-indigo-700 ring-indigo-200" },
} satisfies Record<Tekstur, { label: string; cls: string }>;

export const PERSEN_OPTIONS = [0, 25, 50, 75, 100] as const;

export const PERSEN_CFG: Record<number, { bar: string; pill: string }> = {
  0:   { bar: "bg-rose-400",    pill: "bg-rose-100    text-rose-700    ring-rose-200"    },
  25:  { bar: "bg-orange-400",  pill: "bg-orange-100  text-orange-700  ring-orange-200"  },
  50:  { bar: "bg-amber-400",   pill: "bg-amber-100   text-amber-700   ring-amber-200"   },
  75:  { bar: "bg-sky-400",     pill: "bg-sky-100     text-sky-700     ring-sky-200"     },
  100: { bar: "bg-emerald-400", pill: "bg-emerald-100 text-emerald-700 ring-emerald-200" },
};

export const MONITORING_STATUS_CFG = {
  baik:   { label: "Asupan Baik",   cls: "bg-emerald-100 text-emerald-700" },
  kurang: { label: "Asupan Kurang", cls: "bg-amber-100   text-amber-700"   },
  buruk:  { label: "Asupan Buruk",  cls: "bg-rose-100    text-rose-700"    },
} satisfies Record<MonitoringStatus, { label: string; cls: string }>;

export const MEAL_LABELS: Record<string, string> = {
  pagi: "Pagi", siang: "Siang", malam: "Malam",
};

export const MEAL_ICONS: Record<string, string> = {
  pagi: "🌅", siang: "☀️", malam: "🌙",
};

// ── Helpers ────────────────────────────────────────────────

export function calcDailyAvg(day: DailyMonitoring): number {
  return Math.round((day.pagi.persen + day.siang.persen + day.malam.persen) / 3);
}

export function getMonitoringStatus(avg: number): MonitoringStatus {
  if (avg >= 75) return "baik";
  if (avg >= 50) return "kurang";
  return "buruk";
}

export function emptyMeal(): MealEntry {
  return { persen: 0, catatan: "" };
}

export function emptyDailyMonitoring(tanggal: string): DailyMonitoring {
  return { tanggal, pagi: emptyMeal(), siang: emptyMeal(), malam: emptyMeal(), inputBy: "" };
}

export function emptyGiziNutrisi(): GiziNutrisiData {
  return { dietOrder: null, addendum: null, rujukDietitian: false, monitoring: [] };
}

// ── Mock data ──────────────────────────────────────────────

export const SKRINING_MOCK: Record<string, SkriningSummary> = {
  "RM-2025-003": {
    score:   3,
    level:   "mid",
    tanggal: "2026-05-10",
    petugas: "Ns. Dewi Rahayu",
  },
  "RM-2025-007": {
    score:   5,
    level:   "high",
    tanggal: "2026-05-12",
    petugas: "Ns. Ahmad Fauzi",
  },
};

export const GIZI_NUTRISI_MOCK: Record<string, GiziNutrisiData> = {
  "RM-2025-003": {
    rujukDietitian: true,
    dietOrder: {
      tipeDiet:  "Diet Jantung Rendah Garam II",
      kalori:    1700,
      tekstur:   "lunak",
      batasan:   "Na < 2g/hari · cairan ≤ 1500ml/hari",
      orderedBy: "dr. Budi Santoso Sp.JP",
      orderedAt: "2026-05-10T08:30:00",
    },
    addendum: {
      nama:    "Siti Fatimah, AMG",
      catatan: "Anjurkan makan 5–6× sehari porsi kecil. Tambah suplemen oral Ensure 1×/hari jika asupan < 60%.",
      tanggal: "2026-05-10",
    },
    monitoring: [
      { tanggal: "2026-05-10", pagi: { persen: 50,  catatan: "" },          siang: { persen: 25,  catatan: "Mual post obat" }, malam: { persen: 75,  catatan: "" }, inputBy: "Ns. Rini"  },
      { tanggal: "2026-05-11", pagi: { persen: 75,  catatan: "" },          siang: { persen: 50,  catatan: "" },              malam: { persen: 75,  catatan: "" }, inputBy: "Ns. Ahmad" },
      { tanggal: "2026-05-12", pagi: { persen: 75,  catatan: "" },          siang: { persen: 75,  catatan: "" },              malam: { persen: 100, catatan: "" }, inputBy: "Ns. Rini"  },
      { tanggal: "2026-05-13", pagi: { persen: 100, catatan: "" },          siang: { persen: 75,  catatan: "" },              malam: { persen: 100, catatan: "" }, inputBy: "Ns. Dewi"  },
      { tanggal: "2026-05-14", pagi: { persen: 100, catatan: "Lahap" },     siang: { persen: 100, catatan: "" },              malam: { persen: 75,  catatan: "" }, inputBy: "Ns. Rini"  },
    ],
  },
};
