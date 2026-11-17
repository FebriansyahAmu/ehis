/**
 * Adapter Farmasi → FHIR rantai obat (FH5): Medication (master Obat + KFA) · MedicationRequest
 * (ResepItem) · MedicationDispense (ResepDispensing × item). Fungsi murni.
 * Contoh resmi: docs/fhir-postman/resources/{Medication,MedicationRequest,MedicationDispense}.json.
 *
 * Medication dibuat SEKALI per master Obat (bukan per resep) — identifier RS `medication/{orgId}`
 * = id Obat; dirujuk semua MedicationRequest/Dispense. Racikan (compound) belum didukung (FG-46).
 */

import { FHIR_SYSTEM, orgIdentifierSystem, toFhirDateTime, type FhirResourceBase } from "../fhirShared";
import { MEDICATION_CATEGORY_DISPLAY, ORDER_PRIORITY, ROUTE_ATC, lookup, type KategoriResep } from "../conceptMap";

type FhirRes = FhirResourceBase & Record<string, unknown>;
type Ref = { ihsId: string; nama: string };

/** Blok `master.Obat.kfa` (JSONB) — lihat prisma/schema/obat.prisma. */
export interface KfaMapping {
  poaKode?: string;
  poaNama?: string;
  povKode?: string;
  povNama?: string;
  ruteKode?: string;
  ruteNama?: string;
  bentukKode?: string;
  bentukNama?: string;
  zatAktif?: { kode: string; display: string; dosis?: number; satuan?: string }[];
}

export interface LocalObat {
  id: string;
  namaGenerik: string;
  namaDagang: string;
  status: string;
  kfa: KfaMapping;
}

/** Kode KFA produk: POA (produk aktual, 93xxx) diutamakan, fallback POV (virtual, 92xxx). */
export function kfaProductOf(kfa: KfaMapping | null | undefined): { code: string; display: string } | null {
  if (kfa?.poaKode) return { code: kfa.poaKode, display: kfa.poaNama ?? "" };
  if (kfa?.povKode) return { code: kfa.povKode, display: kfa.povNama ?? "" };
  return null;
}

export function toFhirMedication(o: LocalObat, orgId: string): FhirRes | null {
  const product = kfaProductOf(o.kfa);
  if (!product) return null;
  const ingredient = (o.kfa.zatAktif ?? [])
    .filter((z) => z.kode)
    .map((z) => ({
      itemCodeableConcept: { coding: [{ system: FHIR_SYSTEM.kfa, code: z.kode, display: z.display }] },
      isActive: true,
      ...(z.dosis != null && z.satuan
        ? { strength: { numerator: { value: z.dosis, system: "http://unitsofmeasure.org", code: z.satuan }, denominator: { value: 1 } } }
        : {}),
    }));

  return {
    resourceType: "Medication",
    meta: { profile: ["https://fhir.kemkes.go.id/r4/StructureDefinition/Medication"] },
    identifier: [{ system: orgIdentifierSystem("medication", orgId), use: "official", value: o.id }],
    code: { coding: [{ system: FHIR_SYSTEM.kfa, code: product.code, display: product.display || `${o.namaGenerik} (${o.namaDagang})` }] },
    status: o.status === "Aktif" ? "active" : "inactive",
    ...(o.kfa.bentukKode ? {
      form: { coding: [{ system: "http://terminology.kemkes.go.id/CodeSystem/medication-form", code: o.kfa.bentukKode, display: o.kfa.bentukNama ?? "" }] },
    } : {}),
    ...(ingredient.length ? { ingredient } : {}),
    extension: [{
      url: "https://fhir.kemkes.go.id/r4/StructureDefinition/MedicationType",
      valueCodeableConcept: { coding: [{ system: "http://terminology.kemkes.go.id/CodeSystem/medication-type", code: "NC", display: "Non-compound" }] },
    }],
  };
}

// ── MedicationRequest ───────────────────────────────────────

export interface LocalResep {
  id: string;
  prioritas: string; // CITO/Segera/Rutin
  status: string; // workflow Farmasi
  isObatPulang: boolean;
  createdAt: Date;
  deleted: boolean;
}

export interface LocalResepItem {
  id: string;
  seq: number;
  namaObat: string;
  dosis: string | null;
  dosisSekali: string | null;
  signa: string | null;
  jumlah: number;
  rute: string | null;
  aturanPakai: string | null;
  durasiHari: number;
  keterangan: string | null;
}

export interface MedicationRefs {
  orgId: string;
  unit: "IGD" | "RawatJalan" | "RawatInap";
  patient: Ref;
  encounter: { ihsId: string };
  medication: Ref;
}

function statusOf(r: LocalResep): string {
  if (r.deleted) return "entered-in-error";
  if (r.status === "Dibatalkan") return "cancelled";
  if (r.status === "Selesai") return "completed";
  return "active";
}

function categoryOf(r: LocalResep, unit: MedicationRefs["unit"]): { code: KategoriResep; display: string } {
  const code: KategoriResep = r.isObatPulang ? "discharge" : unit === "RawatInap" ? "inpatient" : "outpatient";
  return { code, display: MEDICATION_CATEGORY_DISPLAY[code] };
}

function dosageText(i: LocalResepItem): string {
  return [i.signa, i.dosisSekali ?? i.dosis, i.aturanPakai].filter(Boolean).join(" · ") || i.namaObat;
}

export function toFhirMedicationRequest(
  r: LocalResep,
  i: LocalResepItem,
  refs: MedicationRefs,
  extra: { requester?: Ref; reason?: { kode: string; nama: string } },
): FhirRes {
  const route = lookup(ROUTE_ATC, i.rute);
  const cat = categoryOf(r, refs.unit);
  return {
    resourceType: "MedicationRequest",
    identifier: [
      { system: orgIdentifierSystem("prescription", refs.orgId), use: "official", value: r.id },
      { system: `http://sys-ids.kemkes.go.id/prescription-item/${refs.orgId}`, use: "official", value: `${r.id}-${i.seq}` },
    ],
    status: statusOf(r),
    intent: "order",
    category: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/medicationrequest-category", ...cat }] }],
    priority: lookup(ORDER_PRIORITY, r.prioritas) ?? "routine",
    medicationReference: { reference: `Medication/${refs.medication.ihsId}`, display: refs.medication.nama },
    subject: { reference: `Patient/${refs.patient.ihsId}`, display: refs.patient.nama },
    encounter: { reference: `Encounter/${refs.encounter.ihsId}` },
    authoredOn: toFhirDateTime(r.createdAt),
    ...(extra.requester ? { requester: { reference: `Practitioner/${extra.requester.ihsId}`, display: extra.requester.nama } } : {}),
    ...(extra.reason ? { reasonCode: [{ coding: [{ system: FHIR_SYSTEM.icd10, code: extra.reason.kode, display: extra.reason.nama }] }] } : {}),
    dosageInstruction: [{
      sequence: 1,
      text: dosageText(i),
      ...(i.keterangan ? { additionalInstruction: [{ text: i.keterangan }] } : {}),
      ...(route ? { route: { coding: [route] } } : {}),
    }],
    dispenseRequest: {
      quantity: { value: i.jumlah },
      expectedSupplyDuration: { value: i.durasiHari, unit: "days", system: "http://unitsofmeasure.org", code: "d" },
      performer: { reference: `Organization/${refs.orgId}` },
    },
  };
}

// ── MedicationDispense ──────────────────────────────────────

export function toFhirMedicationDispense(
  r: LocalResep,
  i: LocalResepItem,
  d: { createdAt: Date },
  refs: MedicationRefs & { request: { ihsId: string } },
  extra: { performer?: Ref; location?: Ref },
): FhirRes {
  const cat = categoryOf(r, refs.unit);
  return {
    resourceType: "MedicationDispense",
    identifier: [
      { system: orgIdentifierSystem("prescription", refs.orgId), use: "official", value: r.id },
      { system: `http://sys-ids.kemkes.go.id/prescription-item/${refs.orgId}`, use: "official", value: `${r.id}-${i.seq}` },
    ],
    status: r.deleted ? "entered-in-error" : "completed",
    category: { coding: [{ system: "http://terminology.hl7.org/fhir/CodeSystem/medicationdispense-category", ...cat }] },
    medicationReference: { reference: `Medication/${refs.medication.ihsId}`, display: refs.medication.nama },
    subject: { reference: `Patient/${refs.patient.ihsId}`, display: refs.patient.nama },
    context: { reference: `Encounter/${refs.encounter.ihsId}` },
    ...(extra.performer ? { performer: [{ actor: { reference: `Practitioner/${extra.performer.ihsId}`, display: extra.performer.nama } }] } : {}),
    ...(extra.location ? { location: { reference: `Location/${extra.location.ihsId}`, display: extra.location.nama } } : {}),
    authorizingPrescription: [{ reference: `MedicationRequest/${refs.request.ihsId}` }],
    quantity: { value: i.jumlah },
    daysSupply: { value: i.durasiHari, unit: "Day", system: "http://unitsofmeasure.org", code: "d" },
    whenHandedOver: toFhirDateTime(d.createdAt),
    dosageInstruction: [{ sequence: 1, text: dosageText(i) }],
  };
}
