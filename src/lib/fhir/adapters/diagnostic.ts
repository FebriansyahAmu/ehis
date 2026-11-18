/**
 * Adapter penunjang → FHIR diagnostik (FH6): ServiceRequest (order Lab/Rad per item) · Observation
 * hasil (Lab per parameter · Rad = temuan narasi) · DiagnosticReport (Lab per tes · Rad per order).
 * Fungsi murni; LOINC wajib (pemanggil melewati item tanpa LOINC).
 * Contoh resmi: docs/fhir-postman/resources/{ServiceRequest,DiagnosticReport,Observation}.json.
 *
 * Specimen (Lab, S6b): dikirim SESUDAH ServiceRequest (request → SR). ImagingStudy dikirim DICOM router/PACS, bukan EHIS: EHIS cukup
 * membawa ACSN di ServiceRequest rad (S6a) agar router dapat mencocokkan studi ke order (FG-54).
 */

import { FHIR_SYSTEM, orgIdentifierSystem, toFhirDateTime, type FhirResourceBase } from "../fhirShared";
import { ORDER_PRIORITY, lookup, type Coding } from "../conceptMap";

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

/** DICOM Controlled Terminology — kode Modality di `ServiceRequest.orderDetail` (contoh resmi rad). */
const DICOM_SYSTEM = "http://dicom.nema.org/resources/ontology/DCM";

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
  extra: {
    requester?: Ref;
    reason?: { kode: string; nama: string };
    /** Rad: Accession Number (wajib — pemanggil menahan item tanpa ACSN). */
    acsn?: string;
    /** Rad: kode DICOM Modality (null/absen → orderDetail dilewati). AE title belum ada master (FG-138). */
    modality?: string | null;
  },
): FhirRes {
  return {
    resourceType: "ServiceRequest",
    identifier: [
      { system: orgIdentifierSystem("servicerequest", r.orgId), value: item.id },
      // Contoh resmi rad: identifier[1] ACSN — kunci pencocokan ImagingStudy oleh DICOM router.
      ...(extra.acsn
        ? [{
            use: "usual",
            type: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/v2-0203", code: "ACSN" }] },
            system: orgIdentifierSystem("acsn", r.orgId),
            value: extra.acsn,
          }]
        : []),
    ],
    status: srStatus(o),
    intent: "original-order",
    priority: lookup(ORDER_PRIORITY, o.prioritas) ?? "routine",
    category: [{ coding: [{ system: FHIR_SYSTEM.snomed, ...SR_CATEGORY[kind] }] }],
    code: { ...coding(loinc), text: item.nama },
    ...(extra.modality
      ? { orderDetail: [{ coding: [{ system: DICOM_SYSTEM, code: extra.modality }], text: `Modality Code: ${extra.modality}` }] }
      : {}),
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
  extra: { serviceRequestIhsId: string; issued: Date; performer?: Ref; specimenIhsId?: string },
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
    ...(extra.specimenIhsId ? { specimen: { reference: `Specimen/${extra.specimenIhsId}` } } : {}),
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
    /** Lab: kategori per bagian (LAB_REPORT_CATEGORY — HM/CH/…, L16); absen → LAB/RAD umum. */
    category?: Coding;
    /** Lab: Specimen terkirim (`specimen*` wajib playbook — pemanggil menahan DR lab tanpa Specimen, S6b). */
    specimenIhsIds?: string[];
  },
): FhirRes {
  return {
    resourceType: "DiagnosticReport",
    identifier: [{ system: `${orgIdentifierSystem("diagnostic", r.orgId)}/${kind}`, use: "official", value: localId }],
    status: extra.deleted ? "entered-in-error" : "final",
    category: [{ coding: [extra.category ?? { system: "http://terminology.hl7.org/CodeSystem/v2-0074", ...DR_CATEGORY[kind] }] }],
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
    ...(extra.specimenIhsIds?.length ? { specimen: extra.specimenIhsIds.map((id) => ({ reference: `Specimen/${id}` })) } : {}),
    ...(extra.conclusion ? { conclusion: extra.conclusion } : {}),
  };
}

// ── Specimen (Lab, S6b) ─────────────────────────────────────

/**
 * Specimen per item tes (1 tes = 1 SR + 1 Specimen, playbook L16). Bentuk = contoh resmi IGD: identifier
 * `…/specimen/{Org_id}` + assigner · status · type SNOMED · subject · `request` → ServiceRequest yang SUDAH
 * terkirim · receivedTime + extension ReceivedPerson (aksi Terima Lab). `collection` (waktu/petugas ambil,
 * status puasa) tidak dikirim — pengambilan sampel di luar aplikasi (FG-143).
 */
export function toFhirSpecimen(
  itemId: string,
  type: Coding,
  r: DiagRefs,
  extra: { serviceRequestIhsId: string; deleted: boolean; receivedTime?: Date | null; receivedBy?: Ref },
): FhirRes {
  return {
    resourceType: "Specimen",
    identifier: [{
      system: orgIdentifierSystem("specimen", r.orgId),
      value: itemId,
      assigner: { reference: `Organization/${r.orgId}` },
    }],
    status: extra.deleted ? "entered-in-error" : "available",
    type: { coding: [type] },
    subject: subject(r),
    request: [{ reference: `ServiceRequest/${extra.serviceRequestIhsId}` }],
    ...(extra.receivedTime ? { receivedTime: toFhirDateTime(extra.receivedTime) } : {}),
    ...(extra.receivedBy
      ? {
          extension: [{
            url: "https://fhir.kemkes.go.id/r4/StructureDefinition/ReceivedPerson",
            valueReference: { reference: `Practitioner/${extra.receivedBy.ihsId}`, display: extra.receivedBy.nama },
          }],
        }
      : {}),
  };
}
