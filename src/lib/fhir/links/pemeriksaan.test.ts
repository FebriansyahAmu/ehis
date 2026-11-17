// Test murni link pemeriksaan S4 (docs/fhir-mapping L09 · L11 · L12) — kode verbatim playbook IGD v5.2 §5.
import { describe, expect, it } from "vitest";
import { SkalaFhirKeyEnum } from "@/lib/schemas/master/skalaRisiko";
import { toFhirKesadaran, toFhirNyeriInduk, toFhirNyeriNrs, toFhirSkalaSkor } from "../adapters/pemeriksaan";
import { KESADARAN_TTV } from "../conceptMap";
import { kesadaranAvpuOf, kesadaranTtvOf, nrsOf, pemeriksaanLocalId } from "./pemeriksaan";
import { LINK_BY_ID } from "./registry";
import { SKALA_FHIR, SKALA_FHIR_KEYS, pitaOf, skalaRencanaOf } from "./skalaPemetaan";

const refs = { orgId: "org", patient: { ihsId: "P1", nama: "Pasien" }, encounter: { ihsId: "E1", display: "Kunjungan" } };
const c = { refs, waktu: new Date("2026-01-01T00:00:00Z"), performer: { ihsId: "N1", nama: "Ners" } };
const kirim = (k: keyof typeof SKALA_FHIR) => {
  const d = SKALA_FHIR[k];
  if (d.aksi !== "kirim") throw new Error(`${k} bukan kirim`);
  return d;
};

describe("L09 kesadaran", () => {
  it("AVPU triase → SNOMED padanan langsung", () => {
    expect(kesadaranAvpuOf({ id: "T1", avpu: "Pain" })).toMatchObject({ ok: true, coding: { code: "450847001", display: "Response to pain" } });
    expect(kesadaranAvpuOf({ id: "T1", avpu: "Ngantuk" })).toMatchObject({ ok: false, issue: { link: "L09", code: "kode-tidak-valid", localId: "T1:avpu" } });
  });
  it("TTV: Apatis ditahan (D3), nilai asing = tidak valid", () => {
    expect(kesadaranTtvOf({ id: "O1", statusKesadaran: "Compos_Mentis" })).toMatchObject({ ok: true, coding: { code: "248234008" } });
    expect(kesadaranTtvOf({ id: "O1", statusKesadaran: "Apatis" })).toMatchObject({ ok: false, issue: { code: "menunggu-keputusan", localId: "O1:kesadaran" } });
    expect(kesadaranTtvOf({ id: "O1", statusKesadaran: "Bingung" })).toMatchObject({ ok: false, issue: { code: "kode-tidak-valid" } });
    expect(Object.keys(KESADARAN_TTV)).toHaveLength(5);
  });
  it("Observation exam 67775-7 (bukan vital-signs)", () => {
    const r = toFhirKesadaran({ system: "http://snomed.info/sct", code: "248234008", display: "Mentally alert" }, c);
    expect(r).toMatchObject({
      category: [{ coding: [{ code: "exam" }] }],
      code: { coding: [{ system: "http://loinc.org", code: "67775-7" }] },
      valueCodeableConcept: { coding: [{ code: "248234008" }] },
      performer: [{ reference: "Practitioner/N1" }],
      effectiveDateTime: "2026-01-01T00:00:00+00:00",
    });
  });
});

describe("L11 nyeri", () => {
  it("NRS 0–10 bulat; 0 = tidak nyeri (sah)", () => {
    expect([nrsOf(0), nrsOf(10), nrsOf(11), nrsOf(-1), nrsOf(2.5), nrsOf(null)]).toEqual([0, 10, null, null, null, null]);
  });
  it("induk Pain survey valueBoolean + hasMember; anggota NRS valueInteger", () => {
    expect(toFhirNyeriNrs(0, c)).toMatchObject({ category: [{ coding: [{ code: "survey" }] }], code: { coding: [{ code: "1172399009" }] }, valueInteger: 0 });
    const induk = toFhirNyeriInduk(true, "urn:uuid:x", c);
    expect(induk).toMatchObject({ code: { coding: [{ code: "22253000", display: "Pain" }] }, valueBoolean: true, hasMember: [{ reference: "Observation/urn:uuid:x" }] });
  });
  it("localId induk BUKAN `:pain` (milik Observation lama salah kamar, FG-100)", () => {
    expect(pemeriksaanLocalId.nyeri("O1")).toBe("O1:nyeri");
    expect(pemeriksaanLocalId.nyeriNrs("O1")).toBe("O1:nyeri-nrs");
  });
  it("Wong-Baker: survey 38221-8 valueInteger, tanpa interpretation (batas skor tak tertulis)", () => {
    const r = toFhirSkalaSkor(kirim("wong-baker"), 6, c);
    expect(r).toMatchObject({ category: [{ coding: [{ code: "survey" }] }], code: { coding: [{ code: "38221-8" }] }, valueInteger: 6 });
    expect(r).not.toHaveProperty("interpretation");
  });
});

describe("L12 skala risiko", () => {
  it("Morse 30 = contoh resmi IGD (valueQuantity {score} + OI000027)", () => {
    const r = toFhirSkalaSkor(kirim("morse"), 30, c);
    expect(r).toMatchObject({
      category: [{ coding: [{ code: "exam" }] }],
      code: { coding: [{ system: "http://loinc.org", code: "59461-4", display: "Fall risk level [Morse Fall Scale]" }] },
      valueQuantity: { value: 30, unit: "{score}", system: "http://unitsofmeasure.org", code: "{score}" },
      interpretation: [{ coding: [{ system: "http://terminology.kemkes.go.id/CodeSystem/clinical-term", code: "OI000027", display: "25 - 44 (Risiko sedang)" }], text: "Risiko sedang" }],
    });
  });
  it("pita interpretasi dari skor, batas inklusif; celah playbook = tanpa interpretation", () => {
    expect([24, 25, 44, 45].map((s) => pitaOf(kirim("morse"), s)?.coding.code)).toEqual(["OI000026", "OI000027", "OI000027", "OI000028"]);
    expect([7, 11, 12, 13].map((s) => pitaOf(kirim("humpty-dumpty"), s)?.coding.code)).toEqual(["OI000021", "OI000021", undefined, "OI000022"]);
    expect(toFhirSkalaSkor(kirim("humpty-dumpty"), 12, c)).not.toHaveProperty("interpretation");
    expect(pitaOf(kirim("edmonson"), 90)).toBeUndefined();
  });
  it("pita tiap instrumen tidak tumpang-tindih", () => {
    for (const k of SKALA_FHIR_KEYS) {
      const d = SKALA_FHIR[k];
      if (d.aksi !== "kirim") continue;
      for (let i = 1; i < d.pita.length; i++) expect(d.pita[i].min).toBeGreaterThan(d.pita[i - 1].max);
    }
  });
  it("rencana per pemetaan master: belum dipetakan / di luar playbook / menunggu keputusan / lewati", () => {
    const row = { id: "S1", skalaNama: "Skala X" };
    expect(skalaRencanaOf(null, row)).toMatchObject({ aksi: "tahan", issue: { link: "L12", code: "kode-kosong", localId: "S1" } });
    expect(skalaRencanaOf("ngawur", row)).toMatchObject({ aksi: "tahan", issue: { code: "kode-kosong" } });
    expect(skalaRencanaOf("barthel", row)).toMatchObject({ aksi: "tahan", issue: { link: "L12", code: "di-luar-playbook" } });
    expect(skalaRencanaOf("braden", row)).toMatchObject({ aksi: "tahan", issue: { code: "menunggu-keputusan" } });
    expect(skalaRencanaOf("flacc", row)).toMatchObject({ aksi: "tahan", issue: { link: "L11" } });
    expect(skalaRencanaOf("nrs", row)).toEqual({ aksi: "lewati" });
    expect(skalaRencanaOf("morse", row)).toMatchObject({ aksi: "kirim", def: { link: "L12" } });
  });
  it("Zod master menerima tepat kunci registry", () => {
    expect(SkalaFhirKeyEnum.options).toEqual([...SKALA_FHIR_KEYS]);
  });
});

describe("registry S4 pemeriksaan", () => {
  it("L09 · L11 · L12 aktif", () => {
    expect(["L09", "L11", "L12"].map((id) => LINK_BY_ID[id as "L09"].status)).toEqual(["aktif", "aktif", "aktif"]);
  });
});
