/**
 * ICD-10-IM & ICD-9-CM-IM Mock Lookup (EK0.2).
 *
 * Indonesian Modification — sumber: Pedoman Pengodean iDRG 2025 Kemenkes.
 * BUKAN ICD-10 WHO standar. Versi IM punya adaptasi lokal Indonesia
 * (granular sub-kategori untuk DRG grouper).
 *
 * Mock ini pakai kode ICD-10/ICD-9-CM yang umum dipakai sebagai basis;
 * label `versiIM: "ICD-10-IM_2025"` menandakan ini representasi mock untuk
 * pengembangan. Swap ke lookup resmi Kemenkes saat backend ready.
 *
 * Cakupan: ~30 ICD-10-IM (kardiovaskular, endokrin, obstetri, pernapasan,
 * pencernaan, ginjal, infeksi) + ~20 ICD-9-CM-IM prosedur paling sering.
 */

import type { KodeICD10IM, KodeICD9CMIM } from "./eklaimShared";

// ── ICD-10-IM (Diagnosis) ──────────────────────────────

const ICD10_IM_VERSION = "ICD-10-IM_2025";

export const ICD10_IM_MOCK: ReadonlyArray<KodeICD10IM> = [
  // Sistem Sirkulasi (I00-I99)
  {
    kode: "I21.0",
    deskripsi: "Infark miokard akut dinding anterior transmural",
    kategori: "Sirkulasi",
    hint: "ST-elevation MI (STEMI) anterior",
    versiIM: ICD10_IM_VERSION,
  },
  {
    kode: "I21.1",
    deskripsi: "Infark miokard akut dinding inferior transmural",
    kategori: "Sirkulasi",
    hint: "STEMI inferior",
    versiIM: ICD10_IM_VERSION,
  },
  {
    kode: "I21.4",
    deskripsi: "Infark miokard akut subendokardial (NSTEMI)",
    kategori: "Sirkulasi",
    hint: "Non-ST-elevation MI",
    versiIM: ICD10_IM_VERSION,
  },
  {
    kode: "I50.0",
    deskripsi: "Gagal jantung kongestif",
    kategori: "Sirkulasi",
    hint: "CHF — NYHA II-IV",
    versiIM: ICD10_IM_VERSION,
  },
  {
    kode: "I50.1",
    deskripsi: "Gagal jantung kiri akut",
    kategori: "Sirkulasi",
    versiIM: ICD10_IM_VERSION,
  },
  {
    kode: "I20.0",
    deskripsi: "Angina pektoris tidak stabil",
    kategori: "Sirkulasi",
    hint: "Unstable angina",
    versiIM: ICD10_IM_VERSION,
  },
  {
    kode: "I48.0",
    deskripsi: "Fibrilasi atrium paroksismal",
    kategori: "Sirkulasi",
    versiIM: ICD10_IM_VERSION,
  },
  {
    kode: "I48.2",
    deskripsi: "Fibrilasi atrium kronik",
    kategori: "Sirkulasi",
    versiIM: ICD10_IM_VERSION,
  },
  {
    kode: "I10",
    deskripsi: "Hipertensi esensial (primer)",
    kategori: "Sirkulasi",
    versiIM: ICD10_IM_VERSION,
  },
  {
    kode: "I11.0",
    deskripsi: "Krisis hipertensi dengan gagal jantung",
    kategori: "Sirkulasi",
    hint: "Hypertensive emergency",
    versiIM: ICD10_IM_VERSION,
  },
  {
    kode: "I63.9",
    deskripsi: "Infark serebri tidak spesifik",
    kategori: "Sirkulasi",
    hint: "Stroke iskemik",
    versiIM: ICD10_IM_VERSION,
  },

  // Endokrin, Nutrisi, Metabolik (E00-E89)
  {
    kode: "E11.9",
    deskripsi: "Diabetes melitus tipe 2 tanpa komplikasi",
    kategori: "Endokrin",
    hint: "DM Type 2",
    versiIM: ICD10_IM_VERSION,
  },
  {
    kode: "E11.65",
    deskripsi: "DM tipe 2 dengan hiperglikemia (krisis)",
    kategori: "Endokrin",
    hint: "Diabetic ketoacidosis (DKA)",
    versiIM: ICD10_IM_VERSION,
  },
  {
    kode: "E11.22",
    deskripsi: "DM tipe 2 dengan nefropati diabetik",
    kategori: "Endokrin",
    versiIM: ICD10_IM_VERSION,
  },
  {
    kode: "E03.9",
    deskripsi: "Hipotiroid tidak spesifik",
    kategori: "Endokrin",
    versiIM: ICD10_IM_VERSION,
  },
  {
    kode: "E05.9",
    deskripsi: "Hipertiroid tidak spesifik",
    kategori: "Endokrin",
    versiIM: ICD10_IM_VERSION,
  },

  // Kehamilan, Persalinan, Nifas (O00-O99)
  {
    kode: "O80",
    deskripsi: "Persalinan tunggal spontan normal",
    kategori: "Obstetri",
    hint: "Partus normal cukup bulan",
    versiIM: ICD10_IM_VERSION,
  },
  {
    kode: "O82",
    deskripsi: "Persalinan tunggal dengan sectio caesarea",
    kategori: "Obstetri",
    versiIM: ICD10_IM_VERSION,
  },
  {
    kode: "O14.1",
    deskripsi: "Preeklampsia berat",
    kategori: "Obstetri",
    hint: "Severe preeclampsia",
    versiIM: ICD10_IM_VERSION,
  },
  {
    kode: "O72.1",
    deskripsi: "Perdarahan postpartum lainnya (atonia uteri)",
    kategori: "Obstetri",
    versiIM: ICD10_IM_VERSION,
  },

  // Pernapasan (J00-J99)
  {
    kode: "J18.9",
    deskripsi: "Pneumonia tidak spesifik",
    kategori: "Pernapasan",
    versiIM: ICD10_IM_VERSION,
  },
  {
    kode: "J44.9",
    deskripsi: "Penyakit paru obstruktif kronik (PPOK)",
    kategori: "Pernapasan",
    hint: "COPD eksaserbasi akut",
    versiIM: ICD10_IM_VERSION,
  },
  {
    kode: "J45.9",
    deskripsi: "Asma tidak spesifik",
    kategori: "Pernapasan",
    versiIM: ICD10_IM_VERSION,
  },
  {
    kode: "J96.0",
    deskripsi: "Gagal nafas akut",
    kategori: "Pernapasan",
    hint: "Acute respiratory failure",
    versiIM: ICD10_IM_VERSION,
  },

  // Pencernaan (K00-K95)
  {
    kode: "K35.9",
    deskripsi: "Apendisitis akut tidak spesifik",
    kategori: "Pencernaan",
    versiIM: ICD10_IM_VERSION,
  },
  {
    kode: "K80.2",
    deskripsi: "Kolelitiasis tanpa kolesistitis",
    kategori: "Pencernaan",
    hint: "Batu empedu",
    versiIM: ICD10_IM_VERSION,
  },
  {
    kode: "A09",
    deskripsi: "Gastroenteritis infeksi tidak spesifik",
    kategori: "Infeksi",
    versiIM: ICD10_IM_VERSION,
  },

  // Genitourinaria (N00-N99)
  {
    kode: "N17.9",
    deskripsi: "Gagal ginjal akut tidak spesifik",
    kategori: "Ginjal",
    hint: "AKI — Acute Kidney Injury",
    versiIM: ICD10_IM_VERSION,
  },
  {
    kode: "N18.5",
    deskripsi: "Gagal ginjal kronik stadium 5",
    kategori: "Ginjal",
    hint: "CKD stage 5 — dialisis",
    versiIM: ICD10_IM_VERSION,
  },

  // Infeksi & Sepsis (A40-A41)
  {
    kode: "A41.9",
    deskripsi: "Sepsis tidak spesifik",
    kategori: "Infeksi",
    hint: "Sepsis without septic shock",
    hospitalAcquired: false,
    versiIM: ICD10_IM_VERSION,
  },
  {
    kode: "R65.21",
    deskripsi: "Sepsis berat dengan syok septik",
    kategori: "Infeksi",
    hint: "Severe sepsis with septic shock",
    versiIM: ICD10_IM_VERSION,
  },
  {
    kode: "T81.4",
    deskripsi: "Infeksi luka operasi pasca-bedah (HAIs)",
    kategori: "Infeksi",
    hint: "Surgical site infection — flag PPI",
    hospitalAcquired: true,
    versiIM: ICD10_IM_VERSION,
  },
];

/** Lookup helper — return entry by exact kode atau undefined. */
export function findICD10IM(kode: string): KodeICD10IM | undefined {
  return ICD10_IM_MOCK.find((entry) => entry.kode === kode);
}

// ── ICD-9-CM-IM (Tindakan/Prosedur) ────────────────────

const ICD9_CM_IM_VERSION = "ICD-9-CM-IM_2025";

export const ICD9_CM_IM_MOCK: ReadonlyArray<KodeICD9CMIM> = [
  // Kardiovaskular
  {
    kode: "36.07",
    deskripsi: "Pemasangan stent arteri koroner",
    kategori: "Kardiovaskular",
    hint: "PCI — Percutaneous Coronary Intervention",
    versiIM: ICD9_CM_IM_VERSION,
  },
  {
    kode: "36.10",
    deskripsi: "Bypass arteri koroner (CABG) — 1 vessel",
    kategori: "Kardiovaskular",
    versiIM: ICD9_CM_IM_VERSION,
  },
  {
    kode: "36.13",
    deskripsi: "Bypass arteri koroner (CABG) — 3 vessel",
    kategori: "Kardiovaskular",
    versiIM: ICD9_CM_IM_VERSION,
  },
  {
    kode: "37.61",
    deskripsi: "Implantasi pacemaker permanen",
    kategori: "Kardiovaskular",
    versiIM: ICD9_CM_IM_VERSION,
  },
  {
    kode: "89.52",
    deskripsi: "Elektrokardiografi (EKG)",
    kategori: "Diagnostik",
    versiIM: ICD9_CM_IM_VERSION,
  },
  {
    kode: "88.72",
    deskripsi: "Ekokardiografi diagnostik",
    kategori: "Diagnostik",
    versiIM: ICD9_CM_IM_VERSION,
  },

  // Obstetri/Ginekologi
  {
    kode: "74.1",
    deskripsi: "Sectio caesarea segmen bawah (low cervical)",
    kategori: "Obstetri",
    versiIM: ICD9_CM_IM_VERSION,
  },
  {
    kode: "74.99",
    deskripsi: "Sectio caesarea lainnya tidak spesifik",
    kategori: "Obstetri",
    versiIM: ICD9_CM_IM_VERSION,
  },
  {
    kode: "73.59",
    deskripsi: "Persalinan dengan bantuan manual lainnya",
    kategori: "Obstetri",
    versiIM: ICD9_CM_IM_VERSION,
  },
  {
    kode: "75.62",
    deskripsi: "Reparasi laserasi obstetrik perineum",
    kategori: "Obstetri",
    versiIM: ICD9_CM_IM_VERSION,
  },

  // Pencernaan
  {
    kode: "47.01",
    deskripsi: "Apendektomi laparoskopik",
    kategori: "Pencernaan",
    versiIM: ICD9_CM_IM_VERSION,
  },
  {
    kode: "47.09",
    deskripsi: "Apendektomi terbuka (open)",
    kategori: "Pencernaan",
    versiIM: ICD9_CM_IM_VERSION,
  },
  {
    kode: "51.23",
    deskripsi: "Kolesistektomi laparoskopik",
    kategori: "Pencernaan",
    versiIM: ICD9_CM_IM_VERSION,
  },

  // Ginjal & Urologi
  {
    kode: "39.95",
    deskripsi: "Hemodialisis",
    kategori: "Ginjal",
    versiIM: ICD9_CM_IM_VERSION,
  },
  {
    kode: "54.98",
    deskripsi: "Dialisis peritoneal",
    kategori: "Ginjal",
    versiIM: ICD9_CM_IM_VERSION,
  },

  // Pernapasan & ICU
  {
    kode: "96.71",
    deskripsi: "Ventilasi mekanik berkelanjutan <96 jam",
    kategori: "ICU",
    hint: "Mekanik ventilator < 4 hari",
    versiIM: ICD9_CM_IM_VERSION,
  },
  {
    kode: "96.72",
    deskripsi: "Ventilasi mekanik berkelanjutan ≥96 jam",
    kategori: "ICU",
    hint: "Mekanik ventilator ≥ 4 hari — eligible top-up CMG",
    versiIM: ICD9_CM_IM_VERSION,
  },
  {
    kode: "31.1",
    deskripsi: "Trakeostomi sementara",
    kategori: "Pernapasan",
    versiIM: ICD9_CM_IM_VERSION,
  },

  // Imaging diagnostik
  {
    kode: "88.38",
    deskripsi: "CT scan kepala tanpa kontras",
    kategori: "Imaging",
    versiIM: ICD9_CM_IM_VERSION,
  },
  {
    kode: "88.71",
    deskripsi: "USG diagnostik kepala-leher",
    kategori: "Imaging",
    versiIM: ICD9_CM_IM_VERSION,
  },
];

/** Lookup helper — return entry by exact kode atau undefined. */
export function findICD9CMIM(kode: string): KodeICD9CMIM | undefined {
  return ICD9_CM_IM_MOCK.find((entry) => entry.kode === kode);
}
