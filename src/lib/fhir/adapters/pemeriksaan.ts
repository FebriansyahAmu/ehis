/**
 * Adapter pemeriksaan → Observation (fase B2): L09 kesadaran (`exam` 67775-7) · L10 head-to-toe (`exam` valueString) · L11 nyeri (`survey` induk "Pain"
 * 22253000 + `hasMember` skala) · L12 skala risiko (`exam`, skor + interpretation clinical-term).
 * Fungsi murni; kode dari conceptMap / skalaPemetaan (verbatim playbook IGD v5.2 §5).
 * Contoh resmi: docs/fhir-postman/bundles/bundle-igd.json (67775-7, 59461-4).
 */

import { toFhirDateTime, type FhirResourceBase } from "../fhirShared";
import { KESADARAN_CODE, NYERI_CODE, OBSERVATION_CATEGORY, type Coding } from "../conceptMap";
import { pitaOf, type SkalaFhirDef } from "../links/skalaPemetaan";
import type { ClinicalRefs } from "./clinical";

type FhirRes = FhirResourceBase & Record<string, unknown>;
type Ref = { ihsId: string; nama: string };

export interface ObsCtx {
  refs: ClinicalRefs;
  /** Waktu klinis pemeriksaan (bukan waktu kirim) → effectiveDateTime & issued. */
  waktu: Date;
  performer?: Ref;
}

function obs(category: Coding, code: Coding, c: ObsCtx, value: Record<string, unknown>): FhirRes {
  const when = toFhirDateTime(c.waktu);
  return {
    resourceType: "Observation",
    status: "final",
    category: [{ coding: [category] }],
    code: { coding: [code] },
    subject: { reference: `Patient/${c.refs.patient.ihsId}`, display: c.refs.patient.nama },
    encounter: { reference: `Encounter/${c.refs.encounter.ihsId}`, display: c.refs.encounter.display },
    effectiveDateTime: when,
    issued: when,
    ...(c.performer ? { performer: [{ reference: `Practitioner/${c.performer.ihsId}` }] } : {}),
    ...value,
  };
}

const skor = (value: number) => ({ value, unit: "{score}", system: "http://unitsofmeasure.org", code: "{score}" });

/** L09 — tingkat kesadaran (category `exam`, sesuai tabel playbook; contoh RJ yang memakai vital-signs tidak diikuti). */
export function toFhirKesadaran(value: Coding, c: ObsCtx): FhirRes {
  return obs(OBSERVATION_CATEGORY.exam, KESADARAN_CODE, c, { valueCodeableConcept: { coding: [value] } });
}

/**
 * L10 — temuan head-to-toe per bagian tubuh (`exam` + LOINC "Physical findings of … Narrative" + `valueString`,
 * pola contoh resmi RI). Dihapus dari pemeriksaan terbaru → status entered-in-error.
 */
export function toFhirPemeriksaanFisik(code: Coding, teks: string, c: ObsCtx, deleted = false): FhirRes {
  return { ...obs(OBSERVATION_CATEGORY.exam, code, c, { valueString: teks }), ...(deleted ? { status: "entered-in-error" } : {}) };
}

/** L11 — anggota skor NRS 0–10 (`valueInteger`). */
export function toFhirNyeriNrs(nilai: number, c: ObsCtx): FhirRes {
  return obs(OBSERVATION_CATEGORY.survey, NYERI_CODE.nrs, c, { valueInteger: nilai });
}

/**
 * L11 — induk asesmen nyeri: `valueBoolean` = ada nyeri (skor > 0) + `hasMember` → Observation skala.
 * `memberIhsId` = id hasil kirim anggota (mode bundle: `urn:uuid:…` sementara, ditulis ulang sink).
 */
export function toFhirNyeriInduk(adaNyeri: boolean, memberIhsId: string, c: ObsCtx): FhirRes {
  return obs(OBSERVATION_CATEGORY.survey, NYERI_CODE.pain, c, {
    valueBoolean: adaNyeri,
    hasMember: [{ reference: `Observation/${memberIhsId}` }],
  });
}

/**
 * L11/L12 — skor instrumen terpetakan (Morse/Humpty Dumpty/Edmonson = `valueQuantity {score}` + interpretation ·
 * Wong-Baker = `valueInteger`). Interpretasi dihitung dari skor dengan pita playbook, BUKAN dari label lokal.
 */
export function toFhirSkalaSkor(def: Extract<SkalaFhirDef, { aksi: "kirim" }>, nilai: number, c: ObsCtx): FhirRes {
  const p = pitaOf(def, nilai);
  return obs(OBSERVATION_CATEGORY[def.category], def.code, c, {
    ...(def.nilai === "quantity" ? { valueQuantity: skor(nilai) } : { valueInteger: nilai }),
    ...(p ? { interpretation: [{ coding: [p.coding], text: p.text }] } : {}),
  });
}
