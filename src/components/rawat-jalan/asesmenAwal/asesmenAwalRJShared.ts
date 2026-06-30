// RJ-specific types and mock data for Asesmen Awal Rawat Jalan (SNARS AP 1.1)

// ── Types ─────────────────────────────────────────────────

export interface AnamnesisRJData {
  keluhanUtama:   string;
  rps:            string;
  onsetDurasi:    string;
  faktorPemberat: string;
  faktorPemerut:  string;
  keadaanUmum:    string;
  obatSaatIni:    string;
  savedAt:        string;
}

// ── Mock data ──────────────────────────────────────────────

export const ASESMEN_RJ_MOCK: Record<string, Partial<AnamnesisRJData>> = {
  "RM-2025-021": {
    keluhanUtama:   "Nyeri dada kiri sejak 2 hari, menjalar ke bahu kiri",
    rps:            "Pasien laki-laki 58 tahun datang dengan keluhan nyeri dada kiri sejak 2 hari yang lalu. Nyeri dirasakan seperti tertekan, menjalar ke bahu kiri dan lengan kiri. Nyeri memberat saat aktivitas ringan dan membaik dengan istirahat. Ada keringat dingin. Tidak ada sesak napas berat. Pasien memiliki riwayat CAD dan hipertensi grade II sejak 5 tahun.",
    onsetDurasi:    "2 hari, mendadak",
    faktorPemberat: "Aktivitas fisik, emosi",
    faktorPemerut:  "Istirahat",
    keadaanUmum:    "Tampak sakit sedang, kesadaran kompos mentis, tampak anxious",
    obatSaatIni:    "Amlodipine 5mg (1x1 malam)\nBisoprolol 2.5mg (1x1 pagi)\nAtorvastatin 20mg (1x1 malam)",
  },
  "RM-2025-034": {
    keluhanUtama:   "Demam 3 hari, batuk berdahak, hidung tersumbat",
    rps:            "Pasien wanita 34 tahun mengeluh demam sejak 3 hari yang lalu, suhu tertinggi 38.8°C di rumah. Disertai batuk berdahak berwarna putih kekuningan, hidung tersumbat dan pilek. Tenggorokan terasa sakit. Tidak ada sesak napas. Nafsu makan menurun. Sudah minum paracetamol di rumah, demam turun sementara lalu naik kembali.",
    onsetDurasi:    "3 hari, bertahap",
    faktorPemberat: "Cuaca dingin, kelelahan",
    faktorPemerut:  "Istirahat, paracetamol",
    keadaanUmum:    "Tampak sakit sedang, kesadaran kompos mentis, mukosa hiperemis",
    obatSaatIni:    "Vitamin C 500mg (1x1)",
  },
};
