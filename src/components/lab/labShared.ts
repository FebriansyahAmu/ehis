// Lab Module — Types, Config, Mock Data, Workflow Store
// Standard: ISO 15189:2022 · SNARS AP 5.9/5.11 · PMK 43/2013

// ── Types ─────────────────────────────────────────────────

export type LabStatus =
  | "Menunggu"         // Order placed, awaiting lab receipt
  | "Diterima"         // Identity verified, receipt confirmed (SKP 1)
  | "Ambil Sampel"     // Sample collection in progress
  | "Sampel Diterima"  // Sample registered at lab
  | "Dianalisa"        // Analysis in progress
  | "Divalidasi"       // Awaiting SpPK/supervisor sign-off
  | "Selesai"          // Results released
  | "Ditolak";         // Specimen rejected

export type KategoriLab =
  | "Hematologi" | "Kimia Klinik" | "Urinalisis"
  | "Mikrobiologi" | "Serologi" | "Koagulasi" | "Analisa Gas Darah";

export type PrioritasLab    = "CITO" | "Segera" | "Rutin";
export type UnitAsalLab     = "IGD" | "Rawat Inap" | "Rawat Jalan";
export type FlagHasil       = "N" | "H" | "L" | "C";
export type AlasanPenolakan =
  | "Hemolisis" | "Lipemia" | "Bekuan"
  | "Volume Kurang" | "Salah Tabung" | "Label Rusak/Salah" | "Lainnya";

// ── Interfaces ────────────────────────────────────────────

export interface LabOrderItem {
  id:          string;
  kode:        string;
  nama:        string;
  kategori:    KategoriLab;
  waktuTunggu: string;
  isSpecial?:  boolean;
}

export interface HasilItem {
  kode:          string;
  nama:          string;
  kategori:      KategoriLab;
  nilai?:        string;
  satuan:        string;
  rujukanStr:    string;
  nilaiMin?:     number;
  nilaiMax?:     number;
  criticalLow?:  number;
  criticalHigh?: number;
  flag?:         FlagHasil;
}

export interface SpecimenInfo {
  jenisTube:     string;
  volumeMl?:     string;
  waktuAmbil?:   string;
  petugas?:      string;
  lokasi?:       string;
  kondisi?:      "Baik" | AlasanPenolakan;
  noRegistrasi?: string;
  waktuTerima?:  string;
}

export interface PenolakanInfo {
  alasan:     AlasanPenolakan | string;
  waktu:      string;
  petugas:    string;
  instruksi?: string;
}

export interface CriticalNotif {
  testNama:         string;
  nilai:            string;
  threshold:        string;
  konfirmasiOleh?:  string;
  metode?:          "Telepon" | "SMS" | "WhatsApp" | "Langsung";
  waktu?:           string;
  confirmed:        boolean;
}

export interface LabTimestamps {
  order?:       string;
  terima?:      string;
  ambil?:       string;
  registrasi?:  string;
  analisa?:     string;
  validasi?:    string;
  rilis?:       string;
}

export interface LabOrder {
  id:                string;
  noOrder:           string;
  noRM:              string;
  namaPasien:        string;
  tanggalLahir:      string;
  usia:              number;
  gender:            "L" | "P";
  tanggal:           string;
  jam:               string;
  dokter:            string;
  unitAsal:          UnitAsalLab;
  ruangan?:          string;
  prioritas:         PrioritasLab;
  status:            LabStatus;
  items:             LabOrderItem[];
  hasil?:            HasilItem[];
  specimen?:         SpecimenInfo;
  catatan?:          string;
  penolakan?:        PenolakanInfo;
  criticalNotifs?:   CriticalNotif[];
  timestamps:        LabTimestamps;
  diterima_oleh?:    string;
  analis?:           string;
  validator?:        string;
  catatanValidator?: string;
}

export interface LabWorkflowData {
  status?:           LabStatus;
  hasil?:            HasilItem[];
  specimen?:         SpecimenInfo;
  penolakan?:        PenolakanInfo;
  criticalNotifs?:   CriticalNotif[];
  timestamps?:       Partial<LabTimestamps>;
  diterima_oleh?:    string;
  analis?:           string;
  validator?:        string;
  catatanValidator?: string;
}

// ── Config Maps ───────────────────────────────────────────

export const LAB_STATUS_CFG: Record<LabStatus, {
  label: string; badge: string; dot: string; step: number; action: string;
}> = {
  "Menunggu":        { label: "Menunggu",         badge: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",       dot: "bg-slate-400",    step: 0, action: "Terima Order"    },
  "Diterima":        { label: "Diterima",          badge: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",              dot: "bg-sky-400",      step: 1, action: "Ambil Sampel"    },
  "Ambil Sampel":    { label: "Ambil Sampel",      badge: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",           dot: "bg-blue-400",     step: 2, action: "Daftar Sampel"   },
  "Sampel Diterima": { label: "Sampel Diterima",   badge: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",     dot: "bg-violet-400",   step: 3, action: "Entry Hasil"     },
  "Dianalisa":       { label: "Dianalisa",         badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",        dot: "bg-amber-400",    step: 4, action: "Validasi Hasil"  },
  "Divalidasi":      { label: "Menunggu Validasi", badge: "bg-orange-50 text-orange-700 ring-1 ring-orange-200",     dot: "bg-orange-400",   step: 5, action: "Rilis Hasil"     },
  "Selesai":         { label: "Selesai",           badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",  dot: "bg-emerald-400",  step: 6, action: ""               },
  "Ditolak":         { label: "Ditolak",           badge: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",           dot: "bg-rose-400",     step: -1, action: ""              },
};

export const LAB_STATUS_STEPS: LabStatus[] = [
  "Menunggu", "Diterima", "Ambil Sampel", "Sampel Diterima",
  "Dianalisa", "Divalidasi", "Selesai",
];

export const KATEGORI_CFG: Record<KategoriLab, { badge: string; dot: string; abbrev: string }> = {
  "Hematologi":        { badge: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",       dot: "bg-rose-400",    abbrev: "Hema"  },
  "Kimia Klinik":      { badge: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",           dot: "bg-sky-400",     abbrev: "Kimia" },
  "Urinalisis":        { badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",     dot: "bg-amber-400",   abbrev: "Urin"  },
  "Mikrobiologi":      { badge: "bg-teal-50 text-teal-700 ring-1 ring-teal-200",        dot: "bg-teal-400",    abbrev: "Mikro" },
  "Serologi":          { badge: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",  dot: "bg-violet-400",  abbrev: "Sero"  },
  "Koagulasi":         { badge: "bg-orange-50 text-orange-700 ring-1 ring-orange-200",  dot: "bg-orange-400",  abbrev: "Koag"  },
  "Analisa Gas Darah": { badge: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",    dot: "bg-slate-500",   abbrev: "AGD"   },
};

export const PRIORITAS_CFG: Record<PrioritasLab, { badge: string; ring: string }> = {
  CITO:   { badge: "bg-rose-500 text-white",       ring: "ring-rose-300"  },
  Segera: { badge: "bg-amber-100 text-amber-700",  ring: "ring-amber-200" },
  Rutin:  { badge: "bg-slate-100 text-slate-600",  ring: "ring-slate-200" },
};

export const UNIT_CFG: Record<UnitAsalLab, { badge: string }> = {
  "IGD":         { badge: "bg-rose-100 text-rose-700"     },
  "Rawat Inap":  { badge: "bg-sky-100 text-sky-700"       },
  "Rawat Jalan": { badge: "bg-emerald-100 text-emerald-700" },
};

export const FLAG_CFG: Record<FlagHasil, { cls: string; label: string }> = {
  N: { cls: "text-emerald-600",                      label: "N"      },
  H: { cls: "text-amber-700 font-bold",              label: "H ↑"    },
  L: { cls: "text-sky-700 font-bold",                label: "L ↓"    },
  C: { cls: "text-rose-700 font-extrabold",          label: "KRITIS" },
};

export const ALASAN_PENOLAKAN: AlasanPenolakan[] = [
  "Hemolisis", "Lipemia", "Bekuan", "Volume Kurang",
  "Salah Tabung", "Label Rusak/Salah", "Lainnya",
];

// ── TAT Configuration ─────────────────────────────────────

export const TAT_TARGET: Record<PrioritasLab | UnitAsalLab, number> = {
  CITO:          60,
  Segera:        120,
  Rutin:         240,
  IGD:           60,
  "Rawat Inap":  120,
  "Rawat Jalan": 120,
};

// ── Mock Data ─────────────────────────────────────────────

const LAB_ORDERS_BASE: LabOrder[] = [
  {
    id: "lab-001",
    noOrder: "LAB/2026/05/1142",
    noRM: "RM-2025-005",
    namaPasien: "Joko Prasetyo",
    tanggalLahir: "1971-03-15",
    usia: 55,
    gender: "L",
    tanggal: "2026-05-18",
    jam: "07:30",
    dokter: "dr. Hendra Wijaya, Sp.EM",
    unitAsal: "IGD",
    prioritas: "CITO",
    status: "Dianalisa",
    catatan: "CITO — Suspek STEMI, troponin urgent",
    items: [
      { id: "i-101", kode: "LAB-K018", nama: "Troponin I",            kategori: "Kimia Klinik",      waktuTunggu: "30 mnt", isSpecial: true },
      { id: "i-102", kode: "LAB-H001", nama: "Darah Lengkap (DL)",    kategori: "Hematologi",        waktuTunggu: "1–2 jam" },
      { id: "i-103", kode: "LAB-A001", nama: "Analisa Gas Darah (AGD)", kategori: "Analisa Gas Darah", waktuTunggu: "30 mnt" },
    ],
    hasil: [
      { kode: "LAB-K018",   nama: "Troponin I",   kategori: "Kimia Klinik",      nilai: "2.4",  satuan: "ng/mL",    rujukanStr: "< 0.04",      nilaiMax: 0.04,  criticalHigh: 1.0,  flag: "C" },
      { kode: "LAB-H001-1", nama: "Hemoglobin",   kategori: "Hematologi",        nilai: "12.8", satuan: "g/dL",     rujukanStr: "13.5 – 17.5", nilaiMin: 13.5,  nilaiMax: 17.5, criticalLow: 6.0,  criticalHigh: 20.0, flag: "L" },
      { kode: "LAB-H001-2", nama: "Leukosit",     kategori: "Hematologi",        nilai: "14.5", satuan: "×10³/µL",  rujukanStr: "4.5 – 11.0",  nilaiMin: 4.5,   nilaiMax: 11.0, criticalLow: 2.0,  criticalHigh: 30.0, flag: "H" },
      { kode: "LAB-H001-3", nama: "Trombosit",    kategori: "Hematologi",        nilai: "198",  satuan: "×10³/µL",  rujukanStr: "150 – 400",   nilaiMin: 150,   nilaiMax: 400,  criticalLow: 20,   criticalHigh: 1000, flag: "N" },
      { kode: "LAB-H001-4", nama: "Hematokrit",   kategori: "Hematologi",        nilai: "38",   satuan: "%",        rujukanStr: "41 – 53",     nilaiMin: 41,    nilaiMax: 53,   flag: "L" },
      { kode: "LAB-A001-1", nama: "pH",           kategori: "Analisa Gas Darah", satuan: "",    rujukanStr: "7.35 – 7.45", nilaiMin: 7.35, nilaiMax: 7.45, criticalLow: 7.2, criticalHigh: 7.6 },
      { kode: "LAB-A001-2", nama: "pCO2",         kategori: "Analisa Gas Darah", satuan: "mmHg", rujukanStr: "35 – 45",  nilaiMin: 35, nilaiMax: 45, criticalLow: 20, criticalHigh: 70 },
      { kode: "LAB-A001-3", nama: "pO2",          kategori: "Analisa Gas Darah", satuan: "mmHg", rujukanStr: "80 – 100", nilaiMin: 80, nilaiMax: 100, criticalLow: 40 },
    ],
    specimen: {
      jenisTube: "EDTA (ungu) + Heparin Li (hijau) + SST II",
      volumeMl: "3 mL × 3 tabung",
      waktuAmbil: "07:42", petugas: "Ns. Dita", lokasi: "V. antecubiti kanan",
      kondisi: "Baik", noRegistrasi: "REG/2026/05/4421", waktuTerima: "07:48",
    },
    criticalNotifs: [
      { testNama: "Troponin I", nilai: "2.4 ng/mL", threshold: "> 1.0 ng/mL", confirmed: false },
    ],
    timestamps: {
      order: "2026-05-18T07:30", terima: "2026-05-18T07:35",
      ambil: "2026-05-18T07:42", registrasi: "2026-05-18T07:48",
      analisa: "2026-05-18T07:55",
    },
    diterima_oleh: "Dini, A.Md.AK", analis: "Mira, A.Md.AK",
  },

  {
    id: "lab-002",
    noOrder: "LAB/2026/05/1139",
    noRM: "RM-2025-012",
    namaPasien: "Siti Rahayu",
    tanggalLahir: "1994-07-22",
    usia: 32,
    gender: "P",
    tanggal: "2026-05-18",
    jam: "08:15",
    dokter: "dr. Hendra Wijaya, Sp.EM",
    unitAsal: "IGD",
    prioritas: "Rutin",
    status: "Menunggu",
    items: [
      { id: "i-201", kode: "LAB-K001", nama: "Gula Darah Sewaktu (GDS)", kategori: "Kimia Klinik", waktuTunggu: "15 mnt" },
      { id: "i-202", kode: "LAB-K003", nama: "HbA1c",                    kategori: "Kimia Klinik", waktuTunggu: "2 jam"  },
    ],
    timestamps: { order: "2026-05-18T08:15" },
  },

  {
    id: "lab-003",
    noOrder: "LAB/2026/05/0892",
    noRM: "RM-2025-003",
    namaPasien: "Sri Wahyuni",
    tanggalLahir: "1968-11-09",
    usia: 57,
    gender: "P",
    tanggal: "2026-05-18",
    jam: "06:30",
    dokter: "dr. Budi Santoso, Sp.JP",
    unitAsal: "Rawat Inap",
    ruangan: "Bangsal Jantung – Kelas 1, Bed 3A",
    prioritas: "Segera",
    status: "Sampel Diterima",
    catatan: "Monitoring BNP + fungsi ginjal post-eskalasi furosemide",
    items: [
      { id: "i-301", kode: "LAB-K021", nama: "BNP (B-type Natriuretic Peptide)", kategori: "Kimia Klinik", waktuTunggu: "2 jam",   isSpecial: true },
      { id: "i-302", kode: "LAB-K007", nama: "Ureum",                             kategori: "Kimia Klinik", waktuTunggu: "1 jam"  },
      { id: "i-303", kode: "LAB-K008", nama: "Kreatinin",                          kategori: "Kimia Klinik", waktuTunggu: "1 jam"  },
      { id: "i-304", kode: "LAB-K009", nama: "Elektrolit (Na/K/Cl)",               kategori: "Kimia Klinik", waktuTunggu: "1 jam"  },
    ],
    specimen: {
      jenisTube: "Serum (SST II kuning)", volumeMl: "5 mL",
      waktuAmbil: "06:35", petugas: "Ns. Ratna (Shift Pagi)", lokasi: "V. antecubiti kiri",
      kondisi: "Baik", noRegistrasi: "REG/2026/05/4398", waktuTerima: "06:52",
    },
    timestamps: {
      order: "2026-05-18T06:30", terima: "2026-05-18T06:33",
      ambil: "2026-05-18T06:35", registrasi: "2026-05-18T06:52",
    },
    diterima_oleh: "Sari, A.Md.AK",
  },

  {
    id: "lab-004",
    noOrder: "LAB/2026/05/0878",
    noRM: "RM-2025-007",
    namaPasien: "Hasan Basri",
    tanggalLahir: "1963-04-08",
    usia: 63,
    gender: "L",
    tanggal: "2026-05-18",
    jam: "06:00",
    dokter: "dr. Hendra Wijaya, Sp.EM",
    unitAsal: "Rawat Inap",
    ruangan: "ICU – Bed 2",
    prioritas: "CITO",
    status: "Divalidasi",
    catatan: "Panel sepsis + fungsi organ — evaluasi respons antibiotik hari ke-2",
    items: [
      { id: "i-401", kode: "LAB-H001", nama: "Darah Lengkap (DL)",        kategori: "Hematologi",   waktuTunggu: "1–2 jam" },
      { id: "i-402", kode: "LAB-K019", nama: "Prokalsitonin (PCT)",        kategori: "Kimia Klinik", waktuTunggu: "2 jam",   isSpecial: true },
      { id: "i-403", kode: "LAB-K008", nama: "Kreatinin",                   kategori: "Kimia Klinik", waktuTunggu: "1 jam"  },
      { id: "i-404", kode: "LAB-K007", nama: "Ureum",                       kategori: "Kimia Klinik", waktuTunggu: "1 jam"  },
      { id: "i-405", kode: "LAB-K009", nama: "Elektrolit (Na/K/Cl)",        kategori: "Kimia Klinik", waktuTunggu: "1 jam"  },
    ],
    hasil: [
      { kode: "LAB-H001-1", nama: "Hemoglobin",       kategori: "Hematologi",   nilai: "8.2",  satuan: "g/dL",    rujukanStr: "13.5 – 17.5", nilaiMin: 13.5, nilaiMax: 17.5, criticalLow: 6.0,   criticalHigh: 20.0, flag: "L" },
      { kode: "LAB-H001-2", nama: "Leukosit",         kategori: "Hematologi",   nilai: "22.1", satuan: "×10³/µL", rujukanStr: "4.5 – 11.0",  nilaiMin: 4.5,  nilaiMax: 11.0, criticalLow: 2.0,   criticalHigh: 30.0, flag: "H" },
      { kode: "LAB-H001-3", nama: "Trombosit",        kategori: "Hematologi",   nilai: "89",   satuan: "×10³/µL", rujukanStr: "150 – 400",   nilaiMin: 150,  nilaiMax: 400,  criticalLow: 20,    criticalHigh: 1000, flag: "L" },
      { kode: "LAB-H001-4", nama: "Hematokrit",       kategori: "Hematologi",   nilai: "25",   satuan: "%",       rujukanStr: "41 – 53",     nilaiMin: 41,   nilaiMax: 53,   flag: "L" },
      { kode: "LAB-K019",   nama: "Prokalsitonin (PCT)", kategori: "Kimia Klinik", nilai: "12.4", satuan: "ng/mL", rujukanStr: "< 0.5",       nilaiMax: 0.5,  criticalHigh: 10.0, flag: "C" },
      { kode: "LAB-K008",   nama: "Kreatinin",        kategori: "Kimia Klinik", nilai: "3.4",  satuan: "mg/dL",   rujukanStr: "0.7 – 1.2",   nilaiMin: 0.7,  nilaiMax: 1.2,  criticalHigh: 10.0, flag: "H" },
      { kode: "LAB-K007",   nama: "Ureum",            kategori: "Kimia Klinik", nilai: "78",   satuan: "mg/dL",   rujukanStr: "15 – 45",     nilaiMin: 15,   nilaiMax: 45,   flag: "H" },
      { kode: "LAB-K009-1", nama: "Natrium (Na)",     kategori: "Kimia Klinik", nilai: "131",  satuan: "mEq/L",   rujukanStr: "136 – 145",   nilaiMin: 136,  nilaiMax: 145,  criticalLow: 120, criticalHigh: 160, flag: "L" },
      { kode: "LAB-K009-2", nama: "Kalium (K)",       kategori: "Kimia Klinik", nilai: "5.8",  satuan: "mEq/L",   rujukanStr: "3.5 – 5.0",   nilaiMin: 3.5,  nilaiMax: 5.0,  criticalLow: 2.5, criticalHigh: 6.5, flag: "H" },
      { kode: "LAB-K009-3", nama: "Klorida (Cl)",     kategori: "Kimia Klinik", nilai: "101",  satuan: "mEq/L",   rujukanStr: "98 – 107",    nilaiMin: 98,   nilaiMax: 107,  flag: "N" },
    ],
    specimen: {
      jenisTube: "EDTA (ungu) + SST II (kuning)", volumeMl: "3 mL + 5 mL",
      waktuAmbil: "06:08", petugas: "Ns. Dewi ICU", lokasi: "CVC port (line 2)",
      kondisi: "Baik", noRegistrasi: "REG/2026/05/4380", waktuTerima: "06:22",
    },
    criticalNotifs: [
      { testNama: "Prokalsitonin (PCT)", nilai: "12.4 ng/mL", threshold: "> 10.0 ng/mL", confirmed: true, konfirmasiOleh: "dr. Hendra Wijaya, Sp.EM", metode: "Telepon", waktu: "07:25" },
    ],
    timestamps: {
      order: "2026-05-18T06:00", terima: "2026-05-18T06:05",
      ambil: "2026-05-18T06:08", registrasi: "2026-05-18T06:22",
      analisa: "2026-05-18T06:38", validasi: "2026-05-18T07:15",
    },
    diterima_oleh: "Sari, A.Md.AK", analis: "Budi, A.Md.AK",
  },

  {
    id: "lab-005",
    noOrder: "LAB/2026/05/0857",
    noRM: "RM-2025-003",
    namaPasien: "Sri Wahyuni",
    tanggalLahir: "1968-11-09",
    usia: 57,
    gender: "P",
    tanggal: "2026-05-17",
    jam: "06:30",
    dokter: "dr. Budi Santoso, Sp.JP",
    unitAsal: "Rawat Inap",
    ruangan: "Bangsal Jantung – Kelas 1, Bed 3A",
    prioritas: "Rutin",
    status: "Selesai",
    items: [
      { id: "i-501", kode: "LAB-H001", nama: "Darah Lengkap (DL)",   kategori: "Hematologi",   waktuTunggu: "1–2 jam" },
      { id: "i-502", kode: "LAB-K009", nama: "Elektrolit (Na/K/Cl)", kategori: "Kimia Klinik", waktuTunggu: "1 jam"   },
      { id: "i-503", kode: "LAB-K021", nama: "BNP",                   kategori: "Kimia Klinik", waktuTunggu: "2 jam",  isSpecial: true },
    ],
    hasil: [
      { kode: "LAB-H001-1", nama: "Hemoglobin",   kategori: "Hematologi",   nilai: "11.4", satuan: "g/dL",    rujukanStr: "12.0 – 15.5", nilaiMin: 12.0, nilaiMax: 15.5, criticalLow: 6.0,  flag: "L" },
      { kode: "LAB-H001-2", nama: "Leukosit",     kategori: "Hematologi",   nilai: "6.8",  satuan: "×10³/µL", rujukanStr: "4.5 – 11.0",  nilaiMin: 4.5,  nilaiMax: 11.0, flag: "N" },
      { kode: "LAB-H001-3", nama: "Trombosit",    kategori: "Hematologi",   nilai: "241",  satuan: "×10³/µL", rujukanStr: "150 – 400",   nilaiMin: 150,  nilaiMax: 400,  flag: "N" },
      { kode: "LAB-H001-4", nama: "Hematokrit",   kategori: "Hematologi",   nilai: "35",   satuan: "%",       rujukanStr: "36 – 46",     nilaiMin: 36,   nilaiMax: 46,   flag: "L" },
      { kode: "LAB-K009-1", nama: "Natrium (Na)", kategori: "Kimia Klinik", nilai: "139",  satuan: "mEq/L",   rujukanStr: "136 – 145",   nilaiMin: 136,  nilaiMax: 145,  flag: "N" },
      { kode: "LAB-K009-2", nama: "Kalium (K)",   kategori: "Kimia Klinik", nilai: "3.1",  satuan: "mEq/L",   rujukanStr: "3.5 – 5.0",   nilaiMin: 3.5,  nilaiMax: 5.0,  criticalLow: 2.5, criticalHigh: 6.5, flag: "L" },
      { kode: "LAB-K009-3", nama: "Klorida (Cl)", kategori: "Kimia Klinik", nilai: "104",  satuan: "mEq/L",   rujukanStr: "98 – 107",    nilaiMin: 98,   nilaiMax: 107,  flag: "N" },
      { kode: "LAB-K021",   nama: "BNP",          kategori: "Kimia Klinik", nilai: "1240", satuan: "pg/mL",   rujukanStr: "< 100",       nilaiMax: 100,  flag: "H" },
    ],
    specimen: {
      jenisTube: "EDTA (ungu) + SST II (kuning)", kondisi: "Baik",
      noRegistrasi: "REG/2026/05/4211", waktuAmbil: "06:35", waktuTerima: "06:52",
    },
    timestamps: {
      order: "2026-05-17T06:30", terima: "2026-05-17T06:33",
      ambil: "2026-05-17T06:35", registrasi: "2026-05-17T06:52",
      analisa: "2026-05-17T07:10", validasi: "2026-05-17T08:15",
      rilis: "2026-05-17T08:20",
    },
    diterima_oleh: "Sari, A.Md.AK",
    analis: "Mira, A.Md.AK",
    validator: "dr. Anggoro, Sp.PK",
    catatanValidator: "Konsisten dengan klinis GJK akut. Hipokalemia (K 3.1 mEq/L) perlu perhatian — monitor setelah suplementasi KCl. BNP 1240 pg/mL masih tinggi (target pre-discharge < 400 pg/mL). Rekomendasikan cek ulang elektrolit 12–24 jam.",
  },

  {
    id: "lab-006",
    noOrder: "LAB/2026/05/0843",
    noRM: "RM-2025-007",
    namaPasien: "Hasan Basri",
    tanggalLahir: "1963-04-08",
    usia: 63,
    gender: "L",
    tanggal: "2026-05-18",
    jam: "04:30",
    dokter: "dr. Hendra Wijaya, Sp.EM",
    unitAsal: "Rawat Inap",
    ruangan: "ICU – Bed 2",
    prioritas: "Segera",
    status: "Ditolak",
    catatan: "Blood culture set (aerob + anaerob) — demam 38.9°C pukul 04:15",
    items: [
      { id: "i-601", kode: "LAB-M001", nama: "Kultur Darah Aerob + Anaerob", kategori: "Mikrobiologi", waktuTunggu: "3–5 hari", isSpecial: true },
    ],
    specimen: {
      jenisTube: "Botol Kultur Darah (aerob + anaerob)", volumeMl: "10 mL/botol",
      waktuAmbil: "04:38", petugas: "Ns. Dewi ICU",
      lokasi: "V. perifer kiri (tidak dari CVC)",
      kondisi: "Bekuan",
    },
    penolakan: {
      alasan: "Bekuan",
      waktu: "05:10",
      petugas: "Sari, A.Md.AK",
      instruksi: "Specimen bekuan — tidak dapat diproses. Lakukan pengambilan ulang dengan botol kultur baru, teknik aseptik. Gunakan vena perifer (bukan CVC yang sama).",
    },
    timestamps: {
      order: "2026-05-18T04:30", terima: "2026-05-18T04:45",
      ambil: "2026-05-18T04:38", registrasi: "2026-05-18T05:05",
    },
    diterima_oleh: "Sari, A.Md.AK",
  },
];

// ── Workflow Store ─────────────────────────────────────────

const _labStore = new Map<string, LabWorkflowData>();

export function updateLabWorkflow(id: string, data: LabWorkflowData): void {
  const prev = _labStore.get(id) ?? {};
  _labStore.set(id, {
    ...prev,
    ...data,
    timestamps: { ...(prev.timestamps ?? {}), ...(data.timestamps ?? {}) },
  });
}

function mergeOrder(base: LabOrder): LabOrder {
  const overlay = _labStore.get(base.id);
  if (!overlay) return base;
  return {
    ...base,
    ...overlay,
    timestamps: { ...base.timestamps, ...(overlay.timestamps ?? {}) },
    specimen:   overlay.specimen  ?? base.specimen,
    hasil:      overlay.hasil     ?? base.hasil,
    penolakan:  overlay.penolakan ?? base.penolakan,
    criticalNotifs: overlay.criticalNotifs ?? base.criticalNotifs,
  };
}

// ── Public API ─────────────────────────────────────────────

export function deriveLabOrders(): LabOrder[] {
  return LAB_ORDERS_BASE
    .map(mergeOrder)
    .sort((a, b) => {
      const priOrd = { CITO: 0, Segera: 1, Rutin: 2 };
      const pDiff = priOrd[a.prioritas] - priOrd[b.prioritas];
      if (pDiff !== 0) return pDiff;
      return (b.timestamps.order ?? "").localeCompare(a.timestamps.order ?? "");
    });
}

export function getLabOrderById(id: string): LabOrder | null {
  const base = LAB_ORDERS_BASE.find((o) => o.id === id);
  return base ? mergeOrder(base) : null;
}

// ── Utility Functions ─────────────────────────────────────

export function calcTATMenit(from?: string, to?: string): number | null {
  if (!from || !to) return null;
  return Math.round((new Date(to).getTime() - new Date(from).getTime()) / 60000);
}

export function getTATStatus(
  menit: number | null,
  prioritas: PrioritasLab,
  unitAsal: UnitAsalLab,
): "ok" | "warning" | "over" | "pending" {
  if (menit === null) return "pending";
  const target = prioritas === "CITO"
    ? TAT_TARGET.CITO
    : unitAsal === "IGD" ? TAT_TARGET.IGD
    : unitAsal === "Rawat Inap" ? TAT_TARGET["Rawat Inap"]
    : TAT_TARGET["Rawat Jalan"];
  if (menit <= target * 0.8) return "ok";
  if (menit <= target) return "warning";
  return "over";
}

export function getTATElapsed(timestamps: LabTimestamps): number | null {
  if (!timestamps.order) return null;
  const end = timestamps.rilis ?? new Date().toISOString().slice(0, 16);
  return calcTATMenit(timestamps.order, end);
}

export function autoFlag(
  nilai: string | undefined,
  nilaiMin?: number,
  nilaiMax?: number,
  criticalLow?: number,
  criticalHigh?: number,
): FlagHasil | undefined {
  if (!nilai) return undefined;
  const v = parseFloat(nilai);
  if (isNaN(v)) return undefined;
  if (criticalLow  !== undefined && v < criticalLow)  return "C";
  if (criticalHigh !== undefined && v > criticalHigh) return "C";
  if (nilaiMin !== undefined && v < nilaiMin) return "L";
  if (nilaiMax !== undefined && v > nilaiMax) return "H";
  return "N";
}

export function hasCriticalResult(hasil: HasilItem[]): boolean {
  return hasil.some((h) => h.flag === "C" && !!h.nilai);
}

export function fmtTimestamp(ts?: string): string {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}
