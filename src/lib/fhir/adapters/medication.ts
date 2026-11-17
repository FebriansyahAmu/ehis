/**
 * Adapter Farmasi → FHIR rantai obat (FH5): Medication (master Obat + KFA) · MedicationRequest
 * (ResepItem) · MedicationDispense (ResepDispensing × item). Fungsi murni.
 * Contoh resmi: docs/fhir-postman/bundles/bundle-rawat-jalan.json (Medication_forRequest / _forDispense).
 *
 * Pola D6 (S3, docs/fhir-mapping/L18 · L20): **1 Medication per paket** — satu untuk tiap MedicationRequest
 * dan satu untuk tiap MedicationDispense, dikirim bersama di Bundle (POST Medication berdiri sendiri tak
 * dapat dipakai mulai 2025). Kode: Request boleh KFA virtual `92…` atau aktual `93…`; Dispense WAJIB `93…`.
 * Racikan (compound) belum didukung (FG-46).
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

export type PemakaianMedication = "request" | "dispense";

const KFA_AKTUAL = /^93\d+$/; // POA — produk aktual
const KFA_VIRTUAL = /^92\d+$/; // POV — produk virtual

/**
 * Kode KFA produk menurut pemakaian paket. request: POA (93) diutamakan, cadangan POV (92).
 * dispense: HANYA POA 93 (playbook) — null bila obat hanya ber-POV.
 */
export function kfaProductOf(
  kfa: KfaMapping | null | undefined,
  untuk: PemakaianMedication = "request",
): { code: string; display: string } | null {
  const poa = kfa?.poaKode?.trim();
  const pov = kfa?.povKode?.trim();
  if (poa && KFA_AKTUAL.test(poa)) return { code: poa, display: kfa?.poaNama ?? "" };
  if (untuk === "request" && pov && KFA_VIRTUAL.test(pov)) return { code: pov, display: kfa?.povNama ?? "" };
  return null;
}

/**
 * Medication satu paket. `paket.identifier` = id paket (unik per Org) — bukan id master obat, karena
 * Medication tidak lagi dipakai ulang lintas resep. `deleted` → status entered-in-error.
 */
export function toFhirMedication(
  o: LocalObat,
  orgId: string,
  paket: { identifier: string; untuk: PemakaianMedication; deleted?: boolean },
): FhirRes | null {
  const product = kfaProductOf(o.kfa, paket.untuk);
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
    identifier: [{ system: orgIdentifierSystem("medication", orgId), use: "official", value: paket.identifier }],
    code: { coding: [{ system: FHIR_SYSTEM.kfa, code: product.code, display: product.display || `${o.namaGenerik} (${o.namaDagang})` }] },
    status: paket.deleted ? "entered-in-error" : o.status === "Aktif" ? "active" : "inactive",
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

// ── MedicationAdministration (L21) ──────────────────────────

/**
 * 1 slot MAR → MedicationAdministration dengan Medication **contained** (contoh resmi RI: `medicationReference`
 * `#<id>`; playbook RI §19: Medication + MedicationAdministration "1 paket"). `effectivePeriod` start = end
 * (MAR mencatat jam pemberian, bukan durasi). `dose` hanya bila dosis teks terurai ke UCUM (links/mar.ts).
 */
export function toFhirMedicationAdministration(
  m: { dosis: string; rute: string; perawat2: string; catatan: string },
  plan: { status: "completed" | "not-done" | "entered-in-error"; alasan?: string; waktu: Date },
  medication: FhirRes,
  refs: MedicationRefs & { request: { ihsId: string } },
  extra: { performer?: Ref; dose?: { value: number; unit: string; system: string; code: string } | null },
): FhirRes {
  const route = lookup(ROUTE_ATC, m.rute);
  const when = toFhirDateTime(plan.waktu);
  const inpatient = refs.unit === "RawatInap";
  const note = [m.catatan.trim(), m.perawat2.trim() ? `Verifikator kedua (HAM): ${m.perawat2.trim()}` : ""].filter(Boolean);
  return {
    resourceType: "MedicationAdministration",
    contained: [{ ...medication, id: "med" }],
    status: plan.status,
    ...(plan.status === "not-done" && plan.alasan ? { statusReason: [{ text: plan.alasan }] } : {}),
    category: {
      coding: [{
        system: "http://terminology.hl7.org/CodeSystem/medication-admin-category",
        code: inpatient ? "inpatient" : "outpatient",
        display: inpatient ? "Inpatient" : "Outpatient",
      }],
    },
    medicationReference: { reference: "#med", display: refs.medication.nama },
    subject: { reference: `Patient/${refs.patient.ihsId}`, display: refs.patient.nama },
    context: { reference: `Encounter/${refs.encounter.ihsId}` },
    effectivePeriod: { start: when, end: when },
    ...(extra.performer ? { performer: [{ actor: { reference: `Practitioner/${extra.performer.ihsId}`, display: extra.performer.nama } }] } : {}),
    ...(plan.status === "completed"
      ? { reasonCode: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/reason-medication-given", code: "b", display: "Given as Ordered" }] }] }
      : {}),
    request: { reference: `MedicationRequest/${refs.request.ihsId}` },
    ...(m.dosis.trim() || route || extra.dose
      ? {
          dosage: {
            ...(m.dosis.trim() ? { text: m.dosis.trim() } : {}),
            ...(route ? { route: { coding: [route] } } : {}),
            ...(extra.dose ? { dose: extra.dose } : {}),
          },
        }
      : {}),
    ...(note.length ? { note: note.map((text) => ({ text })) } : {}),
  };
}
