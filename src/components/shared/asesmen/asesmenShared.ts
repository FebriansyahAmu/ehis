// Shared types, constants, and primitives for Asesmen Medis (IGD + RI)

// ── Minimal patient interface for shared panes ────────────

export interface AsesmenPatientBase {
  noRM: string;
  riwayatAlergi?: string;
  riwayatPenyakitDahulu?: string;
  riwayatKeluarga?: string;
  obatSaatIni?: string;
}

// ── Allergy types ─────────────────────────────────────────

export type AllergyCategory = "Obat" | "Makanan" | "Lainnya";
export type AllergySeverity = "Ringan" | "Sedang" | "Berat";
export type AllergyStatus   = "Terkonfirmasi" | "Dicurigai";

export interface AllergyEntry {
  id: string;
  category: AllergyCategory;
  allergen: string;
  reactions: string[];
  severity: AllergySeverity;
  status: AllergyStatus;
  keterangan: string;
  snomedCode?: string;
}

// ── Riwayat types ─────────────────────────────────────────

export interface ObatEntry {
  id: string;
  nama: string;
  dosis: string;
  frekuensi: string;
  rute: string;
  sejak: string;
  indikasi: string;
}

export interface KeluargaEntry {
  anggota: string;
  penyakit: string[];
  keterangan: string;
}

export interface RawatEntry {
  id: string;
  rs: string;
  unit: string;
  tanggal: string;
  diagnosa: string;
  keterangan: string;
}

export interface BedahEntry {
  id: string;
  tanggal: string;
  tindakan: string;
  rs: string;
  dokter: string;
  keterangan: string;
}

export interface PersalinanEntry {
  id: string;
  tahun: string;
  usiaKeh: string;
  jenis: string;
  bbLahir: string;
  kondisiAnak: string;
  keterangan: string;
}

export type SmokingStatus = "ya" | "tidak" | "mantan";

// ── MUST Gizi types ───────────────────────────────────────

export type GiziScore = 0 | 1 | 2;

export interface GiziState {
  bmi: GiziScore | null;
  bb: GiziScore | null;
  akut: GiziScore | null;
}

// ── Allergy constants ─────────────────────────────────────

import type { LucideIcon } from "lucide-react";
import { Pill, Utensils, ShieldAlert } from "lucide-react";

export const CAT_CFG: Record<AllergyCategory, { icon: LucideIcon; label: string; activeCls: string; iconCls: string }> = {
  Obat:    { icon: Pill,        label: "Obat",    activeCls: "border-indigo-400 bg-indigo-50 text-indigo-700", iconCls: "text-indigo-500"  },
  Makanan: { icon: Utensils,    label: "Makanan", activeCls: "border-orange-300 bg-orange-50 text-orange-700", iconCls: "text-orange-500" },
  Lainnya: { icon: ShieldAlert, label: "Lainnya", activeCls: "border-teal-400   bg-teal-50   text-teal-700",   iconCls: "text-teal-500"   },
};

export const SEV_CFG: Record<AllergySeverity, { activeCls: string; badgeCls: string; borderL: string }> = {
  Ringan: { activeCls: "border-emerald-400 bg-emerald-50 text-emerald-700", badgeCls: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200", borderL: "border-l-4 border-l-emerald-400" },
  Sedang: { activeCls: "border-amber-400   bg-amber-50   text-amber-700",   badgeCls: "bg-amber-100   text-amber-700   ring-1 ring-amber-200",   borderL: "border-l-4 border-l-amber-400"   },
  Berat:  { activeCls: "border-rose-500    bg-rose-50    text-rose-700",    badgeCls: "bg-rose-100    text-rose-700    ring-1 ring-rose-200",    borderL: "border-l-4 border-l-rose-500"    },
};

export const QUICK_PICKS: Record<AllergyCategory, string[]> = {
  Obat:    ["Penisilin", "Amoksisilin", "Aspirin", "Ibuprofen", "Sulfa", "Kodein", "Tetrasiklin", "Ciprofloxacin", "Kontras Radiologi", "Metronidazol", "Tramadol"],
  Makanan: ["Kacang Tanah", "Seafood", "Susu Sapi", "Telur", "Gandum / Gluten", "Kedelai", "Ikan", "Kacang Pohon"],
  Lainnya: ["Lateks", "Serbuk Sari", "Debu", "Bulu Hewan", "Nikel", "Lebah / Serangga", "Parfum", "Getah"],
};

export const REACTIONS: string[] = [
  "Anafilaksis", "Angioedema", "Bronkospasme", "Urtikaria",
  "Ruam / Eritema", "Pruritus", "Mual / Muntah", "Diare",
  "Rinitis", "Sesak Napas",
];

export const SNOMED_CODES: { code: string; display: string }[] = [
  { code: "372687004",  display: "Amoksisilin (Amoxicillin)"     },
  { code: "7947003",    display: "Aspirin"                       },
  { code: "764146007",  display: "Penisilin (Penicillin)"        },
  { code: "387207008",  display: "Ibuprofen"                     },
  { code: "260421004",  display: "Kodein (Codeine)"              },
  { code: "419199007",  display: "Kacang Tanah (Peanut)"         },
  { code: "227493005",  display: "Kacang Pohon (Tree Nut)"       },
  { code: "735029006",  display: "Susu Sapi (Cow's Milk)"        },
  { code: "102263004",  display: "Telur (Egg)"                   },
  { code: "1003755004", display: "Lateks (Natural Rubber Latex)" },
];

export const ALLERGY_MOCK: Record<string, AllergyEntry[]> = {
  "RM-2025-005": [
    { id: "alg-s1", category: "Obat",    allergen: "Penisilin", reactions: ["Anafilaksis", "Urtikaria", "Angioedema"], severity: "Berat",  status: "Terkonfirmasi", keterangan: "Riwayat reaksi anafilaktoid. Hindari semua golongan beta-laktam.", snomedCode: "764146007" },
    { id: "alg-s2", category: "Makanan", allergen: "Seafood",   reactions: ["Urtikaria", "Pruritus"],                  severity: "Sedang", status: "Dicurigai",     keterangan: "Dilaporkan pasien, belum terkonfirmasi tes alergi." },
  ],
  "RM-2025-012": [
    { id: "alg-s3", category: "Obat",    allergen: "Aspirin", reactions: ["Bronkospasme", "Sesak Napas"], severity: "Berat",  status: "Terkonfirmasi", keterangan: "Aspirin-exacerbated respiratory disease (AERD). Hindari seluruh golongan NSAID.", snomedCode: "7947003" },
    { id: "alg-s4", category: "Lainnya", allergen: "Lateks",  reactions: ["Urtikaria", "Pruritus"],       severity: "Ringan", status: "Dicurigai",     keterangan: "", snomedCode: "1003755004" },
  ],
  "RM-2025-003": [
    { id: "alg-ri1", category: "Obat", allergen: "Aspirin", reactions: ["Bronkospasme", "Sesak Napas"], severity: "Berat", status: "Terkonfirmasi", keterangan: "AERD. Dihindari semua NSAID, gunakan paracetamol.", snomedCode: "7947003" },
  ],
};

// ── Riwayat constants ─────────────────────────────────────

export const PENYAKIT_DAHULU_LIST = [
  "Hipertensi", "Diabetes Melitus", "Penyakit Jantung Koroner", "Gagal Jantung",
  "Stroke / TIA", "Asma Bronkial", "PPOK", "Tuberkulosis Paru", "Hepatitis B",
  "Hepatitis C", "HIV / AIDS", "Gagal Ginjal Kronis", "Batu Saluran Kemih",
  "Kanker / Keganasan", "Epilepsi", "Gangguan Jiwa", "Penyakit Tiroid",
  "Reumatoid Artritis", "Lupus (SLE)", "Thalasemia / Anemia Kronis",
];

export const PENYAKIT_BERESIKO = [
  "Hipertensi", "Diabetes Melitus", "Obesitas", "Dislipidemia / Kolesterol Tinggi",
  "Gagal Ginjal", "Penyakit Jantung", "Stroke", "Asma / PPOK",
  "Kanker", "Gangguan Tiroid", "Anemia", "Hepatitis Kronis",
];

export const PERILAKU_BERESIKO = [
  "Merokok Aktif", "Konsumsi Alkohol", "Penggunaan NAPZA / Narkoba",
  "Seks Berisiko Tinggi", "Tidak Rutin Berolahraga",
  "Pola Makan Tidak Sehat", "Kurang Tidur (< 6 jam/hari)", "Stres Berat / Kronis",
];

export const PENYAKIT_KELUARGA_LIST = [
  "Hipertensi", "Diabetes Melitus", "Penyakit Jantung", "Stroke",
  "Kanker", "Tuberkulosis", "Asma", "Thalasemia", "Gangguan Jiwa", "HIV/AIDS",
];

export const ANGGOTA_KELUARGA = [
  "Ayah", "Ibu", "Kakak / Adik", "Kakek (Paternal)",
  "Nenek (Paternal)", "Kakek (Maternal)", "Nenek (Maternal)",
];

export const RUTE_OBAT = ["Oral", "IV", "IM", "SC", "Sublingual", "Topikal", "Inhalasi", "Rektal"];

export const METODE_KB = [
  "IUD / Spiral", "Pil KB", "Suntik KB", "Implan / Susuk",
  "Kondom", "Tubektomi / MOW", "Vasektomi / MOP", "Kalender / Alami",
  "Tidak Menggunakan KB",
] as const;

export const JENIS_PERSALINAN = [
  "Spontan / Normal", "Seksio Sesaria (SC)", "Vakum / Forseps",
  "Persalinan Prematur", "Sungsang",
];

// ── MUST constants ────────────────────────────────────────

export const MUST_QUESTIONS = [
  {
    key: "bmi" as const,
    label: "1. Indeks Massa Tubuh (BMI)",
    options: [
      { label: "BMI > 20 kg/m²",           score: 0 as GiziScore, hint: "Normal / Baik" },
      { label: "BMI 18.5 – 20 kg/m²",      score: 1 as GiziScore, hint: "Borderline" },
      { label: "BMI < 18.5 kg/m²",         score: 2 as GiziScore, hint: "Underweight" },
    ],
  },
  {
    key: "bb" as const,
    label: "2. Penurunan Berat Badan (3–6 bulan terakhir)",
    options: [
      { label: "< 5%",   score: 0 as GiziScore, hint: "Tidak bermakna" },
      { label: "5 – 10%", score: 1 as GiziScore, hint: "Bermakna" },
      { label: "> 10%",  score: 2 as GiziScore, hint: "Signifikan" },
    ],
  },
  {
    key: "akut" as const,
    label: "3. Efek Penyakit Akut",
    options: [
      { label: "Tidak ada penyakit akut / asupan tetap adekuat", score: 0 as GiziScore, hint: "Tidak ada efek" },
      { label: "Sakit akut — asupan sangat kurang > 5 hari",     score: 2 as GiziScore, hint: "Berisiko tinggi" },
    ],
  },
];

export const GIZI_RISK: Record<string, { label: string; cls: string; action: string }> = {
  low:  { label: "Risiko Rendah",  cls: "bg-emerald-50 text-emerald-700 border-emerald-200", action: "Monitor dan catat asupan secara rutin." },
  mid:  { label: "Risiko Sedang",  cls: "bg-amber-50 text-amber-700 border-amber-200",       action: "Monitor asupan. Pertimbangkan konsultasi ke Ahli Gizi." },
  high: { label: "Risiko Tinggi",  cls: "bg-rose-50 text-rose-700 border-rose-200",          action: "Rujuk ke Ahli Gizi segera. Buat rencana intervensi gizi." },
};

export function getGiziRisk(total: number, allFilled: boolean) {
  if (!allFilled) return null;
  if (total >= 2) return GIZI_RISK.high;
  if (total === 1) return GIZI_RISK.mid;
  return GIZI_RISK.low;
}

// ── Gizi History ──────────────────────────────────────────

export type GiziRiskKey = "low" | "mid" | "high";

export interface GiziHistoryEntry {
  id: string;
  savedAt: string;
  tanggal: string;
  petugas: string;
  scores: GiziState;
  total: number;
  risk: GiziRiskKey;
  ahliGizi: string;
  catatan: string;
}

export function getGiziRiskKey(total: number): GiziRiskKey {
  if (total >= 2) return "high";
  if (total === 1) return "mid";
  return "low";
}

export const GIZI_HISTORY_MOCK: Record<string, GiziHistoryEntry[]> = {
  "RM-2025-003": [
    {
      id: "gizi-h1",
      savedAt: "2026-05-13T08:30:00",
      tanggal: "2026-05-13",
      petugas: "Ns. Siti Rahayu, S.Kep",
      scores: { bmi: 2, bb: 1, akut: 2 },
      total: 5,
      risk: "high",
      ahliGizi: "Dr. Amalia Nurhasanah, SGz",
      catatan: "Pasien tampak kurus, intake oral sangat minimal sejak masuk. Dirujuk ahli gizi untuk rencana intervensi nutrisi parsial.",
    },
    {
      id: "gizi-h2",
      savedAt: "2026-05-12T14:20:00",
      tanggal: "2026-05-12",
      petugas: "Ns. Budi Santoso, S.Kep",
      scores: { bmi: 1, bb: 1, akut: 0 },
      total: 2,
      risk: "high",
      ahliGizi: "Tidak dirujuk saat ini",
      catatan: "Skrining awal MRS. Akan dimonitor asupan makan setiap shift.",
    },
  ],
};
