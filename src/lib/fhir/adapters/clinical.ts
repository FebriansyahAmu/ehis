/**
 * Adapter rekam medis → FHIR klinis inti (FH4): Condition (ICD-10) · Procedure (ICD-9-CM) ·
 * Observation tanda vital (LOINC/UCUM) · AllergyIntolerance (SNOMED-CT). Fungsi murni.
 * Contoh resmi: docs/fhir-postman/resources/{Condition,Procedure,Observation,AllergyIntolerance}.json.
 */

import { FHIR_SYSTEM, orgIdentifierSystem, toFhirDateTime, type FhirResourceBase } from "../fhirShared";
import { ALLERGY_CATEGORY, CONDITION_VERIFICATION, lookup } from "../conceptMap";

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
    code: { coding: [{ system: FHIR_SYSTEM.icd10, code: d.kodeIcd10.trim().toUpperCase(), display: d.namaDiagnosis }] },
    subject: subject(r),
    encounter: encounter(r),
    recordedDate: toFhirDateTime(d.createdAt),
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
  extra: { performer?: Ref; reason?: { kode: string; nama: string } },
): FhirRes {
  return {
    resourceType: "Procedure",
    status: p.deleted ? "entered-in-error" : "completed",
    code: { coding: [{ system: FHIR_SYSTEM.icd9cm, code: p.kode.trim(), display: p.nama }] },
    subject: subject(r),
    encounter: encounter(r),
    performedPeriod: { start: toFhirDateTime(p.waktu), end: toFhirDateTime(p.waktu) },
    ...(extra.performer ? { performer: [{ actor: { reference: `Practitioner/${extra.performer.ihsId}`, display: extra.performer.nama } }] } : {}),
    ...(extra.reason ? { reasonCode: [{ coding: [{ system: FHIR_SYSTEM.icd10, code: extra.reason.kode, display: extra.reason.nama }] }] } : {}),
    ...(p.catatan ? { note: [{ text: p.catatan }] } : {}),
  };
}

// ── Observation (tanda vital) ───────────────────────────────

export interface LocalTtv {
  tdSistolik: number;
  tdDiastolik: number;
  nadi: number;
  respirasi: number;
  suhu: number;
  spo2: number;
  gcsEye: number;
  gcsVerbal: number;
  gcsMotor: number;
  skalaNyeri: number;
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
  { key: "gcs", loinc: "9269-2", display: "Glasgow coma score total", unit: "{score}", ucum: "{score}", value: (t) => t.gcsEye + t.gcsVerbal + t.gcsMotor },
  { key: "pain", loinc: "72514-3", display: "Pain severity - 0-10 verbal numeric rating [Score] - Reported", unit: "{score}", ucum: "{score}", value: (t) => t.skalaNyeri },
  { key: "bw", loinc: "29463-7", display: "Body weight", unit: "kg", ucum: "kg", value: (t) => t.beratBadan },
  { key: "bh", loinc: "8302-2", display: "Body height", unit: "cm", ucum: "cm", value: (t) => t.tinggiBadan },
];

export function toFhirVitalObservations(t: LocalTtv, r: ClinicalRefs, performer?: Ref): { key: string; resource: FhirRes }[] {
  const when = toFhirDateTime(t.waktuObservasi);
  return VITALS.flatMap((v) => {
    const value = v.value(t);
    if (value == null || !Number.isFinite(value)) return [];
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
  snomedCode: string;
  createdAt: Date;
  deleted: boolean;
}

export function toFhirAllergy(a: LocalAlergi, r: ClinicalRefs, recorder?: Ref): FhirRes {
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
    code: { coding: [{ system: FHIR_SYSTEM.snomed, code: a.snomedCode, display: a.allergen }], text },
    patient: subject(r),
    encounter: encounter(r),
    recordedDate: toFhirDateTime(a.createdAt),
    ...(recorder ? { recorder: { reference: `Practitioner/${recorder.ihsId}` } } : {}),
  };
}
