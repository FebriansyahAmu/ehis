/**
 * Tipe + helper Katalog Pemeriksaan Radiologi (FE-facing).
 * DATA = DB (master.RadCatalog) via /api/v1/master/rad-catalog. Seed awal: radCatalogSeed.ts.
 * Dipakai: KatalogRadiologiPage (master, SSR-hybrid), OrderRadTab (workflow, baca seed).
 *
 * Standard:
 *   - PMK 1014/2008 (Standar Pelayanan Radiologi Diagnostik)
 *   - PMK 24/2020 (Pelayanan Radiologi Klinik)
 *   - Perka BAPETEN No. 2/2018 (Keselamatan Radiasi Pesawat Sinar-X)
 *   - IAEA HH-19 (Diagnostic Reference Levels) · ACR Practice Parameters
 *   - SatuSehat / FHIR R4 ImagingStudy.modality (KodeModality) — `modalitas` + `modalitasSubtype`
 *
 * Catatan DRL: nilai = referensi maksimum dewasa standar BMI 60–80 kg. Pediatrik &
 * extreme BMI wajib DRL lokal terpisah.
 */

// ── Modalitas (FHIR SatuSehat method codes) ──────────────
// method (singkatan) sesuai daftar SatuSehat ImagingStudy. `modalitasSubtype` opsional =
// salah satu subtype method tsb (mis. "CT.angio"). Disimpan apa adanya (string longgar di DB).

export type RadModalitas =
  | "XR"   // Radiografi / X-Ray
  | "CT"   // Computed Tomography
  | "MR"   // Magnetic Resonance Imaging
  | "RF"   // Radiofluoroscopy
  | "US"   // Ultrasonography
  | "MG"   // Mammography
  | "DXA"  // Dual-energy X-ray Absorptiometry
  | "NM";  // Nuclear Medicine

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
  /** X-Ray / Mammografi / DXA / NM — Entrance Surface Dose (mGy) */
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
  /** Kode internal katalog `RAD-NNNN` — auto-gen server (read-only di form). */
  kode: string;
  /** Kode ICD-9-CM (prosedur) — OPSIONAL; manual / dropdown master ICD Tindakan. */
  kodeIcd?: string;
  nama: string;
  modalitas: RadModalitas;
  /** Subtype method FHIR (mis. "CT.angio") — opsional. */
  modalitasSubtype?: string;
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

// ── Empty factory (entri baru — kode auto-gen server saat simpan) ─────────

export const STRUKTUR_DEFAULT = ["Indikasi Klinis", "Teknik Pemeriksaan", "Temuan", "Kesan", "Saran"];

export function emptyRadCatalogRecord(): RadCatalogRecord {
  return {
    id: `rk-${Date.now()}`,
    kode: "",
    nama: "",
    modalitas: "XR",
    region: "Thorax",
    kategori: "Diagnostik",
    estimasiWaktuMenit: 15,
    tatTargetMenit: { cito: 60, semiCito: 180, rutin: 360 },
    persiapan: { kontraindikasi: [] },
    kontras: { jenis: "Tanpa" },
    reportingTemplate: { struktur: [...STRUKTUR_DEFAULT] },
    status: "Aktif",
  };
}
