/**
 * Master Template Anamnesis — koleksi template anamnesis lintas modul.
 *
 * Konsumen: AnamnesisPane IGD + RI + RJ.
 * Tiap template punya context_tags (modul mana yang relevan) + chief complaint
 * (kategori keluhan utama) + isi pre-fill field anamnesis.
 *
 * Strategi mock representative — 17 template lintas IGD/RI/RJ. Saat backend
 * ready, swap mock array dengan API call. Schema 1:1 ke target DB.
 */

export type ModulContext = "IGD" | "RI" | "RJ";

export type ChiefComplaintCategory =
  | "Kardiovaskular"
  | "Respirasi"
  | "Neurologi"
  | "Pencernaan"
  | "Endokrin"
  | "Infeksi"
  | "Trauma"
  | "Muskuloskeletal"
  | "Urologi"
  | "Mata_THT"
  | "Kontrol_Rutin"
  | "Lainnya";

export interface TemplateAnamnesisItem {
  id: string;
  label: string;
  kategori: ChiefComplaintCategory;
  contextTags: ModulContext[];
  keluhanUtama: string;
  rps: string;
  onsetDurasi: string;
  mekanismeCedera?: string;
  faktorPemberat: string;
  faktorPemerut: string;
  statusGeneralis: string;
  catatanPerawat?: string;
  status: "Aktif" | "NonAktif";
}

// ── Config: kategori display ──────────────────────────────

export const KATEGORI_CFG: Record<
  ChiefComplaintCategory,
  { label: string; tone: string; bg: string; text: string; ring: string }
> = {
  Kardiovaskular:   { label: "Kardiovaskular",  tone: "rose",    bg: "bg-rose-50",    text: "text-rose-700",    ring: "ring-rose-200" },
  Respirasi:        { label: "Respirasi",       tone: "sky",     bg: "bg-sky-50",     text: "text-sky-700",     ring: "ring-sky-200" },
  Neurologi:        { label: "Neurologi",       tone: "violet",  bg: "bg-violet-50",  text: "text-violet-700",  ring: "ring-violet-200" },
  Pencernaan:       { label: "Pencernaan",      tone: "amber",   bg: "bg-amber-50",   text: "text-amber-700",   ring: "ring-amber-200" },
  Endokrin:         { label: "Endokrin",        tone: "teal",    bg: "bg-teal-50",    text: "text-teal-700",    ring: "ring-teal-200" },
  Infeksi:          { label: "Infeksi",         tone: "orange",  bg: "bg-orange-50",  text: "text-orange-700",  ring: "ring-orange-200" },
  Trauma:           { label: "Trauma",          tone: "rose",    bg: "bg-rose-50",    text: "text-rose-700",    ring: "ring-rose-200" },
  Muskuloskeletal:  { label: "Muskuloskeletal", tone: "indigo",  bg: "bg-indigo-50",  text: "text-indigo-700",  ring: "ring-indigo-200" },
  Urologi:          { label: "Urologi",         tone: "sky",     bg: "bg-sky-50",     text: "text-sky-700",     ring: "ring-sky-200" },
  Mata_THT:         { label: "Mata / THT",      tone: "pink",    bg: "bg-pink-50",    text: "text-pink-700",    ring: "ring-pink-200" },
  Kontrol_Rutin:    { label: "Kontrol Rutin",   tone: "emerald", bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200" },
  Lainnya:          { label: "Lainnya",         tone: "slate",   bg: "bg-slate-50",   text: "text-slate-700",   ring: "ring-slate-200" },
};

export const KATEGORI_LIST: ChiefComplaintCategory[] = [
  "Kardiovaskular", "Respirasi", "Neurologi", "Pencernaan", "Endokrin",
  "Infeksi", "Trauma", "Muskuloskeletal", "Urologi", "Mata_THT",
  "Kontrol_Rutin", "Lainnya",
];

// ── Context config ────────────────────────────────────────

export const CONTEXT_CFG: Record<
  ModulContext,
  { label: string; long: string; bg: string; text: string; dot: string }
> = {
  IGD: { label: "IGD", long: "Instalasi Gawat Darurat", bg: "bg-rose-100",    text: "text-rose-700",    dot: "bg-rose-500" },
  RI:  { label: "RI",  long: "Rawat Inap",              bg: "bg-violet-100",  text: "text-violet-700",  dot: "bg-violet-500" },
  RJ:  { label: "RJ",  long: "Rawat Jalan / Poliklinik", bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
};

export const CONTEXT_LIST: ModulContext[] = ["IGD", "RI", "RJ"];

// ── Mock data ─────────────────────────────────────────────

export const TEMPLATE_ANAMNESIS_MOCK: TemplateAnamnesisItem[] = [
  // ── IGD ─────────────────────────────────────────────────
  {
    id: "ta-001",
    label: "Nyeri Dada / Angina (IGD)",
    kategori: "Kardiovaskular",
    contextTags: ["IGD"],
    keluhanUtama: "Nyeri dada kiri menjalar ke lengan kiri",
    rps: "Pasien mengeluh nyeri dada kiri seperti ditekan sejak ± 1 jam. Nyeri menjalar ke lengan kiri. Disertai keringat dingin dan mual. Tidak membaik dengan istirahat.",
    onsetDurasi: "Mendadak, ± 1 jam",
    faktorPemberat: "Aktivitas fisik, emosi",
    faktorPemerut: "Istirahat, nitrogliserin sublingual",
    statusGeneralis: "Tampak sakit sedang, kompos mentis, akral dingin, diaforesis",
    catatanPerawat: "Pasang akses IV + monitor EKG 12-lead segera. Order: Troponin I, EKG, CKMB.",
    status: "Aktif",
  },
  {
    id: "ta-002",
    label: "Sesak Napas Akut (IGD)",
    kategori: "Respirasi",
    contextTags: ["IGD"],
    keluhanUtama: "Sesak napas mendadak",
    rps: "Pasien mengeluh sesak napas mendadak sejak ± 2 jam. Sesak memberat saat berbaring (ortopnea). Disertai batuk dan bengkak kedua tungkai.",
    onsetDurasi: "Mendadak, ± 2 jam",
    faktorPemberat: "Berbaring, aktivitas fisik",
    faktorPemerut: "Posisi duduk tegak",
    statusGeneralis: "Tampak sakit berat, kompos mentis, sesak, RR meningkat, SpO2 turun",
    catatanPerawat: "Oksigen via NRM 10 LPM. Posisi semi-fowler 45°. Order: Foto thorax CITO + BGA.",
    status: "Aktif",
  },
  {
    id: "ta-003",
    label: "Nyeri Abdomen Akut (IGD)",
    kategori: "Pencernaan",
    contextTags: ["IGD"],
    keluhanUtama: "Nyeri perut hebat, mual, muntah",
    rps: "Pasien mengeluh nyeri perut sejak ± 4 jam. Nyeri di perut kanan bawah / epigastrium. Disertai mual, muntah, dan demam.",
    onsetDurasi: "Bertahap, ± 4–6 jam",
    faktorPemberat: "Makan, gerakan",
    faktorPemerut: "Posisi tertentu",
    statusGeneralis: "Tampak sakit sedang, kompos mentis, demam, abdomen tegang saat palpasi",
    status: "Aktif",
  },
  {
    id: "ta-004",
    label: "Trauma / Kecelakaan (IGD)",
    kategori: "Trauma",
    contextTags: ["IGD"],
    keluhanUtama: "Nyeri setelah trauma / kecelakaan",
    rps: "Pasien datang dengan nyeri akibat trauma. Mekanisme cedera: kecelakaan lalu lintas / jatuh / benturan langsung. Disertai perdarahan / deformitas / keterbatasan gerak.",
    onsetDurasi: "Akut, segera setelah trauma",
    mekanismeCedera: "Benturan langsung / KLL / jatuh dari ketinggian",
    faktorPemberat: "Pergerakan, palpasi area trauma",
    faktorPemerut: "Imobilisasi",
    statusGeneralis: "Tampak sakit sedang–berat, kompos mentis, ada hematoma/luka terbuka",
    catatanPerawat: "Primary survey ABCDE. Imobilisasi servikal hingga cleared. Order foto sesuai mekanisme cedera.",
    status: "Aktif",
  },
  {
    id: "ta-005",
    label: "Stroke / Defisit Neurologis (IGD)",
    kategori: "Neurologi",
    contextTags: ["IGD", "RI"],
    keluhanUtama: "Kelemahan sisi tubuh / bicara pelo",
    rps: "Pasien ditemukan / mengeluhkan tiba-tiba ____ (kelemahan anggota gerak / bicara pelo / penurunan kesadaran) sejak ± ____ jam SMRS. Onset mendadak saat ____. Tidak ada riwayat trauma. Riwayat hipertensi sebelumnya ____.",
    onsetDurasi: "Mendadak",
    faktorPemberat: "—",
    faktorPemerut: "—",
    statusGeneralis: "Tampak sakit sedang–berat, kesadaran ____, defisit neurologis fokal",
    catatanPerawat: "Aktivasi Code Stroke. NIHSS score wajib. CT scan kepala non-kontras CITO. Onset >4.5 jam → bukan kandidat trombolisis.",
    status: "Aktif",
  },
  {
    id: "ta-006",
    label: "Kejang (IGD)",
    kategori: "Neurologi",
    contextTags: ["IGD"],
    keluhanUtama: "Kejang seluruh tubuh",
    rps: "Pasien kejang sejak ± ___ menit SMRS. Tipe kejang: tonik-klonik generalisata / fokal. Frekuensi: ___ kali. Pasca-kejang: tidur / sadar penuh. Tidak ada demam / ada demam ___°C.",
    onsetDurasi: "Akut, durasi kejang ___ menit",
    faktorPemberat: "—",
    faktorPemerut: "—",
    statusGeneralis: "Pasca-iktal: kompos mentis / mengantuk. Status iktal: kejang tonik-klonik aktif",
    catatanPerawat: "Posisi miring kiri, jangan tahan tubuh. IV access + GDS bedside. Diazepam 10mg IV bila >5 menit.",
    status: "Aktif",
  },
  {
    id: "ta-007",
    label: "Syok / Hipotensi (IGD)",
    kategori: "Kardiovaskular",
    contextTags: ["IGD"],
    keluhanUtama: "Lemas, akral dingin, kesadaran menurun",
    rps: "Pasien tampak lemas, akral dingin, dan kesadaran menurun sejak ± ___ jam. TD diukur ___ /___ mmHg. Riwayat penyakit: ___. Riwayat trauma / perdarahan: ___.",
    onsetDurasi: "Akut",
    faktorPemberat: "Posisi berdiri",
    faktorPemerut: "Posisi supine, fluid challenge",
    statusGeneralis: "Tampak sakit berat, akral dingin, CRT >3 detik, MAP <65 mmHg",
    catatanPerawat: "2 jalur IV besar (16-18G). Resusitasi cairan kristaloid 30 ml/kgBB. Identifikasi tipe syok (hipovolemik/sepsis/kardiogenik).",
    status: "Aktif",
  },
  {
    id: "ta-008",
    label: "Demam / Infeksi (IGD)",
    kategori: "Infeksi",
    contextTags: ["IGD", "RI"],
    keluhanUtama: "Demam tinggi disertai lemas",
    rps: "Pasien datang dengan demam tinggi sejak ± ____ hari SMRS, mencapai suhu ____°C. Disertai menggigil, berkeringat, dan lemas. Keluhan nyeri di ____. Tidak ada perbaikan dengan obat penurun panas sebelumnya.",
    onsetDurasi: "Mendadak, ± 2 hari SMRS",
    faktorPemberat: "Aktivitas, asupan oral buruk",
    faktorPemerut: "Istirahat, pemberian antipiretik",
    statusGeneralis: "Tampak sakit sedang–berat, kompos mentis, tanda infeksi sistemik",
    status: "Aktif",
  },

  // ── RI (admission) ──────────────────────────────────────
  {
    id: "ta-101",
    label: "Gagal Jantung / Sesak (RI Admission)",
    kategori: "Kardiovaskular",
    contextTags: ["RI"],
    keluhanUtama: "Sesak napas memberat",
    rps: "Pasien mengeluhkan sesak napas yang memberat sejak ± ____ hari/jam SMRS. Sesak dirasakan memberat saat aktivitas ringan dan saat berbaring, berkurang sedikit dengan posisi duduk/setengah duduk. Disertai bengkak pada kedua tungkai. Pasien riwayat hipertensi dan penyakit jantung sebelumnya.",
    onsetDurasi: "Bertahap, ± 3 hari SMRS",
    faktorPemberat: "Aktivitas fisik, posisi berbaring",
    faktorPemerut: "Posisi duduk / setengah duduk",
    statusGeneralis: "Tampak sakit sedang, kesadaran kompos mentis, terpasang oksigen nasal kanul",
    catatanPerawat: "Klasifikasi NYHA + Killip. Restriksi cairan 1.000 ml/hari. Order: BNP, EKG, foto thorax, echo.",
    status: "Aktif",
  },
  {
    id: "ta-102",
    label: "Pneumonia (RI Admission)",
    kategori: "Respirasi",
    contextTags: ["RI"],
    keluhanUtama: "Batuk berdahak, sesak, demam",
    rps: "Pasien mengeluh batuk berdahak warna ____ sejak ± ____ hari, disertai sesak napas dan demam tinggi. Nyeri dada saat batuk dan tarik napas dalam. Nafsu makan menurun. Riwayat penyakit paru sebelumnya: ____.",
    onsetDurasi: "Bertahap, ± 5 hari SMRS",
    faktorPemberat: "Tarik napas dalam, batuk",
    faktorPemerut: "Posisi duduk, oksigen",
    statusGeneralis: "Tampak sakit sedang, kesadaran kompos mentis, RR meningkat, ronkhi basah bilateral",
    catatanPerawat: "Hitung CURB-65 / PSI score. Kultur sputum + darah sebelum AB. Order: foto thorax, BGA, prokalsitonin.",
    status: "Aktif",
  },
  {
    id: "ta-103",
    label: "ACS / Acute Coronary Syndrome (RI Admission)",
    kategori: "Kardiovaskular",
    contextTags: ["RI"],
    keluhanUtama: "Nyeri dada tipikal angina",
    rps: "Pasien dengan nyeri dada tipikal angina sejak ___ jam, durasi >20 menit, tidak hilang dengan istirahat / nitrat sublingual. Disertai keringat dingin, mual. Riwayat CAD/MI sebelumnya: ___. Faktor risiko: HTN, DM, dislipidemia, perokok ___.",
    onsetDurasi: "Akut, ___ jam",
    faktorPemberat: "Aktivitas, emosi",
    faktorPemerut: "Istirahat (parsial), morfin IV",
    statusGeneralis: "Tampak sakit sedang, kompos mentis, akral dingin",
    catatanPerawat: "DAPT loading. EKG serial tiap 15-30 mnt. Troponin serial 0/3/6 jam. Standby cath-lab jika STEMI.",
    status: "Aktif",
  },
  {
    id: "ta-104",
    label: "DM Komplikasi (Ketoasidosis) (RI Admission)",
    kategori: "Endokrin",
    contextTags: ["RI"],
    keluhanUtama: "Mual, muntah, lemas, napas cepat",
    rps: "Pasien dengan riwayat DM tipe ___ sejak ___ tahun, datang dengan mual, muntah, lemas, dan napas cepat-dalam (Kussmaul) sejak ___ hari. GDS terakhir ___ mg/dL. Kepatuhan insulin: ___. Pencetus: infeksi, lupa insulin, dll.",
    onsetDurasi: "Bertahap, ___ hari",
    faktorPemberat: "Asupan oral buruk, dehidrasi, infeksi",
    faktorPemerut: "Insulin, rehidrasi",
    statusGeneralis: "Tampak sakit sedang–berat, kompos mentis, dehidrasi, napas Kussmaul, napas bau aseton",
    catatanPerawat: "Cek keton urin/darah, AGD, elektrolit (K), GDS jam-jaman. Rehidrasi NaCl + insulin drip.",
    status: "Aktif",
  },

  // ── RJ (poliklinik) ─────────────────────────────────────
  {
    id: "ta-201",
    label: "ISPA (RJ)",
    kategori: "Respirasi",
    contextTags: ["RJ"],
    keluhanUtama: "Demam, batuk berdahak, hidung tersumbat",
    rps: "Pasien datang dengan keluhan demam sejak __ hari yang lalu, disertai batuk berdahak dan hidung tersumbat. Batuk dirasakan semakin memberat. Tidak ada sesak napas. Nafsu makan menurun.",
    onsetDurasi: "__ hari, bertahap",
    faktorPemberat: "Cuaca dingin, kelelahan, paparan orang sakit",
    faktorPemerut: "Istirahat, obat pereda demam",
    statusGeneralis: "Tampak sakit ringan-sedang, kesadaran kompos mentis",
    status: "Aktif",
  },
  {
    id: "ta-202",
    label: "Nyeri Dada (RJ)",
    kategori: "Kardiovaskular",
    contextTags: ["RJ"],
    keluhanUtama: "Nyeri dada",
    rps: "Pasien mengeluhkan nyeri dada sejak __ hari/jam yang lalu. Nyeri dirasakan di dada bagian __, menjalar ke __. Sifat nyeri: tumpul/tajam/seperti tertekan. Disertai keringat dingin.",
    onsetDurasi: "__ hari/jam",
    faktorPemberat: "Aktivitas fisik, emosi",
    faktorPemerut: "Istirahat, nitrat sublingual",
    statusGeneralis: "Tampak sakit sedang, kesadaran kompos mentis",
    catatanPerawat: "EKG segera. Bila nyeri tipikal + faktor risiko tinggi → rujuk IGD.",
    status: "Aktif",
  },
  {
    id: "ta-203",
    label: "Kontrol DM (RJ)",
    kategori: "Kontrol_Rutin",
    contextTags: ["RJ"],
    keluhanUtama: "Kontrol diabetes melitus tipe 2",
    rps: "Pasien kontrol rutin DM tipe 2. Keluhan saat ini: __. GDS terakhir di rumah: __ mg/dL. Kepatuhan minum obat: __. Pola makan: __. Aktivitas fisik: __.",
    onsetDurasi: "Kronik, terkontrol/tidak terkontrol",
    faktorPemberat: "Diet tidak terkontrol, obat tidak teratur",
    faktorPemerut: "Diet ketat, olahraga teratur",
    statusGeneralis: "Tampak sakit ringan, kesadaran kompos mentis",
    catatanPerawat: "Cek GDS / GDP / HbA1c per 3 bulan. Cek fundus per tahun.",
    status: "Aktif",
  },
  {
    id: "ta-204",
    label: "Kontrol Hipertensi (RJ)",
    kategori: "Kontrol_Rutin",
    contextTags: ["RJ"],
    keluhanUtama: "Kontrol hipertensi",
    rps: "Pasien kontrol hipertensi. Keluhan saat ini: sakit kepala/tidak ada keluhan. TD terukur terakhir: __/__ mmHg. Obat yang diminum: __. Kepatuhan minum obat: __.",
    onsetDurasi: "Kronik",
    faktorPemberat: "Stres, konsumsi garam berlebih, lupa minum obat",
    faktorPemerut: "Minum obat teratur, diet rendah garam",
    statusGeneralis: "Tampak sakit ringan, kesadaran kompos mentis",
    catatanPerawat: "TD rumah harian. Target <140/90 (umum) / <130/80 (DM, CKD).",
    status: "Aktif",
  },
  {
    id: "ta-205",
    label: "Kontrol Pasca Rawat (RJ)",
    kategori: "Kontrol_Rutin",
    contextTags: ["RJ"],
    keluhanUtama: "Kontrol pasca rawat inap",
    rps: "Pasien kontrol pertama setelah dirawat di RS ___ dari tanggal __ sampai __ dengan diagnosis ___. Keluhan saat ini: ___. Obat yang dikonsumsi: ___. Kepatuhan: ___.",
    onsetDurasi: "Pasca rawat ___ hari",
    faktorPemberat: "—",
    faktorPemerut: "—",
    statusGeneralis: "Tampak sehat / membaik, kesadaran kompos mentis",
    catatanPerawat: "Cek ulang lab/imaging sesuai instruksi resume. Edukasi tanda kambuh.",
    status: "Aktif",
  },
];

// ── Helpers ───────────────────────────────────────────────

export function emptyTemplateAnamnesis(): TemplateAnamnesisItem {
  return {
    id: `ta-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    label: "",
    kategori: "Lainnya",
    contextTags: ["IGD"],
    keluhanUtama: "",
    rps: "",
    onsetDurasi: "",
    faktorPemberat: "",
    faktorPemerut: "",
    statusGeneralis: "",
    catatanPerawat: "",
    status: "Aktif",
  };
}

export function isTemplateValid(t: TemplateAnamnesisItem): boolean {
  return (
    t.label.trim() !== "" &&
    t.keluhanUtama.trim() !== "" &&
    t.contextTags.length > 0
  );
}

export function countByContext(items: TemplateAnamnesisItem[], ctx: ModulContext): number {
  return items.filter((t) => t.contextTags.includes(ctx)).length;
}
