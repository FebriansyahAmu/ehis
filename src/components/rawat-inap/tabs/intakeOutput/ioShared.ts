// ── Intake / Output — shared constants + helpers ──────────

export function calcIWL(bb: number, suhu: number): number {
  const basal   = bb * 10;
  const koreksi = suhu > 37 ? (suhu - 37) * 0.1 * basal : 0;
  return Math.round(basal + koreksi);
}

export function detectShift(jam: string): "Pagi" | "Siang" | "Malam" {
  const h = parseInt(jam.slice(0, 2), 10);
  if (h >= 7 && h < 14) return "Pagi";
  if (h >= 14 && h < 21) return "Siang";
  return "Malam";
}

export function fmtVol(mL: number): string {
  return mL.toLocaleString("id-ID") + " mL";
}

export function balanceBadge(balance: number): { label: string; cls: string } {
  if (Math.abs(balance) <= 200)  return { label: "Seimbang",     cls: "bg-emerald-100 text-emerald-700 ring-emerald-200" };
  if (balance > 1000)            return { label: "Overload Berat",cls: "bg-rose-100 text-rose-700 ring-rose-200"         };
  if (balance > 0)               return { label: "Kelebihan",     cls: "bg-amber-100 text-amber-700 ring-amber-200"      };
  if (balance < -1000)           return { label: "Defisit Berat", cls: "bg-rose-100 text-rose-700 ring-rose-200"         };
  return                                { label: "Defisit",       cls: "bg-sky-100 text-sky-700 ring-sky-200"            };
}

export function daysBetween(from: string, to: string): number {
  return Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86_400_000);
}

// ── Category definitions ───────────────────────────────────

export interface CatDef {
  id:  string;
  label: string;
  sub:   string[];
  ring:  string;   // Tailwind ring + text classes for active state
  soft:  string;   // Tailwind bg classes for inactive state
}

export const INTAKE_CATS: CatDef[] = [
  {
    id: "Oral", label: "Oral / Minum",
    sub:  ["Minum", "Makan Cair", "Susu / Formula"],
    ring: "ring-emerald-400 bg-emerald-600 text-white",
    soft: "ring-emerald-200 bg-emerald-50 text-emerald-700",
  },
  {
    id: "IV", label: "Cairan IV",
    sub:  ["NaCl 0.9%", "Ringer Laktat (RL)", "Dextrose 5%", "Dextrose 10%", "Albumin 20%", "Norepinephrine", "Dobutamin", "Antibiotik IV", "Lainnya"],
    ring: "ring-sky-400 bg-sky-600 text-white",
    soft: "ring-sky-200 bg-sky-50 text-sky-700",
  },
  {
    id: "NGT", label: "NGT / Enteral",
    sub:  ["Formula Enteral", "Air / ORS", "Obat via NGT"],
    ring: "ring-amber-400 bg-amber-600 text-white",
    soft: "ring-amber-200 bg-amber-50 text-amber-700",
  },
  {
    id: "Transfusi", label: "Transfusi",
    sub:  ["PRC", "FFP (Plasma Segar)", "Trombosit (TC)", "Whole Blood"],
    ring: "ring-rose-400 bg-rose-600 text-white",
    soft: "ring-rose-200 bg-rose-50 text-rose-700",
  },
  {
    id: "Lainnya", label: "Lainnya",
    sub:  [],
    ring: "ring-slate-400 bg-slate-600 text-white",
    soft: "ring-slate-200 bg-slate-50 text-slate-600",
  },
];

export const OUTPUT_CATS: CatDef[] = [
  {
    id: "Urine", label: "Urine",
    sub:  ["Kateter Foley", "Void Spontan"],
    ring: "ring-amber-400 bg-amber-600 text-white",
    soft: "ring-amber-200 bg-amber-50 text-amber-700",
  },
  {
    id: "Drainase", label: "Drainase",
    sub:  ["NGT Drainage", "WSD (Water Seal)", "Drain Bedah", "CVC Drainage"],
    ring: "ring-slate-400 bg-slate-600 text-white",
    soft: "ring-slate-200 bg-slate-100 text-slate-600",
  },
  {
    id: "Feses", label: "BAB / Feses",
    sub:  ["Spontan", "Enema", "Kolostomi"],
    ring: "ring-orange-400 bg-orange-600 text-white",
    soft: "ring-orange-200 bg-orange-50 text-orange-700",
  },
  {
    id: "Muntah", label: "Muntah / Emesis",
    sub:  ["Emesis Spontan", "Aspirasi NGT"],
    ring: "ring-violet-400 bg-violet-600 text-white",
    soft: "ring-violet-200 bg-violet-50 text-violet-700",
  },
  {
    id: "Perdarahan", label: "Perdarahan",
    sub:  ["Perdarahan Aktif", "Luka Operasi", "Hematuria"],
    ring: "ring-rose-400 bg-rose-600 text-white",
    soft: "ring-rose-200 bg-rose-50 text-rose-700",
  },
  {
    id: "Lainnya", label: "Lainnya",
    sub:  [],
    ring: "ring-slate-400 bg-slate-600 text-white",
    soft: "ring-slate-200 bg-slate-100 text-slate-600",
  },
];

// Accent for category chips in entry list
export const INTAKE_CHIP: Record<string, string> = {
  Oral:      "bg-emerald-100 text-emerald-700",
  IV:        "bg-sky-100 text-sky-700",
  NGT:       "bg-amber-100 text-amber-700",
  Transfusi: "bg-rose-100 text-rose-700",
  Lainnya:   "bg-slate-100 text-slate-600",
};
export const OUTPUT_CHIP: Record<string, string> = {
  Urine:      "bg-amber-100 text-amber-700",
  Drainase:   "bg-slate-100 text-slate-600",
  Feses:      "bg-orange-100 text-orange-700",
  Muntah:     "bg-violet-100 text-violet-700",
  Perdarahan: "bg-rose-100 text-rose-700",
  Lainnya:    "bg-slate-100 text-slate-600",
};
