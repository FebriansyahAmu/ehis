/**
 * Adapter anamnesis (fase B1, S4d) — fungsi murni:
 *  - L04 riwayat penyakit pribadi → Condition category `previous-condition` (Kemkes)
 *  - L05 riwayat penyakit keluarga → FamilyMemberHistory (relationship FAMMEMB + teks anggota)
 * Bentuk mengikuti contoh resmi docs/fhir-postman/bundles/bundle-rawat-inap.json (Condition 472969004 /
 * 161527007 dengan recorder + note; FamilyMemberHistory `completed` tanpa encounter).
 */

import { toFhirDateTime, type FhirResourceBase } from "../fhirShared";
import { CONDITION_CATEGORY, FAMILY_MEMBER, type Coding } from "../conceptMap";
import type { ClinicalRefs } from "./clinical";

type FhirRes = FhirResourceBase & Record<string, unknown>;

const ENTERED_IN_ERROR = {
  coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-ver-status", code: "entered-in-error", display: "Entered in Error" }],
};

export interface LocalRiwayatPenyakit {
  coding: Coding;
  catatan: string | null;
  recordedAt: Date;
  deleted: boolean;
}

/**
 * L04 — `clinicalStatus` TIDAK diisi: form belum mencatat "masih diderita / sudah sembuh" (active/inactive,
 * opsional di tabel playbook) — tidak dikarang (FG-128). Dihapus → verificationStatus entered-in-error.
 */
export function toFhirRiwayatPenyakit(
  p: LocalRiwayatPenyakit,
  r: ClinicalRefs,
  recorder?: { ihsId: string; nama: string },
): FhirRes {
  return {
    resourceType: "Condition",
    ...(p.deleted ? { verificationStatus: ENTERED_IN_ERROR } : {}),
    category: [{ coding: [CONDITION_CATEGORY.previousCondition] }],
    code: { coding: [p.coding] },
    subject: { reference: `Patient/${r.patient.ihsId}`, display: r.patient.nama },
    encounter: { reference: `Encounter/${r.encounter.ihsId}`, display: r.encounter.display },
    recordedDate: toFhirDateTime(p.recordedAt),
    ...(recorder ? { recorder: { reference: `Practitioner/${recorder.ihsId}`, display: recorder.nama } } : {}),
    ...(p.catatan ? { note: [{ text: p.catatan }] } : {}),
  };
}

export interface LocalRiwayatKeluarga {
  /** Label anggota EHIS (Ayah/Ibu/…) → `relationship.text`. */
  anggota: string;
  kondisi: Coding[];
  keterangan: string | null;
  date: Date;
  deleted: boolean;
}

/** L05 — satu FamilyMemberHistory per anggota, berisi N `condition` (SNOMED "Family history …"). */
export function toFhirRiwayatKeluarga(f: LocalRiwayatKeluarga, r: ClinicalRefs): FhirRes {
  return {
    resourceType: "FamilyMemberHistory",
    status: f.deleted ? "entered-in-error" : "completed",
    patient: { reference: `Patient/${r.patient.ihsId}`, display: r.patient.nama },
    date: toFhirDateTime(f.date),
    relationship: { coding: [FAMILY_MEMBER], text: f.anggota },
    condition: f.kondisi.map((c) => ({ code: { coding: [c] } })),
    ...(f.keterangan ? { note: [{ text: f.keterangan }] } : {}),
  };
}
