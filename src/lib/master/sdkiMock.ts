/**
 * Master SDKI/SIKI/SLKI — mock data (representative sample).
 *
 * Konsumen: KeperawatanTab RI · CarePlanTab template
 * Replace: `shared/medical-records/keperawatanShared.ts` (SDKI_CATALOG 15 entry hardcoded)
 *
 * Strategi: ~30 diagnosa representatif lintas 5 kategori SDKI.
 * Real dataset PPNI: 149 diagnosa SDKI + 119 luaran SLKI + 240 intervensi SIKI.
 * Import full dataset PPNI saat lisensi/dataset tersedia (tahap backend).
 *
 * Standar: PPNI SDKI (2017) · SLKI (2018) · SIKI (2018) edisi 1
 */

// ── Types ────────────────────────────────────────────────

export type SdkiKategori =
  | "Fisiologis"
  | "Psikologis"
  | "Perilaku"
  | "Relasional"
  | "Lingkungan";

export type SdkiJenis = "Aktual" | "Risiko" | "Promosi_Kesehatan";

export type SdkiStatus = "Aktif" | "Non_Aktif";

export interface SdkiData {
  subjektif: string[];
  objektif: string[];
}

export interface SdkiIntervensi {
  observasi:  string[];
  terapeutik: string[];
  edukasi:    string[];
  kolaborasi: string[];
}

export interface SdkiItem {
  id: string;
  kode: string;           // D.NNNN
  nama: string;
  kategori: SdkiKategori;
  subKategori: string;    // mis. "Respirasi", "Sirkulasi", "Nutrisi/Cairan"
  jenis: SdkiJenis;
  penyebabUmum: string;
  faktorResiko?: string;  // untuk jenis "Risiko"
  dataMayor: SdkiData;
  dataMinor: SdkiData;
  kriteriaHasil: string[]; // SLKI
  intervensi: SdkiIntervensi; // SIKI
  status: SdkiStatus;
}

// ── Empty factory ────────────────────────────────────────

export function emptySdkiItem(): SdkiItem {
  return {
    id: `sdki-${Date.now().toString(36)}`,
    kode: "",
    nama: "",
    kategori: "Fisiologis",
    subKategori: "",
    jenis: "Aktual",
    penyebabUmum: "",
    dataMayor: { subjektif: [], objektif: [] },
    dataMinor: { subjektif: [], objektif: [] },
    kriteriaHasil: [],
    intervensi: { observasi: [], terapeutik: [], edukasi: [], kolaborasi: [] },
    status: "Aktif",
  };
}

// ── Mock data (30 diagnosa lintas kategori) ──────────────

const SDKI_DATA: SdkiItem[] = [
  // ── Fisiologis · Respirasi ──
  {
    id: "sdki-d0001", kode: "D.0001", nama: "Bersihan Jalan Napas Tidak Efektif",
    kategori: "Fisiologis", subKategori: "Respirasi", jenis: "Aktual",
    penyebabUmum: "Sekresi yang tertahan, spasme jalan napas, hiperresponsif jalan napas",
    dataMayor: {
      subjektif: [],
      objektif: ["Batuk tidak efektif", "Tidak mampu batuk", "Sputum berlebih", "Mengi/wheezing/ronkhi kering"],
    },
    dataMinor: {
      subjektif: ["Dispnea", "Sulit bicara", "Ortopnea"],
      objektif: ["Gelisah", "Sianosis", "Bunyi napas menurun", "Frekuensi napas berubah", "Pola napas berubah"],
    },
    kriteriaHasil: ["Produksi sputum berkurang", "Ronkhi/mengi tidak terdengar", "Frekuensi napas 16–20×/mnt", "Kemampuan batuk efektif meningkat"],
    intervensi: {
      observasi:  ["Monitor pola napas (frekuensi, kedalaman, usaha)", "Monitor bunyi napas tambahan", "Monitor sputum (jumlah, warna, aroma)"],
      terapeutik: ["Posisikan semi-Fowler atau Fowler", "Lakukan penghisapan lendir <15 detik bila perlu", "Berikan oksigen sesuai kebutuhan"],
      edukasi:    ["Anjurkan asupan cairan 2000 mL/hari bila tidak ada kontraindikasi", "Ajarkan teknik batuk efektif"],
      kolaborasi: ["Kolaborasi pemberian bronkodilator/ekspektoran bila perlu"],
    },
    status: "Aktif",
  },
  {
    id: "sdki-d0003", kode: "D.0003", nama: "Gangguan Pertukaran Gas",
    kategori: "Fisiologis", subKategori: "Respirasi", jenis: "Aktual",
    penyebabUmum: "Ketidakseimbangan ventilasi-perfusi, edema paru, pneumonia",
    dataMayor: { subjektif: ["Dispnea"], objektif: ["PCO₂ meningkat/menurun", "PO₂ menurun", "Takikardia", "pH arteri abnormal"] },
    dataMinor: { subjektif: ["Pusing", "Penglihatan kabur"], objektif: ["Sianosis", "Diaforesis", "Gelisah", "Napas cuping hidung"] },
    kriteriaHasil: ["SpO₂ ≥ 95%", "Dispnea berkurang/tidak ada", "Sianosis tidak ada", "AGD dalam rentang normal"],
    intervensi: {
      observasi:  ["Monitor SpO₂ kontinu", "Monitor frekuensi/irama/kedalaman napas", "Monitor hasil AGD"],
      terapeutik: ["Pertahankan kepatenan jalan napas", "Posisikan semi-Fowler/Fowler", "Berikan oksigen sesuai target SpO₂"],
      edukasi:    ["Ajarkan teknik napas dalam", "Anjurkan lapor bila sesak memberat"],
      kolaborasi: ["Kolaborasi dosis oksigen dengan DPJP", "Kolaborasi AGD tiap 6–12 jam sesuai indikasi"],
    },
    status: "Aktif",
  },
  {
    id: "sdki-d0005", kode: "D.0005", nama: "Pola Napas Tidak Efektif",
    kategori: "Fisiologis", subKategori: "Respirasi", jenis: "Aktual",
    penyebabUmum: "Hambatan upaya napas, depresi pusat pernapasan, nyeri saat bernapas",
    dataMayor: { subjektif: ["Dispnea"], objektif: ["Penggunaan otot bantu napas", "Fase ekspirasi memanjang", "Pola napas abnormal"] },
    dataMinor: { subjektif: ["Ortopnea"], objektif: ["Pernapasan pursed-lip", "Diameter thorax AP meningkat", "Tekanan ekspirasi/inspirasi menurun"] },
    kriteriaHasil: ["Dispnea menurun/tidak ada", "Penggunaan otot bantu napas berkurang", "Frekuensi napas 16–20×/mnt"],
    intervensi: {
      observasi:  ["Monitor frekuensi/irama/kedalaman dan upaya napas", "Monitor SpO₂ berkala", "Monitor pola napas (bradipnea, takipnea)"],
      terapeutik: ["Posisikan semi-Fowler/Fowler", "Berikan oksigen sesuai indikasi", "Pertahankan kepatenan jalan napas"],
      edukasi:    ["Ajarkan teknik relaksasi napas dalam", "Ajarkan mengubah posisi mandiri"],
      kolaborasi: ["Kolaborasi pemberian bronkodilator bila perlu"],
    },
    status: "Aktif",
  },

  // ── Fisiologis · Sirkulasi ──
  {
    id: "sdki-d0008", kode: "D.0008", nama: "Penurunan Curah Jantung",
    kategori: "Fisiologis", subKategori: "Sirkulasi", jenis: "Aktual",
    penyebabUmum: "Perubahan irama jantung, kontraktilitas, preload/afterload, frekuensi jantung",
    dataMayor: { subjektif: ["Lelah"], objektif: ["Edema", "Distensi vena jugularis", "Berat badan bertambah", "Hepatomegali"] },
    dataMinor: { subjektif: ["Dispnea on exertion"], objektif: ["Murmur jantung", "Oliguria", "Akral dingin", "CRT > 3 detik"] },
    kriteriaHasil: ["Tekanan darah dalam batas normal", "Edema berkurang", "CRT < 3 detik", "Toleransi aktivitas meningkat"],
    intervensi: {
      observasi:  ["Identifikasi tanda/gejala penurunan curah jantung", "Monitor TD, HR, SpO₂", "Monitor intake dan output cairan"],
      terapeutik: ["Posisikan semi-Fowler", "Berikan diet rendah garam sesuai indikasi", "Fasilitasi istirahat cukup"],
      edukasi:    ["Anjurkan pembatasan aktivitas berat", "Ajarkan mengenali tanda perburukan"],
      kolaborasi: ["Kolaborasi pemberian diuretik/inotropik bila perlu"],
    },
    status: "Aktif",
  },
  {
    id: "sdki-d0009", kode: "D.0009", nama: "Perfusi Perifer Tidak Efektif",
    kategori: "Fisiologis", subKategori: "Sirkulasi", jenis: "Aktual",
    penyebabUmum: "Hiperglikemia, penurunan konsentrasi hemoglobin, kekurangan volume cairan",
    dataMayor: { subjektif: [], objektif: ["Pengisian kapiler > 3 detik", "Nadi perifer menurun/tidak teraba", "Akral teraba dingin", "Warna kulit pucat"] },
    dataMinor: { subjektif: ["Parestesia", "Nyeri ekstremitas"], objektif: ["Edema", "Penyembuhan luka lambat", "Indeks ankle-brachial < 0.9"] },
    kriteriaHasil: ["Pengisian kapiler < 3 detik", "Akral hangat", "Warna kulit kembali normal", "Nadi perifer teraba kuat"],
    intervensi: {
      observasi:  ["Periksa sirkulasi perifer (nadi, edema, CRT, warna, suhu)", "Identifikasi faktor risiko gangguan sirkulasi"],
      terapeutik: ["Hindari penekanan dan pemasangan tourniquet pada area perfusi terbatas", "Lakukan pencegahan infeksi", "Lakukan perawatan kaki dan kuku"],
      edukasi:    ["Anjurkan berhenti merokok", "Anjurkan olah raga rutin sesuai kondisi"],
      kolaborasi: ["Kolaborasi obat antiplatelet bila perlu"],
    },
    status: "Aktif",
  },

  // ── Fisiologis · Nutrisi/Cairan ──
  {
    id: "sdki-d0019", kode: "D.0019", nama: "Defisit Nutrisi",
    kategori: "Fisiologis", subKategori: "Nutrisi/Cairan", jenis: "Aktual",
    penyebabUmum: "Ketidakmampuan menelan/mencerna makanan, peningkatan kebutuhan metabolisme",
    dataMayor: { subjektif: [], objektif: ["BB menurun minimal 10% di bawah ideal"] },
    dataMinor: { subjektif: ["Cepat kenyang", "Kram/nyeri abdomen", "Nafsu makan menurun"], objektif: ["Bising usus hiperaktif", "Otot pengunyah lemah", "Membran mukosa pucat", "Sariawan", "Serum albumin turun"] },
    kriteriaHasil: ["Porsi makan yang dihabiskan meningkat", "Berat badan stabil/meningkat", "Albumin & protein darah dalam rentang normal"],
    intervensi: {
      observasi:  ["Identifikasi status nutrisi", "Monitor asupan makan tiap shift", "Monitor berat badan harian", "Monitor hasil lab (albumin, Hb)"],
      terapeutik: ["Sajikan makanan sesuai selera dan kondisi medis", "Berikan makanan tinggi kalori dan protein", "Berikan nutrisi enteral/parenteral bila asupan oral tidak adekuat"],
      edukasi:    ["Ajarkan diet sesuai program (DM, jantung, ginjal, dll.)", "Anjurkan makan sedikit tapi sering"],
      kolaborasi: ["Rujuk ahli gizi untuk menentukan kebutuhan kalori dan nutrisi"],
    },
    status: "Aktif",
  },
  {
    id: "sdki-d0022", kode: "D.0022", nama: "Hipervolemia",
    kategori: "Fisiologis", subKategori: "Nutrisi/Cairan", jenis: "Aktual",
    penyebabUmum: "Kelebihan asupan cairan, gangguan mekanisme regulasi (gagal jantung, gagal ginjal)",
    dataMayor: { subjektif: ["Ortopnea", "Dispnea", "Paroxysmal nocturnal dyspnea"], objektif: ["Edema anasarka/perifer", "BB meningkat singkat", "JVP meningkat", "Refleks hepatojugular positif"] },
    dataMinor: { subjektif: [], objektif: ["Distensi vena jugularis", "Suara napas tambahan (ronkhi)", "Hepatomegali", "Kadar Hb/Ht turun", "Oliguria"] },
    kriteriaHasil: ["Edema ekstremitas berkurang/tidak ada", "BB menurun menuju target", "Tekanan darah dalam batas normal", "Ronkhi tidak terdengar"],
    intervensi: {
      observasi:  ["Monitor tanda/gejala hipervolemia tiap shift", "Monitor intake & output cairan", "Monitor BB harian di waktu yang sama"],
      terapeutik: ["Timbang BB tiap pagi", "Batasi asupan cairan sesuai instruksi DPJP", "Tinggikan ekstremitas edema 20–30°"],
      edukasi:    ["Anjurkan lapor bila urine output <30 mL/jam", "Ajarkan cara catat balance cairan"],
      kolaborasi: ["Kolaborasi pemberian diuretik", "Kolaborasi pemeriksaan elektrolit"],
    },
    status: "Aktif",
  },
  {
    id: "sdki-d0023", kode: "D.0023", nama: "Hipovolemia",
    kategori: "Fisiologis", subKategori: "Nutrisi/Cairan", jenis: "Aktual",
    penyebabUmum: "Kehilangan cairan aktif (perdarahan, muntah, diare), asupan cairan tidak adekuat",
    dataMayor: { subjektif: [], objektif: ["Frekuensi nadi meningkat", "Nadi teraba lemah", "Tekanan darah turun", "Tekanan nadi menyempit", "Turgor kulit menurun", "Membran mukosa kering"] },
    dataMinor: { subjektif: ["Merasa lemah", "Mengeluh haus"], objektif: ["Pengisian vena turun", "Status mental berubah", "Suhu tubuh meningkat", "Konsentrasi urine meningkat", "BB turun mendadak"] },
    kriteriaHasil: ["Tekanan darah dalam batas normal", "Frekuensi nadi dalam batas normal", "Membran mukosa lembab", "Turgor kulit elastis"],
    intervensi: {
      observasi:  ["Monitor intake & output cairan tiap shift", "Monitor tanda hipovolemia (TD, nadi, MAP, turgor)", "Monitor BB harian"],
      terapeutik: ["Hitung kebutuhan cairan harian", "Berikan cairan IV sesuai program DPJP", "Berikan cairan oral bertahap bila memungkinkan"],
      edukasi:    ["Anjurkan perbanyak asupan cairan oral bila tidak ada kontraindikasi", "Ajarkan tanda kekurangan cairan yang perlu dilaporkan"],
      kolaborasi: ["Kolaborasi pemberian cairan IV sesuai kebutuhan", "Kolaborasi pemeriksaan elektrolit"],
    },
    status: "Aktif",
  },

  // ── Fisiologis · Aktivitas/Istirahat ──
  {
    id: "sdki-d0054", kode: "D.0054", nama: "Gangguan Mobilitas Fisik",
    kategori: "Fisiologis", subKategori: "Aktivitas/Istirahat", jenis: "Aktual",
    penyebabUmum: "Penurunan kekuatan otot, nyeri saat bergerak, kerusakan integritas struktur tulang",
    dataMayor: { subjektif: ["Mengeluh sulit menggerakkan ekstremitas"], objektif: ["Kekuatan otot menurun", "Rentang gerak (ROM) menurun"] },
    dataMinor: { subjektif: ["Nyeri saat bergerak", "Enggan melakukan pergerakan", "Cemas saat bergerak"], objektif: ["Sendi kaku", "Gerakan tidak terkoordinasi", "Gerakan terbatas", "Fisik lemah"] },
    kriteriaHasil: ["Pergerakan ekstremitas meningkat", "Kekuatan otot meningkat", "ROM meningkat", "Nyeri saat bergerak berkurang"],
    intervensi: {
      observasi:  ["Identifikasi nyeri & keluhan fisik lain saat mobilisasi", "Monitor toleransi fisik saat pergerakan", "Monitor HR dan TD sebelum mobilisasi"],
      terapeutik: ["Fasilitasi aktivitas mobilisasi dengan alat bantu", "Lakukan ROM aktif/pasif sesuai kemampuan", "Libatkan keluarga dalam pergerakan pasien"],
      edukasi:    ["Jelaskan tujuan & prosedur mobilisasi", "Ajarkan mobilisasi bertahap (duduk di tepi bed → berdiri → berjalan)"],
      kolaborasi: ["Kolaborasi dengan fisioterapis untuk program latihan mobilisasi"],
    },
    status: "Aktif",
  },
  {
    id: "sdki-d0056", kode: "D.0056", nama: "Intoleransi Aktivitas",
    kategori: "Fisiologis", subKategori: "Aktivitas/Istirahat", jenis: "Aktual",
    penyebabUmum: "Ketidakseimbangan suplai-kebutuhan oksigen, kelemahan fisik, tirah baring lama",
    dataMayor: { subjektif: ["Mengeluh lelah"], objektif: ["Frekuensi jantung meningkat >20% dari kondisi istirahat"] },
    dataMinor: { subjektif: ["Dispnea saat/setelah aktivitas", "Merasa tidak nyaman saat aktivitas", "Merasa lemah"], objektif: ["TD berubah >20% dari kondisi istirahat", "Gambaran EKG menunjukkan aritmia/iskemia", "Sianosis"] },
    kriteriaHasil: ["Dispnea saat/setelah aktivitas berkurang", "Kemudahan ADL meningkat", "HR dalam batas toleransi aktivitas", "Keluhan kelelahan berkurang"],
    intervensi: {
      observasi:  ["Monitor HR dan SpO₂ sebelum, saat, dan setelah aktivitas", "Identifikasi gangguan fungsi penyebab kelelahan", "Monitor pola dan jam tidur"],
      terapeutik: ["Fasilitasi aktivitas bertahap (tirah baring → duduk → berdiri → jalan)", "Sediakan lingkungan nyaman dan rendah stimulus"],
      edukasi:    ["Ajarkan strategi hemat energi saat beraktivitas", "Anjurkan aktivitas bertahap sesuai toleransi"],
      kolaborasi: ["Kolaborasi dengan fisioterapis untuk program latihan", "Kolaborasi ahli gizi untuk peningkatan asupan energi"],
    },
    status: "Aktif",
  },

  // ── Fisiologis · Neurosensori ──
  {
    id: "sdki-d0077", kode: "D.0077", nama: "Nyeri Akut",
    kategori: "Fisiologis", subKategori: "Neurosensori", jenis: "Aktual",
    penyebabUmum: "Agen pencedera fisik (prosedur invasif, trauma, pembedahan), biologis, kimiawi",
    dataMayor: { subjektif: ["Mengeluh nyeri"], objektif: ["Tampak meringis", "Bersikap protektif (menghindari nyeri)", "Gelisah", "Frekuensi nadi meningkat", "Sulit tidur"] },
    dataMinor: { subjektif: [], objektif: ["Tekanan darah meningkat", "Pola napas berubah", "Nafsu makan berubah", "Proses berpikir terganggu", "Menarik diri"] },
    kriteriaHasil: ["Keluhan nyeri menurun (NRS 0–3)", "Meringis berkurang/tidak ada", "Sikap protektif berkurang", "Pola tidur membaik"],
    intervensi: {
      observasi:  ["Identifikasi lokasi, karakteristik, durasi, frekuensi, kualitas, intensitas nyeri", "Identifikasi skala nyeri (NRS 0–10)", "Monitor efek samping analgetik"],
      terapeutik: ["Berikan teknik nonfarmakologis (relaksasi napas dalam, kompres hangat/dingin)", "Kontrol lingkungan yang memperberat nyeri", "Fasilitasi istirahat dan tidur"],
      edukasi:    ["Jelaskan penyebab, periode, dan pemicu nyeri", "Ajarkan teknik relaksasi napas dalam", "Anjurkan monitor nyeri mandiri"],
      kolaborasi: ["Kolaborasi pemberian analgetik sesuai indikasi"],
    },
    status: "Aktif",
  },
  {
    id: "sdki-d0078", kode: "D.0078", nama: "Nyeri Kronis",
    kategori: "Fisiologis", subKategori: "Neurosensori", jenis: "Aktual",
    penyebabUmum: "Kondisi kronis (kanker, neuropati), gangguan muskuloskeletal kronis",
    dataMayor: { subjektif: ["Mengeluh nyeri", "Merasa depresi/tertekan"], objektif: ["Tampak meringis", "Gelisah", "Tidak mampu menuntaskan aktivitas"] },
    dataMinor: { subjektif: ["Merasa takut terjadi cedera berulang"], objektif: ["Bersikap protektif", "Waspada", "Pola tidur berubah", "Anoreksia", "Fokus menyempit"] },
    kriteriaHasil: ["Keluhan nyeri menurun", "Kemampuan menuntaskan aktivitas meningkat", "Pola tidur membaik"],
    intervensi: {
      observasi:  ["Identifikasi karakteristik nyeri", "Monitor efek samping analgetik kronik", "Monitor mood pasien"],
      terapeutik: ["Berikan teknik nonfarmakologis (relaksasi, distraksi)", "Fasilitasi tidur dan istirahat"],
      edukasi:    ["Jelaskan strategi manajemen nyeri jangka panjang", "Ajarkan jurnal nyeri"],
      kolaborasi: ["Kolaborasi pemberian analgetik kronik sesuai program", "Konsul ke tim manajemen nyeri"],
    },
    status: "Aktif",
  },

  // ── Fisiologis · Termoregulasi/Integumen ──
  {
    id: "sdki-d0129", kode: "D.0129", nama: "Gangguan Integritas Kulit",
    kategori: "Fisiologis", subKategori: "Integumen", jenis: "Aktual",
    penyebabUmum: "Perubahan sirkulasi, penurunan mobilitas, kelembaban berlebih, tekanan berkepanjangan",
    dataMayor: { subjektif: [], objektif: ["Kerusakan jaringan dan/atau lapisan kulit"] },
    dataMinor: { subjektif: [], objektif: ["Nyeri", "Perdarahan", "Kemerahan", "Hematoma"] },
    kriteriaHasil: ["Integritas kulit kembali utuh", "Tidak ada kerusakan kulit/jaringan", "Tidak ada tanda infeksi"],
    intervensi: {
      observasi:  ["Identifikasi penyebab gangguan integritas kulit", "Monitor area kulit yang berisiko"],
      terapeutik: ["Ubah posisi tiap 2 jam jika tirah baring", "Lakukan perawatan luka sesuai kebutuhan", "Gunakan kasur antidekubitus untuk pasien berisiko tinggi"],
      edukasi:    ["Anjurkan menggunakan pelembab", "Ajarkan keluarga teknik miring kanan/kiri"],
      kolaborasi: ["Kolaborasi pemberian topikal/sistemik bila ada infeksi"],
    },
    status: "Aktif",
  },
  {
    id: "sdki-d0130", kode: "D.0130", nama: "Hipertermia",
    kategori: "Fisiologis", subKategori: "Termoregulasi", jenis: "Aktual",
    penyebabUmum: "Dehidrasi, paparan lingkungan panas, proses infeksi, peningkatan metabolisme",
    dataMayor: { subjektif: [], objektif: ["Suhu tubuh > 38.0°C"] },
    dataMinor: { subjektif: [], objektif: ["Kulit kemerahan", "Kejang", "Takikardia", "Takipnea", "Kulit terasa hangat"] },
    kriteriaHasil: ["Suhu tubuh dalam rentang normal (36.5–37.5°C)", "Kulit tidak merah", "Takikardia berkurang"],
    intervensi: {
      observasi:  ["Identifikasi penyebab hipertermia", "Monitor suhu tubuh tiap jam", "Monitor kadar elektrolit"],
      terapeutik: ["Berikan cairan oral/IV", "Lakukan pendinginan eksternal (kompres dingin, fan, water cooling)", "Hindari pemberian antipiretik/aspirin pada anak"],
      edukasi:    ["Anjurkan tirah baring", "Anjurkan minum air putih cukup"],
      kolaborasi: ["Kolaborasi pemberian cairan elektrolit IV bila perlu", "Kolaborasi pemberian antipiretik sesuai indikasi"],
    },
    status: "Aktif",
  },

  // ── Fisiologis · Eliminasi ──
  {
    id: "sdki-d0040", kode: "D.0040", nama: "Gangguan Eliminasi Urin",
    kategori: "Fisiologis", subKategori: "Eliminasi", jenis: "Aktual",
    penyebabUmum: "Penurunan kapasitas kandung kemih, iritasi kandung kemih, penurunan kemampuan menahan urin",
    dataMayor: { subjektif: ["Desakan berkemih (urgency)", "Urin menetes (dribbling)", "Sering buang air kecil", "Nokturia", "Mengompol"], objektif: ["Distensi kandung kemih", "Berkemih tidak tuntas (hesitancy)", "Volume residu urin meningkat"] },
    dataMinor: { subjektif: [], objektif: [] },
    kriteriaHasil: ["Tidak ada distensi kandung kemih", "Berkemih tuntas", "Tidak ada gejala iritasi"],
    intervensi: {
      observasi:  ["Identifikasi tanda/gejala retensi atau inkontinensia urin", "Monitor eliminasi urin (frekuensi, konsistensi, volume, warna, bau)"],
      terapeutik: ["Catat waktu dan volume berkemih", "Batasi asupan cairan bila perlu"],
      edukasi:    ["Ajarkan tanda dan gejala infeksi saluran kemih", "Ajarkan mengukur asupan cairan dan haluaran urin"],
      kolaborasi: ["Kolaborasi pemberian obat supositoria uretra bila perlu"],
    },
    status: "Aktif",
  },

  // ── Fisiologis · Perawatan Diri ──
  {
    id: "sdki-d0109", kode: "D.0109", nama: "Defisit Perawatan Diri: Mandi",
    kategori: "Fisiologis", subKategori: "Aktivitas/Istirahat", jenis: "Aktual",
    penyebabUmum: "Kelemahan fisik, hambatan mobilitas, nyeri, penurunan kesadaran",
    dataMayor: { subjektif: ["Menolak melakukan perawatan diri"], objektif: ["Tidak mampu mandi/mengeringkan tubuh/masuk/keluar kamar mandi secara mandiri"] },
    dataMinor: { subjektif: [], objektif: ["Minat melakukan perawatan diri kurang"] },
    kriteriaHasil: ["Kemampuan mandi meningkat sesuai kondisi", "Kebersihan diri terjaga", "Kemandirian ADL meningkat"],
    intervensi: {
      observasi:  ["Identifikasi tingkat kemandirian ADL harian", "Monitor kebersihan kulit, rambut, mulut, kuku"],
      terapeutik: ["Sediakan peralatan mandi yang mudah dijangkau", "Fasilitasi mandi sesuai kebutuhan (sibin/di kamar mandi)", "Pertahankan kebiasaan kebersihan diri"],
      edukasi:    ["Jelaskan pentingnya kebersihan diri", "Ajarkan keluarga cara memandikan pasien dengan aman"],
      kolaborasi: [],
    },
    status: "Aktif",
  },

  // ── Risiko (Fisiologis) ──
  {
    id: "sdki-d0142", kode: "D.0142", nama: "Risiko Infeksi",
    kategori: "Fisiologis", subKategori: "Keamanan/Proteksi", jenis: "Risiko",
    penyebabUmum: "Tindakan invasif, imunosupresi, prosedur bedah, luka terbuka",
    faktorResiko: "Tindakan invasif (infus, kateter, drain), daya tahan tubuh menurun, luka operasi",
    dataMayor: { subjektif: [], objektif: [] },
    dataMinor: { subjektif: [], objektif: [] },
    kriteriaHasil: ["Tidak ada tanda infeksi (kalor, dolor, rubor, tumor)", "Suhu tubuh dalam batas normal (36–37.5°C)", "Leukosit dalam rentang normal"],
    intervensi: {
      observasi:  ["Monitor tanda/gejala infeksi (lokal & sistemik) tiap shift", "Monitor nilai leukosit", "Monitor kondisi akses infus/luka tiap shift"],
      terapeutik: ["Pertahankan teknik aseptik pada prosedur invasif", "Cuci tangan sebelum & sesudah kontak pasien", "Ganti balutan luka sesuai protokol"],
      edukasi:    ["Jelaskan tanda/gejala infeksi", "Ajarkan teknik cuci tangan yang benar"],
      kolaborasi: ["Kolaborasi pemberian antibiotik sesuai indikasi", "Kolaborasi pemeriksaan kultur bila ada perubahan klinis"],
    },
    status: "Aktif",
  },
  {
    id: "sdki-d0143", kode: "D.0143", nama: "Risiko Jatuh",
    kategori: "Fisiologis", subKategori: "Keamanan/Proteksi", jenis: "Risiko",
    penyebabUmum: "Kelemahan fisik, efek obat sedatif/antihipertensi, gangguan keseimbangan, usia lanjut",
    faktorResiko: "Usia lanjut, kelemahan, penggunaan alat bantu, riwayat jatuh, obat-obatan",
    dataMayor: { subjektif: [], objektif: [] },
    dataMinor: { subjektif: [], objektif: [] },
    kriteriaHasil: ["Tidak terjadi jatuh selama rawat inap", "Pasien dan keluarga memahami risiko jatuh", "Lingkungan aman (pagar bed, alas anti-slip)"],
    intervensi: {
      observasi:  ["Identifikasi risiko jatuh (Skala Morse) tiap shift", "Monitor kemampuan berpindah dan keseimbangan"],
      terapeutik: ["Pasang gelang risiko jatuh kuning", "Pastikan roda tempat tidur terkunci", "Pasang pagar pengaman bed", "Tempatkan bel panggil dalam jangkauan"],
      edukasi:    ["Anjurkan memanggil perawat bila butuh bantuan", "Anjurkan gunakan alas kaki anti-slip", "Edukasi keluarga tentang risiko jatuh"],
      kolaborasi: ["Kolaborasi penggunaan alat bantu jalan bila perlu"],
    },
    status: "Aktif",
  },
  {
    id: "sdki-d0144", kode: "D.0144", nama: "Risiko Cedera",
    kategori: "Fisiologis", subKategori: "Keamanan/Proteksi", jenis: "Risiko",
    penyebabUmum: "Gangguan persepsi, disorientasi, hambatan komunikasi",
    faktorResiko: "Penurunan kesadaran, paparan alat invasif, gangguan koordinasi",
    dataMayor: { subjektif: [], objektif: [] },
    dataMinor: { subjektif: [], objektif: [] },
    kriteriaHasil: ["Tidak terjadi cedera selama perawatan", "Lingkungan aman", "Pasien dan keluarga sadar risiko"],
    intervensi: {
      observasi:  ["Identifikasi area bahaya di lingkungan", "Monitor tingkat kesadaran"],
      terapeutik: ["Sediakan pagar pengaman", "Pastikan pencahayaan adekuat", "Jauhkan benda tajam dari jangkauan"],
      edukasi:    ["Ajarkan keluarga mendampingi pasien dengan gangguan kesadaran"],
      kolaborasi: [],
    },
    status: "Aktif",
  },

  // ── Psikologis ──
  {
    id: "sdki-d0080", kode: "D.0080", nama: "Ansietas",
    kategori: "Psikologis", subKategori: "Integritas Ego", jenis: "Aktual",
    penyebabUmum: "Krisis situasional, ancaman terhadap konsep diri, ancaman kematian, kebutuhan tidak terpenuhi",
    dataMayor: { subjektif: ["Merasa bingung", "Merasa khawatir", "Sulit berkonsentrasi"], objektif: ["Tampak gelisah", "Tampak tegang", "Sulit tidur"] },
    dataMinor: { subjektif: ["Mengeluh pusing", "Anoreksia", "Palpitasi"], objektif: ["Frekuensi napas meningkat", "Frekuensi nadi meningkat", "TD meningkat", "Diaforesis", "Tremor", "Muka tampak pucat", "Suara bergetar"] },
    kriteriaHasil: ["Verbalisasi kekhawatiran berkurang", "Perilaku gelisah menurun", "Tekanan darah dalam batas normal", "Frekuensi nadi normal"],
    intervensi: {
      observasi:  ["Identifikasi saat tingkat ansietas berubah", "Monitor tanda-tanda ansietas (verbal dan nonverbal)"],
      terapeutik: ["Ciptakan suasana terapeutik untuk menumbuhkan kepercayaan", "Temani pasien untuk mengurangi kecemasan bila perlu", "Pahami situasi yang membuat ansietas"],
      edukasi:    ["Anjurkan keluarga tetap bersama pasien", "Latih teknik relaksasi (napas dalam, distraksi)"],
      kolaborasi: ["Kolaborasi pemberian obat ansiolitik bila perlu"],
    },
    status: "Aktif",
  },
  {
    id: "sdki-d0084", kode: "D.0084", nama: "Gangguan Citra Tubuh",
    kategori: "Psikologis", subKategori: "Integritas Ego", jenis: "Aktual",
    penyebabUmum: "Perubahan struktur/bentuk tubuh akibat penyakit, operasi, trauma",
    dataMayor: { subjektif: ["Mengungkapkan kecacatan/kehilangan bagian tubuh"], objektif: ["Kehilangan bagian tubuh", "Fungsi/struktur tubuh berubah/hilang"] },
    dataMinor: { subjektif: ["Tidak mau mengungkapkan kecacatan", "Mengungkapkan perasaan negatif tentang perubahan tubuh"], objektif: ["Menyembunyikan/menunjukkan bagian tubuh berlebihan", "Menghindari melihat bagian tubuh", "Fokus berlebihan pada perubahan tubuh", "Respons nonverbal pada perubahan tubuh"] },
    kriteriaHasil: ["Verbalisasi penerimaan perubahan tubuh meningkat", "Verbalisasi kecemasan pada bagian tubuh menurun", "Hubungan sosial meningkat"],
    intervensi: {
      observasi:  ["Identifikasi citra tubuh dan harapan citra tubuh", "Identifikasi budaya, agama, jenis kelamin, dan usia terkait citra tubuh"],
      terapeutik: ["Diskusikan perbedaan citra tubuh saat ini dan harapan", "Diskusikan kondisi stres yang mempengaruhi citra tubuh"],
      edukasi:    ["Jelaskan kepada keluarga tentang perawatan perubahan citra tubuh", "Latih fungsi tubuh yang dimiliki"],
      kolaborasi: ["Konsul psikolog bila perlu"],
    },
    status: "Aktif",
  },

  // ── Perilaku ──
  {
    id: "sdki-d0111", kode: "D.0111", nama: "Defisit Pengetahuan",
    kategori: "Perilaku", subKategori: "Penyuluhan/Pembelajaran", jenis: "Aktual",
    penyebabUmum: "Keterbatasan kognitif, kurang terpapar informasi, kurang minat dalam belajar",
    dataMayor: { subjektif: ["Menanyakan masalah yang dihadapi"], objektif: ["Menunjukkan perilaku tidak sesuai anjuran", "Menunjukkan persepsi yang keliru terhadap masalah"] },
    dataMinor: { subjektif: [], objektif: ["Menjalani pemeriksaan yang tidak tepat", "Menunjukkan perilaku berlebihan (apatis, agitasi, histeria, marah)"] },
    kriteriaHasil: ["Perilaku sesuai dengan pengetahuan meningkat", "Perilaku sesuai anjuran meningkat", "Pertanyaan tentang masalah yang dihadapi menurun"],
    intervensi: {
      observasi:  ["Identifikasi kesiapan dan kemampuan menerima informasi", "Identifikasi faktor-faktor yang dapat meningkatkan dan menurunkan motivasi pembelajaran"],
      terapeutik: ["Sediakan materi & media pendidikan kesehatan", "Jadwalkan pendidikan kesehatan sesuai kesepakatan", "Beri kesempatan untuk bertanya"],
      edukasi:    ["Jelaskan faktor risiko yang mempengaruhi kesehatan", "Ajarkan perilaku hidup bersih dan sehat", "Ajarkan strategi yang dapat digunakan untuk meningkatkan perilaku hidup sehat"],
      kolaborasi: [],
    },
    status: "Aktif",
  },
  {
    id: "sdki-d0112", kode: "D.0112", nama: "Kesiapan Peningkatan Pengetahuan",
    kategori: "Perilaku", subKategori: "Penyuluhan/Pembelajaran", jenis: "Promosi_Kesehatan",
    penyebabUmum: "—",
    dataMayor: { subjektif: ["Mengungkapkan minat dalam belajar", "Menjelaskan pengetahuan tentang suatu topik"], objektif: ["Perilaku sesuai dengan pengetahuan"] },
    dataMinor: { subjektif: ["Menggambarkan pengalaman sebelumnya yang sesuai dengan topik"], objektif: [] },
    kriteriaHasil: ["Pengetahuan tentang topik meningkat", "Kemampuan menggambarkan pengalaman meningkat"],
    intervensi: {
      observasi:  ["Identifikasi kebutuhan dan keinginan terhadap pengelolaan kesehatan"],
      terapeutik: ["Sediakan materi pendidikan kesehatan tertulis sesuai kebutuhan", "Sediakan kesempatan untuk diskusi dengan tenaga kesehatan"],
      edukasi:    ["Jelaskan kelompok pendukung yang tersedia", "Anjurkan menerapkan pengetahuan baru dalam kehidupan sehari-hari"],
      kolaborasi: [],
    },
    status: "Aktif",
  },
  {
    id: "sdki-d0114", kode: "D.0114", nama: "Ketidakpatuhan",
    kategori: "Perilaku", subKategori: "Penyuluhan/Pembelajaran", jenis: "Aktual",
    penyebabUmum: "Disabilitas, efek samping pengobatan, kompleksitas regimen, lingkungan yang tidak mendukung",
    dataMayor: { subjektif: ["Menolak menjalani perawatan/pengobatan", "Menolak mengikuti anjuran"], objektif: ["Perilaku tidak mengikuti program perawatan/pengobatan", "Perilaku tidak menjalankan anjuran"] },
    dataMinor: { subjektif: [], objektif: ["Tampak tanda/gejala penyakit/masalah kesehatan masih ada atau meningkat", "Tampak komplikasi penyakit/masalah kesehatan menetap atau meningkat"] },
    kriteriaHasil: ["Verbalisasi mengikuti anjuran meningkat", "Risiko komplikasi penyakit menurun"],
    intervensi: {
      observasi:  ["Identifikasi tingkat ketidakpatuhan", "Identifikasi penyebab ketidakpatuhan"],
      terapeutik: ["Buat komitmen menjalani program pengobatan dengan baik", "Diskusikan hal yang dapat mendukung/menghambat berjalannya program pengobatan", "Libatkan keluarga untuk mendukung program pengobatan yang dijalani"],
      edukasi:    ["Informasikan program pengobatan yang harus dijalani", "Informasikan manfaat yang akan diperoleh jika teratur menjalani program pengobatan", "Informasikan akibat yang mungkin terjadi bila tidak menjalani program pengobatan"],
      kolaborasi: ["Kolaborasi dengan keluarga untuk dukungan emosional"],
    },
    status: "Aktif",
  },

  // ── Relasional ──
  {
    id: "sdki-d0119", kode: "D.0119", nama: "Gangguan Interaksi Sosial",
    kategori: "Relasional", subKategori: "Interaksi Sosial", jenis: "Aktual",
    penyebabUmum: "Defisiensi kemampuan interaksi, hambatan komunikasi, kendala lingkungan",
    dataMayor: { subjektif: ["Merasa nyaman dengan situasi sosial", "Merasa sulit menerima/mengkomunikasikan perasaan"], objektif: ["Kurang responsif/tertarik pada orang lain", "Tidak berminat melakukan kontak emosi/fisik"] },
    dataMinor: { subjektif: [], objektif: ["Gejala cemas berat", "Kontak mata kurang", "Ekspresi wajah tidak responsif", "Tidak kooperatif dalam bermain dan berteman dengan sebaya"] },
    kriteriaHasil: ["Perasaan nyaman dengan situasi sosial meningkat", "Responsif pada orang lain meningkat", "Minat melakukan kontak emosi/fisik meningkat"],
    intervensi: {
      observasi:  ["Identifikasi kemampuan melakukan interaksi dengan orang lain", "Identifikasi hambatan melakukan interaksi dengan orang lain"],
      terapeutik: ["Motivasi meningkatkan keterlibatan dalam hubungan", "Motivasi kesabaran dalam mengembangkan suatu hubungan", "Beri umpan balik positif pada setiap peningkatan kemampuan"],
      edukasi:    ["Anjurkan berinteraksi dengan orang lain secara bertahap", "Anjurkan ikut serta dalam kegiatan sosial dan kemasyarakatan"],
      kolaborasi: ["Rujuk pada kelompok keterampilan interpersonal/psikoterapi"],
    },
    status: "Aktif",
  },
  {
    id: "sdki-d0121", kode: "D.0121", nama: "Ketegangan Peran Pemberi Asuhan",
    kategori: "Relasional", subKategori: "Peran/Hubungan", jenis: "Aktual",
    penyebabUmum: "Beban peran pemberi asuhan yang lama dan kompleksitas perawatan",
    dataMayor: { subjektif: ["Khawatir akan keberlangsungan asuhan", "Khawatir akan kemampuan memberi asuhan"], objektif: ["Kesulitan menyelesaikan tugas merawat"] },
    dataMinor: { subjektif: ["Menyatakan tertekan", "Marah dan tidak mampu menyelesaikan tugas"], objektif: ["Mudah sakit", "Penurunan kondisi fisik penerima asuhan"] },
    kriteriaHasil: ["Kemampuan memberikan asuhan meningkat", "Kesejahteraan psikologis pemberi asuhan meningkat", "Stres pemberi asuhan menurun"],
    intervensi: {
      observasi:  ["Identifikasi kesiapan dan kemampuan pemberi asuhan", "Identifikasi pengetahuan pemberi asuhan"],
      terapeutik: ["Diskusikan kekuatan dan kelemahan pemberi asuhan", "Berikan dukungan emosional"],
      edukasi:    ["Ajarkan strategi pemecahan masalah dalam memberikan asuhan", "Ajarkan teknik perawatan diri untuk pemberi asuhan"],
      kolaborasi: ["Rujuk ke kelompok dukungan/konseling"],
    },
    status: "Aktif",
  },

  // ── Lingkungan ──
  {
    id: "sdki-d0148", kode: "D.0148", nama: "Risiko Cedera Lingkungan",
    kategori: "Lingkungan", subKategori: "Keamanan/Proteksi", jenis: "Risiko",
    penyebabUmum: "Paparan zat/lingkungan berbahaya, pencahayaan kurang, lantai licin",
    faktorResiko: "Lingkungan tidak aman, paparan toksin, pencahayaan tidak adekuat",
    dataMayor: { subjektif: [], objektif: [] },
    dataMinor: { subjektif: [], objektif: [] },
    kriteriaHasil: ["Tidak terjadi cedera lingkungan", "Lingkungan aman dari bahaya"],
    intervensi: {
      observasi:  ["Identifikasi bahaya lingkungan", "Monitor perubahan status keamanan lingkungan"],
      terapeutik: ["Sediakan lingkungan yang aman (lantai kering, pagar pengaman)", "Hilangkan bahaya lingkungan (kabel longgar, barang berbahaya)"],
      edukasi:    ["Ajarkan keluarga modifikasi lingkungan untuk keamanan"],
      kolaborasi: [],
    },
    status: "Aktif",
  },
];

export const SDKI_MOCK: SdkiItem[] = SDKI_DATA;

// ── Validators ───────────────────────────────────────────

export function isSdkiValid(item: SdkiItem, isNew = false): boolean {
  if (isNew) return !!item.nama.trim();
  return !!(
    item.kode.trim() &&
    item.nama.trim() &&
    item.kategori &&
    item.kriteriaHasil.length > 0
  );
}

// ── UI helpers ───────────────────────────────────────────

export function sdkiInitials(item: SdkiItem): string {
  return item.kode.replace(/[^A-Za-z0-9]/g, "").slice(0, 4).toUpperCase() || "??";
}

export function getSdkiStatusCfg(status: SdkiStatus) {
  if (status === "Non_Aktif") {
    return { label: "Non-Aktif", bg: "bg-slate-100", text: "text-slate-500", dot: "bg-slate-400" };
  }
  return { label: "Aktif", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" };
}

export function countSdkiIntervensi(item: SdkiItem): number {
  return (
    item.intervensi.observasi.length +
    item.intervensi.terapeutik.length +
    item.intervensi.edukasi.length +
    item.intervensi.kolaborasi.length
  );
}
