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

// ── Barthel Index ─────────────────────────────────────────

export interface ScoreOption {
  score: number;
  label: string;
  detail?: string;
}

export interface ScoringItemDef {
  key: string;
  label: string;
  options: ScoreOption[];
  maxScore: number;
}

export const BARTHEL_ITEMS: ScoringItemDef[] = [
  { key: "makan",      label: "Makan (Feeding)",               maxScore: 10, options: [{ score: 0, label: "Tidak dapat makan sendiri", detail: "Tidak bisa makan sendiri, butuh bantuan penuh" }, { score: 5, label: "Butuh bantuan sebagian", detail: "Butuh bantuan memotong, mengoles, dsb." }, { score: 10, label: "Mandiri", detail: "Dapat makan dari piring yang telah disiapkan" }] },
  { key: "transfer",   label: "Transfer (Tempat Tidur ↔ Kursi)", maxScore: 15, options: [{ score: 0, label: "Tidak dapat bergerak / tidak ada keseimbangan duduk", detail: "Tidak mampu, memerlukan alat angkat" }, { score: 5, label: "Butuh bantuan besar (≥2 orang)", detail: "Dapat duduk namun butuh bantuan besar saat transfer" }, { score: 10, label: "Butuh bantuan minimal (1 orang)", detail: "Butuh sedikit bantuan atau pengawasan" }, { score: 15, label: "Mandiri", detail: "Tidak butuh bantuan" }] },
  { key: "grooming",   label: "Membersihkan Diri (Grooming)",   maxScore: 5,  options: [{ score: 0, label: "Tergantung orang lain", detail: "Memerlukan bantuan perawatan pribadi" }, { score: 5, label: "Mandiri", detail: "Dapat mencuci muka, sisir rambut, sikat gigi, bercukur" }] },
  { key: "toilet",     label: "Dari/ke Toilet (Toilet Use)",    maxScore: 10, options: [{ score: 0, label: "Tergantung orang lain", detail: "Tidak mampu ke toilet" }, { score: 5, label: "Butuh bantuan sebagian", detail: "Butuh bantuan beberapa langkah" }, { score: 10, label: "Mandiri", detail: "Dapat masuk/keluar toilet sendiri, membersihkan diri" }] },
  { key: "mandi",      label: "Mandi (Bathing)",               maxScore: 5,  options: [{ score: 0, label: "Tergantung orang lain" }, { score: 5, label: "Mandiri", detail: "Dapat mandi sendiri tanpa pengawasan" }] },
  { key: "berjalan",   label: "Berjalan di Permukaan Rata",    maxScore: 15, options: [{ score: 0, label: "Tidak mampu berjalan" }, { score: 5, label: "Mandiri dengan kursi roda (> 50 m)", detail: "Memutar, menggerakkan kursi roda ke depan" }, { score: 10, label: "Berjalan dengan bantuan (1 orang) > 50 m", detail: "Secara fisik atau verbal, dengan/tanpa alat bantu" }, { score: 15, label: "Mandiri > 50 m", detail: "Boleh menggunakan alat bantu jalan (bukan kursi roda)" }] },
  { key: "tangga",     label: "Naik Turun Tangga (Stairs)",    maxScore: 10, options: [{ score: 0, label: "Tidak mampu naik tangga" }, { score: 5, label: "Butuh bantuan", detail: "Bantuan fisik atau verbal" }, { score: 10, label: "Mandiri", detail: "Boleh menggunakan alat bantu" }] },
  { key: "berpakaian", label: "Berpakaian (Dressing)",         maxScore: 10, options: [{ score: 0, label: "Tergantung orang lain" }, { score: 5, label: "Butuh bantuan sebagian (≥50% mandiri)" }, { score: 10, label: "Mandiri", detail: "Termasuk tali sepatu, kancing, resleting" }] },
  { key: "bab",        label: "Mengontrol BAB (Bowels)",       maxScore: 10, options: [{ score: 0, label: "Inkontinensia BAB / butuh enema" }, { score: 5, label: "Kadang inkontinensia (≤1×/minggu)" }, { score: 10, label: "Kontinen", detail: "Tidak ada inkontinensia" }] },
  { key: "bak",        label: "Mengontrol BAK (Bladder)",      maxScore: 10, options: [{ score: 0, label: "Inkontinensia / kateter permanen / tidak dapat mengontrol" }, { score: 5, label: "Kadang inkontinensia (< 24 jam)" }, { score: 10, label: "Kontinen / kateter mandiri terkontrol" }] },
];

export const BARTHEL_MAX = 100;

export function barthelInterpretation(total: number): { label: string; cls: string; action: string } {
  if (total <= 20) return { label: "Ketergantungan Penuh",          cls: "bg-rose-50 text-rose-700 border-rose-200",         action: "Butuh bantuan total semua aktivitas harian. Perlu tim rehabilitasi segera." };
  if (total <= 40) return { label: "Ketergantungan Berat",          cls: "bg-red-50 text-red-700 border-red-200",            action: "Butuh bantuan besar sebagian besar aktivitas. Rencanakan fisioterapi dan OT." };
  if (total <= 60) return { label: "Ketergantungan Sedang",         cls: "bg-orange-50 text-orange-700 border-orange-200",   action: "Butuh bantuan sebagian aktivitas. Libatkan fisioterapi dan OT." };
  if (total <= 80) return { label: "Ketergantungan Ringan",         cls: "bg-amber-50 text-amber-700 border-amber-200",      action: "Relatif mandiri namun butuh bantuan beberapa aktivitas." };
  if (total <= 99) return { label: "Ketergantungan Sangat Ringan",  cls: "bg-yellow-50 text-yellow-700 border-yellow-200",   action: "Hampir mandiri penuh, masih ada 1–2 aktivitas yang butuh bantuan." };
  return             { label: "Mandiri Penuh",                      cls: "bg-emerald-50 text-emerald-700 border-emerald-200", action: "Tidak ada ketergantungan dalam aktivitas harian." };
}

// ── Morse Fall Scale ──────────────────────────────────────

export const MORSE_ITEMS: ScoringItemDef[] = [
  { key: "riwayatJatuh",       label: "Riwayat Jatuh (3 bulan terakhir)",     maxScore: 25, options: [{ score: 0, label: "Tidak ada riwayat jatuh" }, { score: 25, label: "Ya, ada riwayat jatuh" }] },
  { key: "diagnosisSekunder",  label: "Diagnosis Sekunder (> 1 diagnosis)",   maxScore: 15, options: [{ score: 0, label: "Tidak" }, { score: 15, label: "Ya" }] },
  { key: "alatBantu",          label: "Alat Bantu Ambulasi",                  maxScore: 30, options: [{ score: 0, label: "Tidak diperlukan / Tirah Baring / Dibantu Perawat", detail: "Bed rest total atau dibantu perawat saat berjalan" }, { score: 15, label: "Tongkat / Kruk / Walker / Kursi Roda" }, { score: 30, label: "Berpegangan pada Furnitur / Dinding" }] },
  { key: "infusIV",            label: "Terpasang Infus IV / Antikoagulan",   maxScore: 20, options: [{ score: 0, label: "Tidak" }, { score: 20, label: "Ya" }] },
  { key: "gayaBerjalan",       label: "Gaya Berjalan",                        maxScore: 20, options: [{ score: 0, label: "Normal / Tirah Baring / Kursi Roda", detail: "Berjalan tegak, mengangkat kaki dari lantai" }, { score: 10, label: "Lemah", detail: "Mengangkat kaki tetapi pendek langkahnya" }, { score: 20, label: "Terganggu", detail: "Kesulitan berdiri, terhuyung-huyung, tidak stabil" }] },
  { key: "statusMental",       label: "Status Mental (Self-Assessment)",      maxScore: 15, options: [{ score: 0, label: "Sadar penuh sesuai kemampuan fisik", detail: "Memperkirakan kemampuan sesuai kondisi fisik" }, { score: 15, label: "Lupa/tidak menyadari keterbatasan diri", detail: "Melebih-lebihkan kemampuan, lupa keterbatasan" }] },
];

export const MORSE_MAX = 125;

export function morseInterpretation(total: number): { label: string; cls: string; action: string } {
  if (total < 25)  return { label: "Risiko Rendah",  cls: "bg-emerald-50 text-emerald-700 border-emerald-200", action: "Lakukan prosedur pencegahan jatuh rutin." };
  if (total < 45)  return { label: "Risiko Sedang",  cls: "bg-amber-50 text-amber-700 border-amber-200",       action: "Lakukan intervensi pencegahan jatuh standar." };
  return             { label: "Risiko Tinggi",  cls: "bg-rose-50 text-rose-700 border-rose-200",          action: "Lakukan intervensi pencegahan jatuh intensif. Pasang gelang kuning, bed rail, call bell dalam jangkauan." };
}

// ── Braden Scale ──────────────────────────────────────────

export const BRADEN_ITEMS: ScoringItemDef[] = [
  { key: "persepsiSensorik", label: "Persepsi Sensorik",  maxScore: 4, options: [{ score: 1, label: "Terbatas Penuh", detail: "Tidak ada respons terhadap rangsangan nyeri" }, { score: 2, label: "Sangat Terbatas", detail: "Respons hanya terhadap nyeri, tidak bisa komunikasi" }, { score: 3, label: "Sedikit Terbatas", detail: "Merespons perintah verbal tapi tidak selalu mengatakan nyeri" }, { score: 4, label: "Tidak Terbatas", detail: "Merespons perintah verbal, tidak ada kelainan sensori" }] },
  { key: "kelembapan",       label: "Kelembapan Kulit",   maxScore: 4, options: [{ score: 1, label: "Selalu Lembap", detail: "Kulit hampir selalu lembap oleh keringat/urin" }, { score: 2, label: "Sering Lembap", detail: "Kulit sering lembap, linen perlu diganti min 1×/shift" }, { score: 3, label: "Kadang Lembap", detail: "Kulit kadang lembap, linen diganti 1×/hari" }, { score: 4, label: "Jarang Lembap", detail: "Kulit biasanya kering, linen diganti sesuai jadwal" }] },
  { key: "aktivitas",        label: "Aktivitas",          maxScore: 4, options: [{ score: 1, label: "Berbaring di Tempat Tidur", detail: "Terbatas di tempat tidur" }, { score: 2, label: "Di Kursi", detail: "Tidak dapat berjalan atau berjalan sangat terbatas" }, { score: 3, label: "Kadang Berjalan", detail: "Berjalan jarak pendek dengan/tanpa bantuan" }, { score: 4, label: "Sering Berjalan", detail: "Berjalan di luar kamar min 2× sehari" }] },
  { key: "mobilisasi",       label: "Mobilisasi",         maxScore: 4, options: [{ score: 1, label: "Tidak dapat Bergerak", detail: "Tidak dapat mengubah posisi tubuh/ekstremitas" }, { score: 2, label: "Sangat Terbatas", detail: "Perubahan posisi tubuh sesekali tapi minimal" }, { score: 3, label: "Sedikit Terbatas", detail: "Dapat berubah posisi sendiri, meski terbatas" }, { score: 4, label: "Tidak Terbatas", detail: "Bergerak bebas, tanpa bantuan" }] },
  { key: "nutrisi",          label: "Nutrisi",            maxScore: 4, options: [{ score: 1, label: "Sangat Buruk", detail: "Tidak pernah menghabiskan makan, jarang minum" }, { score: 2, label: "Kemungkinan Tidak Adekuat", detail: "Jarang menghabiskan ½ porsi makan" }, { score: 3, label: "Adekuat", detail: "Menghabiskan > ½ porsi makan, mendapat nutrisi enteral" }, { score: 4, label: "Sangat Baik", detail: "Menghabiskan semua porsi makan, tidak perlu suplemen" }] },
  { key: "friksi",           label: "Friksi & Geseran",   maxScore: 3, options: [{ score: 1, label: "Masalah", detail: "Butuh bantuan penuh saat berpindah, sering melorot" }, { score: 2, label: "Potensi Masalah", detail: "Bergerak kurang atau perlu sedikit bantuan, kadang melorot" }, { score: 3, label: "Tidak Ada Masalah", detail: "Dapat berpindah sendiri, tidak melorot" }] },
];

export const BRADEN_MAX = 23;

export function bradenInterpretation(total: number): { label: string; cls: string; action: string } {
  if (total <= 9)  return { label: "Risiko Sangat Tinggi", cls: "bg-rose-50 text-rose-700 border-rose-200",         action: "Intervensi pencegahan dekubitus intensif segera. Reposisi tiap 1–2 jam, gunakan kasur khusus." };
  if (total <= 12) return { label: "Risiko Tinggi",        cls: "bg-red-50 text-red-700 border-red-200",            action: "Reposisi setiap 2 jam, pertimbangkan kasur antidekubitus." };
  if (total <= 14) return { label: "Risiko Sedang",        cls: "bg-amber-50 text-amber-700 border-amber-200",      action: "Reposisi tiap 2–3 jam, inspeksi kulit setiap shift." };
  if (total <= 18) return { label: "Risiko Rendah",        cls: "bg-yellow-50 text-yellow-700 border-yellow-200",   action: "Monitor kulit setiap shift, edukasi pasien." };
  return             { label: "Tidak Berisiko",           cls: "bg-emerald-50 text-emerald-700 border-emerald-200", action: "Tidak ada risiko dekubitus bermakna saat ini." };
}

// Note: Braden is INVERSE — lower total = higher risk

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

// ── Anamnesis templates ───────────────────────────────────

export const ANAMNESIS_TEMPLATES = [
  {
    id: "gjk",
    label: "Gagal Jantung / Sesak",
    keluhanUtama: "Sesak napas memberat",
    rps: "Pasien mengeluhkan sesak napas yang memberat sejak ± ____ hari/jam SMRS. Sesak dirasakan memberat saat aktivitas ringan dan saat berbaring, berkurang sedikit dengan posisi duduk/setengah duduk. Disertai bengkak pada kedua tungkai. Pasien riwayat hipertensi dan penyakit jantung sebelumnya.",
    onsetDurasi: "Bertahap, ± 3 hari SMRS",
    faktorPemberat: "Aktivitas fisik, posisi berbaring",
    faktorPemerut: "Posisi duduk / setengah duduk",
    statusGeneralis: "Tampak sakit sedang, kesadaran kompos mentis, terpasang oksigen nasal kanul.",
  },
  {
    id: "infeksi",
    label: "Demam / Infeksi Sepsis",
    keluhanUtama: "Demam tinggi disertai lemas",
    rps: "Pasien datang dengan demam tinggi sejak ± ____ hari SMRS, mencapai suhu ____°C. Disertai menggigil, berkeringat, dan lemas. Keluhan nyeri di ____. Tidak ada perbaikan dengan obat penurun panas sebelumnya. Pasien tidak memiliki riwayat infeksi serupa sebelumnya.",
    onsetDurasi: "Mendadak, ± 2 hari SMRS",
    faktorPemberat: "Aktivitas, asupan oral buruk",
    faktorPemerut: "Istirahat, pemberian antipiretik",
    statusGeneralis: "Tampak sakit sedang–berat, kesadaran kompos mentis, tanda infeksi sistemik.",
  },
  {
    id: "stroke",
    label: "Defisit Neurologis / Stroke",
    keluhanUtama: "Kelemahan sisi tubuh / bicara pelo",
    rps: "Pasien ditemukan / mengeluhkan tiba-tiba ____ (kelemahan anggota gerak / bicara pelo / penurunan kesadaran) sejak ± ____ jam SMRS. Onset mendadak saat ____. Tidak ada riwayat trauma. Riwayat hipertensi sebelumnya ____.",
    onsetDurasi: "Mendadak",
    faktorPemberat: "—",
    faktorPemerut: "—",
    statusGeneralis: "Tampak sakit sedang–berat, kesadaran ____, defisit neurologis fokal.",
  },
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
