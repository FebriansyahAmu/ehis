/**
 * Adapter rekam medis → FHIR klinis inti (FH4): Condition (ICD-10) · Procedure (ICD-9-CM + category SNOMED) ·
 * Observation tanda vital (LOINC/UCUM, tanpa nyeri/GCS) · AllergyIntolerance (obat: KFA 91 · lainnya: SNOMED).
 * Fungsi murni. Koreksi kamar S3: docs/fhir-mapping/L06 · L08 · L14.
 * Contoh resmi: docs/fhir-postman/resources/{Condition,Procedure,Observation,AllergyIntolerance}.json.
 */

import { FHIR_SYSTEM, orgIdentifierSystem, toFhirDateTime, type FhirResourceBase } from "../fhirShared";
import { ALLERGY_CATEGORY, CONDITION_VERIFICATION, lookup, type Coding } from "../conceptMap";

export interface ClinicalRefs {
  orgId: string;
  patient: { ihsId: string; nama: string };
  encounter: { ihsId: string; display: string };
}

type Ref = { ihsId: string; nama: string };
type FhirRes = FhirResourceBase & Record<string, unknown>;

const subject = (r: ClinicalRefs) => ({ reference: `Patient/${r.patient.ihsId}`, display: r.patient.nama });
const encounter = (r: ClinicalRefs) => ({ reference: `Encounter/${r.encounter.ihsId}`, display: r.encounter.display });

// ── Condition ───────────────────────────────────────────────

export interface LocalDiagnosa {
  kodeIcd10: string;
  namaDiagnosis: string;
  status: string; // Pasti/Dicurigai/Diferensial
  deleted: boolean;
  createdAt: Date;
  /** Display resmi master ICD-10 (L13/FG-39); absen (baris ditarik tanpa master) → nama lokal. */
  display?: string;
}

export function toFhirCondition(d: LocalDiagnosa, r: ClinicalRefs): FhirRes {
  const verif = d.deleted
    ? { system: "http://terminology.hl7.org/CodeSystem/condition-ver-status", code: "entered-in-error", display: "Entered in Error" }
    : lookup(CONDITION_VERIFICATION, d.status) ?? CONDITION_VERIFICATION.Pasti;
  return {
    resourceType: "Condition",
    clinicalStatus: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-clinical", code: "active", display: "Active" }] },
    verificationStatus: { coding: [verif] },
    category: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-category", code: "encounter-diagnosis", display: "Encounter Diagnosis" }] }],
    code: icd10Code(d.kodeIcd10, d.display ?? d.namaDiagnosis, d.namaDiagnosis),
    subject: subject(r),
    encounter: encounter(r),
    recordedDate: toFhirDateTime(d.createdAt),
  };
}

/** `code` ICD-10: display resmi master; nama lokal ke `code.text` hanya bila berbeda (contoh resmi RI). */
function icd10Code(kode: string, display: string, namaLokal: string) {
  const text = namaLokal.trim();
  return {
    coding: [{ system: FHIR_SYSTEM.icd10, code: kode.trim().toUpperCase(), display }],
    ...(text && text !== display ? { text } : {}),
  };
}

export interface LocalDiagnosaMasuk {
  kode: string;
  display: string;
  waktu: Date;
}

/**
 * L13 diagnosa masuk → Condition `encounter-diagnosis` (bentuk = contoh resmi IGD "Diagnosis Awal":
 * clinicalStatus · category · code · subject · encounter · onsetDateTime · recordedDate; tanpa
 * verificationStatus). Dirujuk `Encounter.diagnosis` use AD saat finished.
 */
export function toFhirDiagnosaMasuk(d: LocalDiagnosaMasuk, r: ClinicalRefs): FhirRes {
  return {
    resourceType: "Condition",
    clinicalStatus: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-clinical", code: "active", display: "Active" }] },
    category: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-category", code: "encounter-diagnosis", display: "Encounter Diagnosis" }] }],
    code: icd10Code(d.kode, d.display, d.display),
    subject: subject(r),
    encounter: encounter(r),
    onsetDateTime: toFhirDateTime(d.waktu),
    recordedDate: toFhirDateTime(d.waktu),
  };
}

// ── Procedure ───────────────────────────────────────────────

export interface LocalProsedur {
  kode: string; // ICD-9-CM
  nama: string;
  catatan?: string | null;
  waktu: Date;
  deleted: boolean;
}

export function toFhirProcedure(
  p: LocalProsedur,
  r: ClinicalRefs,
  extra: {
    performer?: Ref;
    /** Kategori tindakan → SNOMED (PROCEDURE_CATEGORY); null/absen = tanpa category. */
    category?: Coding | null;
    /** Condition diagnosis Utama yang sudah terkirim → `reasonReference` (L14, lebih tepat dari teks). */
    reasonCondition?: { ihsId: string; display: string };
    /** Cadangan bila Condition Utama belum terkirim → `reasonCode` ICD-10. */
    reason?: { kode: string; nama: string };
  },
): FhirRes {
  return {
    resourceType: "Procedure",
    status: p.deleted ? "entered-in-error" : "completed",
    ...(extra.category ? { category: { coding: [extra.category] } } : {}),
    code: { coding: [{ system: FHIR_SYSTEM.icd9cm, code: p.kode.trim(), display: p.nama }] },
    subject: subject(r),
    encounter: encounter(r),
    performedPeriod: { start: toFhirDateTime(p.waktu), end: toFhirDateTime(p.waktu) },
    ...(extra.performer ? { performer: [{ actor: { reference: `Practitioner/${extra.performer.ihsId}`, display: extra.performer.nama } }] } : {}),
    ...(extra.reasonCondition
      ? { reasonReference: [{ reference: `Condition/${extra.reasonCondition.ihsId}`, display: extra.reasonCondition.display }] }
      : extra.reason
        ? { reasonCode: [{ coding: [{ system: FHIR_SYSTEM.icd10, code: extra.reason.kode, display: extra.reason.nama }] }] }
        : {}),
    ...(p.catatan ? { note: [{ text: p.catatan }] } : {}),
  };
}

// ── Observation (tanda vital) ───────────────────────────────

// L08 (S3): GCS & skala nyeri DIKELUARKAN dari vital-signs — salah kamar (GCS = exam/kesadaran L09, di luar
// playbook D5; nyeri = asesmen nyeri category survey L11). SpO₂ tetap (kode HL7 vital-signs valid; D5 belum
// diputuskan). docs/fhir-mapping/L08-ttv-to-observation.md.
export interface LocalTtv {
  tdSistolik: number;
  tdDiastolik: number;
  nadi: number;
  respirasi: number;
  suhu: number;
  spo2: number;
  beratBadan: number | null;
  tinggiBadan: number | null;
  waktuObservasi: Date;
}

interface VitalDef {
  key: string;
  loinc: string;
  display: string;
  unit: string;
  ucum: string;
  value: (t: LocalTtv) => number | null;
}

/** 1 baris TTV lokal → N Observation (1 per parameter). `key` = sufiks localId peta. */
const VITALS: VitalDef[] = [
  { key: "sbp", loinc: "8480-6", display: "Systolic blood pressure", unit: "mm[Hg]", ucum: "mm[Hg]", value: (t) => t.tdSistolik },
  { key: "dbp", loinc: "8462-4", display: "Diastolic blood pressure", unit: "mm[Hg]", ucum: "mm[Hg]", value: (t) => t.tdDiastolik },
  { key: "hr", loinc: "8867-4", display: "Heart rate", unit: "beats/minute", ucum: "/min", value: (t) => t.nadi },
  { key: "rr", loinc: "9279-1", display: "Respiratory rate", unit: "breaths/minute", ucum: "/min", value: (t) => t.respirasi },
  { key: "temp", loinc: "8310-5", display: "Body temperature", unit: "C", ucum: "Cel", value: (t) => t.suhu },
  { key: "spo2", loinc: "59408-5", display: "Oxygen saturation in Arterial blood by Pulse oximetry", unit: "%", ucum: "%", value: (t) => t.spo2 },
  { key: "bw", loinc: "29463-7", display: "Body weight", unit: "kg", ucum: "kg", value: (t) => t.beratBadan },
  { key: "bh", loinc: "8302-2", display: "Body height", unit: "cm", ucum: "cm", value: (t) => t.tinggiBadan },
];

/** Nilai ≤ 0 / non-angka = TIDAK DIISI (form TTV menyimpan 0 sebagai default) — tak satu parameter di atas bisa 0. */
const terisi = (v: number | null): v is number => v != null && Number.isFinite(v) && v > 0;

export function toFhirVitalObservations(t: LocalTtv, r: ClinicalRefs, performer?: Ref): { key: string; resource: FhirRes }[] {
  const when = toFhirDateTime(t.waktuObservasi);
  return VITALS.flatMap((v) => {
    const value = v.value(t);
    if (!terisi(value)) return [];
    return [{
      key: v.key,
      resource: {
        resourceType: "Observation",
        status: "final",
        category: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/observation-category", code: "vital-signs", display: "Vital Signs" }] }],
        code: { coding: [{ system: FHIR_SYSTEM.loinc, code: v.loinc, display: v.display }] },
        subject: { reference: `Patient/${r.patient.ihsId}` },
        ...(performer ? { performer: [{ reference: `Practitioner/${performer.ihsId}` }] } : {}),
        encounter: encounter(r),
        effectiveDateTime: when,
        issued: when,
        valueQuantity: { value, unit: v.unit, system: "http://unitsofmeasure.org", code: v.ucum },
      },
    }];
  });
}

// ── AllergyIntolerance ──────────────────────────────────────

export interface LocalAlergi {
  id: string;
  category: string; // Obat/Makanan/Lainnya
  allergen: string;
  reactions: string[];
  severity: string; // Ringan/Sedang/Berat
  status: string; // Terkonfirmasi/Dicurigai
  keterangan: string | null;
  createdAt: Date;
  deleted: boolean;
}

/**
 * L06: `code` sudah dipilih per kategori oleh `alergiKodeOf` (links/alergi.ts) — obat = KFA zat aktif `91…`
 * (system kfa, contoh resmi), makanan/lingkungan = SNOMED.
 */
export function toFhirAllergy(a: LocalAlergi, code: Coding, r: ClinicalRefs, recorder?: Ref): FhirRes {
  const verif = a.deleted
    ? { code: "entered-in-error", display: "Entered in Error" }
    : a.status === "Dicurigai"
      ? { code: "unconfirmed", display: "Unconfirmed" }
      : { code: "confirmed", display: "Confirmed" };
  const text = [a.allergen, a.reactions.length ? `reaksi: ${a.reactions.join(", ")}` : "", a.keterangan ?? ""].filter(Boolean).join(" — ");
  return {
    resourceType: "AllergyIntolerance",
    identifier: [{ system: orgIdentifierSystem("allergy", r.orgId), use: "official", value: a.id }],
    clinicalStatus: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical", code: "active", display: "Active" }] },
    verificationStatus: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/allergyintolerance-verification", ...verif }] },
    category: [lookup(ALLERGY_CATEGORY, a.category) ?? "environment"],
    criticality: a.severity === "Berat" ? "high" : "low",
    code: { coding: [code], text },
    patient: subject(r),
    encounter: encounter(r),
    recordedDate: toFhirDateTime(a.createdAt),
    ...(recorder ? { recorder: { reference: `Practitioner/${recorder.ihsId}` } } : {}),
  };
}
