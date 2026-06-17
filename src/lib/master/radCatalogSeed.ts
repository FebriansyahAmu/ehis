/**
 * Seed Katalog Radiologi (master.RadCatalog). Plain data (Node-loadable) — di-seed via
 * prisma/scripts/seed-rad-catalog.mts dan dibaca OrderRadTab (workflow) sebelum endpoint
 * `rad-catalog-tersedia` ada. Tipe = RadCatalogRecord (import type-only, erased saat runtime).
 *
 * Konvensi:
 *  - `kode` internal `RAD-NNNN` eksplisit (counter di-set ke seq tertinggi → entri baru lanjut).
 *  - `kodeIcd` = ICD-9-CM prosedur (tanpa prefix "ICD-"), OPSIONAL.
 *  - `modalitas` = method FHIR SatuSehat (XR/CT/MR/RF/US/MG/DXA/NM) + `modalitasSubtype` opsional.
 *  - DRL = referensi maksimum dewasa (PMK 1014/2008 · BAPETEN 2/2018 · IAEA HH-19).
 */

import type { RadCatalogRecord } from "./radCatalogMock";

const STRUKTUR = ["Indikasi Klinis", "Teknik Pemeriksaan", "Temuan", "Kesan", "Saran"];

/** Seed = RadCatalogRecord tanpa `id` (id uuid dibuat saat insert). */
export type RadCatalogSeed = Omit<RadCatalogRecord, "id">;

export const RAD_CATALOG_SEED: RadCatalogSeed[] = [
  // ── XR · Radiografi konvensional ──────────────────────────
  {
    kode: "RAD-0001",
    kodeIcd: "87.44",
    nama: "Foto Thorax PA",
    modalitas: "XR",
    region: "Thorax",
    kategori: "Diagnostik",
    estimasiWaktuMenit: 10,
    tatTargetMenit: { cito: 30, semiCito: 120, rutin: 360 },
    persiapan: {
      kontraindikasi: ["Hamil trimester 1 (relatif)"],
      instruksiPasien: "Lepas perhiasan logam pada area thorax. Pakai gown. Tarik napas dalam & tahan saat ekspos.",
    },
    kontras: { jenis: "Tanpa" },
    drlReferensi: { entranceDose: 0.4, catatan: "PMK 1014/2008 — DRL dewasa Foto Thorax PA" },
    reportingTemplate: {
      struktur: STRUKTUR,
      templateTemuan:
        "Trakea: di tengah / deviasi (sebutkan).\nMediastinum: lebar normal / melebar.\nJantung: CTR (sebutkan %), kontur dalam batas normal.\nParu kanan: corak bronkovaskular (sebutkan).\nParu kiri: corak bronkovaskular (sebutkan).\nSinus & diafragma: tajam / tumpul.\nTulang & soft tissue: dalam batas normal.",
    },
    deskripsi: "Foto polos dada proyeksi postero-anterior. Lini pertama evaluasi paru, jantung, mediastinum.",
    status: "Aktif",
  },
  {
    kode: "RAD-0002",
    kodeIcd: "87.49",
    nama: "Foto Thorax AP (Portable)",
    modalitas: "XR",
    modalitasSubtype: "XR.portable",
    region: "Thorax",
    kategori: "Diagnostik",
    estimasiWaktuMenit: 10,
    tatTargetMenit: { cito: 30, semiCito: 120, rutin: 360 },
    persiapan: {
      kontraindikasi: ["Hamil trimester 1 (relatif)"],
      instruksiPasien: "Pasien immobile / bedside. Posisi supine atau semi-erect.",
    },
    kontras: { jenis: "Tanpa" },
    drlReferensi: { entranceDose: 0.5, catatan: "PMK 1014/2008 — DRL Foto Thorax AP supine" },
    reportingTemplate: {
      struktur: STRUKTUR,
      templateTemuan:
        "Posisi AP supine — proyeksi dapat menyebabkan magnifikasi jantung.\nTrakea, mediastinum, jantung: (sebutkan).\nLapangan paru: (sebutkan kelainan).\nPosisi alat (ETT/CVC/NGT) bila ada: (sebutkan).\nSinus & diafragma: (sebutkan).",
    },
    deskripsi: "Foto thorax proyeksi antero-posterior portable, untuk pasien tidak dapat berdiri (ICU/bedside).",
    status: "Aktif",
  },
  {
    kode: "RAD-0003",
    kodeIcd: "88.19",
    nama: "Foto Abdomen 3 Posisi (BNO)",
    modalitas: "XR",
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
      struktur: STRUKTUR,
      templateTemuan:
        "Distribusi udara usus: normal / abnormal.\nDilatasi usus: tidak ada / ada (sebutkan).\nAir-fluid level: tidak ada / ada (sebutkan jumlah).\nUdara bebas subdiafragma: ada / tidak.\nBatu radioopak: tidak ada / ada (sebutkan lokasi).\nKontur psoas line, preperitoneal fat: (sebutkan).\nTulang vertebra & pelvis: (sebutkan).",
    },
    deskripsi: "3 posisi: supine, semi-erect/erect, lateral decubitus kiri. Standar evaluasi akut abdomen.",
    status: "Aktif",
  },
  {
    kode: "RAD-0004",
    kodeIcd: "87.17",
    nama: "Foto Cranium AP/Lateral",
    modalitas: "XR",
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
      struktur: STRUKTUR,
      templateTemuan:
        "Tabula eksterna & interna: utuh / fraktur.\nSutura: normal / diastasis.\nSinus paranasalis: (sebutkan jika tervisualisasi).\nSella tursica: (sebutkan).",
    },
    deskripsi: "Foto cranium 2 proyeksi untuk evaluasi trauma kepala atau kelainan tulang.",
    status: "Aktif",
  },
  {
    kode: "RAD-0005",
    kodeIcd: "88.23",
    nama: "Foto Antebrachii AP/Lateral",
    modalitas: "XR",
    region: "Ekstremitas_Atas",
    kategori: "Diagnostik",
    estimasiWaktuMenit: 10,
    tatTargetMenit: { cito: 30, semiCito: 120, rutin: 360 },
    persiapan: {
      kontraindikasi: [],
      instruksiPasien: "Lepas perhiasan/gips logam pada area pemeriksaan.",
    },
    kontras: { jenis: "Tanpa" },
    drlReferensi: { entranceDose: 0.2, catatan: "PMK 1014/2008 — ekstremitas" },
    reportingTemplate: {
      struktur: STRUKTUR,
      templateTemuan:
        "Aligment os radius & ulna: (sebutkan).\nGaris fraktur: tidak ada / ada (sebutkan lokasi, tipe, displacement).\nSendi (elbow/wrist): (sebutkan).\nSoft tissue: (sebutkan swelling).",
    },
    deskripsi: "Foto lengan bawah 2 proyeksi. Indikasi trauma, evaluasi fraktur.",
    status: "Aktif",
  },

  // ── CT ────────────────────────────────────────────────────
  {
    kode: "RAD-0006",
    kodeIcd: "87.41",
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
    drlReferensi: { ctdiVol: 12, dlp: 350, catatan: "PMK 1014/2008 — DRL dewasa CT Thorax non-kontras" },
    reportingTemplate: {
      struktur: STRUKTUR,
      templateTemuan:
        "Trakea & bronkus utama: paten.\nParenkim paru: (sebutkan lesi/konsolidasi/ground-glass).\nMediastinum: limfonodi (jumlah & ukuran).\nJantung & pembuluh besar: (sebutkan).\nPleura: efusi / penebalan.\nTulang & soft tissue: (sebutkan).",
    },
    deskripsi: "CT thorax tanpa kontras. Indikasi: skrining nodul, evaluasi tuberkulosis, follow-up.",
    status: "Aktif",
  },
  {
    kode: "RAD-0007",
    kodeIcd: "87.41",
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
      catatanKhusus: "Cek kreatinin/eGFR dalam 30 hari terakhir. Premedikasi steroid jika riwayat alergi ringan.",
    },
    kontras: {
      jenis: "IV_Iodinasi",
      dosisMl: 90,
      kecepatanInjeksiMlSec: 3,
      premedikasiSteroidJikaAlergi: true,
      catatan: "Iohexol 300/350 mg/ml atau Iopromide 370 mg/ml.",
    },
    drlReferensi: { ctdiVol: 15, dlp: 450, catatan: "PMK 1014/2008 — DRL dewasa CT Thorax kontras" },
    reportingTemplate: {
      struktur: STRUKTUR,
      templateTemuan:
        "Pemberian kontras: (jumlah & jenis).\nFase akuisisi: arterial / vena / delayed.\nTrakea, bronkus, parenkim paru: (sebutkan).\nMediastinum & limfonodi (lokasi + ukuran).\nJantung & pembuluh besar: (sebutkan).\nLesi enhancement (lokasi, ukuran, pola enhancement).",
    },
    deskripsi: "CT thorax dengan kontras IV. Indikasi: massa mediastinum, staging onkologi.",
    status: "Aktif",
  },
  {
    kode: "RAD-0008",
    kodeIcd: "88.38",
    nama: "CT Pulmonary Angiography (CTPA)",
    modalitas: "CT",
    modalitasSubtype: "CT.angio",
    region: "Vaskular",
    kategori: "Diagnostik",
    estimasiWaktuMenit: 25,
    tatTargetMenit: { cito: 45, semiCito: 120, rutin: 240 },
    persiapan: {
      kontraindikasi: ["Hamil (pertimbangkan V/Q scan)", "Alergi iodinasi berat", "Kreatinin >1.5 mg/dL"],
      instruksiPasien: "Akses IV 18G antecubital. Bolus tracking arteri pulmonalis. Tahan napas.",
      catatanKhusus: "Protokol emboli paru — timing bolus pada trunkus pulmonalis.",
    },
    kontras: {
      jenis: "IV_Iodinasi",
      dosisMl: 70,
      kecepatanInjeksiMlSec: 4,
      premedikasiSteroidJikaAlergi: true,
      catatan: "High-flow 4–5 ml/s + saline chaser.",
    },
    drlReferensi: { ctdiVol: 14, dlp: 420, catatan: "IAEA HH-19 — CTPA dewasa" },
    reportingTemplate: {
      struktur: STRUKTUR,
      templateTemuan:
        "Filling defect a. pulmonalis: tidak ada / ada (sentral/lobar/segmental/subsegmental — sebutkan sisi).\nRight heart strain (rasio RV/LV): (sebutkan).\nInfark paru / oligemia: (sebutkan).\nEfusi pleura: (sebutkan).\nParenkim paru: (sebutkan).",
    },
    deskripsi: "CT angiografi arteri pulmonalis. Baku emas diagnosis emboli paru akut.",
    status: "Aktif",
  },
  {
    kode: "RAD-0009",
    kodeIcd: "88.01",
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
      catatanKhusus: "Multifase: non-kontras, arterial (30s), portal (70s), delayed (3 min) sesuai indikasi.",
    },
    kontras: {
      jenis: "Kombinasi",
      dosisMl: 100,
      kecepatanInjeksiMlSec: 3,
      premedikasiSteroidJikaAlergi: true,
      catatan: "Iodinasi IV + iodinasi oral encer (Iohexol 300 mg/ml 30 ml dalam 1000 ml air).",
    },
    drlReferensi: { ctdiVol: 18, dlp: 700, catatan: "PMK 1014/2008 — DRL dewasa CT Abdomen kontras" },
    reportingTemplate: {
      struktur: STRUKTUR,
      templateTemuan:
        "Hepar: ukuran, parenkim, lesi fokal (sebutkan).\nKandung empedu & duktus biliaris: (sebutkan).\nPankreas: (sebutkan).\nLien: ukuran, parenkim.\nGinjal: ukuran, parenkim, sistem pelvocalices.\nLambung, usus, mesenterium: (sebutkan).\nLimfonodi & pembuluh: (sebutkan).\nTulang & soft tissue: (sebutkan).",
    },
    deskripsi: "CT abdomen kontras. Indikasi: massa, infeksi, trauma, evaluasi pasca-operasi.",
    status: "Aktif",
  },
  {
    kode: "RAD-0010",
    kodeIcd: "87.03",
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
    drlReferensi: { ctdiVol: 60, dlp: 1000, catatan: "PMK 1014/2008 — DRL dewasa CT Kepala non-kontras" },
    reportingTemplate: {
      struktur: STRUKTUR,
      templateTemuan:
        "Parenkim otak: (sebutkan area hipodens/hiperdens).\nSistem ventrikel: ukuran & posisi.\nGirus & sulkus: (sebutkan).\nSisterna basal: (sebutkan).\nPerdarahan: tidak ada / ada (sebutkan lokasi + perkiraan volume).\nTulang cranium & SPN: (sebutkan).\nMidline shift: tidak ada / ada (sebutkan mm).",
    },
    deskripsi: "CT kepala non-kontras. Lini pertama stroke, trauma kepala, perdarahan akut.",
    status: "Aktif",
  },

  // ── US ─────────────────────────────────────────────────────
  {
    kode: "RAD-0011",
    kodeIcd: "88.76",
    nama: "USG Abdomen Lengkap",
    modalitas: "US",
    region: "Abdomen",
    kategori: "Diagnostik",
    estimasiWaktuMenit: 25,
    tatTargetMenit: { cito: 60, semiCito: 180, rutin: 360 },
    persiapan: {
      puasaJam: 6,
      kontraindikasi: [],
      instruksiPasien: "Puasa 6 jam (evaluasi vesika felea & pankreas). Vesika urinaria penuh.",
    },
    kontras: { jenis: "Tanpa" },
    reportingTemplate: {
      struktur: STRUKTUR,
      templateTemuan:
        "Hepar: ukuran, ekogenisitas, kontur, lesi fokal.\nVesika felea: ukuran, dinding, batu, sludge.\nDuktus biliaris: tidak melebar / melebar.\nPankreas: kepala/corpus/cauda (jika tervisualisasi).\nLien: ukuran, ekogenisitas.\nGinjal: ukuran, batas korteks-medula, batu, hidronefrosis.\nVesika urinaria: dinding, isi, batu.\nProstat (♂) / Uterus & adneksa (♀): ukuran, ekogenisitas.",
    },
    deskripsi: "USG abdomen total. Lini pertama hepatobilier, ginjal, batu saluran kemih, nyeri abdomen.",
    status: "Aktif",
  },
  {
    kode: "RAD-0012",
    kodeIcd: "88.71",
    nama: "USG Tiroid",
    modalitas: "US",
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
      struktur: STRUKTUR,
      templateTemuan:
        "Lobus kanan: ukuran (LxAPxT), ekogenisitas, nodul (TI-RADS).\nLobus kiri: ukuran (LxAPxT), ekogenisitas, nodul (TI-RADS).\nIstmus: ukuran AP.\nLimfonodi leher (level I-VI): (sebutkan).\nKesimpulan TI-RADS.",
    },
    deskripsi: "USG tiroid + limfonodi leher. Klasifikasi nodul: TI-RADS ACR.",
    status: "Aktif",
  },
  {
    kode: "RAD-0013",
    kodeIcd: "88.73",
    nama: "USG Mammae Bilateral",
    modalitas: "US",
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
      struktur: STRUKTUR,
      templateTemuan:
        "Mammae kanan (kuadran UO/UM/UI/LM/LO/areolar): lesi (lokasi jam, ukuran, BI-RADS).\nMammae kiri (kuadran UO/UM/UI/LM/LO/areolar): lesi (lokasi jam, ukuran, BI-RADS).\nLimfonodi aksila kanan & kiri: (sebutkan).\nKesimpulan BI-RADS akhir.",
    },
    deskripsi: "USG mammae bilateral. Klasifikasi BI-RADS ACR. Pelengkap mammografi pada jaringan padat.",
    status: "Aktif",
  },
  {
    kode: "RAD-0014",
    kodeIcd: "88.74",
    nama: "USG Doppler Karotis",
    modalitas: "US",
    modalitasSubtype: "US.Doppler",
    region: "Vaskular",
    kategori: "Diagnostik",
    estimasiWaktuMenit: 30,
    tatTargetMenit: { cito: 120, semiCito: 240, rutin: 480 },
    persiapan: {
      kontraindikasi: [],
      instruksiPasien: "Tidak perlu persiapan khusus. Lepas kalung & pakaian leher tinggi.",
    },
    kontras: { jenis: "Tanpa" },
    reportingTemplate: {
      struktur: STRUKTUR,
      templateTemuan:
        "A. karotis komunis/interna/eksterna kanan: IMT, plak, derajat stenosis (%), PSV/EDV.\nA. karotis kanan-kiri: (sebutkan).\nA. vertebralis: arah aliran, kecepatan.\nKesimpulan derajat stenosis (kriteria NASCET).",
    },
    deskripsi: "USG Doppler vaskular leher. Evaluasi stenosis karotis, sumber emboli stroke.",
    status: "Aktif",
  },

  // ── MR ─────────────────────────────────────────────────────
  {
    kode: "RAD-0015",
    kodeIcd: "88.91",
    nama: "MRI Brain Non-Kontras",
    modalitas: "MR",
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
      struktur: STRUKTUR,
      templateTemuan:
        "Sequence yang dilakukan: (sebutkan).\nParenkim otak: (T1/T2/FLAIR signal abnormal — area & karakter).\nSistem ventrikel: ukuran & posisi.\nDifusi (DWI/ADC): restriksi / tidak.\nT2* / SWI: produk darah / kalsifikasi.\nMidline shift, herniasi: (sebutkan).\nSPN, mastoid, orbita (jika tervisualisasi).",
    },
    deskripsi: "MRI otak rutin tanpa kontras. Sequence standar untuk stroke iskemik, lesi white matter, infeksi.",
    status: "Aktif",
  },
  {
    kode: "RAD-0016",
    kodeIcd: "88.91",
    nama: "MRA Brain (Time-of-Flight)",
    modalitas: "MR",
    modalitasSubtype: "MR.angio",
    region: "Vaskular",
    kategori: "Diagnostik",
    estimasiWaktuMenit: 30,
    tatTargetMenit: { cito: 120, semiCito: 240, rutin: 720 },
    persiapan: {
      kontraindikasi: ["Pacemaker non-MRI safe", "Aneurysm clip ferromagnetik", "Klaustrofobia berat"],
      instruksiPasien: "Skrining metallic implant. Lepas semua barang logam.",
      catatanKhusus: "3D TOF circle of Willis — tanpa kontras (gadolinium opsional).",
    },
    kontras: { jenis: "Tanpa" },
    reportingTemplate: {
      struktur: STRUKTUR,
      templateTemuan:
        "Sirkulus Willisi: lengkap / varian (sebutkan).\nA. serebri (ACA/MCA/PCA): patensi, stenosis, oklusi (sebutkan sisi).\nAneurisma: tidak ada / ada (lokasi, ukuran).\nMalformasi vaskular (AVM): (sebutkan).",
    },
    deskripsi: "Angiografi MR intrakranial Time-of-Flight. Evaluasi aneurisma, stenosis, AVM.",
    status: "Aktif",
  },
  {
    kode: "RAD-0017",
    kodeIcd: "88.94",
    nama: "MRI Knee",
    modalitas: "MR",
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
      struktur: STRUKTUR,
      templateTemuan:
        "Meniscus medial (anterior/body/posterior horn): utuh / robekan (tipe).\nMeniscus lateral (anterior/body/posterior horn): utuh / robekan (tipe).\nACL: utuh / robek parsial / robek komplit.\nPCL & ligamen kolateral medial-lateral: (sebutkan).\nCartilage compartment: (sebutkan).\nTulang subkondral, bone marrow edema: (sebutkan).\nBaker cyst / efusi sendi: (sebutkan).",
    },
    deskripsi: "MRI knee tanpa kontras. Gold standard evaluasi cedera meniscus & ligamen.",
    status: "Aktif",
  },

  // ── MG · Mammografi ────────────────────────────────────────
  {
    kode: "RAD-0018",
    kodeIcd: "87.37",
    nama: "Mammografi Bilateral (Skrining)",
    modalitas: "MG",
    region: "Mammae",
    kategori: "Skrining",
    estimasiWaktuMenit: 20,
    tatTargetMenit: { cito: 120, semiCito: 180, rutin: 720 },
    persiapan: {
      kontraindikasi: ["Hamil", "Laktasi (relatif)"],
      instruksiPasien: "Hindari deodoran, lotion, parfum pada area mammae & aksila. Jadwal hari ke 7-14 siklus.",
    },
    kontras: { jenis: "Tanpa" },
    drlReferensi: { entranceDose: 10, catatan: "PMK 1014/2008 — DRL Mammografi (payudara terkompresi 4.5 cm)" },
    reportingTemplate: {
      struktur: STRUKTUR,
      templateTemuan:
        "Posisi: CC + MLO bilateral.\nDensitas mammae (ACR a/b/c/d).\nMammae kanan: lesi (lokasi clock, ukuran, karakter, BI-RADS).\nMammae kiri: lesi (lokasi clock, ukuran, karakter, BI-RADS).\nMikrokalsifikasi: tidak ada / ada (distribusi, morfologi, BI-RADS).\nKesimpulan BI-RADS akhir.",
    },
    deskripsi: "Mammografi skrining 4 view (CC + MLO bilateral). Standar BI-RADS ACR.",
    status: "Aktif",
  },
  {
    kode: "RAD-0019",
    kodeIcd: "87.37",
    nama: "Mammografi Tomosintesis (DBT)",
    modalitas: "MG",
    modalitasSubtype: "MG.tomosynthesis",
    region: "Mammae",
    kategori: "Diagnostik",
    estimasiWaktuMenit: 25,
    tatTargetMenit: { cito: 120, semiCito: 180, rutin: 720 },
    persiapan: {
      kontraindikasi: ["Hamil", "Laktasi (relatif)"],
      instruksiPasien: "Hindari deodoran/lotion area mammae & aksila. Jadwal hari ke 7-14 siklus.",
    },
    kontras: { jenis: "Tanpa" },
    drlReferensi: { entranceDose: 12, catatan: "IAEA — DBT sedikit > mammografi 2D" },
    reportingTemplate: {
      struktur: STRUKTUR,
      templateTemuan:
        "Tomosintesis (slices 1 mm) + sintetik 2D.\nDensitas mammae (ACR a/b/c/d).\nLesi mammae kanan/kiri: (lokasi clock, ukuran, karakter, BI-RADS).\nDistorsi arsitektur: (sebutkan).\nKesimpulan BI-RADS akhir.",
    },
    deskripsi: "Mammografi 3D tomosintesis. Meningkatkan deteksi pada jaringan padat, kurangi recall.",
    status: "Aktif",
  },

  // ── RF · Radiofluoroskopi ──────────────────────────────────
  {
    kode: "RAD-0020",
    kodeIcd: "87.83",
    nama: "HSG (Hysterosalpingografi)",
    modalitas: "RF",
    modalitasSubtype: "RF.video",
    region: "Ginekologi",
    kategori: "Diagnostik",
    estimasiWaktuMenit: 30,
    tatTargetMenit: { cito: 240, semiCito: 360, rutin: 1440 },
    persiapan: {
      kontraindikasi: ["Hamil", "PID akut", "Perdarahan aktif", "Alergi iodinasi berat"],
      instruksiPasien: "Jadwal hari 9-12 siklus. Profilaksis antibiotik 1 jam sebelum prosedur.",
      catatanKhusus: "Posisi litotomi. Spekulum + kateter intrauterine + injeksi kontras pelan di bawah fluoroskopi.",
    },
    kontras: {
      jenis: "IV_Iodinasi",
      dosisMl: 10,
      catatan: "Iohexol 300 mg/ml diinjeksi pelan via kateter intrauterine (bukan IV).",
    },
    drlReferensi: { dap: 2.5, waktuFluoroMenit: 5, catatan: "BAPETEN No. 2/2018 — DAP referensi HSG dewasa" },
    reportingTemplate: {
      struktur: STRUKTUR,
      templateTemuan:
        "Kavum uteri: bentuk, ukuran, isi (defek/polip/septum).\nTuba kanan: paten / tersumbat (lokasi proksimal/medial/distal).\nTuba kiri: paten / tersumbat (lokasi proksimal/medial/distal).\nSpillage peritoneum: ada / tidak (bilateral/unilateral).\nKesimpulan patensi tuba.",
    },
    deskripsi: "Fluoroskopi HSG untuk evaluasi patensi tuba & kavum uteri pada infertilitas.",
    status: "Aktif",
  },
  {
    kode: "RAD-0021",
    kodeIcd: "87.62",
    nama: "OMD (Oesophago-Maag-Duodenografi)",
    modalitas: "RF",
    region: "Abdomen",
    kategori: "Diagnostik",
    estimasiWaktuMenit: 40,
    tatTargetMenit: { cito: 240, semiCito: 360, rutin: 1440 },
    persiapan: {
      puasaJam: 8,
      kontraindikasi: ["Hamil", "Curiga perforasi (gunakan kontras larut air)", "Obstruksi total"],
      instruksiPasien: "Puasa 8 jam. Menelan kontras barium sesuai aba-aba di bawah fluoroskopi.",
    },
    kontras: {
      jenis: "Oral",
      catatan: "Barium sulfat suspensi (atau kontras larut air bila curiga perforasi).",
    },
    drlReferensi: { dap: 12, waktuFluoroMenit: 4, catatan: "BAPETEN No. 2/2018 — DAP referensi GI atas" },
    reportingTemplate: {
      struktur: STRUKTUR,
      templateTemuan:
        "Esofagus: pasase, kontur mukosa, striktur/dilatasi, refluks.\nGaster: bentuk, rugae, pengisian, filling defect, ulkus.\nDuodenum: bulbus, C-loop, pasase.\nKesimpulan.",
    },
    deskripsi: "Fluoroskopi saluran cerna atas dengan kontras. Evaluasi disfagia, ulkus, obstruksi.",
    status: "Aktif",
  },

  // ── DXA ────────────────────────────────────────────────────
  {
    kode: "RAD-0022",
    kodeIcd: "88.98",
    nama: "DEXA Bone Densitometry",
    modalitas: "DXA",
    modalitasSubtype: "DXA.densitometry",
    region: "Whole_Body",
    kategori: "Diagnostik",
    estimasiWaktuMenit: 20,
    tatTargetMenit: { cito: 240, semiCito: 360, rutin: 720 },
    persiapan: {
      kontraindikasi: ["Hamil", "Pemeriksaan kontras dalam 7 hari terakhir"],
      instruksiPasien: "Lepas perhiasan logam. Pakai baju tanpa logam (zipper, kancing).",
    },
    kontras: { jenis: "Tanpa" },
    drlReferensi: { entranceDose: 0.01, catatan: "DEXA — dosis sangat rendah, < 1/10 foto Thorax." },
    reportingTemplate: {
      struktur: STRUKTUR,
      templateTemuan:
        "Lumbar spine (L1-L4): BMD (g/cm²), T-score, Z-score.\nFemur kanan (Neck + Total): BMD (g/cm²), T-score, Z-score.\nFemur kiri (Neck + Total): BMD (g/cm²), T-score, Z-score.\nKlasifikasi WHO: Normal (T ≥ -1.0) / Osteopenia (-1.0 > T ≥ -2.5) / Osteoporosis (T < -2.5).",
    },
    deskripsi: "DEXA densitometri tulang. Diagnosis osteoporosis & evaluasi terapi.",
    status: "Aktif",
  },

  // ── NM · Kedokteran Nuklir ─────────────────────────────────
  {
    kode: "RAD-0023",
    kodeIcd: "92.14",
    nama: "Bone Scan (Sidik Tulang)",
    modalitas: "NM",
    modalitasSubtype: "NM.SPECT",
    region: "Whole_Body",
    kategori: "Diagnostik",
    estimasiWaktuMenit: 240,
    tatTargetMenit: { cito: 480, semiCito: 720, rutin: 1440 },
    persiapan: {
      kontraindikasi: ["Hamil", "Laktasi (tunda/peras ASI)"],
      instruksiPasien: "Hidrasi baik & sering berkemih pasca injeksi. Akuisisi 2–4 jam setelah injeksi radiofarmaka.",
      catatanKhusus: "Radiofarmaka Tc-99m MDP IV. Whole body ± SPECT lokal.",
    },
    kontras: { jenis: "Tanpa" },
    drlReferensi: { catatan: "Aktivitas Tc-99m MDP ~740 MBq (DRL aktivitas teradministrasi, bukan ESD)." },
    reportingTemplate: {
      struktur: STRUKTUR,
      templateTemuan:
        "Distribusi radiofarmaka: fisiologis / fokus uptake abnormal (lokasi, intensitas).\nLesi metastasis: tidak ada / ada (jumlah, distribusi aksial/apendikular).\nUptake sendi degeneratif vs metastasis: (sebutkan).\nKesimpulan.",
    },
    deskripsi: "Skintigrafi tulang Tc-99m MDP. Skrining metastasis tulang, osteomielitis, fraktur stres.",
    status: "Aktif",
  },
  {
    kode: "RAD-0024",
    kodeIcd: "92.05",
    nama: "SPECT Perfusi Miokard",
    modalitas: "NM",
    modalitasSubtype: "NM.SPECT+CT",
    region: "Thorax",
    kategori: "Diagnostik",
    estimasiWaktuMenit: 180,
    tatTargetMenit: { cito: 480, semiCito: 720, rutin: 1440 },
    persiapan: {
      puasaJam: 4,
      kontraindikasi: ["Hamil", "Laktasi", "Stres farmakologi: asma berat (untuk adenosin)"],
      instruksiPasien: "Puasa 4 jam. Hindari kafein 24 jam. Bawa daftar obat (tahan beta-blocker bila diinstruksikan).",
      catatanKhusus: "Protokol stress-rest Tc-99m Sestamibi. Stres treadmill/farmakologi.",
    },
    kontras: { jenis: "Tanpa" },
    drlReferensi: { catatan: "Aktivitas Tc-99m Sestamibi sesuai protokol (DRL aktivitas teradministrasi)." },
    reportingTemplate: {
      struktur: STRUKTUR,
      templateTemuan:
        "Perfusi saat stres: defek (lokasi segmen, luas, derajat).\nPerfusi saat rest: reversibel (iskemia) / fixed (infark).\nFungsi ventrikel kiri (LVEF, wall motion).\nSummed Stress/Rest/Difference Score (SSS/SRS/SDS).\nKesimpulan iskemia/infark.",
    },
    deskripsi: "SPECT/CT perfusi miokard stress-rest. Evaluasi iskemia, viabilitas miokard.",
    status: "Aktif",
  },
];
