import type { StatusLuaran, ShiftType, AsuhanKeperawatanEntry } from "@/lib/data";

// ── Form state (omit server-generated / readonly fields) ──

export type AsuhanFormState = Omit<
  AsuhanKeperawatanEntry,
  "id" | "verified" | "verifiedBy" | "verifiedAt" | "evaluasi" | "aktif"
>;

// ── Catalog item shape ─────────────────────────────────────

export interface SdkiCatalogItem {
  kode:        string;
  nama:        string;
  penyebabUmum: string;
  faktorResiko?: string;
  kriteriaHasil: string[];
  intervensi:  { observasi: string[]; terapeutik: string[]; edukasi: string[]; kolaborasi: string[] };
}

// ── Status Luaran config ───────────────────────────────────

export const STATUS_LUARAN_CONFIG: Record<StatusLuaran, {
  label: string; cls: string; dotCls: string; icon: string;
}> = {
  Teratasi:          { label: "Teratasi",           cls: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200", dotCls: "bg-emerald-500", icon: "✓" },
  Teratasi_Sebagian: { label: "Teratasi Sebagian",  cls: "bg-amber-100 text-amber-700 ring-1 ring-amber-200",     dotCls: "bg-amber-500",   icon: "⚡" },
  Belum_Teratasi:    { label: "Belum Teratasi",      cls: "bg-rose-100 text-rose-700 ring-1 ring-rose-200",        dotCls: "bg-rose-500",    icon: "✗" },
  Dipantau:          { label: "Dalam Pemantauan",    cls: "bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200",  dotCls: "bg-indigo-500",  icon: "●" },
};

export const SHIFT_CONFIG: Record<ShiftType, { label: string; badgeCls: string }> = {
  Pagi:  { label: "Pagi",  badgeCls: "bg-amber-50 text-amber-700 ring-1 ring-amber-200" },
  Siang: { label: "Siang", badgeCls: "bg-sky-50 text-sky-700 ring-1 ring-sky-200" },
  Malam: { label: "Malam", badgeCls: "bg-slate-100 text-slate-600 ring-1 ring-slate-200" },
};

// ── Helpers ────────────────────────────────────────────────

export function emptyForm(): AsuhanFormState {
  return {
    kodeSdki:     "",
    dataMayor:    { subjektif: "", objektif: "" },
    dataMinor:    { subjektif: "", objektif: "" },
    faktorResiko: "",
    diagnosa:     "",
    penyebab:     "",
    tujuanDurasi: "3",
    tujuanUnit:   "Hari",
    selama:       "pasien dirawat",
    kriteriaHasil: [""],
    intervensi:   { observasi: [""], terapeutik: [""], edukasi: [""], kolaborasi: [""] },
    tanggalInput: new Date().toISOString().split("T")[0],
    perawat:      "",
    statusLuaran: "Dipantau",
  };
}

export function applyTemplate(item: SdkiCatalogItem): Partial<AsuhanFormState> {
  return {
    kodeSdki:     item.kode,
    diagnosa:     `${item.nama} b.d ${item.penyebabUmum.split(",")[0].toLowerCase()} d.d `,
    penyebab:     item.penyebabUmum,
    faktorResiko: item.faktorResiko ?? "",
    kriteriaHasil: item.kriteriaHasil.length ? item.kriteriaHasil : [""],
    intervensi:   {
      observasi:  item.intervensi.observasi.length  ? item.intervensi.observasi  : [""],
      terapeutik: item.intervensi.terapeutik.length ? item.intervensi.terapeutik : [""],
      edukasi:    item.intervensi.edukasi.length    ? item.intervensi.edukasi    : [""],
      kolaborasi: item.intervensi.kolaborasi.length ? item.intervensi.kolaborasi : [""],
    },
  };
}

// ── SDKI Catalog (15 diagnosa umum RI) ────────────────────

export const SDKI_CATALOG: SdkiCatalogItem[] = [
  {
    kode: "D.0077", nama: "Nyeri Akut",
    penyebabUmum: "Agen pencedera fisik (prosedur invasif, trauma, pembedahan)",
    kriteriaHasil: [
      "Keluhan nyeri menurun (skala 0–3)",
      "Meringis berkurang / tidak ada",
      "Sikap protektif berkurang",
      "Pola tidur membaik",
    ],
    intervensi: {
      observasi:  ["Identifikasi lokasi, karakteristik, durasi, frekuensi, kualitas, intensitas nyeri", "Identifikasi skala nyeri (NRS 0–10)", "Monitor efek samping analgetik"],
      terapeutik: ["Berikan teknik nonfarmakologis (relaksasi napas dalam, kompres hangat/dingin)", "Kontrol lingkungan yang memperberat nyeri (kebisingan, suhu)", "Fasilitasi istirahat dan tidur"],
      edukasi:    ["Jelaskan penyebab, periode, dan pemicu nyeri", "Ajarkan teknik relaksasi napas dalam", "Anjurkan monitor nyeri secara mandiri"],
      kolaborasi: ["Kolaborasi pemberian analgetik sesuai indikasi"],
    },
  },
  {
    kode: "D.0001", nama: "Bersihan Jalan Napas Tidak Efektif",
    penyebabUmum: "Sekresi yang tertahan, spasme jalan napas",
    kriteriaHasil: [
      "Produksi sputum berkurang",
      "Ronkhi / mengi tidak terdengar",
      "Frekuensi napas 16–20x/mnt",
      "Kemampuan batuk efektif meningkat",
    ],
    intervensi: {
      observasi:  ["Monitor pola napas (frekuensi, kedalaman, usaha napas)", "Monitor bunyi napas tambahan (ronkhi, mengi, wheezing)", "Monitor sputum (jumlah, warna, aroma)"],
      terapeutik: ["Posisikan semi-Fowler atau Fowler", "Lakukan penghisapan lendir <15 detik jika perlu", "Berikan oksigen sesuai kebutuhan"],
      edukasi:    ["Anjurkan asupan cairan 2000 mL/hari jika tidak ada kontraindikasi", "Ajarkan teknik batuk efektif"],
      kolaborasi: ["Kolaborasi pemberian bronkodilator / ekspektoran jika perlu"],
    },
  },
  {
    kode: "D.0005", nama: "Pola Napas Tidak Efektif",
    penyebabUmum: "Hambatan upaya napas, depresi pusat pernapasan, nyeri saat bernapas",
    kriteriaHasil: [
      "Dispnea menurun / tidak ada",
      "Penggunaan otot bantu napas berkurang",
      "Frekuensi napas 16–20x/mnt",
    ],
    intervensi: {
      observasi:  ["Monitor frekuensi, irama, kedalaman dan upaya napas", "Monitor SpO₂ secara berkala", "Monitor pola napas (bradipnea, takipnea)"],
      terapeutik: ["Posisikan semi-Fowler/Fowler", "Berikan oksigen sesuai indikasi", "Pertahankan kepatenan jalan napas"],
      edukasi:    ["Ajarkan teknik relaksasi napas dalam", "Ajarkan mengubah posisi secara mandiri"],
      kolaborasi: ["Kolaborasi pemberian bronkodilator jika perlu"],
    },
  },
  {
    kode: "D.0003", nama: "Gangguan Pertukaran Gas",
    penyebabUmum: "Ketidakseimbangan ventilasi-perfusi, edema paru, pneumonia",
    kriteriaHasil: [
      "SpO₂ ≥ 95%",
      "Dispnea berkurang / tidak ada",
      "Sianosis tidak ada",
      "AGD dalam rentang normal",
    ],
    intervensi: {
      observasi:  ["Monitor SpO₂ secara kontinu", "Monitor frekuensi, irama, kedalaman dan upaya napas", "Monitor hasil AGD (Analisis Gas Darah)"],
      terapeutik: ["Pertahankan kepatenan jalan napas", "Posisikan semi-Fowler atau Fowler", "Berikan oksigen sesuai target SpO₂"],
      edukasi:    ["Ajarkan teknik napas dalam", "Anjurkan melaporkan sesak napas atau perubahan yang dirasakan"],
      kolaborasi: ["Kolaborasi penentuan dosis oksigen dengan DPJP", "Kolaborasi AGD tiap 6–12 jam sesuai indikasi"],
    },
  },
  {
    kode: "D.0022", nama: "Hipervolemia",
    penyebabUmum: "Kelebihan asupan cairan, gangguan mekanisme regulasi (gagal jantung, gagal ginjal)",
    kriteriaHasil: [
      "Edema ekstremitas berkurang / tidak ada",
      "Berat badan menurun menuju target",
      "Tekanan darah dalam batas normal",
      "Ronkhi tidak terdengar",
    ],
    intervensi: {
      observasi:  ["Monitor tanda dan gejala hipervolemia tiap shift (edema, dispnea, JVP)", "Monitor intake dan output cairan", "Monitor berat badan harian di waktu yang sama"],
      terapeutik: ["Timbang berat badan setiap pagi", "Batasi asupan cairan sesuai instruksi DPJP", "Tinggikan ekstremitas yang edema 20–30 derajat"],
      edukasi:    ["Anjurkan melapor jika haluaran urine <30 mL/jam", "Ajarkan cara mencatat balance cairan"],
      kolaborasi: ["Kolaborasi pemberian diuretik sesuai indikasi", "Kolaborasi pemeriksaan elektrolit"],
    },
  },
  {
    kode: "D.0023", nama: "Hipovolemia",
    penyebabUmum: "Kehilangan cairan aktif (perdarahan, muntah, diare), asupan cairan tidak adekuat",
    kriteriaHasil: [
      "Tekanan darah dalam batas normal",
      "Frekuensi nadi dalam batas normal",
      "Membran mukosa lembab",
      "Turgor kulit elastis",
    ],
    intervensi: {
      observasi:  ["Monitor intake dan output cairan tiap shift", "Monitor tanda-tanda hipovolemia (TD, nadi, MAP, turgor kulit)", "Monitor berat badan harian"],
      terapeutik: ["Hitung kebutuhan cairan harian", "Berikan cairan IV sesuai program DPJP", "Berikan cairan oral secara bertahap jika kondisi memungkinkan"],
      edukasi:    ["Anjurkan memperbanyak asupan cairan oral jika tidak ada kontraindikasi", "Ajarkan tanda-tanda kekurangan cairan yang perlu dilaporkan"],
      kolaborasi: ["Kolaborasi pemberian cairan IV sesuai kebutuhan", "Kolaborasi pemeriksaan elektrolit"],
    },
  },
  {
    kode: "D.0142", nama: "Risiko Infeksi",
    penyebabUmum: "Tindakan invasif, imunosupresi, prosedur bedah, luka terbuka",
    faktorResiko: "Tindakan invasif (infus, kateter, drain), daya tahan tubuh menurun, luka operasi",
    kriteriaHasil: [
      "Tidak ada tanda infeksi (kalor, dolor, rubor, tumor)",
      "Suhu tubuh dalam batas normal (36–37.5°C)",
      "Leukosit dalam rentang normal",
    ],
    intervensi: {
      observasi:  ["Monitor tanda dan gejala infeksi (lokal dan sistemik) tiap shift", "Monitor nilai leukosit", "Monitor kondisi akses infus / luka tiap shift"],
      terapeutik: ["Pertahankan teknik aseptik pada semua prosedur invasif", "Cuci tangan sebelum dan sesudah kontak pasien", "Ganti balutan luka sesuai protokol"],
      edukasi:    ["Jelaskan tanda dan gejala infeksi", "Ajarkan teknik cuci tangan yang benar"],
      kolaborasi: ["Kolaborasi pemberian antibiotik sesuai indikasi", "Kolaborasi pemeriksaan kultur jika ada perubahan klinis"],
    },
  },
  {
    kode: "D.0143", nama: "Risiko Jatuh",
    penyebabUmum: "Kelemahan fisik, efek obat sedatif/antihipertensi, gangguan keseimbangan, usia lanjut",
    faktorResiko: "Usia lanjut, kelemahan, penggunaan alat bantu, riwayat jatuh, obat-obatan",
    kriteriaHasil: [
      "Tidak terjadi jatuh selama rawat inap",
      "Pasien dan keluarga memahami risiko jatuh",
      "Lingkungan aman (pagar bed, alas anti-slip)",
    ],
    intervensi: {
      observasi:  ["Identifikasi risiko jatuh (Skala Morse) tiap shift", "Monitor kemampuan berpindah dan keseimbangan pasien"],
      terapeutik: ["Pasang gelang risiko jatuh kuning", "Pastikan roda tempat tidur terkunci", "Pasang pagar pengaman tempat tidur", "Tempatkan bel panggil dalam jangkauan pasien"],
      edukasi:    ["Anjurkan memanggil perawat jika butuh bantuan", "Anjurkan gunakan alas kaki anti-slip", "Edukasi keluarga tentang risiko jatuh dan pencegahannya"],
      kolaborasi: ["Kolaborasi penggunaan alat bantu jalan jika perlu"],
    },
  },
  {
    kode: "D.0054", nama: "Gangguan Mobilitas Fisik",
    penyebabUmum: "Penurunan kekuatan otot, nyeri saat bergerak, kerusakan integritas struktur tulang",
    kriteriaHasil: [
      "Pergerakan ekstremitas meningkat",
      "Kekuatan otot meningkat",
      "ROM meningkat",
      "Nyeri saat bergerak berkurang",
    ],
    intervensi: {
      observasi:  ["Identifikasi adanya nyeri dan keluhan fisik lain saat mobilisasi", "Monitor toleransi fisik dalam melakukan pergerakan", "Monitor HR dan TD sebelum memulai mobilisasi"],
      terapeutik: ["Fasilitasi aktivitas mobilisasi dengan alat bantu", "Lakukan ROM aktif/pasif sesuai kemampuan", "Libatkan keluarga dalam meningkatkan pergerakan pasien"],
      edukasi:    ["Jelaskan tujuan dan prosedur mobilisasi", "Ajarkan mobilisasi bertahap (duduk di tepi bed → berdiri → berjalan)"],
      kolaborasi: ["Kolaborasi dengan fisioterapis untuk program latihan mobilisasi"],
    },
  },
  {
    kode: "D.0056", nama: "Intoleransi Aktivitas",
    penyebabUmum: "Ketidakseimbangan antara suplai dan kebutuhan oksigen, kelemahan fisik, tirah baring lama",
    kriteriaHasil: [
      "Dispnea saat dan setelah aktivitas berkurang",
      "Kemudahan melakukan aktivitas sehari-hari meningkat",
      "HR dalam batas toleransi aktivitas",
      "Keluhan kelelahan berkurang",
    ],
    intervensi: {
      observasi:  ["Monitor HR dan SpO2 sebelum, saat, dan setelah aktivitas", "Identifikasi gangguan fungsi yang mengakibatkan kelelahan", "Monitor pola dan jam tidur"],
      terapeutik: ["Fasilitasi aktivitas secara bertahap (tirah baring → duduk → berdiri → jalan)", "Sediakan lingkungan nyaman dan rendah stimulus"],
      edukasi:    ["Ajarkan strategi hemat energi saat beraktivitas", "Anjurkan aktivitas bertahap sesuai toleransi"],
      kolaborasi: ["Kolaborasi dengan fisioterapis untuk program latihan", "Kolaborasi ahli gizi untuk peningkatan asupan energi"],
    },
  },
  {
    kode: "D.0019", nama: "Deficit Nutrisi",
    penyebabUmum: "Ketidakmampuan menelan/mencerna makanan, peningkatan kebutuhan metabolisme",
    kriteriaHasil: [
      "Porsi makan yang dihabiskan meningkat",
      "Berat badan stabil atau meningkat",
      "Albumin dan protein darah dalam rentang normal",
    ],
    intervensi: {
      observasi:  ["Identifikasi status nutrisi", "Monitor asupan makan tiap shift", "Monitor berat badan harian", "Monitor hasil lab (albumin, Hb)"],
      terapeutik: ["Sajikan makanan sesuai selera dan kondisi medis", "Berikan makanan tinggi kalori dan protein", "Berikan nutrisi enteral/parenteral jika asupan oral tidak adekuat"],
      edukasi:    ["Ajarkan diet sesuai yang diprogramkan (DM, jantung, ginjal, dll)", "Anjurkan makan sedikit tapi sering"],
      kolaborasi: ["Rujuk ahli gizi untuk menentukan kebutuhan kalori dan nutrisi"],
    },
  },
  {
    kode: "D.0109", nama: "Deficit Perawatan Diri: Mandi",
    penyebabUmum: "Kelemahan fisik, hambatan mobilitas, nyeri, penurunan kesadaran",
    kriteriaHasil: [
      "Kemampuan mandi meningkat sesuai kondisi",
      "Kebersihan diri terjaga",
      "Kemandirian ADL meningkat",
    ],
    intervensi: {
      observasi:  ["Identifikasi tingkat kemandirian ADL tiap hari", "Monitor kebersihan kulit, rambut, mulut, dan kuku"],
      terapeutik: ["Sediakan peralatan mandi di tempat yang mudah dijangkau", "Fasilitasi mandi sesuai kebutuhan (sibin / di kamar mandi)", "Pertahankan kebiasaan kebersihan diri"],
      edukasi:    ["Jelaskan pentingnya kebersihan diri terhadap kesehatan", "Ajarkan keluarga cara memandikan pasien dengan aman"],
      kolaborasi: [],
    },
  },
  {
    kode: "D.0129", nama: "Gangguan Integritas Kulit",
    penyebabUmum: "Perubahan sirkulasi, penurunan mobilitas, kelembaban berlebih, tekanan berkepanjangan",
    kriteriaHasil: [
      "Kerusakan jaringan berkurang / tidak ada",
      "Kerusakan lapisan kulit berkurang",
      "Nyeri berkurang",
    ],
    intervensi: {
      observasi:  ["Identifikasi penyebab gangguan integritas kulit", "Monitor karakteristik luka (warna, ukuran, bau, drainase)", "Monitor tanda-tanda infeksi pada luka"],
      terapeutik: ["Alih posisi tiap 2 jam untuk mencegah decubitus", "Lakukan perawatan luka sesuai protokol", "Gunakan matras anti-decubitus"],
      edukasi:    ["Anjurkan mengonsumsi makanan tinggi kalori dan protein", "Ajarkan perawatan luka secara mandiri kepada pasien/keluarga"],
      kolaborasi: ["Kolaborasi prosedur debridement jika perlu", "Kolaborasi pemberian suplemen vitamin dan mineral"],
    },
  },
  {
    kode: "D.0080", nama: "Ansietas",
    penyebabUmum: "Krisis situasional (hospitalisasi, diagnosis penyakit berat, prosedur tindakan)",
    kriteriaHasil: [
      "Verbalisasi khawatir berkurang",
      "Perilaku gelisah berkurang",
      "Pola tidur membaik",
      "Ekspresi wajah tenang",
    ],
    intervensi: {
      observasi:  ["Identifikasi saat tingkat ansietas berubah", "Monitor tanda-tanda ansietas (verbal dan nonverbal)"],
      terapeutik: ["Ciptakan suasana terapeutik untuk menumbuhkan kepercayaan", "Temani pasien dan dengarkan dengan aktif", "Gunakan pendekatan yang tenang dan meyakinkan"],
      edukasi:    ["Jelaskan prosedur dan sensasi yang mungkin dialami dengan bahasa yang mudah dimengerti", "Ajarkan teknik relaksasi (napas dalam, distraksi, imajinasi terbimbing)"],
      kolaborasi: ["Kolaborasi pemberian obat antiansietas jika perlu"],
    },
  },
  {
    kode: "D.0027", nama: "Ketidakstabilan Kadar Glukosa Darah",
    penyebabUmum: "Hiperglikemia / hipoglikemia akibat DM, penggunaan steroid, kurang asupan karbohidrat",
    kriteriaHasil: [
      "GDS dalam rentang target (GDP 80–130 mg/dL, GD2JPP <180 mg/dL)",
      "Keluhan pusing / gemetar berkurang",
      "Tidak ada episode hipoglikemia berat",
    ],
    intervensi: {
      observasi:  ["Monitor kadar glukosa darah sesuai program (sebelum makan dan tidur)", "Monitor tanda hipoglikemia (gemetar, diaphoresis, kesadaran menurun)", "Monitor tanda hiperglikemia (polidipsia, poliuria, kelemahan)"],
      terapeutik: ["Berikan karbohidrat sederhana jika hipoglikemia (jika pasien sadar)", "Pertahankan jadwal makan dan pemberian insulin yang konsisten"],
      edukasi:    ["Ajarkan cara mengatasi hipoglikemia (aturan 15-15)", "Ajarkan diet sesuai program diabetes"],
      kolaborasi: ["Kolaborasi pemberian insulin atau OAD sesuai indikasi", "Kolaborasi HbA1c dan evaluasi kontrol glikemik"],
    },
  },
];
