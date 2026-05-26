/**
 * INA-CBG Legacy Mock (EK0.2 · Active Secondary).
 *
 * 10 entries CBG paling umum — untuk klaim layanan pre-Okt 2025 dan dual-mode
 * Comparator (AD-19 di EK3.4/EK4/EK8.6). Per riset 2026-05-26 industri SIMRS
 * (Trustmedis, SIMRS Cendana, KhanzaHIS) **masih support INA-CBG** karena
 * transisi iDRG phased. Kemenkes pun baru rilis INA-CBG v5.9.
 *
 * Format kode: 4-digit alphanumeric (e.g. "I-1-01-I").
 * - Letter: case type (I=Internal/Medical, K=Bedah, U=Urology, O=Obstetri, J=Respiratory)
 * - Number 1: CMG (Casemix Main Group)
 * - Number 2: group sequence
 * - Roman: severity (I/II/III)
 *
 * Tarif mock pakai rasio kelas standar INA-CBG:
 * Kelas 3 (base) · Kelas 2 = 1.2x · Kelas 1 = 1.4x · VIP = 1.6x.
 */

import type { InaCbgLegacyResult, Rupiah } from "./eklaimShared";

const VERSI_GROUPER = "INA-CBG_v5.9";

/** Generate tarif per kelas dari base tarif Kelas 3. */
function tarifPerKelas(kelas3: Rupiah): InaCbgLegacyResult["tarif"] {
  return {
    kelas3,
    kelas2: (kelas3 * 12n) / 10n,
    kelas1: (kelas3 * 14n) / 10n,
    vip: (kelas3 * 16n) / 10n,
  };
}

/**
 * Lookup entry shape — sama dengan `InaCbgLegacyResult` minus `timestampGroup`
 * (timestamp di-isi saat grouper dipanggil, bukan static di lookup).
 */
export type InaCbgLegacyLookupEntry = Omit<InaCbgLegacyResult, "timestampGroup">;

export const INA_CBG_LEGACY_MOCK: ReadonlyArray<InaCbgLegacyLookupEntry> = [
  // I-1-01: Infark Miokard Akut (3 severity)
  {
    code: "I-1-01-I",
    group: "Infark Miokard Akut Ringan",
    severity: 1,
    tarif: tarifPerKelas(6_500_000n),
    versiGrouper: VERSI_GROUPER,
  },
  {
    code: "I-1-01-II",
    group: "Infark Miokard Akut Sedang",
    severity: 2,
    tarif: tarifPerKelas(13_500_000n),
    versiGrouper: VERSI_GROUPER,
  },
  {
    code: "I-1-01-III",
    group: "Infark Miokard Akut Berat",
    severity: 3,
    tarif: tarifPerKelas(22_500_000n),
    versiGrouper: VERSI_GROUPER,
  },

  // I-4-10: Gagal Jantung Kongestif (2 severity)
  {
    code: "I-4-10-I",
    group: "Gagal Jantung Kongestif Ringan",
    severity: 1,
    tarif: tarifPerKelas(5_500_000n),
    versiGrouper: VERSI_GROUPER,
  },
  {
    code: "I-4-10-II",
    group: "Gagal Jantung Kongestif Sedang",
    severity: 2,
    tarif: tarifPerKelas(11_000_000n),
    versiGrouper: VERSI_GROUPER,
  },

  // U-1-02: DM Type 2 dengan Komplikasi
  {
    code: "U-1-02-II",
    group: "Diabetes Melitus Tipe 2 dengan Komplikasi Sedang",
    severity: 2,
    tarif: tarifPerKelas(6_500_000n),
    versiGrouper: VERSI_GROUPER,
  },

  // K-1-31: Sectio Caesarea (2 severity)
  {
    code: "K-1-31-I",
    group: "Sectio Caesarea Elektif Ringan",
    severity: 1,
    tarif: tarifPerKelas(5_500_000n),
    versiGrouper: VERSI_GROUPER,
  },
  {
    code: "K-1-31-II",
    group: "Sectio Caesarea dengan Komplikasi",
    severity: 2,
    tarif: tarifPerKelas(8_500_000n),
    versiGrouper: VERSI_GROUPER,
  },

  // O-6-10: Persalinan Normal
  {
    code: "O-6-10-I",
    group: "Persalinan Pervaginam Spontan Normal",
    severity: 1,
    tarif: tarifPerKelas(2_500_000n),
    versiGrouper: VERSI_GROUPER,
  },

  // J-1-30: Pneumonia
  {
    code: "J-1-30-I",
    group: "Pneumonia Bakteri Ringan",
    severity: 1,
    tarif: tarifPerKelas(4_500_000n),
    versiGrouper: VERSI_GROUPER,
  },
];

/** Lookup helper — return entry by exact code atau undefined. */
export function findInaCbgLegacy(code: string): InaCbgLegacyLookupEntry | undefined {
  return INA_CBG_LEGACY_MOCK.find((entry) => entry.code === code);
}
