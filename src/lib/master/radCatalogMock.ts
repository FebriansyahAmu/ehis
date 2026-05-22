/**
 * Source-of-truth Katalog Pemeriksaan Radiologi.
 * Digunakan oleh: KatalogRadiologiPage (master), nantinya RadOrderHeader/Akuisisi/Expertise (workflow).
 *
 * Standard:
 *   - PMK 1014/2008 (Standar Pelayanan Radiologi Diagnostik)
 *   - PMK 24/2020 (Pelayanan Radiologi Klinik)
 *   - Perka BAPETEN No. 2/2018 (Keselamatan Radiasi dalam Penggunaan Pesawat Sinar-X)
 *   - IAEA HH-19 (Diagnostic Reference Levels in Medical Imaging)
 *   - ACR Practice Parameters
 *
 * Catatan DRL: nilai di sini = referensi maksimum dewasa standar BMI 60–80 kg.
 * Untuk pediatrik dan extreme BMI, RS wajib menetapkan DRL lokal terpisah.
 */

// ── Enum & Types ─────────────────────────────────────────

export type RadModalitas =
  | "Konvensional"
  | "CT"
  | "MRI"
  | "USG"
  | "Fluoroskopi"
  | "Mammografi"
  | "DEXA"
  | "Intervensi";

export type RadRegion =
  | "Kepala_Leher"
  | "Thorax"
  | "Abdomen"
  | "Pelvis"
  | "Ekstremitas_Atas"
  | "Ekstremitas_Bawah"
  | "Tulang_Belakang"
  | "Mammae"
  | "Ginekologi"
  | "Vaskular"
  | "Whole_Body"
  | "Lainnya";

export type RadKategori = "Diagnostik" | "Intervensi" | "Skrining";

export type RadJenisKontras =
  | "Tanpa"
  | "IV_Iodinasi"
  | "Oral"
  | "Rektal"
  | "Gadolinium"
  | "Kombinasi";

export type RadStatus = "Aktif" | "Non_Aktif";

export interface DRLReferensi {
  /** CT — Computed Tomography Dose Index volume (mGy) */
  ctdiVol?: number;
  /** CT — Dose-Length Product (mGy·cm) */
  dlp?: number;
  /** Fluoroskopi — Dose-Area Product (Gy·cm²) */
  dap?: number;
  /** Fluoroskopi — Waktu fluoroskopi (menit) */
  waktuFluoroMenit?: number;
  /** Konvensional & Mammografi — Entrance Surface Dose (mGy) */
  entranceDose?: number;
  /** Catatan referensi/sumber */
  catatan?: string;
}

export interface PersiapanProtap {
  puasaJam?: number;
  premedikasi?: string;
  kontraindikasi: string[];
  /** Instruksi khusus untuk pasien sebelum pemeriksaan */
  instruksiPasien?: string;
  catatanKhusus?: string;
}

export interface KontrasInfo {
  jenis: RadJenisKontras;
  dosisMl?: number;
  kecepatanInjeksiMlSec?: number;
  premedikasiSteroidJikaAlergi?: boolean;
  catatan?: string;
}

export interface ReportingTemplate {
  /** Section header default (Indikasi / Teknik / Temuan / Kesan / Saran) */
  struktur: string[];
  /** Template terstruktur untuk bagian Temuan */
  templateTemuan?: string;
}

export interface RadCatalogRecord {
  id: string;
  kode: string;
  nama: string;
  modalitas: RadModalitas;
  region: RadRegion;
  kategori: RadKategori;
  estimasiWaktuMenit: number;
  tatTargetMenit: { cito: number; semiCito: number; rutin: number };
  persiapan: PersiapanProtap;
  kontras: KontrasInfo;
  drlReferensi?: DRLReferensi;
  reportingTemplate: ReportingTemplate;
  deskripsi?: string;
  status: RadStatus;
}

// ── Empty factory ─────────────────────────────────────────

export function emptyRadCatalogRecord(): RadCatalogRecord {
  return {
    id: `rk-${Date.now()}`,
    kode: "",
    nama: "",
    modalitas: "Konvensional",
    region: "Thorax",
    kategori: "Diagnostik",
    estimasiWaktuMenit: 15,
    tatTargetMenit: { cito: 60, semiCito: 180, rutin: 360 },
    persiapan: { kontraindikasi: [] },
    kontras: { jenis: "Tanpa" },
    reportingTemplate: {
      struktur: ["Indikasi Klinis", "Teknik Pemeriksaan", "Temuan", "Kesan", "Saran"],
    },
    status: "Aktif",
  };
}

// ── Mock Data ─────────────────────────────────────────────

const STRUKTUR_DEFAULT = ["Indikasi Klinis", "Teknik Pemeriksaan", "Temuan", "Kesan", "Saran"];

export const RAD_KATALOG_MOCK: RadCatalogRecord[] = [
  // ── Konvensional / X-Ray ──────────────────────────
  {
    id: "rk-001",
    kode: "ICD-87.44",
    nama: "Foto Thorax PA",
    modalitas: "Konvensional",
    region: "Thorax",
    kategori: "Diagnostik",
    estimasiWaktuMenit: 10,
    tatTargetMenit: { cito: 30, semiCito: 120, rutin: 360 },
    persiapan: {
      kontraindikasi: ["Hamil trimester 1 (relatif)"],
      instruksiPasien: "Lepas perhiasan logam pada area thorax. Pakai gown.",
    },
    kontras: { jenis: "Tanpa" },
    drlReferensi: {
      entranceDose: 0.4,
      catatan: "PMK 1014/2008 — DRL dewasa Foto Thorax PA",
    },
    reportingTemplate: {
      struktur: STRUKTUR_DEFAULT,
      templateTemuan:
        "Trakea: di tengah / deviasi (sebutkan).\nMediastinum: lebar normal / melebar.\nJantung: CTR (sebutkan %), kontur dalam batas normal.\nParu kanan: corak bronkovaskular (sebutkan).\nParu kiri: corak bronkovaskular (sebutkan).\nSinus & diafragma: tajam / tumpul.\nTulang & soft tissue: dalam batas normal.",
    },
    deskripsi: "Foto polos dada proyeksi postero-anterior. Lini pertama evaluasi paru, jantung, mediastinum.",
    status: "Aktif",
  },
  {
    id: "rk-002",
    kode: "ICD-87.49",
    nama: "Foto Thorax AP",
    modalitas: "Konvensional",
    region: "Thorax",
    kategori: "Diagnostik",
    estimasiWaktuMenit: 10,
    tatTargetMenit: { cito: 30, semiCito: 120, rutin: 360 },
    persiapan: {
      kontraindikasi: ["Hamil trimester 1 (relatif)"],
      instruksiPasien: "Pasien immobile / bedside. Posisi supine.",
    },
    kontras: { jenis: "Tanpa" },
    drlReferensi: { entranceDose: 0.5, catatan: "PMK 1014/2008 — DRL Foto Thorax AP supine" },
    reportingTemplate: {
      struktur: STRUKTUR_DEFAULT,
      templateTemuan:
        "Posisi AP supine — proyeksi dapat menyebabkan magnifikasi jantung.\nTrakea, mediastinum, jantung: (sebutkan).\nLapangan paru: (sebutkan kelainan).\nSinus & diafragma: (sebutkan).",
    },
    deskripsi: "Foto thorax proyeksi antero-posterior, biasanya untuk pasien tidak bisa berdiri.",
    status: "Aktif",
  },
  {
    id: "rk-003",
    kode: "ICD-88.19",
    nama: "Foto BNO 3 Posisi",
    modalitas: "Konvensional",
    region: "Abdomen",
    kategori: "Diagnostik",
    estimasiWaktuMenit: 15,
    tatTargetMenit: { cito: 30, semiCito: 120, rutin: 360 },
    persiapan: {
      kontraindikasi: ["Hamil"],
      instruksiPasien: "Lepas perhiasan logam pada area abdomen.",
    },
    kontras: { jenis: "Tanpa" },
    drlReferensi: { entranceDose: 4, catatan: "PMK 1014/2008 — Abdomen polos AP" },
    reportingTemplate: {
      struktur: STRUKTUR_DEFAULT,
      templateTemuan:
        "Distribusi udara usus: normal / abnormal.\nDilatasi usus: tidak ada / ada (sebutkan).\nAir-fluid level: tidak ada / ada (sebutkan jumlah).\nBatu radioopak: tidak ada / ada (sebutkan lokasi).\nKontur psoas line, preperitoneal fat: (sebutkan).\nTulang vertebra & pelvis: (sebutkan).",
    },
    deskripsi: "3 posisi: supine, semi-erect/erect, lateral decubitus kiri. Standar evaluasi akut abdomen.",
    status: "Aktif",
  },
  {
    id: "rk-004",
    kode: "ICD-87.16",
    nama: "Foto Cranium AP/Lateral",
    modalitas: "Konvensional",
    region: "Kepala_Leher",
    kategori: "Diagnostik",
    estimasiWaktuMenit: 10,
    tatTargetMenit: { cito: 30, semiCito: 120, rutin: 360 },
    persiapan: {
      kontraindikasi: ["Hamil (relatif)"],
      instruksiPasien: "Lepas anting, kalung, jepit rambut logam.",
    },
    kontras: { jenis: "Tanpa" },
    drlReferensi: { entranceDose: 3, catatan: "PMK 1014/2008 — Cranium AP" },
    reportingTemplate: {
      struktur: STRUKTUR_DEFAULT,
      templateTemuan:
        "Tabula eksterna & interna: utuh / fraktur.\nSutura: normal / diastasis.\nSinus paranasalis: (sebutkan jika tervisualisasi).\nSella tursica: (sebutkan).",
    },
    deskripsi: "Foto cranium 2 proyeksi untuk evaluasi trauma kepala atau kelainan tulang.",
    status: "Aktif",
  },

  // ── CT Scan ───────────────────────────────────────
  {
    id: "rk-101",
    kode: "ICD-87.41",
    nama: "CT Thorax Non-Kontras",
    modalitas: "CT",
    region: "Thorax",
    kategori: "Diagnostik",
    estimasiWaktuMenit: 20,
    tatTargetMenit: { cito: 60, semiCito: 180, rutin: 360 },
    persiapan: {
      kontraindikasi: ["Hamil"],
      instruksiPasien: "Lepas perhiasan logam pada area thorax. Pasien menahan napas saat akuisisi.",
    },
    kontras: { jenis: "Tanpa" },
    drlReferensi: {
      ctdiVol: 12, dlp: 350,
      catatan: "PMK 1014/2008 — DRL dewasa CT Thorax non-kontras",
    },
    reportingTemplate: {
      struktur: STRUKTUR_DEFAULT,
      templateTemuan:
        "Trakea & bronkus utama: paten.\nParenkim paru: (sebutkan lesi/konsolidasi/ground-glass).\nMediastinum: limfonodi (jumlah & ukuran).\nJantung & pembuluh besar: (sebutkan).\nPleura: efusi / penebalan.\nTulang & soft tissue: (sebutkan).",
    },
    deskripsi: "CT thorax tanpa kontras. Indikasi: skrining nodul, evaluasi tuberkulosis, follow-up.",
    status: "Aktif",
  },
  {
    id: "rk-102",
    kode: "ICD-87.41",
    nama: "CT Thorax dengan Kontras",
    modalitas: "CT",
    region: "Thorax",
    kategori: "Diagnostik",
    estimasiWaktuMenit: 25,
    tatTargetMenit: { cito: 60, semiCito: 180, rutin: 360 },
    persiapan: {
      puasaJam: 4,
      kontraindikasi: ["Hamil", "Kreatinin >1.5 mg/dL", "Alergi iodinasi berat", "Hipertiroid tidak terkontrol"],
      instruksiPasien: "Puasa 4 jam. Akses IV ukuran 18G di vena antecubital. Hidrasi pre dan post.",
      catatanKhusus: "Cek kreatinin dalam 30 hari terakhir. Premedikasi steroid jika riwayat alergi ringan.",
    },
    kontras: {
      jenis: "IV_Iodinasi",
      dosisMl: 90,
      kecepatanInjeksiMlSec: 3,
      premedikasiSteroidJikaAlergi: true,
      catatan: "Iohexol 300/350 mg/ml atau Iopromide 370 mg/ml.",
    },
    drlReferensi: {
      ctdiVol: 15, dlp: 450,
      catatan: "PMK 1014/2008 — DRL dewasa CT Thorax kontras",
    },
    reportingTemplate: {
      struktur: STRUKTUR_DEFAULT,
      templateTemuan:
        "Pemberian kontras: (jumlah & jenis).\nFase akuisisi: arterial / vena / delayed.\nTrakea, bronkus, parenkim paru: (sebutkan).\nMediastinum & limfonodi (lokasi + ukuran).\nJantung & pembuluh besar: (sebutkan).\nLesi enhancement (lokasi, ukuran, pola enhancement).",
    },
    deskripsi: "CT thorax dengan kontras IV. Indikasi: massa mediastinum, emboli paru (CT-PA), staging onkologi.",
    status: "Aktif",
  },
  {
    id: "rk-103",
    kode: "ICD-88.01",
    nama: "CT Abdomen dengan Kontras",
    modalitas: "CT",
    region: "Abdomen",
    kategori: "Diagnostik",
    estimasiWaktuMenit: 30,
    tatTargetMenit: { cito: 60, semiCito: 180, rutin: 360 },
    persiapan: {
      puasaJam: 6,
      kontraindikasi: ["Hamil", "Kreatinin >1.5 mg/dL", "Alergi iodinasi berat"],
      instruksiPasien: "Puasa 6 jam. Minum kontras oral 1000 ml dalam 60 menit pre-akuisisi.",
      catatanKhusus: "3-fase: non-kontras, arterial (30s), portal (70s), delayed (3 min) sesuai indikasi.",
    },
    kontras: {
      jenis: "Kombinasi",
      dosisMl: 100,
      kecepatanInjeksiMlSec: 3,
      premedikasiSteroidJikaAlergi: true,
      catatan: "Iodinasi IV + Iodinasi oral encer (mis. Iohexol 300 mg/ml 30 ml dalam 1000 ml air).",
    },
    drlReferensi: {
      ctdiVol: 18, dlp: 700,
      catatan: "PMK 1014/2008 — DRL dewasa CT Abdomen kontras",
    },
    reportingTemplate: {
      struktur: STRUKTUR_DEFAULT,
      templateTemuan:
        "Hepar: ukuran, parenkim, lesi fokal (sebutkan).\nKandung empedu: (sebutkan).\nPankreas: (sebutkan).\nLien: ukuran, parenkim.\nGinjal: ukuran, parenkim, sistem pelvocalices.\nLambung, usus, mesenterium: (sebutkan).\nLimfonodi & pembuluh: (sebutkan).\nTulang & soft tissue: (sebutkan).",
    },
    deskripsi: "CT abdomen kontras. Indikasi: massa, infeksi, trauma, evaluasi pasca-operasi.",
    status: "Aktif",
  },
  {
    id: "rk-104",
    kode: "ICD-87.03",
    nama: "CT Kepala Non-Kontras",
    modalitas: "CT",
    region: "Kepala_Leher",
    kategori: "Diagnostik",
    estimasiWaktuMenit: 15,
    tatTargetMenit: { cito: 30, semiCito: 120, rutin: 360 },
    persiapan: {
      kontraindikasi: ["Hamil"],
      instruksiPasien: "Lepas perhiasan & gigi palsu logam.",
    },
    kontras: { jenis: "Tanpa" },
    drlReferensi: {
      ctdiVol: 60, dlp: 1000,
      catatan: "PMK 1014/2008 — DRL dewasa CT Kepala non-kontras",
    },
    reportingTemplate: {
      struktur: STRUKTUR_DEFAULT,
      templateTemuan:
        "Parenkim otak: (sebutkan area hipodens/hiperdens).\nSistem ventrikel: ukuran & posisi.\nGirus & sulkus: (sebutkan).\nSisterna basal: (sebutkan).\nPerdarahan: tidak ada / ada (sebutkan lokasi + perkiraan volume).\nTulang cranium & SPN: (sebutkan).\nMidline shift: tidak ada / ada (sebutkan mm).",
    },
    deskripsi: "CT kepala non-kontras. Lini pertama untuk stroke, trauma kepala, perdarahan akut.",
    status: "Aktif",
  },

  // ── USG ───────────────────────────────────────────
  {
    id: "rk-201",
    kode: "ICD-88.76",
    nama: "USG Abdomen Lengkap",
    modalitas: "USG",
    region: "Abdomen",
    kategori: "Diagnostik",
    estimasiWaktuMenit: 25,
    tatTargetMenit: { cito: 60, semiCito: 180, rutin: 360 },
    persiapan: {
      puasaJam: 6,
      kontraindikasi: [],
      instruksiPasien: "Puasa 6 jam (untuk evaluasi vesika felea & pankreas). Vesika urinaria penuh.",
    },
    kontras: { jenis: "Tanpa" },
    reportingTemplate: {
      struktur: STRUKTUR_DEFAULT,
      templateTemuan:
        "Hepar: ukuran, ekogenisitas, kontur, lesi fokal.\nVesika felea: ukuran, dinding, batu, sludge.\nDuktus biliaris: tidak melebar / melebar.\nPankreas: kepala/corpus/cauda (jika tervisualisasi).\nLien: ukuran, ekogenisitas.\nGinjal: ukuran, batas korteks-medula, batu, hidronefrosis.\nVesika urinaria: dinding, isi, batu.\nProstat (laki) / Uterus (perempuan): ukuran, ekogenisitas.",
    },
    deskripsi: "USG abdomen total. Lini pertama hepatobilier, ginjal, batu saluran kemih, evaluasi nyeri abdomen.",
    status: "Aktif",
  },
  {
    id: "rk-202",
    kode: "ICD-88.71",
    nama: "USG Tiroid",
    modalitas: "USG",
    region: "Kepala_Leher",
    kategori: "Diagnostik",
    estimasiWaktuMenit: 15,
    tatTargetMenit: { cito: 60, semiCito: 180, rutin: 360 },
    persiapan: {
      kontraindikasi: [],
      instruksiPasien: "Tidak perlu persiapan khusus. Lepas kalung & pakaian leher tinggi.",
    },
    kontras: { jenis: "Tanpa" },
    reportingTemplate: {
      struktur: STRUKTUR_DEFAULT,
      templateTemuan:
        "Lobus kanan: ukuran (LxAPxT), ekogenisitas, nodul (TI-RADS).\nLobus kiri: ukuran (LxAPxT), ekogenisitas, nodul (TI-RADS).\nIstmus: ukuran AP.\nLimfonodi leher (level I-VI): (sebutkan).\nKesimpulan TI-RADS.",
    },
    deskripsi: "USG tiroid + limfonodi leher. Standar klasifikasi nodul: TI-RADS ACR.",
    status: "Aktif",
  },
  {
    id: "rk-203",
    kode: "ICD-88.73",
    nama: "USG Mammae Bilateral",
    modalitas: "USG",
    region: "Mammae",
    kategori: "Diagnostik",
    estimasiWaktuMenit: 25,
    tatTargetMenit: { cito: 120, semiCito: 180, rutin: 360 },
    persiapan: {
      kontraindikasi: [],
      instruksiPasien: "Hindari pemeriksaan saat menstruasi. Jadwal hari ke 7-14 siklus.",
    },
    kontras: { jenis: "Tanpa" },
    reportingTemplate: {
      struktur: STRUKTUR_DEFAULT,
      templateTemuan:
        "Mammae kanan (kuadran UO/UM/UI/LM/LO/areolar): lesi (sebutkan lokasi jam, ukuran, BI-RADS).\nMammae kiri (kuadran UO/UM/UI/LM/LO/areolar): lesi (sebutkan lokasi jam, ukuran, BI-RADS).\nLimfonodi aksila kanan & kiri: (sebutkan).\nKesimpulan BI-RADS akhir.",
    },
    deskripsi: "USG mammae bilateral. Standar klasifikasi: BI-RADS ACR. Pelengkap mammografi pada jaringan padat.",
    status: "Aktif",
  },

  // ── MRI ───────────────────────────────────────────
  {
    id: "rk-301",
    kode: "ICD-88.91",
    nama: "MRI Brain Non-Kontras",
    modalitas: "MRI",
    region: "Kepala_Leher",
    kategori: "Diagnostik",
    estimasiWaktuMenit: 35,
    tatTargetMenit: { cito: 120, semiCito: 240, rutin: 720 },
    persiapan: {
      kontraindikasi: ["Pacemaker non-MRI safe", "Cochlear implant", "Aneurysm clip ferromagnetik", "Klaustrofobia berat"],
      instruksiPasien: "Skrining metallic implant. Lepas semua barang logam. Hindari makeup mengandung logam.",
      catatanKhusus: "Sequence: T1, T2, FLAIR, DWI, T2*. Tambah MRA pada evaluasi vaskular.",
    },
    kontras: { jenis: "Tanpa" },
    reportingTemplate: {
      struktur: STRUKTUR_DEFAULT,
      templateTemuan:
        "Sequence yang dilakukan: (sebutkan).\nParenkim otak: (T1/T2/FLAIR signal abnormal — sebutkan area & karakter).\nSistem ventrikel: ukuran & posisi.\nDifusi (DWI/ADC): restriksi / tidak.\nT2* / SWI: produk darah / kalsifikasi.\nMidline shift, herniasi: (sebutkan).\nSPN, mastoid, orbita (jika tervisualisasi).",
    },
    deskripsi: "MRI otak rutin tanpa kontras. Sequence standar untuk stroke iskemik, lesi white matter, infeksi.",
    status: "Aktif",
  },
  {
    id: "rk-302",
    kode: "ICD-88.94",
    nama: "MRI Knee",
    modalitas: "MRI",
    region: "Ekstremitas_Bawah",
    kategori: "Diagnostik",
    estimasiWaktuMenit: 30,
    tatTargetMenit: { cito: 120, semiCito: 240, rutin: 720 },
    persiapan: {
      kontraindikasi: ["Pacemaker non-MRI safe", "Klaustrofobia berat"],
      instruksiPasien: "Lepas semua barang logam pada area lutut & ekstremitas. Posisi supine.",
      catatanKhusus: "Knee coil dedicated. Sequence: PD-FS sagittal/coronal/axial, T1, T2*.",
    },
    kontras: { jenis: "Tanpa" },
    reportingTemplate: {
      struktur: STRUKTUR_DEFAULT,
      templateTemuan:
        "Meniscus medial (anterior/body/posterior horn): utuh / robekan (sebutkan tipe).\nMeniscus lateral (anterior/body/posterior horn): utuh / robekan (sebutkan tipe).\nACL: utuh / robek parsial / robek komplit.\nPCL: (sebutkan).\nLigamen kolateral medial & lateral: (sebutkan).\nCartilage compartment: (sebutkan).\nTulang subkondral, bone marrow edema: (sebutkan).\nBaker cyst / efusi sendi: (sebutkan).",
    },
    deskripsi: "MRI knee tanpa kontras. Gold standard evaluasi cedera meniscus & ligamen.",
    status: "Aktif",
  },

  // ── Mammografi ────────────────────────────────────
  {
    id: "rk-401",
    kode: "ICD-87.37",
    nama: "Mammografi Bilateral (Skrining)",
    modalitas: "Mammografi",
    region: "Mammae",
    kategori: "Skrining",
    estimasiWaktuMenit: 20,
    tatTargetMenit: { cito: 120, semiCito: 180, rutin: 720 },
    persiapan: {
      kontraindikasi: ["Hamil", "Laktasi (relatif)"],
      instruksiPasien: "Hindari deodoran, lotion, parfum pada area mammae & aksila. Jadwal hari ke 7-14 siklus.",
    },
    kontras: { jenis: "Tanpa" },
    drlReferensi: {
      entranceDose: 10,
      catatan: "PMK 1014/2008 — DRL Mammografi (dewasa, payudara komprehensi 4.5 cm)",
    },
    reportingTemplate: {
      struktur: STRUKTUR_DEFAULT,
      templateTemuan:
        "Posisi: CC + MLO bilateral.\nDensitas mammae (ACR a/b/c/d).\nMammae kanan: lesi (lokasi clock, ukuran, karakter, BI-RADS).\nMammae kiri: lesi (lokasi clock, ukuran, karakter, BI-RADS).\nMikrokalsifikasi: tidak ada / ada (sebutkan distribusi, morfologi, BI-RADS).\nKesimpulan BI-RADS akhir.",
    },
    deskripsi: "Mammografi screening 4 view (CC + MLO bilateral). Standar BI-RADS ACR.",
    status: "Aktif",
  },

  // ── Fluoroskopi ───────────────────────────────────
  {
    id: "rk-501",
    kode: "ICD-87.83",
    nama: "HSG (Hysterosalpingografi)",
    modalitas: "Fluoroskopi",
    region: "Ginekologi",
    kategori: "Diagnostik",
    estimasiWaktuMenit: 30,
    tatTargetMenit: { cito: 240, semiCito: 360, rutin: 1440 },
    persiapan: {
      kontraindikasi: ["Hamil", "PID akut", "Perdarahan aktif", "Alergi iodinasi berat"],
      instruksiPasien: "Jadwal hari 9-12 siklus. Profilaksis antibiotik 1 jam sebelum prosedur.",
      catatanKhusus: "Posisi litotomi. Spekulum + kateter Foley intrauterine + injeksi kontras pelan.",
    },
    kontras: {
      jenis: "IV_Iodinasi",
      dosisMl: 10,
      catatan: "Iohexol 300 mg/ml diinjeksi pelan via kateter intrauterine, bukan IV.",
    },
    drlReferensi: {
      dap: 2.5,
      waktuFluoroMenit: 5,
      catatan: "Perka BAPETEN No. 2/2018 — DAP referensi HSG dewasa",
    },
    reportingTemplate: {
      struktur: STRUKTUR_DEFAULT,
      templateTemuan:
        "Kavum uteri: bentuk, ukuran, isi (sebutkan defek/polip/septum).\nTuba kanan: paten / tersumbat (sebutkan lokasi proksimal/medial/distal).\nTuba kiri: paten / tersumbat (sebutkan lokasi proksimal/medial/distal).\nSpillage peritoneum: ada / tidak (bilateral/unilateral).\nKesimpulan patensi tuba.",
    },
    deskripsi: "Fluoroskopi HSG untuk evaluasi patensi tuba & kavum uteri pada infertilitas.",
    status: "Aktif",
  },

  // ── DEXA ──────────────────────────────────────────
  {
    id: "rk-601",
    kode: "ICD-88.98",
    nama: "DEXA Bone Densitometry",
    modalitas: "DEXA",
    region: "Whole_Body",
    kategori: "Diagnostik",
    estimasiWaktuMenit: 20,
    tatTargetMenit: { cito: 240, semiCito: 360, rutin: 720 },
    persiapan: {
      kontraindikasi: ["Hamil", "Pemeriksaan kontras dalam 7 hari terakhir"],
      instruksiPasien: "Lepas perhiasan logam. Pakai baju tanpa logam (zipper, kancing).",
    },
    kontras: { jenis: "Tanpa" },
    drlReferensi: {
      entranceDose: 0.01,
      catatan: "DEXA — dosis sangat rendah, < 1/10 foto Thorax.",
    },
    reportingTemplate: {
      struktur: STRUKTUR_DEFAULT,
      templateTemuan:
        "Lumbar spine (L1-L4): BMD (g/cm²), T-score, Z-score.\nFemur kanan (Neck + Total): BMD (g/cm²), T-score, Z-score.\nFemur kiri (Neck + Total): BMD (g/cm²), T-score, Z-score.\nKlasifikasi WHO: Normal (T-score ≥ -1.0) / Osteopenia (-1.0 > T ≥ -2.5) / Osteoporosis (T < -2.5).",
    },
    deskripsi: "DEXA densitometri tulang. Standar diagnosis osteoporosis & evaluasi terapi.",
    status: "Aktif",
  },
];

// ── Lookup helper ─────────────────────────────────────────

export function getRadCatalogById(id: string): RadCatalogRecord | undefined {
  return RAD_KATALOG_MOCK.find((r) => r.id === id);
}
