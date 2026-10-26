/**
 * Adapter `medicalrecord.ResumeMedik` (revisi terbaru) → FHIR `Composition` resume medis (FH7).
 * type LOINC 18842-5 Discharge summary · status final bila sudah TTE, preliminary bila belum.
 * Section = narasi (XHTML ter-escape). Contoh resmi: docs/fhir-postman/resources/Composition.json.
 */

import { FHIR_SYSTEM, orgIdentifierSystem, toFhirDateTime, type FhirResourceBase } from "../fhirShared";

type Ref = { ihsId: string; nama: string };

export interface LocalResume {
  kunjunganId: string;
  noKunjungan: string;
  unit: "IGD" | "RawatJalan" | "RawatInap";
  ringkasanKlinis: string;
  kondisiMasuk: string;
  kondisiPulang: string;
  diagnosisKeluar: string[];
  signedAt: Date | null;
  createdAt: Date;
}

const TITLE: Record<LocalResume["unit"], string> = {
  IGD: "Resume Medis Gawat Darurat",
  RawatJalan: "Resume Medis Rawat Jalan",
  RawatInap: "Resume Medis Rawat Inap",
};

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const xhtml = (s: string) => `<div xmlns="http://www.w3.org/1999/xhtml">${esc(s).replace(/\n/g, "<br/>")}</div>`;

export function toFhirComposition(
  r: LocalResume,
  refs: { orgId: string; patient: Ref; encounter: Ref; author: Ref },
): FhirResourceBase & Record<string, unknown> {
  const sections: { title: string; code?: { code: string; display: string }; text: string }[] = [
    { title: "Ringkasan Klinis", code: { code: "8648-8", display: "Hospital course Narrative" }, text: r.ringkasanKlinis },
    { title: "Diagnosis Keluar", code: { code: "11535-2", display: "Hospital discharge Dx Narrative" }, text: r.diagnosisKeluar.join("\n") },
    { title: "Kondisi Saat Masuk", text: r.kondisiMasuk },
    { title: "Kondisi Saat Pulang", text: r.kondisiPulang },
  ];

  return {
    resourceType: "Composition",
    identifier: { system: orgIdentifierSystem("composition", refs.orgId), value: r.noKunjungan },
    status: r.signedAt ? "final" : "preliminary",
    type: { coding: [{ system: FHIR_SYSTEM.loinc, code: "18842-5", display: "Discharge summary" }] },
    category: [{ coding: [{ system: FHIR_SYSTEM.loinc, code: "LP173421-1", display: "Report" }] }],
    subject: { reference: `Patient/${refs.patient.ihsId}`, display: refs.patient.nama },
    encounter: { reference: `Encounter/${refs.encounter.ihsId}`, display: refs.encounter.nama },
    date: toFhirDateTime(r.signedAt ?? r.createdAt),
    author: [{ reference: `Practitioner/${refs.author.ihsId}`, display: refs.author.nama }],
    title: TITLE[r.unit],
    custodian: { reference: `Organization/${refs.orgId}` },
    section: sections
      .filter((s) => s.text.trim())
      .map((s) => ({
        title: s.title,
        ...(s.code ? { code: { coding: [{ system: FHIR_SYSTEM.loinc, ...s.code }] } } : {}),
        text: { status: "additional", div: xhtml(s.text.trim()) },
      })),
  };
}
