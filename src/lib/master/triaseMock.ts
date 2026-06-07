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

/** Hint tipe nilai parameter — fondasi auto-klasifikasi level dari TTV.
 *  Kategori = pilihan teks · Numerik = ambang ukur (pakai `satuan`) · Teks = bebas. */
export type TriaseValueType = "Kategori" | "Numerik" | "Teks";

export const TRIASE_VALUE_TYPE_OPTIONS: { value: TriaseValueType; label: string }[] = [
  { value: "Kategori", label: "Kategori" },
  { value: "Numerik", label: "Numerik" },
  { value: "Teks", label: "Teks" },
];

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
  /** Hint tipe nilai (fondasi auto-klasifikasi level dari TTV). Default "Kategori". */
  tipeNilai: TriaseValueType;
  /** Satuan ukur untuk parameter Numerik (mis. "×/mnt", "mmHg", "%", "°C"). */
  satuan?: string;
  /** Map level.kode → DAFTAR item kriteria sel (boleh >1). [] / tak ada = tak applicable. */
  values: Record<string, string[]>;
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
    tipeNilai: "Kategori",
    values: {
      resusitasi: ["Tersumbat total / apnea", "Obstruksi total jalan napas", "Butuh airway definitif segera"],
      emergency:  ["Tersumbat parsial, stridor", "Risiko obstruksi (luka bakar inhalasi / edema)", "Butuh manuver jalan napas"],
      urgent:     ["Bebas, perlu bantuan", "Sekret banyak / perlu suction berkala"],
      lessUrgent: ["Bebas"],
      nonUrgent:  ["Bebas"],
      doa:        [],
    },
  },
  {
    id: "pa-breathing",
    kode: "breathing",
    label: "Breathing / RR",
    tipeNilai: "Numerik",
    satuan: "×/mnt",
    values: {
      resusitasi: ["Tidak bernapas / RR < 8", "Distress berat + kelelahan otot napas", "Gasping / sianosis sentral", "Bicara satu kata"],
      emergency:  ["RR > 30 (ATS ≥ 36)", "Distress berat", "Bicara penggal kata", "Retraksi berat"],
      urgent:     ["RR 25–30, distress sedang", "Bicara kalimat pendek"],
      lessUrgent: ["RR 21–24, distress ringan"],
      nonUrgent:  ["RR 12–20 (normal)"],
      doa:        [],
    },
  },
  {
    id: "pa-sirkulasi",
    kode: "sirkulasi",
    label: "Sirkulasi / TD",
    tipeNilai: "Numerik",
    satuan: "mmHg",
    values: {
      resusitasi: ["Henti jantung / TD tidak terukur", "Syok berat", "Perdarahan tak terkontrol"],
      emergency:  ["TD < 90 mmHg (syok)", "Hipoperfusi: akral dingin, CRT > 3 dtk, diaforesis, pucat"],
      urgent:     ["TD 90–100 mmHg", "Hemodynamic compromise borderline", "Krisis hipertensi bergejala"],
      lessUrgent: ["TD borderline tanpa gejala · perfusi baik"],
      nonUrgent:  ["TD normal"],
      doa:        [],
    },
  },
  {
    id: "pa-nadi",
    kode: "nadi",
    label: "Nadi",
    tipeNilai: "Numerik",
    satuan: "×/mnt",
    values: {
      resusitasi: ["Tidak teraba", "Nadi sentral lemah / PEA"],
      emergency:  ["< 40 atau > 140 ×/mnt (ESI danger-zone)", "Nadi perifer lemah / thready"],
      urgent:     ["50–<60 atau 100–140 ×/mnt", "Iregular bergejala"],
      lessUrgent: ["100–110 ×/mnt tanpa gejala"],
      nonUrgent:  ["60–100 ×/mnt (normal)"],
      doa:        [],
    },
  },
  {
    id: "pa-kesadaran",
    kode: "kesadaran",
    label: "Kesadaran (GCS)",
    tipeNilai: "Numerik",
    satuan: "GCS",
    values: {
      resusitasi: ["GCS ≤ 8 · Koma", "Unresponsive (AVPU = U/P)", "Penurunan kesadaran akut"],
      emergency:  ["GCS 9–12 · Somnolen", "Agitasi berat / violent", "AVPU = P"],
      urgent:     ["GCS 13–14 · Apatis / Delirium", "Bingung baru · AVPU = V"],
      lessUrgent: ["GCS 15 · Sadar penuh · Alert"],
      nonUrgent:  ["GCS 15"],
      doa:        [],
    },
  },
  {
    id: "pa-nyeri",
    kode: "nyeri",
    label: "Skala Nyeri (VAS)",
    tipeNilai: "Numerik",
    satuan: "0–10",
    values: {
      resusitasi: [],
      emergency:  ["8–10 · Berat", "Nyeri berat sentral/viseral (dada, abdomen)"],
      urgent:     ["4–7 · Sedang", "Nyeri berat perifer (CTAS L3)"],
      lessUrgent: ["1–3 · Ringan-sedang lokal"],
      nonUrgent:  ["0–2"],
      doa:        [],
    },
  },
  {
    id: "pa-spo2",
    kode: "spo2",
    label: "Saturasi (SpO₂)",
    tipeNilai: "Numerik",
    satuan: "%",
    values: {
      resusitasi: ["< 90% dengan distress berat", "Sianosis sentral"],
      emergency:  ["< 92%"],
      urgent:     ["92–94%"],
      lessUrgent: ["≥ 95%"],
      nonUrgent:  ["Normal (≥ 95%)"],
      doa:        [],
    },
  },
  {
    id: "pa-suhu",
    kode: "suhu",
    label: "Suhu",
    tipeNilai: "Numerik",
    satuan: "°C",
    values: {
      resusitasi: ["Hipotermia berat < 32°C", "Hipertermia > 41°C"],
      emergency:  ["> 38,3°C dengan tanda sepsis", "< 35°C (hipotermia)"],
      urgent:     ["38–39°C", "Demam pada imunokompromais"],
      lessUrgent: ["37,5–38°C"],
      nonUrgent:  ["Afebris (36–37,4°C)"],
      doa:        [],
    },
  },
  {
    id: "pa-perdarahan",
    kode: "perdarahan",
    label: "Perdarahan",
    tipeNilai: "Kategori",
    values: {
      resusitasi: ["Perdarahan masif tak terkontrol", "Syok hemoragik"],
      emergency:  ["Perdarahan aktif signifikan", "Perdarahan internal dicurigai"],
      urgent:     ["Perdarahan terkontrol / sedang"],
      lessUrgent: ["Perdarahan minor (luka kecil)"],
      nonUrgent:  ["Tidak ada perdarahan aktif"],
      doa:        [],
    },
  },
  {
    id: "pa-risiko",
    kode: "risiko",
    label: "Risiko Perilaku",
    tipeNilai: "Kategori",
    values: {
      resusitasi: ["Kekerasan/agresif bersenjata — bahaya segera", "Percobaan bunuh diri berlangsung"],
      emergency:  ["Agitasi berat / risiko kekerasan", "Risiko bunuh diri tinggi"],
      urgent:     ["Gelisah, distress psikologis sedang", "Risiko menengah membahayakan diri"],
      lessUrgent: ["Cemas, kooperatif"],
      nonUrgent:  ["Tenang, tanpa risiko"],
      doa:        [],
    },
  },
  {
    id: "pa-respons",
    kode: "respons",
    label: "Waktu Respons",
    tipeNilai: "Kategori",
    values: {
      resusitasi: ["Segera · tindakan penyelamat nyawa tanpa delay"],
      emergency:  ["< 10 menit"],
      urgent:     ["< 30 menit"],
      lessUrgent: ["< 60 menit"],
      nonUrgent:  ["< 120 menit"],
      doa:        ["Verifikasi kematian"],
    },
  },
  {
    id: "pa-contoh",
    kode: "contoh",
    label: "Contoh Kasus",
    tipeNilai: "Teks",
    values: {
      resusitasi: ["Henti napas / jantung", "Syok berat", "Obstruksi jalan napas total", "Status epileptikus", "Trauma mayor + syok", "Anafilaksis berat"],
      emergency:  ["STEMI / nyeri dada kardiak", "Stroke akut (onset < 4,5 jam)", "Distress napas berat", "Sepsis", "Overdosis", "Perdarahan GIT aktif", "Fraktur terbuka mayor", "Luka bakar luas"],
      urgent:     ["Fraktur tertutup", "Nyeri dada non-kardiak", "Kolik abdomen / ginjal", "Kejang teratasi", "Demam tinggi anak", "Dehidrasi sedang"],
      lessUrgent: ["Luka robek perlu jahit", "Nyeri sedang lokal", "Muntah/diare tanpa dehidrasi", "ISK", "Cedera minor"],
      nonUrgent:  ["ISPA ringan", "Kontrol / resep ulang", "Keluhan kronik stabil", "Luka lecet kecil"],
      doa:        ["Meninggal saat tiba, tanpa tanda kehidupan"],
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
