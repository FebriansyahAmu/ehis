// RI-specific types and scoring constants for Asesmen Awal (SNARS AP 1)

// ── Types ─────────────────────────────────────────────────

export interface SosialData {
  pekerjaan: string;
  pendidikan: string;
  statusPernikahan: string;
  tinggalBersama: string;
  dukunganKeluarga: "" | "Kuat" | "Cukup" | "Lemah" | "Tidak Ada";
  hambatanKomunikasi: string[];
  kondisiEkonomi: "" | "Mampu" | "Cukup" | "Kurang";
  catatanSosial: string;
}

export interface SpiritualData {
  agama: string;
  kebutuhanSpiritual: boolean | null;
  detailKebutuhan: string;
  penolakanProsedur: boolean | null;
  detailPenolakan: string;
  catatanSpiritual: string;
}

export interface AnamnesisRIData {
  keluhanUtama: string;
  rps: string;
  onsetDurasi: string;
  faktorPemberat: string;
  faktorPemerut: string; // peringan
  statusGeneralis: string;
  obatSaatIni: string;
  sosial: SosialData;
  spiritual: SpiritualData;
  savedAt: string;
}

export interface NyeriData {
  nrs: number | null;
  lokasi: string;
  karakter: string;
  durasi: string;
  pemberat: string;
  peringan: string;
}

// Skala risiko (Barthel/Morse/Braden + skala lain) TIDAK lagi hardcode di sini — ditarik dari
// master `master.SkalaInstrument` (ter-assign unit via konsumenModul) & dirender oleh
// `components/shared/penilaian/SkalaRisikoPanel` di tab top-level "Penilaian" (single source).

// ── NRS Pain constants ────────────────────────────────────

export const NRS_LABELS: Record<number, { label: string; cls: string }> = {
  0:  { label: "Tidak Nyeri",        cls: "bg-emerald-100 text-emerald-700" },
  1:  { label: "Sangat Ringan",      cls: "bg-green-100 text-green-700" },
  2:  { label: "Ringan",             cls: "bg-lime-100 text-lime-700" },
  3:  { label: "Ringan–Sedang",      cls: "bg-yellow-100 text-yellow-700" },
  4:  { label: "Sedang",             cls: "bg-amber-100 text-amber-700" },
  5:  { label: "Sedang Kuat",        cls: "bg-orange-100 text-orange-700" },
  6:  { label: "Cukup Berat",        cls: "bg-orange-200 text-orange-800" },
  7:  { label: "Berat",              cls: "bg-red-100 text-red-700" },
  8:  { label: "Sangat Berat",       cls: "bg-red-200 text-red-800" },
  9:  { label: "Tidak Tertahankan",  cls: "bg-rose-200 text-rose-800" },
  10: { label: "Nyeri Maksimal",     cls: "bg-rose-300 text-rose-900" },
};

export const KARAKTER_NYERI = [
  "Tajam / Menusuk", "Tumpul", "Terbakar", "Berdenyut",
  "Menjalar", "Tertekan", "Kolik / Kram", "Bergerak",
];

// ── Mock data ─────────────────────────────────────────────

const EMPTY_SOSIAL: SosialData = {
  pekerjaan: "", pendidikan: "", statusPernikahan: "", tinggalBersama: "",
  dukunganKeluarga: "", hambatanKomunikasi: [], kondisiEkonomi: "", catatanSosial: "",
};
const EMPTY_SPIRITUAL: SpiritualData = {
  agama: "", kebutuhanSpiritual: null, detailKebutuhan: "",
  penolakanProsedur: null, detailPenolakan: "", catatanSpiritual: "",
};

export const ASESMEN_AWAL_MOCK: Record<string, Partial<AnamnesisRIData>> = {
  "RM-2025-003": {
    keluhanUtama: "Sesak napas memberat",
    rps: "Pasien pria 67 tahun datang dengan keluhan sesak napas yang memberat sejak 3 hari SMRS. Sesak dirasakan saat aktivitas ringan dan bertambah saat berbaring. Disertai bengkak kedua kaki dan batuk berdahak putih. Pasien riwayat gagal jantung kongestif, hipertensi, dan DM tipe 2.",
    onsetDurasi: "Bertahap ± 3 hari SMRS",
    faktorPemberat: "Aktivitas fisik, posisi berbaring",
    faktorPemerut: "Posisi duduk tegak, oksigenasi",
    statusGeneralis: "Tampak sakit sedang, kesadaran kompos mentis. Ortopnea +, edema pretibia bilateral.",
    obatSaatIni: "Bisoprolol 5mg 1×1, Candesartan 8mg 1×1, Furosemid 40mg 1×1, Metformin 500mg 2×1",
    sosial: { ...EMPTY_SOSIAL, pekerjaan: "Pensiunan PNS", pendidikan: "S1", statusPernikahan: "Menikah", tinggalBersama: "Istri dan anak", dukunganKeluarga: "Kuat", kondisiEkonomi: "Cukup" },
    spiritual: { ...EMPTY_SPIRITUAL, agama: "Islam", kebutuhanSpiritual: false, penolakanProsedur: false },
  },
};
