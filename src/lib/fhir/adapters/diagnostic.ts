/**
 * Adapter penunjang → FHIR diagnostik (FH6): ServiceRequest (order Lab/Rad per item) · Observation
 * hasil (Lab per parameter · Rad = temuan narasi) · DiagnosticReport (Lab per tes · Rad per order).
 * Fungsi murni; LOINC wajib (pemanggil melewati item tanpa LOINC).
 * Contoh resmi: docs/fhir-postman/resources/{ServiceRequest,DiagnosticReport,Observation}.json.
 *
 * Specimen (Lab) & ImagingStudy (Rad) ditunda — butuh data pengambilan sampel & DICOM UID dari
 * PACS/router yang belum ada (FHIR-GAP FG-53/FG-54).
 */

import { FHIR_SYSTEM, orgIdentifierSystem, toFhirDateTime, type FhirResourceBase } from "../fhirShared";
import { ORDER_PRIORITY, lookup } from "../conceptMap";

type FhirRes = FhirResourceBase & Record<string, unknown>;
type Ref = { ihsId: string; nama: string };
export type DiagKind = "lab" | "rad";

export interface DiagRefs {
  orgId: string;
  patient: Ref;
  encounter: { ihsId: string };
}

export interface Loinc {
  code: string;
  display: string;
}

const subject = (r: DiagRefs) => ({ reference: `Patient/${r.patient.ihsId}`, display: r.patient.nama });
const encounter = (r: DiagRefs) => ({ reference: `Encounter/${r.encounter.ihsId}` });
const coding = (l: Loinc) => ({ coding: [{ system: FHIR_SYSTEM.loinc, code: l.code, display: l.display }] });

const SR_CATEGORY: Record<DiagKind, { code: string; display: string }> = {
  lab: { code: "108252007", display: "Laboratory procedure" },
  rad: { code: "363679005", display: "Imaging" },
};

export interface LocalDiagOrder {
  id: string;
  prioritas: string;
  status: string;
  catatan: string | null;
  createdAt: Date;
  deleted: boolean;
}

function srStatus(o: LocalDiagOrder): string {
  if (o.deleted) return "entered-in-error";
  if (o.status === "Dibatalkan") return "revoked";
  if (o.status === "Selesai") return "completed";
  return "active";
}

export function toFhirServiceRequest(
  kind: DiagKind,
  o: LocalDiagOrder,
  item: { id: string; nama: string },
  loinc: Loinc,
  r: DiagRefs,
  extra: { requester?: Ref; reason?: { kode: string; nama: string } },
): FhirRes {
  return {
    resourceType: "ServiceRequest",
    identifier: [{ system: orgIdentifierSystem("servicerequest", r.orgId), value: item.id }],
    status: srStatus(o),
    intent: "original-order",
    priority: lookup(ORDER_PRIORITY, o.prioritas) ?? "routine",
    category: [{ coding: [{ system: FHIR_SYSTEM.snomed, ...SR_CATEGORY[kind] }] }],
    code: { ...coding(loinc), text: item.nama },
    subject: subject(r),
    encounter: encounter(r),
    occurrenceDateTime: toFhirDateTime(o.createdAt),
    authoredOn: toFhirDateTime(o.createdAt),
    ...(extra.requester ? { requester: { reference: `Practitioner/${extra.requester.ihsId}`, display: extra.requester.nama } } : {}),
    ...(extra.reason
      ? { reasonCode: [{ coding: [{ system: FHIR_SYSTEM.icd10, code: extra.reason.kode, display: extra.reason.nama }], ...(o.catatan ? { text: o.catatan } : {}) }] }
      : o.catatan ? { reasonCode: [{ text: o.catatan }] } : {}),
  };
}

// ── Observation hasil ───────────────────────────────────────

/** Flag lokal → v3-ObservationInterpretation. */
const INTERPRETATION: Record<string, { code: string; display: string }> = {
  N: { code: "N", display: "Normal" },
  H: { code: "H", display: "High" },
  L: { code: "L", display: "Low" },
  HH: { code: "HH", display: "Critical high" },
  LL: { code: "LL", display: "Critical low" },
  C: { code: "AA", display: "Critical abnormal" },
  A: { code: "A", display: "Abnormal" },
};

export function toFhirLabObservation(
  v: { nilai: string; satuan: string; rujukanStr: string; flag: string | null; numerik: boolean },
  loinc: Loinc,
  r: DiagRefs,
  extra: { serviceRequestIhsId: string; issued: Date; performer?: Ref },
): FhirRes {
  const num = v.numerik ? Number(v.nilai.replace(",", ".")) : NaN;
  const interp = v.flag ? INTERPRETATION[v.flag.toUpperCase()] : undefined;
  return {
    resourceType: "Observation",
    status: "final",
    category: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/observation-category", code: "laboratory", display: "Laboratory" }] }],
    code: coding(loinc),
    subject: subject(r),
    encounter: encounter(r),
    basedOn: [{ reference: `ServiceRequest/${extra.serviceRequestIhsId}` }],
    ...(extra.performer ? { performer: [{ reference: `Practitioner/${extra.performer.ihsId}` }] } : {}),
    effectiveDateTime: toFhirDateTime(extra.issued),
    issued: toFhirDateTime(extra.issued),
    ...(Number.isFinite(num)
      ? { valueQuantity: { value: num, unit: v.satuan, ...(v.satuan ? { system: "http://unitsofmeasure.org", code: v.satuan } : {}) } }
      : { valueString: v.nilai }),
    ...(interp ? { interpretation: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation", ...interp }] }] } : {}),
    ...(v.rujukanStr && v.rujukanStr !== "—" ? { referenceRange: [{ text: v.rujukanStr }] } : {}),
  };
}

export function toFhirRadObservation(
  temuan: string,
  loinc: Loinc,
  r: DiagRefs,
  extra: { serviceRequestIhsIds: string[]; issued: Date; performer?: Ref },
): FhirRes {
  return {
    resourceType: "Observation",
    status: "final",
    category: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/observation-category", code: "imaging", display: "Imaging" }] }],
    code: coding(loinc),
    subject: subject(r),
    encounter: encounter(r),
    basedOn: extra.serviceRequestIhsIds.map((id) => ({ reference: `ServiceRequest/${id}` })),
    ...(extra.performer ? { performer: [{ reference: `Practitioner/${extra.performer.ihsId}` }] } : {}),
    effectiveDateTime: toFhirDateTime(extra.issued),
    issued: toFhirDateTime(extra.issued),
    valueString: temuan,
  };
}

// ── DiagnosticReport ────────────────────────────────────────

const DR_CATEGORY: Record<DiagKind, { code: string; display: string }> = {
  lab: { code: "LAB", display: "Laboratory" },
  rad: { code: "RAD", display: "Radiology" },
};

export function toFhirDiagnosticReport(
  kind: DiagKind,
  localId: string,
  loinc: Loinc,
  r: DiagRefs,
  extra: {
    deleted: boolean;
    issued: Date;
    observationIhsIds: string[];
    serviceRequestIhsIds: string[];
    performer?: Ref;
    conclusion?: string | null;
  },
): FhirRes {
  return {
    resourceType: "DiagnosticReport",
    identifier: [{ system: `${orgIdentifierSystem("diagnostic", r.orgId)}/${kind}`, use: "official", value: localId }],
    status: extra.deleted ? "entered-in-error" : "final",
    category: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/v2-0074", ...DR_CATEGORY[kind] }] }],
    code: coding(loinc),
    subject: subject(r),
    encounter: encounter(r),
    effectiveDateTime: toFhirDateTime(extra.issued),
    issued: toFhirDateTime(extra.issued),
    performer: [
      ...(extra.performer ? [{ reference: `Practitioner/${extra.performer.ihsId}` }] : []),
      { reference: `Organization/${r.orgId}` },
    ],
    ...(extra.observationIhsIds.length ? { result: extra.observationIhsIds.map((id) => ({ reference: `Observation/${id}` })) } : {}),
    basedOn: extra.serviceRequestIhsIds.map((id) => ({ reference: `ServiceRequest/${id}` })),
    ...(extra.conclusion ? { conclusion: extra.conclusion } : {}),
  };
}
