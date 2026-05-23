/**
 * Master Skala Umum — mock data.
 *
 * Konsumen: TTVTab (semua modul) · StatusFisikPane · IGD Triase preview
 * Replace: `shared/medical-records/TTVTab.tsx` (KESADARAN_LABEL)
 *           `rawat-inap/tabs/pemeriksaan/StatusFisikPane.tsx` (KU/KESADARAN/GIZI)
 *
 * Standar: Glasgow Coma Scale (Teasdale 1974) · NEWS2 (RCP 2017) · MEWS (Subbe 2001)
 */

import {
  type SkalaRecord, emptySkalaRecord,
} from "./skalaCommon";

export type {
  SkalaRecord, SkalaScoringMode, SkalaArah, SkalaModulKonsumen,
  SkalaTone, SkalaStatus, SkalaOption, SkalaItem, SkalaInterpretasi,
} from "./skalaCommon";

export type SkalaUmumRecord = SkalaRecord;

export function emptySkalaUmumRecord(): SkalaUmumRecord {
  return emptySkalaRecord("sku");
}

// ── Mock data ────────────────────────────────────────────

const GCS: SkalaUmumRecord = {
  id: "sku-gcs",
  kode: "GCS",
  nama: "Glasgow Coma Scale",
  singkat: "Tingkat Kesadaran Numerik",
  deskripsi:
    "Skala penilaian tingkat kesadaran berbasis respons Eye (E), Verbal (V), Motor (M). Total 3–15.",
  scoringMode: "sum_items",
  arah: "lower_is_worse",
  totalMax: 15,
  referensi: "Teasdale G, Jennett B. Lancet 1974;304(7872):81-84.",
  konsumenModul: ["IGD", "RI", "RJ", "ICU"],
  status: "Aktif",
  items: [
    { id: "eye", label: "Eye Response (E)", maxScore: 4, options: [
      { score: 1, label: "1 — Tidak ada respons" },
      { score: 2, label: "2 — Membuka mata terhadap rangsangan nyeri" },
      { score: 3, label: "3 — Membuka mata terhadap rangsangan suara" },
      { score: 4, label: "4 — Membuka mata spontan" },
    ]},
    { id: "verbal", label: "Verbal Response (V)", maxScore: 5, options: [
      { score: 1, label: "1 — Tidak ada respons" },
      { score: 2, label: "2 — Suara tidak dapat dimengerti" },
      { score: 3, label: "3 — Kata-kata kacau, tidak nyambung" },
      { score: 4, label: "4 — Bingung tapi koheren" },
      { score: 5, label: "5 — Orientasi baik" },
    ]},
    { id: "motor", label: "Motor Response (M)", maxScore: 6, options: [
      { score: 1, label: "1 — Tidak ada respons" },
      { score: 2, label: "2 — Ekstensi abnormal (deserebrasi)" },
      { score: 3, label: "3 — Fleksi abnormal (dekortikasi)" },
      { score: 4, label: "4 — Menarik diri dari rangsangan nyeri" },
      { score: 5, label: "5 — Melokalisir rangsangan nyeri" },
      { score: 6, label: "6 — Mengikuti perintah" },
    ]},
  ],
  interpretasi: [
    { id: "g-1", min: 3,  max: 8,  label: "Cedera Otak Berat",  tone: "rose",    action: "Cedera otak berat. Pertimbangkan intubasi (GCS ≤8). Konsul bedah saraf segera." },
    { id: "g-2", min: 9,  max: 12, label: "Cedera Otak Sedang", tone: "amber",   action: "Observasi ketat di unit intensif. Re-evaluasi tiap 30 menit." },
    { id: "g-3", min: 13, max: 15, label: "Cedera Otak Ringan", tone: "emerald", action: "Observasi rutin. Monitor perubahan kesadaran tiap shift." },
  ],
};

const KESADARAN: SkalaUmumRecord = {
  id: "sku-kesadaran",
  kode: "KESADARAN",
  nama: "Tingkat Kesadaran Klinis",
  singkat: "Status Kesadaran",
  deskripsi:
    "Klasifikasi kesadaran kualitatif (deskriptif). Dipakai bersamaan dengan GCS untuk dokumentasi rutin.",
  scoringMode: "select_value",
  arah: "lower_is_worse",
  totalMax: 6,
  referensi: "Plum F, Posner JB. The Diagnosis of Stupor and Coma. 4th ed. 2007.",
  konsumenModul: ["IGD", "RI", "RJ", "ICU"],
  status: "Aktif",
  items: [
    { id: "lvl", label: "Tingkat Kesadaran", maxScore: 6, options: [
      { score: 6, label: "Compos Mentis",  detail: "Sadar penuh, orientasi waktu/tempat/orang baik" },
      { score: 5, label: "Apatis",         detail: "Sadar tapi acuh tak acuh, masih merespons" },
      { score: 4, label: "Delirium",       detail: "Gelisah, disorientasi, kadang halusinasi" },
      { score: 3, label: "Somnolen",       detail: "Mengantuk berat, bisa dibangunkan, lalu tidur lagi" },
      { score: 2, label: "Sopor",          detail: "Hanya respons rangsangan kuat (nyeri)" },
      { score: 1, label: "Koma",           detail: "Tidak ada respons sama sekali" },
    ]},
  ],
  interpretasi: [
    { id: "k-1", min: 1, max: 2, label: "Kesadaran Sangat Menurun", tone: "rose",    action: "Code blue jika perlu. Intubasi pertimbangkan. ICU." },
    { id: "k-2", min: 3, max: 4, label: "Kesadaran Menurun",        tone: "amber",   action: "Observasi ketat. Cari etiologi (metabolik/struktural/intoksikasi)." },
    { id: "k-3", min: 5, max: 5, label: "Kesadaran Berubah",        tone: "yellow",  action: "Monitor frekuensi tinggi. Evaluasi penyebab delirium reversibel." },
    { id: "k-4", min: 6, max: 6, label: "Sadar Penuh",              tone: "emerald", action: "Tidak butuh intervensi khusus tingkat kesadaran." },
  ],
};

const KU: SkalaUmumRecord = {
  id: "sku-ku",
  kode: "KU",
  nama: "Keadaan Umum (KU)",
  singkat: "Status Klinis Umum",
  deskripsi:
    "Penilaian global keadaan umum pasien saat pemeriksaan fisik. Subjektif klinisi.",
  scoringMode: "select_value",
  arah: "lower_is_worse",
  totalMax: 4,
  referensi: "Bates' Guide to Physical Examination, 13th ed. 2021.",
  konsumenModul: ["IGD", "RI", "RJ"],
  status: "Aktif",
  items: [
    { id: "ku", label: "Keadaan Umum", maxScore: 4, options: [
      { score: 4, label: "Baik",   detail: "Tampak tidak sakit, aktif, kooperatif" },
      { score: 3, label: "Sedang", detail: "Tampak sakit sedang, mampu beraktivitas ringan" },
      { score: 2, label: "Berat",  detail: "Tampak sakit berat, tirah baring" },
      { score: 1, label: "Kritis", detail: "Tanda-tanda syok / impending arrest" },
    ]},
  ],
  interpretasi: [
    { id: "ku-1", min: 1, max: 1, label: "Kritis",  tone: "rose",    action: "Resusitasi segera. ICU." },
    { id: "ku-2", min: 2, max: 2, label: "Berat",   tone: "orange",  action: "Tirah baring total. Monitor intensif." },
    { id: "ku-3", min: 3, max: 3, label: "Sedang",  tone: "amber",   action: "Observasi rutin tiap shift." },
    { id: "ku-4", min: 4, max: 4, label: "Baik",    tone: "emerald", action: "Mobilisasi sesuai toleransi." },
  ],
};

const NEWS2: SkalaUmumRecord = {
  id: "sku-news2",
  kode: "NEWS2",
  nama: "National Early Warning Score 2",
  singkat: "Early Warning Skor",
  deskripsi:
    "Sistem peringatan dini deteriorasi pasien berbasis 7 parameter fisiologis. Direkomendasikan RCP untuk pasien dewasa di ruang rawat.",
  scoringMode: "sum_items",
  arah: "higher_is_worse",
  totalMax: 20,
  referensi: "Royal College of Physicians. NEWS2 Score Report 2017.",
  konsumenModul: ["IGD", "RI"],
  status: "Aktif",
  items: [
    { id: "rr", label: "Frekuensi Napas (×/menit)", maxScore: 3, options: [
      { score: 3, label: "≤8"     },
      { score: 1, label: "9–11"   },
      { score: 0, label: "12–20"  },
      { score: 2, label: "21–24"  },
      { score: 3, label: "≥25"    },
    ]},
    { id: "spo2", label: "SpO₂ (%)", maxScore: 3, options: [
      { score: 3, label: "≤91"   },
      { score: 2, label: "92–93" },
      { score: 1, label: "94–95" },
      { score: 0, label: "≥96"   },
    ]},
    { id: "oxygen", label: "Suplementasi Oksigen", maxScore: 2, options: [
      { score: 0, label: "Tidak (udara ruangan)" },
      { score: 2, label: "Ya, terpasang O₂" },
    ]},
    { id: "temp", label: "Suhu (°C)", maxScore: 3, options: [
      { score: 3, label: "≤35.0"     },
      { score: 1, label: "35.1–36.0" },
      { score: 0, label: "36.1–38.0" },
      { score: 1, label: "38.1–39.0" },
      { score: 2, label: "≥39.1"     },
    ]},
    { id: "sbp", label: "TD Sistolik (mmHg)", maxScore: 3, options: [
      { score: 3, label: "≤90"     },
      { score: 2, label: "91–100"  },
      { score: 1, label: "101–110" },
      { score: 0, label: "111–219" },
      { score: 3, label: "≥220"    },
    ]},
    { id: "hr", label: "Nadi (×/menit)", maxScore: 3, options: [
      { score: 3, label: "≤40"     },
      { score: 1, label: "41–50"   },
      { score: 0, label: "51–90"   },
      { score: 1, label: "91–110"  },
      { score: 2, label: "111–130" },
      { score: 3, label: "≥131"    },
    ]},
    { id: "consc", label: "Kesadaran (AVPU)", maxScore: 3, options: [
      { score: 0, label: "Alert (Sadar penuh)" },
      { score: 3, label: "Confused / V / P / U" },
    ]},
  ],
  interpretasi: [
    { id: "n2-1", min: 0,  max: 0,  label: "Risiko Rendah",       tone: "emerald", action: "Lanjutkan observasi rutin tiap shift." },
    { id: "n2-2", min: 1,  max: 4,  label: "Risiko Rendah-Sedang", tone: "yellow", action: "Observasi tiap 4–6 jam. Lapor perawat senior." },
    { id: "n2-3", min: 5,  max: 6,  label: "Risiko Sedang",        tone: "amber",  action: "Observasi tiap 1 jam. Aktivasi tim respons cepat (≥5 atau skor parameter tunggal = 3)." },
    { id: "n2-4", min: 7,  max: 20, label: "Risiko Tinggi (Kritis)", tone: "rose", action: "Observasi kontinu. Aktivasi MET / code team. Pertimbangkan transfer ICU." },
  ],
};

const MEWS: SkalaUmumRecord = {
  id: "sku-mews",
  kode: "MEWS",
  nama: "Modified Early Warning Score",
  singkat: "Early Warning (Modified)",
  deskripsi:
    "Versi modifikasi NEWS untuk deteksi dini deteriorasi. Lebih ringkas, 5 parameter.",
  scoringMode: "sum_items",
  arah: "higher_is_worse",
  totalMax: 14,
  referensi: "Subbe CP, Kruger M, Rutherford P, Gemmel L. QJM 2001;94(10):521-526.",
  konsumenModul: ["RI", "ICU"],
  status: "Aktif",
  items: [
    { id: "sbp", label: "TD Sistolik (mmHg)", maxScore: 3, options: [
      { score: 3, label: "≤70"     },
      { score: 2, label: "71–80"   },
      { score: 1, label: "81–100"  },
      { score: 0, label: "101–199" },
      { score: 2, label: "≥200"    },
    ]},
    { id: "hr", label: "Nadi (×/menit)", maxScore: 3, options: [
      { score: 2, label: "<40"     },
      { score: 1, label: "40–50"   },
      { score: 0, label: "51–100"  },
      { score: 1, label: "101–110" },
      { score: 2, label: "111–129" },
      { score: 3, label: "≥130"    },
    ]},
    { id: "rr", label: "Frekuensi Napas (×/menit)", maxScore: 3, options: [
      { score: 2, label: "<9"     },
      { score: 0, label: "9–14"   },
      { score: 1, label: "15–20"  },
      { score: 2, label: "21–29"  },
      { score: 3, label: "≥30"    },
    ]},
    { id: "temp", label: "Suhu (°C)", maxScore: 2, options: [
      { score: 2, label: "<35.0"     },
      { score: 0, label: "35.0–38.4" },
      { score: 2, label: "≥38.5"     },
    ]},
    { id: "consc", label: "Kesadaran AVPU", maxScore: 3, options: [
      { score: 0, label: "Alert" },
      { score: 1, label: "Voice (suara)" },
      { score: 2, label: "Pain (nyeri)" },
      { score: 3, label: "Unresponsive" },
    ]},
  ],
  interpretasi: [
    { id: "m-1", min: 0, max: 2,  label: "Risiko Rendah",  tone: "emerald", action: "Observasi rutin tiap shift." },
    { id: "m-2", min: 3, max: 4,  label: "Risiko Sedang",  tone: "amber",   action: "Observasi tiap 2 jam. Lapor perawat senior + DPJP." },
    { id: "m-3", min: 5, max: 14, label: "Risiko Tinggi",  tone: "rose",    action: "Aktivasi MET. Pertimbangkan transfer ICU." },
  ],
};

export const SKALA_UMUM_MOCK: SkalaUmumRecord[] = [
  GCS, KESADARAN, KU, NEWS2, MEWS,
];
