/**
 * Adapter Condition tingkat kunjungan (S2) — fungsi murni:
 *  - L03 keluhan utama → Condition category `chief-complaint` (Kemkes), dirujuk Encounter.diagnosis use CC.
 *  - L24 kondisi saat meninggalkan RS → Condition category `problem-list-item` (SNOMED stabil/tidak/perbaikan).
 * Bentuk mengikuti contoh resmi docs/fhir-postman/bundles/bundle-rawat-inap.json (Condition_KeluhanUtama:
 * teks bebas di `note`, recorder Practitioner; Condition 359746009 tanpa verificationStatus).
 */

import { toFhirDateTime, type FhirResourceBase } from "../fhirShared";
import { CONDITION_CATEGORY, type Coding } from "../conceptMap";
import type { ClinicalRefs } from "./clinical";

type FhirRes = FhirResourceBase & Record<string, unknown>;

const SNOMED = "http://snomed.info/sct";
const ACTIVE = {
  coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-clinical", code: "active", display: "Active" }],
};

const subject = (r: ClinicalRefs) => ({ reference: `Patient/${r.patient.ihsId}`, display: r.patient.nama });
const encounter = (r: ClinicalRefs) => ({ reference: `Encounter/${r.encounter.ihsId}`, display: r.encounter.display });

export interface LocalKeluhanUtama {
  /** SCTID dari subset master KeluhanUtama (snapshot di Anamnesis). */
  kode: string;
  display: string;
  /** Teks bebas keluhan dari form Anamnesis → `note` (pola contoh resmi). */
  teks: string;
  recordedAt: Date;
}

export function toFhirChiefComplaint(
  k: LocalKeluhanUtama,
  r: ClinicalRefs,
  recorder?: { ihsId: string; nama: string },
): FhirRes {
  const teks = k.teks.trim();
  return {
    resourceType: "Condition",
    clinicalStatus: ACTIVE,
    category: [{ coding: [CONDITION_CATEGORY.chiefComplaint] }],
    code: { coding: [{ system: SNOMED, code: k.kode, display: k.display }] },
    subject: subject(r),
    encounter: encounter(r),
    recordedDate: toFhirDateTime(k.recordedAt),
    ...(recorder ? { recorder: { reference: `Practitioner/${recorder.ihsId}`, display: recorder.nama } } : {}),
    ...(teks ? { note: [{ text: teks }] } : {}),
  };
}

export interface LocalKondisiPulang {
  kode: Coding; // dari KONDISI_PULANG (conceptMap)
  /** Nilai lokal asli (Baik/Sedang/…) — ikut di `code.text` agar tetap terlacak (D11: 4 nilai → 2 kode). */
  lokal: string;
  recordedAt: Date; // Disposisi.waktuKeluar
}

export function toFhirKondisiPulang(k: LocalKondisiPulang, r: ClinicalRefs): FhirRes {
  return {
    resourceType: "Condition",
    clinicalStatus: ACTIVE,
    category: [{ coding: [CONDITION_CATEGORY.problemListItem] }],
    code: { coding: [k.kode], text: `Kondisi umum: ${k.lokal}` },
    subject: subject(r),
    encounter: encounter(r),
    recordedDate: toFhirDateTime(k.recordedAt),
  };
}
