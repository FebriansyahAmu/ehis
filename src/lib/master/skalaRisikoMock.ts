/**
 * Master Skala Risiko — mock data.
 *
 * Konsumen: IGD `PenilaianTab` · RI `PenilaianRisikoPane` · RJ skrining
 * Replace: `rawat-inap/asesmenAwal/asesmenAwalShared.ts` (Barthel/Morse/Braden)
 *           `igd/tabs/PenilaianTab.tsx` (duplicate Morse/Braden/Barthel)
 *
 * Standar: validated assessment tools
 *   Dewasa     : Mahoney 1965 (Barthel) · Morse 1989 · Braden 1987 · NRS · BAPEN MUST · Ferguson 1999 (MST)
 *   Pediatrik  : Humpty Dumpty 2009 · Wong-Baker 1988 · FLACC 1997 · Braden Q 2003 · STRONGkids 2010
 *   Non-verbal : CPOT 2006 (ICU) · NIPS 1993 (neonatus)
 */

// NOTE: import TYPE-ONLY dari skalaCommon (di-strip Node native TS) agar file ini
// bisa di-load skrip seed `node --env-file` tanpa resolusi ekstensi runtime. Helper
// `emptySkalaRisikoRecord` di-inline (tak lagi panggil runtime `emptySkalaRecord`).
import type { SkalaRecord } from "./skalaCommon";

// Re-export types untuk backward-compat dengan components yang import dari sini.
export type {
  SkalaRecord, SkalaScoringMode, SkalaArah, SkalaModulKonsumen,
  SkalaTone, SkalaStatus, SkalaOption, SkalaItem, SkalaInterpretasi,
} from "./skalaCommon";

/** Alias eksplisit untuk dipakai di components Skala Risiko. */
export type SkalaRisikoRecord = SkalaRecord;

export function emptySkalaRisikoRecord(): SkalaRisikoRecord {
  return {
    id: `skl-${Date.now().toString(36)}`,
    kode: "",
    nama: "",
    singkat: "",
    deskripsi: "",
    scoringMode: "sum_items",
    arah: "higher_is_worse",
    items: [],
    totalMax: 0,
    interpretasi: [],
    referensi: "",
    konsumenModul: ["IGD", "RI"],
    status: "Aktif",
  };
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

// ── Pediatrik: Risiko Jatuh ──────────────────────────────
const HUMPTY_DUMPTY: SkalaRisikoRecord = {
  id: "skl-humpty",
  kode: "HUMPTY",
  nama: "Humpty Dumpty Fall Scale",
  singkat: "Jatuh Anak",
  deskripsi:
    "Skala risiko jatuh khusus pasien anak (pediatrik). Skor lebih tinggi = risiko jatuh lebih besar.",
  scoringMode: "sum_items",
  arah: "higher_is_worse",
  totalMax: 23,
  referensi: "Hill-Rodriguez D, et al. J Spec Pediatr Nurs 2009;14(1):22-32.",
  konsumenModul: ["IGD", "RI", "RJ"],
  status: "Aktif",
  items: [
    { id: "usia", label: "Usia", maxScore: 4, options: [
      { score: 4, label: "< 3 tahun" },
      { score: 3, label: "3 – < 7 tahun" },
      { score: 2, label: "7 – < 13 tahun" },
      { score: 1, label: "≥ 13 tahun" },
    ]},
    { id: "kelamin", label: "Jenis Kelamin", maxScore: 2, options: [
      { score: 2, label: "Laki-laki" },
      { score: 1, label: "Perempuan" },
    ]},
    { id: "diagnosis", label: "Diagnosis", maxScore: 4, options: [
      { score: 4, label: "Diagnosis neurologis" },
      { score: 3, label: "Perubahan oksigenasi", detail: "Respiratorik, dehidrasi, anemia, anoreksia, sinkop, pusing" },
      { score: 2, label: "Gangguan psikis / perilaku" },
      { score: 1, label: "Diagnosis lain" },
    ]},
    { id: "kognitif", label: "Gangguan Kognitif", maxScore: 3, options: [
      { score: 3, label: "Tidak menyadari keterbatasan" },
      { score: 2, label: "Lupa keterbatasan diri" },
      { score: 1, label: "Orientasi sesuai kemampuan diri" },
    ]},
    { id: "lingkungan", label: "Faktor Lingkungan", maxScore: 4, options: [
      { score: 4, label: "Riwayat jatuh / bayi-balita di TT dewasa" },
      { score: 3, label: "Pakai alat bantu / bayi-balita di boks / perabot" },
      { score: 2, label: "Pasien berada di tempat tidur" },
      { score: 1, label: "Area rawat jalan" },
    ]},
    { id: "operasi", label: "Respons Pembedahan / Sedasi / Anestesi", maxScore: 3, options: [
      { score: 3, label: "Dalam 24 jam" },
      { score: 2, label: "Dalam 48 jam" },
      { score: 1, label: "> 48 jam / tidak ada" },
    ]},
    { id: "obat", label: "Penggunaan Obat", maxScore: 3, options: [
      { score: 3, label: "Multipel obat berisiko", detail: "Sedatif, hipnotik, barbiturat, fenotiazin, antidepresan, laksatif/diuretik, narkotik" },
      { score: 2, label: "Salah satu obat di atas" },
      { score: 1, label: "Obat lain / tanpa obat" },
    ]},
  ],
  interpretasi: [
    { id: "h-1", min: 0,  max: 11, label: "Risiko Rendah", tone: "emerald", action: "Pencegahan jatuh standar pediatrik. Edukasi orang tua / pengasuh." },
    { id: "h-2", min: 12, max: 23, label: "Risiko Tinggi", tone: "rose",    action: "Intervensi jatuh tinggi: gelang kuning, side rail, supervisi, edukasi intensif keluarga." },
  ],
};

// ── Pediatrik / Self-report: Nyeri ───────────────────────
const WONG_BAKER: SkalaRisikoRecord = {
  id: "skl-wong-baker",
  kode: "WONG-BAKER",
  nama: "Wong-Baker FACES Pain Rating Scale",
  singkat: "Nyeri Wajah",
  deskripsi:
    "Skala nyeri ekspresi wajah untuk anak ≥ 3 tahun yang mampu self-report. Enam wajah, skor 0–10.",
  scoringMode: "select_value",
  arah: "higher_is_worse",
  totalMax: 10,
  referensi: "Wong DL, Baker CM. Pediatr Nurs 1988;14(1):9-17.",
  konsumenModul: ["IGD", "RI", "RJ"],
  status: "Aktif",
  items: [
    { id: "faces", label: "Pilih wajah sesuai nyeri", maxScore: 10, options: [
      { score: 0,  label: "0 — Tidak nyeri", detail: "Wajah sangat senang" },
      { score: 2,  label: "2 — Sedikit nyeri" },
      { score: 4,  label: "4 — Agak lebih nyeri" },
      { score: 6,  label: "6 — Lebih nyeri lagi" },
      { score: 8,  label: "8 — Sangat nyeri" },
      { score: 10, label: "10 — Nyeri hebat", detail: "Menangis / nyeri maksimal" },
    ]},
  ],
  interpretasi: [
    { id: "wb-1", min: 0, max: 0,  label: "Tidak Nyeri",  tone: "emerald", action: "Tidak perlu analgesik." },
    { id: "wb-2", min: 1, max: 3,  label: "Nyeri Ringan", tone: "yellow",  action: "Non-farmakologis / analgesik ringan sesuai BB anak." },
    { id: "wb-3", min: 4, max: 6,  label: "Nyeri Sedang", tone: "amber",   action: "Analgesik terjadwal. Re-evaluasi 30–60 menit." },
    { id: "wb-4", min: 7, max: 10, label: "Nyeri Berat",  tone: "rose",    action: "Analgesik kuat sesuai BB. Re-evaluasi 15–30 menit. Konsul nyeri." },
  ],
};

// ── Anak / Non-verbal: Nyeri Observasional ───────────────
const FLACC: SkalaRisikoRecord = {
  id: "skl-flacc",
  kode: "FLACC",
  nama: "FLACC Behavioral Pain Scale",
  singkat: "Nyeri Non-Verbal",
  deskripsi:
    "Skala nyeri observasional untuk bayi/anak (2 bln–7 thn) atau pasien non-verbal. 5 kategori: Face, Legs, Activity, Cry, Consolability.",
  scoringMode: "sum_items",
  arah: "higher_is_worse",
  totalMax: 10,
  referensi: "Merkel SI, et al. Pediatr Nurs 1997;23(3):293-297.",
  konsumenModul: ["IGD", "RI", "ICU"],
  status: "Aktif",
  items: [
    { id: "face", label: "Wajah (Face)", maxScore: 2, options: [
      { score: 0, label: "Tanpa ekspresi khusus / senyum" },
      { score: 1, label: "Meringis sesekali, menarik diri" },
      { score: 2, label: "Dagu gemetar terus, rahang mengatup" },
    ]},
    { id: "legs", label: "Tungkai (Legs)", maxScore: 2, options: [
      { score: 0, label: "Posisi normal / rileks" },
      { score: 1, label: "Gelisah, tegang" },
      { score: 2, label: "Menendang / kaki tertarik" },
    ]},
    { id: "activity", label: "Aktivitas (Activity)", maxScore: 2, options: [
      { score: 0, label: "Berbaring tenang, bergerak mudah" },
      { score: 1, label: "Menggeliat, tegang, maju-mundur" },
      { score: 2, label: "Melengkung, kaku, menyentak" },
    ]},
    { id: "cry", label: "Menangis (Cry)", maxScore: 2, options: [
      { score: 0, label: "Tidak menangis (sadar / tidur)" },
      { score: 1, label: "Merintih / merengek sesekali" },
      { score: 2, label: "Menangis terus / menjerit" },
    ]},
    { id: "consol", label: "Kemampuan Ditenangkan (Consolability)", maxScore: 2, options: [
      { score: 0, label: "Tenang, rileks" },
      { score: 1, label: "Tenang dengan sentuhan / dapat dialihkan" },
      { score: 2, label: "Sulit dihibur / ditenangkan" },
    ]},
  ],
  interpretasi: [
    { id: "fl-1", min: 0, max: 0,  label: "Rileks / Nyaman",         tone: "emerald", action: "Tidak ada tanda nyeri." },
    { id: "fl-2", min: 1, max: 3,  label: "Ketidaknyamanan Ringan",  tone: "yellow",  action: "Tindakan kenyamanan non-farmakologis." },
    { id: "fl-3", min: 4, max: 6,  label: "Nyeri Sedang",            tone: "amber",   action: "Analgesik sesuai BB. Re-evaluasi 30–60 menit." },
    { id: "fl-4", min: 7, max: 10, label: "Nyeri Berat",             tone: "rose",    action: "Analgesik kuat sesuai BB. Re-evaluasi 15–30 menit." },
  ],
};

// ── Kritis / ICU: Nyeri Observasional ────────────────────
const CPOT: SkalaRisikoRecord = {
  id: "skl-cpot",
  kode: "CPOT",
  nama: "Critical-Care Pain Observation Tool",
  singkat: "Nyeri ICU",
  deskripsi:
    "Skala nyeri observasional untuk pasien kritis non-verbal / terintubasi di ICU. 4 indikator perilaku.",
  scoringMode: "sum_items",
  arah: "higher_is_worse",
  totalMax: 8,
  referensi: "Gélinas C, et al. Am J Crit Care 2006;15(4):420-427.",
  konsumenModul: ["ICU", "RI", "IGD"],
  status: "Aktif",
  items: [
    { id: "wajah", label: "Ekspresi Wajah", maxScore: 2, options: [
      { score: 0, label: "Rileks, netral" },
      { score: 1, label: "Tegang", detail: "Alis menurun, orbit menegang" },
      { score: 2, label: "Meringis", detail: "Di atas + kelopak mata menutup rapat" },
    ]},
    { id: "gerakan", label: "Gerakan Tubuh", maxScore: 2, options: [
      { score: 0, label: "Tidak ada gerakan / posisi normal" },
      { score: 1, label: "Perlindungan", detail: "Gerakan lambat hati-hati, menyentuh area nyeri" },
      { score: 2, label: "Gelisah / agitasi", detail: "Menarik selang, mencoba bangun, tidak ikut perintah" },
    ]},
    { id: "otot", label: "Tegangan Otot", maxScore: 2, options: [
      { score: 0, label: "Rileks", detail: "Tidak ada resistensi gerak pasif" },
      { score: 1, label: "Tegang / kaku", detail: "Resistensi terhadap gerakan pasif" },
      { score: 2, label: "Sangat tegang / kaku", detail: "Resistensi kuat, sulit diselesaikan" },
    ]},
    { id: "ventilasi", label: "Kepatuhan Ventilator / Vokalisasi", maxScore: 2, options: [
      { score: 0, label: "Toleransi ventilator / bicara normal" },
      { score: 1, label: "Batuk tapi toleransi / mendesah-mengerang" },
      { score: 2, label: "Melawan ventilator / menangis keras" },
    ]},
  ],
  interpretasi: [
    { id: "cp-1", min: 0, max: 2, label: "Nyeri Minimal / Terkendali", tone: "emerald", action: "Lanjutkan pemantauan. CPOT > 2 = nyeri signifikan." },
    { id: "cp-2", min: 3, max: 8, label: "Nyeri Signifikan",            tone: "rose",    action: "Berikan / titrasi analgesik. Re-evaluasi setelah intervensi." },
  ],
};

// ── Neonatus: Nyeri Observasional ────────────────────────
const NIPS: SkalaRisikoRecord = {
  id: "skl-nips",
  kode: "NIPS",
  nama: "Neonatal Infant Pain Scale",
  singkat: "Nyeri Neonatus",
  deskripsi:
    "Skala nyeri observasional untuk neonatus / bayi. 6 indikator perilaku & fisiologis.",
  scoringMode: "sum_items",
  arah: "higher_is_worse",
  totalMax: 7,
  referensi: "Lawrence J, et al. Neonatal Netw 1993;12(6):59-66.",
  konsumenModul: ["IGD", "RI", "ICU"],
  status: "Aktif",
  items: [
    { id: "wajah", label: "Ekspresi Wajah", maxScore: 1, options: [
      { score: 0, label: "Rileks" },
      { score: 1, label: "Meringis" },
    ]},
    { id: "tangis", label: "Menangis", maxScore: 2, options: [
      { score: 0, label: "Tidak menangis" },
      { score: 1, label: "Merengek / mengerang" },
      { score: 2, label: "Menangis kuat" },
    ]},
    { id: "napas", label: "Pola Napas", maxScore: 1, options: [
      { score: 0, label: "Rileks / biasa" },
      { score: 1, label: "Perubahan pola napas", detail: "Tidak teratur, lebih cepat, tertahan" },
    ]},
    { id: "lengan", label: "Lengan", maxScore: 1, options: [
      { score: 0, label: "Rileks / tertahan" },
      { score: 1, label: "Fleksi / ekstensi", detail: "Tegang, kaku, gerakan cepat" },
    ]},
    { id: "tungkai", label: "Tungkai", maxScore: 1, options: [
      { score: 0, label: "Rileks / tertahan" },
      { score: 1, label: "Fleksi / ekstensi", detail: "Tegang, kaku, gerakan cepat" },
    ]},
    { id: "arousal", label: "Keadaan Terjaga (Arousal)", maxScore: 1, options: [
      { score: 0, label: "Tidur / tenang" },
      { score: 1, label: "Rewel / gelisah" },
    ]},
  ],
  interpretasi: [
    { id: "ni-1", min: 0, max: 2, label: "Tidak Nyeri / Minimal", tone: "emerald", action: "Lanjutkan pemantauan rutin." },
    { id: "ni-2", min: 3, max: 4, label: "Nyeri Ringan–Sedang",   tone: "amber",   action: "Tindakan kenyamanan (swaddling, sukrosa, ASI). Re-evaluasi." },
    { id: "ni-3", min: 5, max: 7, label: "Nyeri Berat",           tone: "rose",    action: "Analgesik sesuai protokol neonatus. Re-evaluasi ketat." },
  ],
};

// ── Pediatrik: Risiko Dekubitus ──────────────────────────
const BRADEN_Q: SkalaRisikoRecord = {
  id: "skl-braden-q",
  kode: "BRADEN-Q",
  nama: "Braden Q Scale",
  singkat: "Dekubitus Anak",
  deskripsi:
    "Skala risiko dekubitus khusus pasien anak (21 hari–8 tahun). 7 subskala. INVERSE: skor lebih rendah = risiko lebih tinggi.",
  scoringMode: "sum_items",
  arah: "lower_is_worse",
  totalMax: 28,
  referensi: "Curley MAQ, Razmus IS, Roberts KE, Wypij D. Nurs Res 2003;52(1):22-33.",
  konsumenModul: ["RI", "ICU"],
  status: "Aktif",
  items: [
    { id: "mobilisasi", label: "Mobilitas", maxScore: 4, options: [
      { score: 1, label: "Tidak mampu berubah posisi" },
      { score: 2, label: "Sangat terbatas" },
      { score: 3, label: "Sedikit terbatas" },
      { score: 4, label: "Tidak terbatas" },
    ]},
    { id: "aktivitas", label: "Aktivitas", maxScore: 4, options: [
      { score: 1, label: "Berbaring di tempat tidur" },
      { score: 2, label: "Terbatas di kursi" },
      { score: 3, label: "Kadang berjalan" },
      { score: 4, label: "Sesuai usia / sering bergerak" },
    ]},
    { id: "persepsi", label: "Persepsi Sensorik", maxScore: 4, options: [
      { score: 1, label: "Terbatas penuh" },
      { score: 2, label: "Sangat terbatas" },
      { score: 3, label: "Sedikit terbatas" },
      { score: 4, label: "Tidak terganggu" },
    ]},
    { id: "kelembapan", label: "Kelembapan Kulit", maxScore: 4, options: [
      { score: 1, label: "Selalu lembap" },
      { score: 2, label: "Sangat lembap" },
      { score: 3, label: "Kadang lembap" },
      { score: 4, label: "Jarang lembap" },
    ]},
    { id: "friksi", label: "Friksi & Geseran", maxScore: 4, options: [
      { score: 1, label: "Masalah signifikan" },
      { score: 2, label: "Masalah" },
      { score: 3, label: "Potensi masalah" },
      { score: 4, label: "Tidak ada masalah" },
    ]},
    { id: "nutrisi", label: "Nutrisi", maxScore: 4, options: [
      { score: 1, label: "Sangat buruk" },
      { score: 2, label: "Tidak adekuat" },
      { score: 3, label: "Adekuat" },
      { score: 4, label: "Sangat baik" },
    ]},
    { id: "perfusi", label: "Perfusi Jaringan & Oksigenasi", maxScore: 4, options: [
      { score: 1, label: "Sangat terganggu", detail: "Hipotensi atau tidak toleran perubahan posisi" },
      { score: 2, label: "Terganggu", detail: "Normotensi; SpO₂ <95% / Hb <10 / CRT >2 dtk" },
      { score: 3, label: "Adekuat", detail: "Normotensi; salah satu parameter di atas" },
      { score: 4, label: "Sangat baik", detail: "Normotensi, SpO₂ & Hb normal, CRT normal" },
    ]},
  ],
  interpretasi: [
    { id: "bq-1", min: 0,  max: 16, label: "Risiko Tinggi", tone: "rose",    action: "Reposisi tiap 2 jam, kasur antidekubitus, inspeksi kulit tiap shift." },
    { id: "bq-2", min: 17, max: 22, label: "Risiko Sedang", tone: "amber",   action: "Reposisi terjadwal, lindungi area tekanan, monitor kulit." },
    { id: "bq-3", min: 23, max: 28, label: "Risiko Rendah", tone: "emerald", action: "Perawatan kulit rutin. Re-skrining bila kondisi berubah." },
  ],
};

// ── Dewasa: Skrining Gizi (alternatif MUST) ──────────────
const MST: SkalaRisikoRecord = {
  id: "skl-mst",
  kode: "MST",
  nama: "Malnutrition Screening Tool",
  singkat: "Skrining Gizi Dewasa",
  deskripsi:
    "Alat skrining malnutrisi 2 pertanyaan untuk pasien dewasa (umum dipakai RS Indonesia). Skor ≥ 2 = berisiko.",
  scoringMode: "sum_items",
  arah: "higher_is_worse",
  totalMax: 5,
  referensi: "Ferguson M, et al. Nutrition 1999;15(6):458-464.",
  konsumenModul: ["IGD", "RI", "RJ"],
  status: "Aktif",
  items: [
    { id: "turunBB", label: "Penurunan BB tanpa Disengaja", maxScore: 4, options: [
      { score: 0, label: "Tidak ada penurunan BB" },
      { score: 1, label: "1–5 kg" },
      { score: 2, label: "6–10 kg / tidak yakin" },
      { score: 3, label: "11–15 kg" },
      { score: 4, label: "> 15 kg" },
    ]},
    { id: "nafsuMakan", label: "Asupan Makan Berkurang (Nafsu Makan ↓)", maxScore: 1, options: [
      { score: 0, label: "Tidak" },
      { score: 1, label: "Ya" },
    ]},
  ],
  interpretasi: [
    { id: "ms-1", min: 0, max: 1, label: "Risiko Rendah",       tone: "emerald", action: "Tidak berisiko malnutrisi. Skrining ulang berkala." },
    { id: "ms-2", min: 2, max: 5, label: "Berisiko Malnutrisi", tone: "rose",    action: "Konsul dietisien untuk asesmen gizi lengkap & rencana intervensi." },
  ],
};

// ── Pediatrik: Skrining Gizi ─────────────────────────────
const STRONGKIDS: SkalaRisikoRecord = {
  id: "skl-strongkids",
  kode: "STRONGKIDS",
  nama: "STRONGkids (Skrining Gizi Anak)",
  singkat: "Skrining Gizi Anak",
  deskripsi:
    "Screening Tool for Risk On Nutritional Status and Growth — skrining malnutrisi pediatrik (1 bln–18 thn).",
  scoringMode: "sum_items",
  arah: "higher_is_worse",
  totalMax: 5,
  referensi: "Hulst JM, et al. Clin Nutr 2010;29(1):106-111.",
  konsumenModul: ["IGD", "RI", "RJ"],
  status: "Aktif",
  items: [
    { id: "klinis", label: "Penilaian Klinis Subjektif", maxScore: 1, options: [
      { score: 0, label: "Status gizi tampak baik" },
      { score: 1, label: "Status gizi buruk", detail: "Lemak / massa otot subkutan berkurang" },
    ]},
    { id: "penyakit", label: "Penyakit Berisiko Tinggi / Bedah Mayor", maxScore: 2, options: [
      { score: 0, label: "Tidak" },
      { score: 2, label: "Ya", detail: "Penyakit berisiko malnutrisi atau rencana bedah mayor" },
    ]},
    { id: "asupan", label: "Asupan & Kehilangan Nutrisi", maxScore: 1, options: [
      { score: 0, label: "Tidak ada masalah" },
      { score: 1, label: "Ada masalah", detail: "Diare ≥5×/hari / muntah >3×/hari / asupan ↓ / diet khusus" },
    ]},
    { id: "beratBadan", label: "Penurunan / Tidak Naik BB", maxScore: 1, options: [
      { score: 0, label: "BB naik normal" },
      { score: 1, label: "BB turun / stagnan", detail: "Beberapa minggu–bulan terakhir" },
    ]},
  ],
  interpretasi: [
    { id: "sk-1", min: 0, max: 0, label: "Risiko Rendah", tone: "emerald", action: "Tidak perlu intervensi. Skrining ulang berkala." },
    { id: "sk-2", min: 1, max: 3, label: "Risiko Sedang", tone: "amber",   action: "Timbang BB 2×/minggu, evaluasi 1 minggu, konsul dokter." },
    { id: "sk-3", min: 4, max: 5, label: "Risiko Tinggi", tone: "rose",    action: "Konsul dokter & dietisien. Mulai intervensi gizi + monitoring." },
  ],
};

export const SKALA_RISIKO_MOCK: SkalaRisikoRecord[] = [
  // Dewasa (set awal) — kode SR-0001..SR-0005 (stabil).
  BARTHEL, MORSE, BRADEN, NRS_PAIN, MUST,
  // Stratifikasi usia & kondisi (tambahan) — kode SR-0006..SR-0013.
  HUMPTY_DUMPTY, WONG_BAKER, FLACC, CPOT, NIPS, BRADEN_Q, MST, STRONGKIDS,
];
