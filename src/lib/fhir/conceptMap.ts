/**
 * ConceptMap — nilai enum TETAP lokal EHIS → kode standar FHIR/SatuSehat (satu tempat, exhaustive).
 *
 * Aturan (docs/fhir-mapping/ARSITEKTUR.md §5):
 * - Hanya enum tertutup milik EHIS (status, unit, kelas, disposisi, …). Kode item katalog (KFA, LOINC,
 *   SNOMED, ICD) TIDAK di sini — disimpan di master katalog.
 * - Tipe kunci = union enum lokal → nilai enum baru yang lupa dipetakan = error compile.
 * - Kode & display mengikuti tabel playbook SatuSehat (RJ v7.0 · IGD v5.2 · RI v6.0) / contoh Bundle resmi.
 *
 * Aman diimpor client maupun server (tanpa I/O).
 */

import type { DisposisiJenis } from "@/lib/schemas/disposisi/disposisi";

export interface Coding {
  system: string;
  code: string;
  display: string;
}

const HL7 = "http://terminology.hl7.org/CodeSystem";
const KEMKES = "http://terminology.kemkes.go.id/CodeSystem";

// ── Encounter (L01) ─────────────────────────────────────────

export type KunjunganUnit = "IGD" | "RawatJalan" | "RawatInap";

/** Unit kunjungan → `Encounter.class` (v3-ActCode). */
export const ENCOUNTER_CLASS: Record<KunjunganUnit, Coding> = {
  IGD: { system: `${HL7}/v3-ActCode`, code: "EMER", display: "emergency" },
  RawatJalan: { system: `${HL7}/v3-ActCode`, code: "AMB", display: "ambulatory" },
  RawatInap: { system: `${HL7}/v3-ActCode`, code: "IMP", display: "inpatient encounter" },
};

export type KelasRawat = "VIP" | "Kelas_1" | "Kelas_2" | "Kelas_3" | "ICU" | "HCU" | "Isolasi";

/**
 * Kelas kamar RI → `locationServiceClass-Inpatient`. ICU/HCU/Isolasi tidak punya kode di playbook → null
 * (extension ServiceClass dihilangkan, FG-28).
 */
export const SERVICE_CLASS_INPATIENT: Record<KelasRawat, Coding | null> = {
  VIP: { system: `${KEMKES}/locationServiceClass-Inpatient`, code: "vip", display: "Kelas VIP" },
  Kelas_1: { system: `${KEMKES}/locationServiceClass-Inpatient`, code: "1", display: "Kelas 1" },
  Kelas_2: { system: `${KEMKES}/locationServiceClass-Inpatient`, code: "2", display: "Kelas 2" },
  Kelas_3: { system: `${KEMKES}/locationServiceClass-Inpatient`, code: "3", display: "Kelas 3" },
  ICU: null,
  HCU: null,
  Isolasi: null,
};

/** RJ/IGD: kelas layanan rawat jalan (playbook RJ/IGD). */
export const SERVICE_CLASS_OUTPATIENT_REGULER: Coding = {
  system: `${KEMKES}/locationServiceClass-Outpatient`, code: "reguler", display: "Kelas Reguler",
};

/** Peringkat kelas untuk menentukan naik/turun kelas (lebih tinggi = lebih mahal). */
export const KELAS_RANK: Partial<Record<KelasRawat, number>> = { Kelas_3: 1, Kelas_2: 2, Kelas_1: 3, VIP: 4 };

export type UpgradeClass = "kelas-tetap" | "naik-kelas" | "turun-kelas" | "titip-rawat";

/** Indikator perubahan kelas (`locationUpgradeClass`) — display sesuai tabel playbook RI. */
export const UPGRADE_CLASS: Record<UpgradeClass, Coding> = {
  "kelas-tetap": { system: `${KEMKES}/locationUpgradeClass`, code: "kelas-tetap", display: "Kelas Tetap Perawatan" },
  "naik-kelas": { system: `${KEMKES}/locationUpgradeClass`, code: "naik-kelas", display: "Kenaikan Kelas Perawatan" },
  "turun-kelas": { system: `${KEMKES}/locationUpgradeClass`, code: "turun-kelas", display: "Penurunan Kelas Perawatan" },
  "titip-rawat": { system: `${KEMKES}/locationUpgradeClass`, code: "titip-rawat", display: "Titip Kelas Perawatan" },
};

/**
 * Jenis disposisi → `Encounter.hospitalization.dischargeDisposition`.
 * Rawat_Inap tak punya kode → `oth` + teks (contoh resmi IGD). Meninggal masih `exp` HL7 —
 * dikoreksi ke `exp-lt48h`/`exp-gt48h` (system Kemkes) di langkah S2 (FG-77, L24).
 */
export const DISCHARGE_DISPOSITION: Record<DisposisiJenis, Coding> = {
  Pulang: { system: `${HL7}/discharge-disposition`, code: "home", display: "Home" },
  Rujuk: { system: `${HL7}/discharge-disposition`, code: "other-hcf", display: "Other healthcare facility" },
  Meninggal: { system: `${HL7}/discharge-disposition`, code: "exp", display: "Expired" },
  APS: { system: `${HL7}/discharge-disposition`, code: "aadvice", display: "Left against advice" },
  Rawat_Inap: { system: `${HL7}/discharge-disposition`, code: "oth", display: "Other" },
};

// ── Condition (L13) ─────────────────────────────────────────

export type DiagnosaStatus = "Pasti" | "Dicurigai" | "Diferensial";

/** Status diagnosis → `Condition.verificationStatus`. */
export const CONDITION_VERIFICATION: Record<DiagnosaStatus, Coding> = {
  Pasti: { system: `${HL7}/condition-ver-status`, code: "confirmed", display: "Confirmed" },
  Dicurigai: { system: `${HL7}/condition-ver-status`, code: "provisional", display: "Provisional" },
  Diferensial: { system: `${HL7}/condition-ver-status`, code: "differential", display: "Differential" },
};

// ── AllergyIntolerance (L06) ────────────────────────────────

export type AlergiKategori = "Obat" | "Makanan" | "Lainnya";

/** Kategori alergi lokal → `AllergyIntolerance.category` (code FHIR, bukan Coding). */
export const ALLERGY_CATEGORY: Record<AlergiKategori, "medication" | "food" | "environment"> = {
  Obat: "medication",
  Makanan: "food",
  Lainnya: "environment",
};

// ── Obat (L18/L20) ──────────────────────────────────────────

/** Rute pemberian lokal → kode rute ATC (`http://www.whocc.no/atc`, dipakai contoh resmi). */
export const ROUTE_ATC: Record<string, Coding> = {
  PO: { system: "http://www.whocc.no/atc", code: "O", display: "Oral" },
  Oral: { system: "http://www.whocc.no/atc", code: "O", display: "Oral" },
  SL: { system: "http://www.whocc.no/atc", code: "SL", display: "Sublingual" },
  IV: { system: "http://www.whocc.no/atc", code: "P", display: "Parenteral" },
  IM: { system: "http://www.whocc.no/atc", code: "P", display: "Parenteral" },
  SC: { system: "http://www.whocc.no/atc", code: "P", display: "Parenteral" },
  Rektal: { system: "http://www.whocc.no/atc", code: "R", display: "Rectal" },
  Inhalasi: { system: "http://www.whocc.no/atc", code: "Inhal", display: "Inhalation" },
  Nasal: { system: "http://www.whocc.no/atc", code: "N", display: "Nasal" },
  Transdermal: { system: "http://www.whocc.no/atc", code: "TD", display: "Transdermal" },
  Vaginal: { system: "http://www.whocc.no/atc", code: "V", display: "Vaginal" },
};

export type KategoriResep = "outpatient" | "inpatient" | "discharge";

/** Kategori resep/dispense — code sama untuk MedicationRequest & MedicationDispense (system berbeda). */
export const MEDICATION_CATEGORY_DISPLAY: Record<KategoriResep, string> = {
  outpatient: "Outpatient",
  inpatient: "Inpatient",
  discharge: "Discharge",
};

// ── Order (L16/L17/L18) ─────────────────────────────────────

/** Prioritas order lokal → `ServiceRequest.priority` / `MedicationRequest.priority`. */
export const ORDER_PRIORITY: Record<string, "stat" | "urgent" | "routine"> = {
  CITO: "stat",
  Segera: "urgent",
  Rutin: "routine",
};

// ── Helper lookup aman (input string bebas dari DB) ─────────

/** Lookup map ber-kunci union dengan nilai string mentah dari DB; nilai tak dikenal → undefined. */
export function lookup<K extends string, V>(map: Partial<Record<K, V>>, key: string | null | undefined): V | undefined {
  return key != null && Object.prototype.hasOwnProperty.call(map, key) ? map[key as K] : undefined;
}
