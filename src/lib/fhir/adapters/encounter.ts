/**
 * Adapter `encounter.Kunjungan` → FHIR `Encounter` (FH3). Fungsi murni; semua IHS id sudah
 * di-resolve oleh pemanggil.
 *
 * Status: InService → in-progress · Completed/Closed/Billed/Claimed → finished · Cancelled → cancelled.
 * statusHistory: arrived [waktuKunjungan → dilayaniAt] → in-progress [dilayaniAt → selesaiAt] → finished.
 * Contoh resmi: docs/fhir-postman/resources/Encounter.json + bundles/*.json (entry Encounter).
 */

import { FHIR_SYSTEM, orgIdentifierSystem, toFhirDateTime, type FhirResourceBase } from "../fhirShared";

export type EncounterStatus = "arrived" | "in-progress" | "finished" | "cancelled";

export interface LocalEncounter {
  noKunjungan: string;
  unit: "IGD" | "RawatJalan" | "RawatInap";
  status: string;
  waktuKunjungan: Date;
  dilayaniAt: Date | null;
  selesaiAt: Date | null;
  /** Kelas KAMAR (RI) · kelas hak · titipan — untuk extension ServiceClass. */
  kelas: string | null;
  kelasHak: string | null;
  titipan: boolean;
  /** Jenis disposisi terakhir (Pulang/Rawat_Inap/Rujuk/Meninggal/APS) bila selesai. */
  disposisi?: { jenis: string; rujukTujuan: string | null; instruksi: string } | null;
}

export interface EncounterRefs {
  orgId: string;
  patient: { ihsId: string; nama: string };
  practitioner?: { ihsId: string; nama: string };
  location?: { ihsId: string; nama: string };
  /** Condition terpetakan (FH4) — wajib untuk status finished di SatuSehat (FHIR-GAP FG-27). */
  diagnoses?: { ihsId: string; display: string; rank: number }[];
}

export interface FhirEncounter extends FhirResourceBase {
  resourceType: "Encounter";
  [k: string]: unknown;
}

const CLASS: Record<LocalEncounter["unit"], { code: string; display: string }> = {
  IGD: { code: "EMER", display: "emergency" },
  RawatJalan: { code: "AMB", display: "ambulatory" },
  RawatInap: { code: "IMP", display: "inpatient encounter" },
};

const FINISHED = new Set(["Completed", "Closed", "Billed", "Claimed"]);

/** Status FHIR dari status kunjungan; null = belum layak dikirim (belum diterima). */
export function encounterStatusOf(status: string): EncounterStatus | null {
  if (status === "InService") return "in-progress";
  if (FINISHED.has(status)) return "finished";
  if (status === "Cancelled") return "cancelled";
  return null;
}

/** Disposisi lokal → HL7 discharge-disposition. */
const DISCHARGE: Record<string, { code: string; display: string }> = {
  Pulang: { code: "home", display: "Home" },
  Rujuk: { code: "other-hcf", display: "Other healthcare facility" },
  Meninggal: { code: "exp", display: "Expired" },
  APS: { code: "aadvice", display: "Left against advice" },
  Rawat_Inap: { code: "oth", display: "Other" },
};

/** Kelas kamar lokal → kode locationServiceClass-Inpatient. */
const KELAS_INPATIENT: Record<string, { code: string; display: string }> = {
  VIP: { code: "vip", display: "Kelas VIP" },
  Kelas_1: { code: "1", display: "Kelas 1" },
  Kelas_2: { code: "2", display: "Kelas 2" },
  Kelas_3: { code: "3", display: "Kelas 3" },
};
const KELAS_RANK: Record<string, number> = { Kelas_3: 1, Kelas_2: 2, Kelas_1: 3, VIP: 4 };

function serviceClassExtension(e: LocalEncounter) {
  const inpatient = e.unit === "RawatInap";
  const kelas = inpatient ? KELAS_INPATIENT[e.kelas ?? ""] : { code: "reguler", display: "Kelas Reguler" };
  if (!kelas) return undefined; // RI tanpa kelas terpetakan (ICU/HCU/Isolasi) → tanpa extension (FG-28)

  let upgrade = { code: "kelas-tetap", display: "Kelas Tetap Perawatan" };
  if (inpatient && e.titipan) upgrade = { code: "titip-rawat", display: "Titip Rawat" };
  else if (inpatient && e.kelas && e.kelasHak && KELAS_RANK[e.kelas] && KELAS_RANK[e.kelasHak]) {
    const d = KELAS_RANK[e.kelas] - KELAS_RANK[e.kelasHak];
    if (d > 0) upgrade = { code: "naik-kelas", display: "Naik Kelas" };
    else if (d < 0) upgrade = { code: "turun-kelas", display: "Turun Kelas" };
  }

  return [{
    url: "https://fhir.kemkes.go.id/r4/StructureDefinition/ServiceClass",
    extension: [
      {
        url: "value",
        valueCodeableConcept: {
          coding: [{
            system: `http://terminology.kemkes.go.id/CodeSystem/locationServiceClass-${inpatient ? "Inpatient" : "Outpatient"}`,
            ...kelas,
          }],
        },
      },
      {
        url: "upgradeClassIndicator",
        valueCodeableConcept: {
          coding: [{ system: "http://terminology.kemkes.go.id/CodeSystem/locationUpgradeClass", ...upgrade }],
        },
      },
    ],
  }];
}

export function toFhirEncounter(e: LocalEncounter, refs: EncounterRefs, status: EncounterStatus): FhirEncounter {
  const t = toFhirDateTime;
  const arrived = e.waktuKunjungan;
  const served = e.dilayaniAt ?? e.waktuKunjungan;
  const done = status === "finished" ? (e.selesaiAt ?? served) : null;

  const history: { status: EncounterStatus; period: { start: string; end?: string } }[] = [
    { status: "arrived", period: { start: t(arrived), end: t(served) } },
  ];
  if (status === "in-progress" || status === "finished") {
    history.push({ status: "in-progress", period: { start: t(served), ...(done ? { end: t(done) } : {}) } });
  }
  if (done) history.push({ status: "finished", period: { start: t(done), end: t(done) } });
  if (status === "cancelled") history.push({ status: "cancelled", period: { start: t(served) } });

  const disp = status === "finished" && e.disposisi ? DISCHARGE[e.disposisi.jenis] : undefined;
  const dispText = e.disposisi?.jenis === "Rujuk" && e.disposisi.rujukTujuan
    ? `Rujuk ke ${e.disposisi.rujukTujuan}`
    : e.disposisi?.instruksi || undefined;
  const serviceClass = serviceClassExtension(e);

  return {
    resourceType: "Encounter",
    identifier: [{ system: orgIdentifierSystem("encounter", refs.orgId), value: e.noKunjungan }],
    status,
    statusHistory: history,
    class: { system: FHIR_SYSTEM.actCode, ...CLASS[e.unit] },
    subject: { reference: `Patient/${refs.patient.ihsId}`, display: refs.patient.nama },
    ...(refs.practitioner ? {
      participant: [{
        type: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/v3-ParticipationType", code: "ATND", display: "attender" }] }],
        individual: { reference: `Practitioner/${refs.practitioner.ihsId}`, display: refs.practitioner.nama },
      }],
    } : {}),
    period: { start: t(arrived), ...(done ? { end: t(done) } : {}) },
    ...(refs.location ? {
      location: [{
        location: { reference: `Location/${refs.location.ihsId}`, display: refs.location.nama },
        ...(serviceClass ? { extension: serviceClass } : {}),
      }],
    } : {}),
    ...(status === "finished" && refs.diagnoses?.length ? {
      diagnosis: refs.diagnoses.map((d) => ({
        condition: { reference: `Condition/${d.ihsId}`, display: d.display },
        use: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/diagnosis-role", code: "DD", display: "Discharge diagnosis" }] },
        rank: d.rank,
      })),
    } : {}),
    ...(disp ? {
      hospitalization: {
        dischargeDisposition: {
          coding: [{ system: "http://terminology.hl7.org/CodeSystem/discharge-disposition", ...disp }],
          ...(dispText ? { text: dispText } : {}),
        },
      },
    } : {}),
    serviceProvider: { reference: `Organization/${refs.orgId}` },
  };
}
