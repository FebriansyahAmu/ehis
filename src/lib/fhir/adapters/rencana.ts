/**
 * Adapter rencana & pulang (fase B6): L22 Goal + CarePlan rencana rawat · L23 CarePlan pemulangan ·
 * L15 Procedure edukasi · L25 ServiceRequest rencana tindak lanjut. Fungsi murni.
 * Bentuk = contoh Bundle resmi RI/RJ/IGD (docs/fhir-postman/bundles/) + tabel playbook (verbatim 2026-11-18).
 */

import { FHIR_SYSTEM, orgIdentifierSystem, toFhirDateTime, type FhirResourceBase } from "../fhirShared";
import { EDUKASI, TINDAK_LANJUT, type Coding } from "../conceptMap";
import type { ClinicalRefs } from "./clinical";

type FhirRes = FhirResourceBase & Record<string, unknown>;
type Ref = { ihsId: string; nama: string };

const subject = (r: ClinicalRefs) => ({ reference: `Patient/${r.patient.ihsId}`, display: r.patient.nama });
const encounter = (r: ClinicalRefs) => ({ reference: `Encounter/${r.encounter.ihsId}` });
const practitioner = (p: Ref) => ({ reference: `Practitioner/${p.ihsId}`, display: p.nama });
const notes = (xs: string[]) => {
  const n = xs.map((x) => x.trim()).filter(Boolean);
  return n.length ? { note: n.map((text) => ({ text })) } : {};
};

// ── L22 Goal (tujuan perawatan) ─────────────────────────────

/**
 * 1 CarePlanGoal → Goal `nursing`. `description.text` = target teks bebas (contoh resmi RI memakai text saja — SNOMED
 * tidak wajib). Target waktu/intervensi/evaluasi teks → `note` (Goal.target butuh measure terkode; tidak dikarang).
 */
export function toFhirGoal(
  g: {
    target: string; indikator: string; targetWaktu: string; intervensi: string[]; evaluasi: string;
    lifecycle: "active" | "completed" | "cancelled" | "entered-in-error"; achievement?: Coding; statusDate: string;
  },
  r: ClinicalRefs,
  extra: { expressedBy?: Ref; addresses?: { ihsId: string; display: string } },
): FhirRes {
  return {
    resourceType: "Goal",
    lifecycleStatus: g.lifecycle,
    ...(g.achievement && g.lifecycle !== "entered-in-error" ? { achievementStatus: { coding: [g.achievement] } } : {}),
    category: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/goal-category", code: "nursing", display: "Nursing" }] }],
    description: { text: [g.target.trim(), g.indikator.trim() ? `indikator: ${g.indikator.trim()}` : ""].filter(Boolean).join(" — ") },
    subject: subject(r),
    statusDate: g.statusDate,
    ...(extra.expressedBy ? { expressedBy: practitioner(extra.expressedBy) } : {}),
    ...(extra.addresses ? { addresses: [{ reference: `Condition/${extra.addresses.ihsId}`, display: extra.addresses.display }] } : {}),
    ...notes([
      g.targetWaktu ? `Target waktu: ${g.targetWaktu}` : "",
      g.intervensi.length ? `Intervensi: ${g.intervensi.join("; ")}` : "",
      g.evaluasi ? `Evaluasi: ${g.evaluasi}` : "",
    ]),
  };
}

// ── L22/L23 CarePlan ────────────────────────────────────────

export function toFhirCarePlan(
  c: {
    status: "active" | "completed" | "revoked" | "entered-in-error";
    category: Coding;
    title: string;
    description: string;
    created: Date;
  },
  r: ClinicalRefs,
  extra: { author: Ref; goalIhsIds?: string[] },
): FhirRes {
  return {
    resourceType: "CarePlan",
    status: c.status,
    intent: "plan",
    category: [{ coding: [c.category] }],
    title: c.title,
    description: c.description,
    subject: subject(r),
    encounter: encounter(r),
    created: toFhirDateTime(c.created),
    author: practitioner(extra.author),
    ...(extra.goalIhsIds?.length ? { goal: extra.goalIhsIds.map((id) => ({ reference: `Goal/${id}` })) } : {}),
  };
}

// ── L15 Procedure edukasi ───────────────────────────────────

/** Playbook: SNOMED topik **dan** KPTL `10913` dalam 1 `Procedure.code`. `waktu` = dateTime atau tanggal saja. */
export function toFhirEdukasi(
  e: { topik: Coding; waktu: string; deleted: boolean; note: string[] },
  r: ClinicalRefs,
  extra: { performer?: Ref },
): FhirRes {
  return {
    resourceType: "Procedure",
    status: e.deleted ? "entered-in-error" : "completed",
    category: { coding: [EDUKASI.category], text: "Education" },
    code: { coding: [e.topik, EDUKASI.kptl] },
    subject: subject(r),
    encounter: encounter(r),
    performedPeriod: { start: e.waktu, end: e.waktu },
    ...(extra.performer ? { performer: [{ actor: practitioner(extra.performer) }] } : {}),
    ...notes(e.note),
  };
}

// ── L25 ServiceRequest rencana tindak lanjut ────────────────

export function toFhirTindakLanjut(
  s: {
    identifier: string;
    status: "active" | "completed" | "revoked";
    code: Coding;
    text: string;
    priority: "routine" | "urgent" | "stat";
    /** dateTime FHIR atau tanggal saja (YYYY-MM-DD). */
    occurrence: string;
    authoredOn: Date;
    location?: { coding: Coding; text?: string };
    patientInstruction?: string;
  },
  r: ClinicalRefs,
  extra: { requester?: Ref; performer?: Ref; reason?: { kode: string; nama: string } },
): FhirRes {
  return {
    resourceType: "ServiceRequest",
    identifier: [{ system: orgIdentifierSystem("servicerequest", r.orgId), value: s.identifier }],
    status: s.status,
    intent: "original-order",
    category: [{ coding: [TINDAK_LANJUT.category] }],
    priority: s.priority,
    code: { coding: [s.code], text: s.text },
    subject: subject(r),
    encounter: encounter(r),
    occurrenceDateTime: s.occurrence,
    authoredOn: toFhirDateTime(s.authoredOn),
    ...(extra.requester ? { requester: practitioner(extra.requester) } : {}),
    ...(extra.performer ? { performer: [practitioner(extra.performer)] } : {}),
    ...(s.location ? { locationCode: [{ coding: [s.location.coding], ...(s.location.text ? { text: s.location.text } : {}) }] } : {}),
    ...(extra.reason ? { reasonCode: [{ coding: [{ system: FHIR_SYSTEM.icd10, code: extra.reason.kode, display: extra.reason.nama }] }] } : {}),
    ...(s.patientInstruction ? { patientInstruction: s.patientInstruction } : {}),
  };
}
