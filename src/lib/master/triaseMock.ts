/**
 * Master Triase IGD — types + mock data.
 *
 * Konsumen: IGD `TriaseTab` + `TriaseModal` · IGD Board urgensi indicator
 * Replace: `igd/tabs/TriaseTab.tsx` (`COL_HEADERS` + `CRITERIA_ROWS` hardcoded)
 *
 * Standar: ESI (Emergency Severity Index) · ATS (Australasian Triage Scale)
 *          PMK 47/2018 (klasifikasi triase IGD RS di Indonesia)
 */

// ── Types ────────────────────────────────────────────────

export type TriaseStatus = "Aktif" | "Non_Aktif";

export type TriaseLevelTone =
  | "red-dark" | "rose" | "amber" | "emerald" | "sky" | "slate" | "violet";

export interface TriaseLevel {
  id: string;
  kode: string;             // mis. "resusitasi" / "P1"
  label: string;            // mis. "Resusitasi"
  tone: TriaseLevelTone;    // warna chip + header column
  responsTime: string;      // "Segera" / "< 10 menit"
  prioritas: number;        // 1 = tertinggi
  deskripsi: string;        // ringkasan klinis
}

export interface TriaseParameter {
  id: string;
  kode: string;
  label: string;
  /** Map level.kode → deskripsi cell. Cell kosong jika tidak applicable. */
  values: Record<string, string>;
}

export interface TriaseRecord {
  id: string;
  kode: string;             // mis. "DEFAULT-IGD" / "ESI" / "ATS"
  nama: string;
  deskripsi: string;
  protokol: string;         // referensi standar
  levels: TriaseLevel[];
  parameters: TriaseParameter[];
  status: TriaseStatus;
}

// ── Empty factory ────────────────────────────────────────

export function emptyTriaseRecord(): TriaseRecord {
  return {
    id: `tri-${Date.now().toString(36)}`,
    kode: "",
    nama: "",
    deskripsi: "",
    protokol: "",
    levels: [],
    parameters: [],
    status: "Aktif",
  };
}

// ── Tone palette ─────────────────────────────────────────

export interface TriaseToneCfg {
  /** Warna kuat untuk column header. */
  headerBg:    string;
  headerText:  string;
  /** Variasi soft untuk badge & cell highlight. */
  softBg:      string;
  softText:    string;
  ring:        string;
  dot:         string;
}

export const TRIASE_TONE_CFG: Record<TriaseLevelTone, TriaseToneCfg> = {
  "red-dark": { headerBg: "bg-red-600",     headerText: "text-white", softBg: "bg-red-50",     softText: "text-red-700",     ring: "ring-red-200",     dot: "bg-red-600"     },
  rose:       { headerBg: "bg-rose-500",    headerText: "text-white", softBg: "bg-rose-50",    softText: "text-rose-700",    ring: "ring-rose-200",    dot: "bg-rose-500"    },
  amber:      { headerBg: "bg-amber-500",   headerText: "text-white", softBg: "bg-amber-50",   softText: "text-amber-700",   ring: "ring-amber-200",   dot: "bg-amber-500"   },
  emerald:    { headerBg: "bg-emerald-500", headerText: "text-white", softBg: "bg-emerald-50", softText: "text-emerald-700", ring: "ring-emerald-200", dot: "bg-emerald-500" },
  sky:        { headerBg: "bg-sky-500",     headerText: "text-white", softBg: "bg-sky-50",     softText: "text-sky-700",     ring: "ring-sky-200",     dot: "bg-sky-500"     },
  slate:      { headerBg: "bg-slate-700",   headerText: "text-white", softBg: "bg-slate-100",  softText: "text-slate-700",   ring: "ring-slate-200",   dot: "bg-slate-700"   },
  violet:     { headerBg: "bg-violet-500",  headerText: "text-white", softBg: "bg-violet-50",  softText: "text-violet-700",  ring: "ring-violet-200",  dot: "bg-violet-500"  },
};

export const TRIASE_TONE_OPTIONS: TriaseLevelTone[] = [
  "red-dark", "rose", "amber", "emerald", "sky", "slate", "violet",
];

// ── Mock data ────────────────────────────────────────────

const DEFAULT_LEVELS: TriaseLevel[] = [
  { id: "lv-1", kode: "resusitasi", label: "Resusitasi", tone: "red-dark", responsTime: "Segera",     prioritas: 1, deskripsi: "Mengancam jiwa segera, butuh resusitasi tanpa delay." },
  { id: "lv-2", kode: "emergency",  label: "Emergency",  tone: "rose",     responsTime: "< 10 menit", prioritas: 2, deskripsi: "Kondisi gawat darurat, intervensi cepat dalam 10 menit." },
  { id: "lv-3", kode: "urgent",     label: "Urgent",     tone: "amber",    responsTime: "< 30 menit", prioritas: 3, deskripsi: "Kondisi mendesak, perlu evaluasi medis dalam 30 menit." },
  { id: "lv-4", kode: "lessUrgent", label: "Less Urgent", tone: "emerald", responsTime: "< 60 menit", prioritas: 4, deskripsi: "Kondisi tidak mendesak, dapat ditangani dalam 60 menit." },
  { id: "lv-5", kode: "nonUrgent",  label: "Non Urgent",  tone: "sky",     responsTime: "< 120 menit", prioritas: 5, deskripsi: "Keluhan ringan, dapat menunggu hingga 120 menit." },
  { id: "lv-6", kode: "doa",        label: "DOA",         tone: "slate",   responsTime: "Verifikasi",  prioritas: 6, deskripsi: "Dead On Arrival — tanpa tanda kehidupan saat tiba." },
];

const DEFAULT_PARAMETERS: TriaseParameter[] = [
  {
    id: "pa-airway",
    kode: "airway",
    label: "Airway",
    values: {
      resusitasi: "Tersumbat total / apnea",
      emergency:  "Tersumbat parsial, stridor",
      urgent:     "Bebas, perlu bantuan",
      lessUrgent: "Bebas",
      nonUrgent:  "Bebas",
      doa:        "—",
    },
  },
  {
    id: "pa-breathing",
    kode: "breathing",
    label: "Breathing / RR",
    values: {
      resusitasi: "Tidak bernapas / RR < 8",
      emergency:  "RR > 30, distress berat, sianosis",
      urgent:     "RR 21–30, distress sedang",
      lessUrgent: "Normal, sesak ringan",
      nonUrgent:  "Normal",
      doa:        "—",
    },
  },
  {
    id: "pa-sirkulasi",
    kode: "sirkulasi",
    label: "Sirkulasi / TD",
    values: {
      resusitasi: "Henti jantung / TD tidak terukur",
      emergency:  "TD < 90 mmHg (syok)",
      urgent:     "TD 90–100 mmHg",
      lessUrgent: "Stabil",
      nonUrgent:  "Normal",
      doa:        "—",
    },
  },
  {
    id: "pa-nadi",
    kode: "nadi",
    label: "Nadi",
    values: {
      resusitasi: "Tidak teraba",
      emergency:  "< 50 atau > 130 ×/mnt",
      urgent:     "100–130 ×/mnt (lemah)",
      lessUrgent: "Normal",
      nonUrgent:  "Normal",
      doa:        "—",
    },
  },
  {
    id: "pa-kesadaran",
    kode: "kesadaran",
    label: "Kesadaran (GCS)",
    values: {
      resusitasi: "≤ 8 · Koma",
      emergency:  "9–12 · Somnolen",
      urgent:     "13–14 · Apatis / Delirium",
      lessUrgent: "15 · Sadar penuh",
      nonUrgent:  "15",
      doa:        "—",
    },
  },
  {
    id: "pa-nyeri",
    kode: "nyeri",
    label: "Skala Nyeri (VAS)",
    values: {
      resusitasi: "—",
      emergency:  "8–10 · Berat",
      urgent:     "5–7 · Sedang",
      lessUrgent: "3–4 · Ringan-sedang",
      nonUrgent:  "0–2",
      doa:        "—",
    },
  },
  {
    id: "pa-respons",
    kode: "respons",
    label: "Waktu Respons",
    values: {
      resusitasi: "Segera · detik",
      emergency:  "< 10 menit",
      urgent:     "< 30 menit",
      lessUrgent: "< 60 menit",
      nonUrgent:  "< 120 menit",
      doa:        "Verifikasi kematian",
    },
  },
  {
    id: "pa-contoh",
    kode: "contoh",
    label: "Contoh Kasus",
    values: {
      resusitasi: "Henti napas / jantung, syok berat",
      emergency:  "STEMI, stroke, distress napas berat",
      urgent:     "Fraktur, nyeri dada moderat, kejang",
      lessUrgent: "Luka ringan, nyeri sedang",
      nonUrgent:  "ISPA ringan, kontrol rutin",
      doa:        "Meninggal saat tiba, tanpa tanda kehidupan",
    },
  },
];

const DEFAULT_PROTOCOL: TriaseRecord = {
  id: "tri-default",
  kode: "DEFAULT-IGD",
  nama: "Protokol Triase IGD RS (Default)",
  deskripsi:
    "Protokol triase 6 level berbasis ESI yang diadaptasi untuk konteks RS Indonesia. 8 parameter kriteria klinis.",
  protokol: "ESI 5-level (ENA 2020) + DOA · PMK 47/2018",
  levels: DEFAULT_LEVELS,
  parameters: DEFAULT_PARAMETERS,
  status: "Aktif",
};

export const TRIASE_MOCK: TriaseRecord[] = [DEFAULT_PROTOCOL];

// ── Validators ───────────────────────────────────────────

export function isTriaseValid(item: TriaseRecord, isNew = false): boolean {
  if (isNew) return !!item.nama.trim();
  return !!(
    item.kode.trim() &&
    item.nama.trim() &&
    item.levels.length >= 2 &&
    item.parameters.length >= 1
  );
}

// ── UI helpers ───────────────────────────────────────────

export function triaseInitials(item: TriaseRecord): string {
  const src = item.kode || item.nama || "";
  const cleaned = src.replace(/[^A-Za-z0-9]/g, "");
  return cleaned.slice(0, 3).toUpperCase() || "??";
}

export function getTriaseStatusCfg(status: TriaseStatus) {
  if (status === "Non_Aktif") {
    return { label: "Non-Aktif", bg: "bg-slate-100", text: "text-slate-500", dot: "bg-slate-400" };
  }
  return { label: "Aktif", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" };
}
