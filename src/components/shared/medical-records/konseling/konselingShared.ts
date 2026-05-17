// Konseling Obat Pulang · SNARS PP 5 · PMK 72/2016 Ps. 27

export type KonselingMetode   = "Verbal" | "Tertulis" | "Verbal + Tertulis" | "Demonstrasi";
export type PenerimaMateri    = "Pasien" | "Keluarga" | "Pasien & Keluarga";
export type TingkatPemahaman  = "Baik" | "Cukup" | "Kurang";

export interface KonselingObatItem {
  resepItemId:  string;
  namaObat:     string;
  dosis:        string;
  rute:         string;
  indikasi:     string;
  efekSamping:  string[];
  penyimpanan:  string;
  dikonseling:  boolean;
}

export interface KonselingRecord {
  id:              string;
  noRM:            string;
  tanggal:         string;
  metode:          KonselingMetode;
  penerimaMateri:  PenerimaMateri;
  bahasa:          string;
  durasiMenit:     number;
  pemahaman:       TingkatPemahaman;
  obat:            KonselingObatItem[];
  apoteker:        string;
  ttdPasien:       boolean;
  catatan?:        string;
}

// ── Drug info lookup ──────────────────────────────────────

interface DrugInfo { indikasi: string; efekSamping: string[]; penyimpanan: string }

const DRUG_INFO_MAP: { kw: string[]; info: DrugInfo }[] = [
  {
    kw: ["furosemide", "furosemid"],
    info: {
      indikasi:    "Mengurangi kelebihan cairan pada gagal jantung dan edema",
      efekSamping: ["Penurunan kalium darah (hipokalemia)", "Penurunan tekanan darah", "Dehidrasi jika berlebihan"],
      penyimpanan: "Suhu ruang (15–30°C), jauhkan dari sinar matahari langsung",
    },
  },
  {
    kw: ["spironolakton", "spironolactone"],
    info: {
      indikasi:    "Mengurangi retensi cairan dan melindungi jantung pada gagal jantung",
      efekSamping: ["Peningkatan kalium darah (hiperkalemia)", "Ginekomastia pada pria", "Pusing"],
      penyimpanan: "Suhu ruang, simpan dalam wadah tertutup rapat",
    },
  },
  {
    kw: ["bisoprolol"],
    info: {
      indikasi:    "Memperlambat denyut jantung dan mengurangi beban kerja jantung",
      efekSamping: ["Kelelahan", "Tangan dan kaki terasa dingin", "Pusing saat berdiri tiba-tiba"],
      penyimpanan: "Suhu ruang (≤25°C), jauhkan dari kelembaban",
    },
  },
  {
    kw: ["captopril"],
    info: {
      indikasi:    "Menurunkan tekanan darah dan melindungi fungsi jantung",
      efekSamping: ["Batuk kering persisten", "Pusing", "Peningkatan kreatinin awal terapi"],
      penyimpanan: "Suhu ruang, simpan di tempat kering. Minum 1 jam sebelum makan",
    },
  },
  {
    kw: ["heparin"],
    info: {
      indikasi:    "Mencegah pembekuan darah (profilaksis trombosis vena dalam)",
      efekSamping: ["Perdarahan di tempat injeksi", "Memar", "Trombositopenia (jarang)"],
      penyimpanan: "Disimpan oleh tenaga kesehatan, injeksi subkutan oleh perawat",
    },
  },
  {
    kw: ["ksr", "kalium klorid", "kcl"],
    info: {
      indikasi:    "Mengganti kadar kalium yang rendah akibat obat diuretik",
      efekSamping: ["Mual atau tidak nyaman di lambung jika diminum saat perut kosong", "Hiperkalemia jika berlebihan"],
      penyimpanan: "Suhu ruang. Diminum sesudah makan untuk mengurangi gangguan lambung",
    },
  },
];

export function getDrugInfo(namaObat: string): DrugInfo {
  const low = namaObat.toLowerCase();
  for (const entry of DRUG_INFO_MAP) {
    if (entry.kw.some((kw) => low.includes(kw))) return entry.info;
  }
  return {
    indikasi:    "Lihat informasi dari dokter / apoteker",
    efekSamping: ["Informasikan ke tenaga kesehatan jika ada keluhan baru"],
    penyimpanan: "Suhu ruang, jauhkan dari jangkauan anak-anak",
  };
}

export const PEMAHAMAN_CFG: Record<TingkatPemahaman, { label: string; cls: string; badge: string }> = {
  Baik:   { label: "Baik",   cls: "text-emerald-700", badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" },
  Cukup:  { label: "Cukup",  cls: "text-amber-700",   badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200"       },
  Kurang: { label: "Kurang", cls: "text-rose-700",    badge: "bg-rose-50 text-rose-700 ring-1 ring-rose-200"          },
};

// ── Mock data ─────────────────────────────────────────────

export const KONSELING_MOCK: KonselingRecord[] = [];

export function getKonselingForRM(noRM: string): KonselingRecord[] {
  return KONSELING_MOCK.filter((k) => k.noRM === noRM);
}
