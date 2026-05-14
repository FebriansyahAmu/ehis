// PPI Isolasi + Bundle HAI — shared types, configs, mock history

export type IsolasiTipe = "Contact" | "Droplet" | "Airborne";
export type BundleTipe  = "VAP" | "CAUTI" | "CLABSI";
export type Shift       = "Pagi" | "Siang" | "Malam";

export const SHIFT_ORDER: Shift[] = ["Pagi", "Siang", "Malam"];

// ── Shift config ────────────────────────────────────────────

export const SHIFT_CFG: Record<Shift, { label: string; chip: string; dot: string; short: string }> = {
  Pagi:  { label: "Pagi",  short: "P", chip: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",   dot: "bg-amber-400"  },
  Siang: { label: "Siang", short: "S", chip: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",         dot: "bg-sky-400"    },
  Malam: { label: "Malam", short: "M", chip: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200", dot: "bg-indigo-500" },
};

export function currentShift(): Shift {
  const h = new Date().getHours();
  if (h >= 7 && h < 15) return "Pagi";
  if (h >= 15 && h < 22) return "Siang";
  return "Malam";
}

// ── Isolasi Precaution config ───────────────────────────────

export interface IsolasiCfg {
  label:    string;
  subdesc:  string;
  chip:     string;
  dot:      string;
  formBg:   string;
  formBorder: string;
}

export const ISOLASI_CFG: Record<IsolasiTipe, IsolasiCfg> = {
  Contact: {
    label:      "Contact",
    subdesc:    "MRSA · VRE · C.diff · Luka Terbuka",
    chip:       "bg-amber-100 text-amber-800 ring-amber-300",
    dot:        "bg-amber-400",
    formBg:     "bg-amber-50",
    formBorder: "border-amber-200",
  },
  Droplet: {
    label:      "Droplet",
    subdesc:    "Influenza · Meningitis · Pertussis",
    chip:       "bg-orange-100 text-orange-800 ring-orange-300",
    dot:        "bg-orange-500",
    formBg:     "bg-orange-50",
    formBorder: "border-orange-200",
  },
  Airborne: {
    label:      "Airborne",
    subdesc:    "TB Paru · Campak · Aerosol COVID-19",
    chip:       "bg-red-100 text-red-800 ring-red-300",
    dot:        "bg-red-500",
    formBg:     "bg-red-50",
    formBorder: "border-red-200",
  },
};

export const ISOLASI_OPTIONS: IsolasiTipe[] = ["Contact", "Droplet", "Airborne"];

// ── Bundle HAI items ────────────────────────────────────────

export interface BundleItem {
  id:     string;
  label:  string;
  detail: string;
}

export const VAP_ITEMS: BundleItem[] = [
  { id: "hob",  label: "Elevasi kepala 30–45°",               detail: "Head-of-Bed terpantau setiap shift" },
  { id: "ohc",  label: "Oral hygiene chlorhexidine 0.12%",    detail: "Dilakukan minimal 2× sehari" },
  { id: "svbt", label: "Sedation vacation & breathing trial", detail: "Penilaian SBT harian terdokumentasi" },
  { id: "dvt",  label: "DVT prophylaxis terlaksana",          detail: "Antikoagulan / stoking kompresi sesuai order" },
  { id: "pud",  label: "PUD prophylaxis terlaksana",          detail: "PPI / H2-blocker sesuai protokol" },
];

export const CAUTI_ITEMS: BundleItem[] = [
  { id: "ind",  label: "Indikasi kateter terdokumentasi",     detail: "Alasan klinis tercatat dalam rekam medis" },
  { id: "care", label: "Perawatan kateter harian",            detail: "Kebersihan meatus uretra teknik aseptik" },
  { id: "rev",  label: "Review kebutuhan kateter",            detail: "Pertimbangkan pelepasan kateter hari ini" },
];

export const CLABSI_ITEMS: BundleItem[] = [
  { id: "hh",    label: "Hand hygiene sebelum akses CVC",      detail: "5 momen kebersihan tangan terlaksana" },
  { id: "anti",  label: "Antiseptik chlorhexidine port/lumen", detail: "Scrub port ≥15 detik sebelum setiap akses" },
  { id: "dress", label: "Dressing CVC bersih dan utuh",        detail: "Ganti jika basah, kotor, atau terlepas" },
  { id: "rev",   label: "Review kebutuhan CVC",                detail: "Pertimbangkan pelepasan akses sentral" },
];

// ── Bundle config ───────────────────────────────────────────

export interface BundleCfg {
  label:    string;
  desc:     string;
  trigger:  string;
  hdrCls:   string;
  dotCls:   string;
  badgeCls: string;
  items:    BundleItem[];
}

export const BUNDLE_CFG: Record<BundleTipe, BundleCfg> = {
  VAP: {
    label:    "VAP Bundle",
    desc:     "Ventilator-Associated Pneumonia Prevention",
    trigger:  "Pasien terpasang ventilator mekanik",
    hdrCls:   "bg-rose-50 border-rose-200",
    dotCls:   "bg-rose-500",
    badgeCls: "bg-rose-100 text-rose-700 ring-1 ring-rose-200",
    items:    VAP_ITEMS,
  },
  CAUTI: {
    label:    "CAUTI Bundle",
    desc:     "Catheter-Associated Urinary Tract Infection Prevention",
    trigger:  "Pasien terpasang kateter urin (Foley)",
    hdrCls:   "bg-amber-50 border-amber-200",
    dotCls:   "bg-amber-500",
    badgeCls: "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
    items:    CAUTI_ITEMS,
  },
  CLABSI: {
    label:    "CLABSI Bundle",
    desc:     "Central Line-Associated Bloodstream Infection Prevention",
    trigger:  "Pasien terpasang CVC / akses sentral",
    hdrCls:   "bg-indigo-50 border-indigo-200",
    dotCls:   "bg-indigo-500",
    badgeCls: "bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200",
    items:    CLABSI_ITEMS,
  },
};

export const BUNDLE_ORDER: BundleTipe[] = ["VAP", "CAUTI", "CLABSI"];

// ── Per-shift daily record ──────────────────────────────────

export interface DailyRecord {
  tanggal: string;
  shift:   Shift;
  checks:  Record<string, boolean>;
  perawat: string;
  waktu:   string;
}

// ── Helpers ─────────────────────────────────────────────────

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function fmtTgl(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
}

export function initChecks(items: BundleItem[]): Record<string, boolean> {
  return Object.fromEntries(items.map(i => [i.id, false]));
}

export function completionPct(checks: Record<string, boolean>): number {
  const vals = Object.values(checks);
  if (vals.length === 0) return 0;
  return Math.round((vals.filter(Boolean).length / vals.length) * 100);
}

// ── Mock history (ri-3, ICU Syok Sepsis) — per shift ───────
// Pattern: day-6 Pagi only, day-5 Pagi+Siang, day-4..3 all 3,
//          day-2 Pagi+Malam (Siang miss), day-1 all 3

function past(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

export const BUNDLE_HISTORY_MOCK: Record<BundleTipe, DailyRecord[]> = {
  VAP: [
    // Day -6: Pagi only (hari admisi)
    { tanggal: past(6), shift: "Pagi",  checks: { hob: true,  ohc: true,  svbt: false, dvt: true,  pud: true  }, perawat: "Ns. Rini Susanti",   waktu: "09:30" },
    // Day -5: Pagi + Siang
    { tanggal: past(5), shift: "Pagi",  checks: { hob: true,  ohc: true,  svbt: true,  dvt: true,  pud: true  }, perawat: "Ns. Rini Susanti",   waktu: "08:00" },
    { tanggal: past(5), shift: "Siang", checks: { hob: true,  ohc: true,  svbt: true,  dvt: true,  pud: true  }, perawat: "Ns. Wahyu Pratama",  waktu: "15:30" },
    // Day -4: all 3
    { tanggal: past(4), shift: "Pagi",  checks: { hob: true,  ohc: false, svbt: true,  dvt: true,  pud: true  }, perawat: "Ns. Sari Dewi",      waktu: "08:05" },
    { tanggal: past(4), shift: "Siang", checks: { hob: true,  ohc: true,  svbt: true,  dvt: true,  pud: true  }, perawat: "Ns. Budi Hartono",   waktu: "15:45" },
    { tanggal: past(4), shift: "Malam", checks: { hob: true,  ohc: true,  svbt: false, dvt: true,  pud: true  }, perawat: "Ns. Dewi Rahayu",    waktu: "22:10" },
    // Day -3: all 3, full compliance
    { tanggal: past(3), shift: "Pagi",  checks: { hob: true,  ohc: true,  svbt: true,  dvt: true,  pud: true  }, perawat: "Ns. Rini Susanti",   waktu: "08:20" },
    { tanggal: past(3), shift: "Siang", checks: { hob: true,  ohc: true,  svbt: true,  dvt: true,  pud: true  }, perawat: "Ns. Wahyu Pratama",  waktu: "15:30" },
    { tanggal: past(3), shift: "Malam", checks: { hob: true,  ohc: true,  svbt: true,  dvt: true,  pud: true  }, perawat: "Ns. Agus Santoso",   waktu: "22:05" },
    // Day -2: Pagi + Malam (Siang miss)
    { tanggal: past(2), shift: "Pagi",  checks: { hob: true,  ohc: true,  svbt: false, dvt: true,  pud: false }, perawat: "Ns. Sari Dewi",      waktu: "07:55" },
    { tanggal: past(2), shift: "Malam", checks: { hob: true,  ohc: true,  svbt: true,  dvt: true,  pud: true  }, perawat: "Ns. Dewi Rahayu",    waktu: "22:00" },
    // Day -1: all 3
    { tanggal: past(1), shift: "Pagi",  checks: { hob: true,  ohc: true,  svbt: true,  dvt: true,  pud: true  }, perawat: "Ns. Rini Susanti",   waktu: "08:10" },
    { tanggal: past(1), shift: "Siang", checks: { hob: true,  ohc: true,  svbt: true,  dvt: true,  pud: true  }, perawat: "Ns. Wahyu Pratama",  waktu: "15:20" },
    { tanggal: past(1), shift: "Malam", checks: { hob: true,  ohc: false, svbt: true,  dvt: true,  pud: true  }, perawat: "Ns. Agus Santoso",   waktu: "22:15" },
  ],
  CAUTI: [
    { tanggal: past(6), shift: "Pagi",  checks: { ind: true, care: true,  rev: true  }, perawat: "Ns. Rini Susanti",   waktu: "09:00" },
    { tanggal: past(5), shift: "Pagi",  checks: { ind: true, care: true,  rev: false }, perawat: "Ns. Rini Susanti",   waktu: "08:15" },
    { tanggal: past(5), shift: "Siang", checks: { ind: true, care: true,  rev: true  }, perawat: "Ns. Wahyu Pratama",  waktu: "16:00" },
    { tanggal: past(4), shift: "Pagi",  checks: { ind: true, care: false, rev: true  }, perawat: "Ns. Sari Dewi",      waktu: "08:45" },
    { tanggal: past(4), shift: "Siang", checks: { ind: true, care: true,  rev: true  }, perawat: "Ns. Budi Hartono",   waktu: "15:30" },
    { tanggal: past(4), shift: "Malam", checks: { ind: true, care: true,  rev: true  }, perawat: "Ns. Dewi Rahayu",    waktu: "22:30" },
    { tanggal: past(3), shift: "Pagi",  checks: { ind: true, care: true,  rev: true  }, perawat: "Ns. Rini Susanti",   waktu: "09:00" },
    { tanggal: past(3), shift: "Siang", checks: { ind: true, care: true,  rev: true  }, perawat: "Ns. Wahyu Pratama",  waktu: "15:45" },
    { tanggal: past(3), shift: "Malam", checks: { ind: true, care: true,  rev: false }, perawat: "Ns. Agus Santoso",   waktu: "22:10" },
    { tanggal: past(2), shift: "Pagi",  checks: { ind: true, care: true,  rev: false }, perawat: "Ns. Sari Dewi",      waktu: "08:30" },
    { tanggal: past(2), shift: "Malam", checks: { ind: true, care: true,  rev: true  }, perawat: "Ns. Dewi Rahayu",    waktu: "22:05" },
    { tanggal: past(1), shift: "Pagi",  checks: { ind: true, care: true,  rev: true  }, perawat: "Ns. Rini Susanti",   waktu: "09:10" },
    { tanggal: past(1), shift: "Siang", checks: { ind: true, care: true,  rev: true  }, perawat: "Ns. Wahyu Pratama",  waktu: "15:35" },
    { tanggal: past(1), shift: "Malam", checks: { ind: true, care: true,  rev: true  }, perawat: "Ns. Agus Santoso",   waktu: "22:00" },
  ],
  CLABSI: [
    { tanggal: past(6), shift: "Pagi",  checks: { hh: true, anti: true,  dress: true,  rev: true  }, perawat: "Ns. Rini Susanti",   waktu: "10:00" },
    { tanggal: past(5), shift: "Pagi",  checks: { hh: true, anti: true,  dress: true,  rev: false }, perawat: "Ns. Rini Susanti",   waktu: "09:45" },
    { tanggal: past(5), shift: "Siang", checks: { hh: true, anti: true,  dress: true,  rev: true  }, perawat: "Ns. Wahyu Pratama",  waktu: "16:15" },
    { tanggal: past(4), shift: "Pagi",  checks: { hh: true, anti: false, dress: true,  rev: true  }, perawat: "Ns. Sari Dewi",      waktu: "09:50" },
    { tanggal: past(4), shift: "Siang", checks: { hh: true, anti: true,  dress: true,  rev: true  }, perawat: "Ns. Budi Hartono",   waktu: "15:50" },
    { tanggal: past(4), shift: "Malam", checks: { hh: true, anti: true,  dress: false, rev: true  }, perawat: "Ns. Dewi Rahayu",    waktu: "22:20" },
    { tanggal: past(3), shift: "Pagi",  checks: { hh: true, anti: true,  dress: true,  rev: true  }, perawat: "Ns. Rini Susanti",   waktu: "10:05" },
    { tanggal: past(3), shift: "Siang", checks: { hh: true, anti: true,  dress: true,  rev: true  }, perawat: "Ns. Wahyu Pratama",  waktu: "15:55" },
    { tanggal: past(3), shift: "Malam", checks: { hh: true, anti: true,  dress: true,  rev: true  }, perawat: "Ns. Agus Santoso",   waktu: "22:00" },
    { tanggal: past(2), shift: "Pagi",  checks: { hh: true, anti: true,  dress: false, rev: true  }, perawat: "Ns. Sari Dewi",      waktu: "10:20" },
    { tanggal: past(2), shift: "Malam", checks: { hh: true, anti: true,  dress: true,  rev: true  }, perawat: "Ns. Dewi Rahayu",    waktu: "22:10" },
    { tanggal: past(1), shift: "Pagi",  checks: { hh: true, anti: true,  dress: true,  rev: true  }, perawat: "Ns. Rini Susanti",   waktu: "10:10" },
    { tanggal: past(1), shift: "Siang", checks: { hh: true, anti: true,  dress: true,  rev: false }, perawat: "Ns. Wahyu Pratama",  waktu: "16:00" },
    { tanggal: past(1), shift: "Malam", checks: { hh: true, anti: true,  dress: true,  rev: true  }, perawat: "Ns. Agus Santoso",   waktu: "22:05" },
  ],
};
