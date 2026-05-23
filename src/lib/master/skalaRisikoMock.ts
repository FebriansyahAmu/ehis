/**
 * Master Skala Risiko — mock data.
 *
 * Konsumen: IGD `PenilaianTab` · RI `PenilaianRisikoPane` · RJ skrining
 * Replace: `rawat-inap/asesmenAwal/asesmenAwalShared.ts` (Barthel/Morse/Braden)
 *           `igd/tabs/PenilaianTab.tsx` (duplicate Morse/Braden/Barthel)
 *
 * Standar: validated assessment tools (Mahoney 1965 · Morse 1989 · Braden 1987 · NRS · BAPEN MUST)
 */

import {
  type SkalaRecord, emptySkalaRecord,
} from "./skalaCommon";

// Re-export types untuk backward-compat dengan components yang import dari sini.
export type {
  SkalaRecord, SkalaScoringMode, SkalaArah, SkalaModulKonsumen,
  SkalaTone, SkalaStatus, SkalaOption, SkalaItem, SkalaInterpretasi,
} from "./skalaCommon";

/** Alias eksplisit untuk dipakai di components Skala Risiko. */
export type SkalaRisikoRecord = SkalaRecord;

export function emptySkalaRisikoRecord(): SkalaRisikoRecord {
  return emptySkalaRecord("skl");
}

// ── Mock data ────────────────────────────────────────────

const BARTHEL: SkalaRisikoRecord = {
  id: "skl-barthel",
  kode: "BARTHEL",
  nama: "Barthel Index",
  singkat: "ADL",
  deskripsi:
    "Indeks penilaian Activities of Daily Living (ADL). Mengukur tingkat kemandirian pasien dalam 10 aktivitas harian.",
  scoringMode: "sum_items",
  arah: "lower_is_worse",
  totalMax: 100,
  referensi: "Mahoney FI, Barthel DW. Maryland State Med J 1965;14:61-65.",
  konsumenModul: ["IGD", "RI", "RJ"],
  status: "Aktif",
  items: [
    { id: "makan", label: "Makan (Feeding)", maxScore: 10, options: [
      { score: 0, label: "Tidak dapat makan sendiri", detail: "Butuh bantuan penuh" },
      { score: 5, label: "Butuh bantuan sebagian", detail: "Memotong, mengoles, dsb." },
      { score: 10, label: "Mandiri", detail: "Makan dari piring yang telah disiapkan" },
    ]},
    { id: "transfer", label: "Transfer (TT ↔ Kursi)", maxScore: 15, options: [
      { score: 0,  label: "Tidak mampu", detail: "Tidak ada keseimbangan duduk" },
      { score: 5,  label: "Butuh bantuan besar (≥2 orang)" },
      { score: 10, label: "Butuh bantuan minimal (1 orang)" },
      { score: 15, label: "Mandiri" },
    ]},
    { id: "grooming", label: "Membersihkan Diri", maxScore: 5, options: [
      { score: 0, label: "Tergantung orang lain" },
      { score: 5, label: "Mandiri", detail: "Cuci muka, sisir, sikat gigi, bercukur" },
    ]},
    { id: "toilet", label: "Penggunaan Toilet", maxScore: 10, options: [
      { score: 0,  label: "Tergantung orang lain" },
      { score: 5,  label: "Butuh bantuan sebagian" },
      { score: 10, label: "Mandiri" },
    ]},
    { id: "mandi", label: "Mandi (Bathing)", maxScore: 5, options: [
      { score: 0, label: "Tergantung orang lain" },
      { score: 5, label: "Mandiri tanpa pengawasan" },
    ]},
    { id: "berjalan", label: "Berjalan di Permukaan Rata", maxScore: 15, options: [
      { score: 0,  label: "Tidak mampu berjalan" },
      { score: 5,  label: "Mandiri dengan kursi roda (>50 m)" },
      { score: 10, label: "Berjalan dengan bantuan (>50 m)" },
      { score: 15, label: "Mandiri (>50 m)" },
    ]},
    { id: "tangga", label: "Naik Turun Tangga", maxScore: 10, options: [
      { score: 0,  label: "Tidak mampu" },
      { score: 5,  label: "Butuh bantuan", detail: "Fisik atau verbal" },
      { score: 10, label: "Mandiri" },
    ]},
    { id: "berpakaian", label: "Berpakaian (Dressing)", maxScore: 10, options: [
      { score: 0,  label: "Tergantung orang lain" },
      { score: 5,  label: "Butuh bantuan sebagian" },
      { score: 10, label: "Mandiri", detail: "Termasuk tali, kancing, resleting" },
    ]},
    { id: "bab", label: "Mengontrol BAB (Bowels)", maxScore: 10, options: [
      { score: 0,  label: "Inkontinensia / butuh enema" },
      { score: 5,  label: "Kadang inkontinensia (≤1×/minggu)" },
      { score: 10, label: "Kontinen" },
    ]},
    { id: "bak", label: "Mengontrol BAK (Bladder)", maxScore: 10, options: [
      { score: 0,  label: "Inkontinensia / kateter permanen" },
      { score: 5,  label: "Kadang inkontinensia (<24 jam)" },
      { score: 10, label: "Kontinen / kateter mandiri" },
    ]},
  ],
  interpretasi: [
    { id: "b-1", min: 0,   max: 20,  label: "Ketergantungan Penuh",         tone: "rose",    action: "Bantuan total semua aktivitas. Rujuk tim rehabilitasi segera." },
    { id: "b-2", min: 21,  max: 40,  label: "Ketergantungan Berat",         tone: "red",     action: "Bantuan besar sebagian besar aktivitas. Rencanakan fisioterapi & OT." },
    { id: "b-3", min: 41,  max: 60,  label: "Ketergantungan Sedang",        tone: "orange",  action: "Bantuan sebagian aktivitas. Libatkan fisioterapi & OT." },
    { id: "b-4", min: 61,  max: 80,  label: "Ketergantungan Ringan",        tone: "amber",   action: "Relatif mandiri, butuh bantuan beberapa aktivitas." },
    { id: "b-5", min: 81,  max: 99,  label: "Ketergantungan Sangat Ringan", tone: "yellow",  action: "Hampir mandiri penuh, masih 1–2 aktivitas butuh bantuan." },
    { id: "b-6", min: 100, max: 100, label: "Mandiri Penuh",                tone: "emerald", action: "Tidak ada ketergantungan dalam aktivitas harian." },
  ],
};

const MORSE: SkalaRisikoRecord = {
  id: "skl-morse",
  kode: "MORSE",
  nama: "Morse Fall Scale",
  singkat: "Risiko Jatuh",
  deskripsi:
    "Skala penilaian risiko jatuh pada pasien dewasa. Skor lebih tinggi = risiko jatuh lebih besar.",
  scoringMode: "sum_items",
  arah: "higher_is_worse",
  totalMax: 125,
  referensi: "Morse JM, Morse RM, Tylko SJ. Can J Aging 1989;8:366-377.",
  konsumenModul: ["IGD", "RI", "RJ"],
  status: "Aktif",
  items: [
    { id: "riwayat", label: "Riwayat Jatuh (3 bulan terakhir)", maxScore: 25, options: [
      { score: 0, label: "Tidak ada riwayat jatuh" },
      { score: 25, label: "Ya, ada riwayat jatuh" },
    ]},
    { id: "diagSekunder", label: "Diagnosis Sekunder (>1 diagnosis)", maxScore: 15, options: [
      { score: 0, label: "Tidak" }, { score: 15, label: "Ya" },
    ]},
    { id: "alatBantu", label: "Alat Bantu Ambulasi", maxScore: 30, options: [
      { score: 0,  label: "Tidak perlu / Tirah Baring / Dibantu Perawat" },
      { score: 15, label: "Tongkat / Kruk / Walker / Kursi Roda" },
      { score: 30, label: "Berpegangan pada Furnitur / Dinding" },
    ]},
    { id: "infusIV", label: "Terpasang Infus IV / Antikoagulan", maxScore: 20, options: [
      { score: 0, label: "Tidak" }, { score: 20, label: "Ya" },
    ]},
    { id: "gayaBerjalan", label: "Gaya Berjalan", maxScore: 20, options: [
      { score: 0,  label: "Normal / Tirah Baring / Kursi Roda" },
      { score: 10, label: "Lemah", detail: "Mengangkat kaki tapi pendek langkah" },
      { score: 20, label: "Terganggu", detail: "Terhuyung-huyung, tidak stabil" },
    ]},
    { id: "statusMental", label: "Status Mental", maxScore: 15, options: [
      { score: 0,  label: "Sadar sesuai kemampuan fisik" },
      { score: 15, label: "Lupa / tidak menyadari keterbatasan diri" },
    ]},
  ],
  interpretasi: [
    { id: "m-1", min: 0,  max: 24,  label: "Risiko Rendah", tone: "emerald", action: "Prosedur pencegahan jatuh rutin. Edukasi pasien & keluarga." },
    { id: "m-2", min: 25, max: 44,  label: "Risiko Sedang", tone: "amber",   action: "Intervensi pencegahan jatuh standar. Pasang gelang kuning." },
    { id: "m-3", min: 45, max: 125, label: "Risiko Tinggi", tone: "rose",    action: "Intervensi intensif. Gelang kuning + bed rail + call bell + supervisi ketat." },
  ],
};

const BRADEN: SkalaRisikoRecord = {
  id: "skl-braden",
  kode: "BRADEN",
  nama: "Braden Scale",
  singkat: "Risiko Dekubitus",
  deskripsi:
    "Skala penilaian risiko dekubitus (luka tekan). INVERSE: skor lebih rendah = risiko lebih tinggi.",
  scoringMode: "sum_items",
  arah: "lower_is_worse",
  totalMax: 23,
  referensi: "Bergstrom N, Braden BJ, Laguzza A, Holman V. Nurs Res 1987;36(4):205-210.",
  konsumenModul: ["RI", "ICU"],
  status: "Aktif",
  items: [
    { id: "persepsi", label: "Persepsi Sensorik", maxScore: 4, options: [
      { score: 1, label: "Terbatas Penuh",   detail: "Tidak ada respons rangsangan nyeri" },
      { score: 2, label: "Sangat Terbatas",  detail: "Respons hanya nyeri" },
      { score: 3, label: "Sedikit Terbatas", detail: "Merespons perintah verbal" },
      { score: 4, label: "Tidak Terbatas",   detail: "Tidak ada kelainan sensori" },
    ]},
    { id: "kelembapan", label: "Kelembapan Kulit", maxScore: 4, options: [
      { score: 1, label: "Selalu Lembap",  detail: "Hampir selalu lembap" },
      { score: 2, label: "Sering Lembap",  detail: "Linen min 1×/shift" },
      { score: 3, label: "Kadang Lembap",  detail: "Linen 1×/hari" },
      { score: 4, label: "Jarang Lembap",  detail: "Biasanya kering" },
    ]},
    { id: "aktivitas", label: "Aktivitas", maxScore: 4, options: [
      { score: 1, label: "Berbaring di TT" },
      { score: 2, label: "Di Kursi", detail: "Tidak bisa berjalan / sangat terbatas" },
      { score: 3, label: "Kadang Berjalan", detail: "Jarak pendek" },
      { score: 4, label: "Sering Berjalan", detail: "Min 2×/hari di luar kamar" },
    ]},
    { id: "mobilisasi", label: "Mobilisasi", maxScore: 4, options: [
      { score: 1, label: "Tidak Dapat Bergerak" },
      { score: 2, label: "Sangat Terbatas",  detail: "Perubahan posisi minimal" },
      { score: 3, label: "Sedikit Terbatas", detail: "Bisa ganti posisi sendiri" },
      { score: 4, label: "Tidak Terbatas",   detail: "Bergerak bebas tanpa bantuan" },
    ]},
    { id: "nutrisi", label: "Nutrisi", maxScore: 4, options: [
      { score: 1, label: "Sangat Buruk",            detail: "Tidak pernah habis makan" },
      { score: 2, label: "Kemungkinan Tidak Adekuat", detail: "Jarang habis ½ porsi" },
      { score: 3, label: "Adekuat",                 detail: ">½ porsi atau nutrisi enteral" },
      { score: 4, label: "Sangat Baik",             detail: "Habiskan semua porsi" },
    ]},
    { id: "friksi", label: "Friksi & Geseran", maxScore: 3, options: [
      { score: 1, label: "Masalah",         detail: "Butuh bantuan penuh saat berpindah" },
      { score: 2, label: "Potensi Masalah", detail: "Sedikit bantuan, kadang melorot" },
      { score: 3, label: "Tidak Ada Masalah", detail: "Berpindah sendiri" },
    ]},
  ],
  interpretasi: [
    { id: "br-1", min: 0,  max: 9,  label: "Risiko Sangat Tinggi", tone: "rose",    action: "Reposisi tiap 1–2 jam. Kasur khusus antidekubitus." },
    { id: "br-2", min: 10, max: 12, label: "Risiko Tinggi",        tone: "red",     action: "Reposisi tiap 2 jam. Pertimbangkan kasur antidekubitus." },
    { id: "br-3", min: 13, max: 14, label: "Risiko Sedang",        tone: "amber",   action: "Reposisi tiap 2–3 jam. Inspeksi kulit tiap shift." },
    { id: "br-4", min: 15, max: 18, label: "Risiko Rendah",        tone: "yellow",  action: "Monitor kulit tiap shift. Edukasi pasien." },
    { id: "br-5", min: 19, max: 23, label: "Tidak Berisiko",       tone: "emerald", action: "Tidak ada risiko bermakna saat ini." },
  ],
};

const NRS_PAIN: SkalaRisikoRecord = {
  id: "skl-nrs",
  kode: "NRS-PAIN",
  nama: "NRS Pain Scale",
  singkat: "Skala Nyeri",
  deskripsi:
    "Numeric Rating Scale untuk pengukuran intensitas nyeri pasien dewasa. Skala 0 (tidak nyeri) hingga 10 (nyeri maksimal).",
  scoringMode: "select_value",
  arah: "higher_is_worse",
  totalMax: 10,
  referensi: "Hartrick CT, Kovan JP, Shapiro S. Pain Pract 2003;3(4):310-316.",
  konsumenModul: ["IGD", "RI", "RJ"],
  status: "Aktif",
  items: [
    { id: "nrs", label: "Pilih intensitas nyeri", maxScore: 10, options: [
      { score: 0,  label: "0 — Tidak Nyeri" },
      { score: 1,  label: "1 — Sangat Ringan" },
      { score: 2,  label: "2 — Ringan" },
      { score: 3,  label: "3 — Ringan–Sedang" },
      { score: 4,  label: "4 — Sedang" },
      { score: 5,  label: "5 — Sedang Kuat" },
      { score: 6,  label: "6 — Cukup Berat" },
      { score: 7,  label: "7 — Berat" },
      { score: 8,  label: "8 — Sangat Berat" },
      { score: 9,  label: "9 — Tidak Tertahankan" },
      { score: 10, label: "10 — Nyeri Maksimal" },
    ]},
  ],
  interpretasi: [
    { id: "n-1", min: 0,  max: 0,  label: "Tidak Nyeri",   tone: "emerald", action: "Tidak perlu analgesik." },
    { id: "n-2", min: 1,  max: 3,  label: "Nyeri Ringan",  tone: "yellow",  action: "Non-farmakologis atau analgesik step 1 (paracetamol/NSAID)." },
    { id: "n-3", min: 4,  max: 6,  label: "Nyeri Sedang",  tone: "amber",   action: "Analgesik step 2 (opioid lemah). Re-evaluasi 30–60 mnt." },
    { id: "n-4", min: 7,  max: 10, label: "Nyeri Berat",   tone: "rose",    action: "Analgesik step 3 (opioid kuat). Re-evaluasi 15–30 mnt. Konsul nyeri." },
  ],
};

const MUST: SkalaRisikoRecord = {
  id: "skl-must",
  kode: "MUST",
  nama: "MUST (Skrining Gizi)",
  singkat: "Skrining Malnutrisi",
  deskripsi:
    "Malnutrition Universal Screening Tool — alat skrining cepat untuk risiko malnutrisi pada pasien dewasa.",
  scoringMode: "sum_items",
  arah: "higher_is_worse",
  totalMax: 6,
  referensi: "BAPEN Malnutrition Advisory Group. MUST Explanatory Booklet 2003.",
  konsumenModul: ["IGD", "RI", "RJ"],
  status: "Aktif",
  items: [
    { id: "bmi", label: "BMI (kg/m²)", maxScore: 2, options: [
      { score: 0, label: "BMI > 20", detail: "(> 30 obesitas)" },
      { score: 1, label: "BMI 18.5–20" },
      { score: 2, label: "BMI < 18.5" },
    ]},
    { id: "weightLoss", label: "Penurunan BB tanpa Direncanakan (3–6 bulan)", maxScore: 2, options: [
      { score: 0, label: "< 5%" },
      { score: 1, label: "5–10%" },
      { score: 2, label: "> 10%" },
    ]},
    { id: "acuteEffect", label: "Penyakit Akut + Tidak Ada Asupan ≥5 Hari", maxScore: 2, options: [
      { score: 0, label: "Tidak" },
      { score: 2, label: "Ya" },
    ]},
  ],
  interpretasi: [
    { id: "mu-1", min: 0, max: 0, label: "Risiko Rendah",  tone: "emerald", action: "Skrining ulang rutin (mingguan di RI / bulanan di RJ)." },
    { id: "mu-2", min: 1, max: 1, label: "Risiko Sedang",  tone: "amber",   action: "Observasi asupan 3 hari. Jika tidak membaik → konsul dietisien." },
    { id: "mu-3", min: 2, max: 6, label: "Risiko Tinggi",  tone: "rose",    action: "Konsul dietisien segera. Rencana intervensi nutrisi." },
  ],
};

export const SKALA_RISIKO_MOCK: SkalaRisikoRecord[] = [
  BARTHEL, MORSE, BRADEN, NRS_PAIN, MUST,
];
