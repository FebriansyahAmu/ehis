/**
 * Adapter `medicalrecord.ResumeMedik` (revisi terbaru) → FHIR `Composition` resume medis (FH7 · koreksi S3/L26).
 *  - `type` per unit: RJ 88645-7 · IGD 97663-9 · RI 34105-7 (bukan 18842-5 untuk semua).
 *  - Section bersarang mengikuti contoh resmi bundle-rawat-inap.json: tiap section MERUJUK resource yang terkirim
 *    di link lain (`entry`); section tanpa resource DIHILANGKAN (bukan teks kosong). Narasi hanya di
 *    "Perjalanan Kunjungan Pasien" (8648-8, `ringkasanKlinis`, XHTML ter-escape FG-63).
 *  - status `final` + `attester` legal (DPJP) bila sudah TTE; `preliminary` bila belum.
 * Composition tidak membawa data baru — docs/fhir-mapping/L26-resume-to-composition.md.
 */

import { FHIR_SYSTEM, orgIdentifierSystem, toFhirDateTime, type FhirResourceBase } from "../fhirShared";
import { COMPOSITION_TYPE, type Coding, type KunjunganUnit } from "../conceptMap";

type Ref = { ihsId: string; nama: string };

/** Section resume yang merujuk resource link lain (L26 §Section → kode → entry). */
export type ResumeSection =
  | "keluhanUtama" | "alergi" | "tandaVital" | "lab" | "rad" | "diagnosis" | "tindakan" | "obat" | "obatPulang"
  | "kondisiPulang" | "rencanaRawat" | "edukasi" | "tindakLanjut";

/**
 * Referensi `"Type/ihsId"` per section — diisi layanan sinkron HANYA untuk resource aktif yang terkirim
 * (bukan entered-in-error). Bundle: `Type/urn:uuid:…` ditulis ulang sink menjadi referensi intra-bundle.
 */
export type SectionRefs = Partial<Record<ResumeSection, string[]>>;

export function addSectionRef(s: SectionRefs, key: ResumeSection, resourceType: string, ihsId: string): void {
  (s[key] ??= []).push(`${resourceType}/${ihsId}`);
}

export function mergeSectionRefs(...all: SectionRefs[]): SectionRefs {
  const out: SectionRefs = {};
  for (const s of all) {
    for (const [k, v] of Object.entries(s) as [ResumeSection, string[]][]) (out[k] ??= []).push(...v);
  }
  return out;
}

export interface LocalResume {
  kunjunganId: string;
  noKunjungan: string;
  unit: KunjunganUnit;
  ringkasanKlinis: string;
  signedAt: Date | null;
  createdAt: Date;
}

const TITLE: Record<KunjunganUnit, string> = {
  IGD: "Resume Medis Gawat Darurat",
  RawatJalan: "Resume Medis Rawat Jalan",
  RawatInap: "Resume Medis Rawat Inap",
};

const kemkes = (code: string, display: string): Coding => ({ system: "http://terminology.kemkes.go.id", code, display });
const loinc = (code: string, display: string): Coding => ({ system: FHIR_SYSTEM.loinc, code, display });

interface SectionDef {
  title: string;
  code?: Coding;
  key?: ResumeSection;
  sub?: SectionDef[];
}

/** Struktur & kode section = contoh resmi RI (judul/display apa adanya). "Diagnosis" induk tanpa kode (sama seperti contoh). */
const STRUKTUR: SectionDef[] = [
  {
    title: "Anamnesis", code: kemkes("TK000003", "Anamnesis"), sub: [
      { title: "Keluhan Utama", code: loinc("10154-3", "Chief complaint Narrative - Reported"), key: "keluhanUtama" },
      { title: "Riwayat Alergi", code: loinc("48765-2", "Allergies and adverse reactions Document"), key: "alergi" },
    ],
  },
  {
    title: "Pemeriksaan Fisik", code: kemkes("TK000007", "Pemeriksaan Fisik"), sub: [
      { title: "Tanda Vital", code: loinc("8716-3", "Vital signs"), key: "tandaVital" },
    ],
  },
  { title: "Perencanaan Perawatan", code: loinc("18776-5", "Plan of treatment (narrative)"), key: "rencanaRawat" },
  {
    title: "Pemeriksaan Penunjang", code: kemkes("TK000009", "Hasil Pemeriksaan Penunjang"), sub: [
      { title: "Hasil Pemeriksaan Laboratorium", code: loinc("11502-2", "Laboratory report"), key: "lab" },
      { title: "Hasil Pemeriksaan Radiologi", code: loinc("18782-3", "Radiology Study observation (narrative)"), key: "rad" },
    ],
  },
  {
    title: "Diagnosis", sub: [
      { title: "Diagnosis Akhir", code: loinc("78375-3", "Discharge diagnosis Narrative"), key: "diagnosis" },
    ],
  },
  { title: "Tindakan/Prosedur Medis", code: kemkes("TK000005", "Tindakan/Prosedur Medis"), key: "tindakan" },
  {
    title: "Farmasi", code: kemkes("TK000013", "Obat"), sub: [
      { title: "Obat Saat Kunjungan", code: loinc("42346-7", "Medications on admission (narrative)"), key: "obat" },
      { title: "Obat Pulang", code: loinc("75311-1", "Discharge medications Narrative"), key: "obatPulang" },
    ],
  },
  { title: "Edukasi", code: loinc("34895-3", "Education note"), key: "edukasi" },
  {
    title: "Kondisi Saat Meninggalkan Rumah Sakit",
    code: loinc("10184-0", "Hospital discharge physical findings Narrative"),
    key: "kondisiPulang",
  },
  { title: "Rencana Tindak Lanjut", code: loinc("8653-8", "Hospital Discharge instructions"), key: "tindakLanjut" },
];

type FhirSection = { title: string; code?: { coding: Coding[] }; entry?: { reference: string }[]; section?: FhirSection[]; text?: unknown };

function buildSection(def: SectionDef, refs: SectionRefs): FhirSection | null {
  const entry = def.key ? [...new Set(refs[def.key] ?? [])].map((reference) => ({ reference })) : [];
  const section = (def.sub ?? []).map((s) => buildSection(s, refs)).filter((s): s is FhirSection => s !== null);
  if (!entry.length && !section.length) return null; // tanpa resource terkirim → dihilangkan
  return {
    title: def.title,
    ...(def.code ? { code: { coding: [def.code] } } : {}),
    ...(entry.length ? { entry } : {}),
    ...(section.length ? { section } : {}),
  };
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const xhtml = (s: string) => `<div xmlns="http://www.w3.org/1999/xhtml">${esc(s).replace(/\n/g, "<br/>")}</div>`;

/** Pohon section (murni) — diekspor untuk test. */
export function compositionSectionsOf(r: Pick<LocalResume, "ringkasanKlinis">, refs: SectionRefs): FhirSection[] {
  const sections = STRUKTUR.map((d) => buildSection(d, refs)).filter((s): s is FhirSection => s !== null);
  const narasi = r.ringkasanKlinis.trim();
  if (narasi) {
    sections.push({
      title: "Perjalanan Kunjungan Pasien",
      code: { coding: [loinc("8648-8", "Hospital course Narrative")] },
      text: { status: "additional", div: xhtml(narasi) },
    });
  }
  return sections;
}

export function toFhirComposition(
  r: LocalResume,
  refs: { orgId: string; patient: Ref; encounter: Ref; author: Ref },
  sectionRefs: SectionRefs,
): FhirResourceBase & Record<string, unknown> {
  return {
    resourceType: "Composition",
    identifier: { system: orgIdentifierSystem("composition", refs.orgId), value: r.noKunjungan },
    status: r.signedAt ? "final" : "preliminary",
    type: { coding: [COMPOSITION_TYPE[r.unit]] },
    category: [{ coding: [loinc("LP173421-1", "Report")] }],
    subject: { reference: `Patient/${refs.patient.ihsId}`, display: refs.patient.nama },
    encounter: { reference: `Encounter/${refs.encounter.ihsId}`, display: refs.encounter.nama },
    date: toFhirDateTime(r.signedAt ?? r.createdAt),
    author: [{ reference: `Practitioner/${refs.author.ihsId}`, display: refs.author.nama }],
    title: TITLE[r.unit],
    ...(r.signedAt ? {
      attester: [{
        mode: "legal",
        time: toFhirDateTime(r.signedAt),
        party: { reference: `Practitioner/${refs.author.ihsId}`, display: refs.author.nama },
      }],
    } : {}),
    custodian: { reference: `Organization/${refs.orgId}` },
    section: compositionSectionsOf(r, sectionRefs),
  };
}
