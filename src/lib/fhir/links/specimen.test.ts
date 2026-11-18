// Test murni S6b — L16 Specimen Lab: urutan SR → Specimen → Observation → DiagnosticReport.
// Bentuk dibandingkan dengan contoh resmi IGD (docs/fhir-postman/bundles/bundle-igd.json, Specimen DK19231961).
import { describe, expect, it } from "vitest";
import { SpesimenSnomedInput } from "@/lib/schemas/master/labTest";
import { toFhirDiagnosticReport, toFhirLabObservation, toFhirSpecimen } from "../adapters/diagnostic";
import { SPESIMEN_SNOMED, spesimenCodingOf } from "../conceptMap";
import { drLabTanpaSpecimen, specimenRencana } from "./specimen";

const refs = { orgId: "org", patient: { ihsId: "P1", nama: "Pasien" }, encounter: { ihsId: "E1" } };
const item = { id: "it1", namaTes: "Darah Lengkap" };
const t = new Date("2026-11-19T02:23:00Z");
const ord = (p: Partial<{ deleted: boolean; status: string; diterimaAt: Date | null; adaHasil: boolean }>) =>
  ({ deleted: false, status: "Diterima", diterimaAt: null, adaHasil: false, ...p });

describe("SPESIMEN_SNOMED (daftar terkurasi)", () => {
  it("kode unik; display Blood/Urine identik contoh resmi IGD/RI; kode asing → null", () => {
    expect(new Set(SPESIMEN_SNOMED.map((s) => s.code)).size).toBe(SPESIMEN_SNOMED.length);
    expect(spesimenCodingOf("119297000")).toEqual({ system: "http://snomed.info/sct", code: "119297000", display: "Blood specimen" });
    expect(spesimenCodingOf(" 122575003 ")?.display).toBe("Urine specimen");
    expect(spesimenCodingOf("999")).toBeNull();
    expect(spesimenCodingOf(null)).toBeNull();
  });

  it("input Katalog Lab: kode daftar diterima, '' → null, kode asing ditolak", () => {
    expect(SpesimenSnomedInput.parse("119364003")).toBe("119364003");
    expect(SpesimenSnomedInput.parse("")).toBeNull();
    expect(SpesimenSnomedInput.parse(undefined)).toBeUndefined();
    expect(SpesimenSnomedInput.safeParse("12345").success).toBe(false);
  });
});

describe("L16 rencana Specimen", () => {
  it("menunggu sampel: belum diterima / dibatalkan / RJ tanpa hasil → belum dikirim (tanpa Issue)", () => {
    expect(specimenRencana(item, ord({ status: "Menunggu" }), "119297000")).toEqual({ kind: "tunggu" });
    expect(specimenRencana(item, ord({ status: "Dibatalkan" }), "119297000")).toEqual({ kind: "tunggu" });
    expect(specimenRencana(item, ord({}), "119297000")).toEqual({ kind: "tunggu" }); // RJ: "Diterima" tanpa aksi Terima
  });

  it("diterima Lab (stamp) atau hasil sudah ada → kirim; tanpa SNOMED → Issue kode-kosong", () => {
    expect(specimenRencana(item, ord({ diterimaAt: t }), "119297000")).toMatchObject({ kind: "kirim", deleted: false, type: { code: "119297000" } });
    expect(specimenRencana(item, ord({ adaHasil: true }), "122575003")).toMatchObject({ kind: "kirim", type: { display: "Urine specimen" } });
    expect(specimenRencana(item, ord({ diterimaAt: t }), null)).toMatchObject({
      kind: "tahan", issue: { link: "L16", resourceType: "Specimen", localId: "it1", code: "kode-kosong" },
    });
  });

  it("order dihapus → tarik (entered-in-error) bila jenis diketahui", () => {
    expect(specimenRencana(item, ord({ deleted: true, diterimaAt: t }), "119297000")).toMatchObject({ kind: "kirim", deleted: true });
    expect(specimenRencana(item, ord({ deleted: true }), null)).toEqual({ kind: "tunggu" });
  });
});

describe("L16 bentuk Specimen & rujukan", () => {
  const blood = spesimenCodingOf("119297000")!;

  it("Specimen = contoh resmi IGD: identifier+assigner · available · type · subject · request SR · receivedTime · ReceivedPerson", () => {
    const res = toFhirSpecimen("it1", blood, refs, {
      serviceRequestIhsId: "SR1", deleted: false, receivedTime: t, receivedBy: { ihsId: "PR9", nama: "Analis A" },
    });
    expect(res).toEqual({
      resourceType: "Specimen",
      identifier: [{ system: "http://sys-ids.kemkes.go.id/specimen/org", value: "it1", assigner: { reference: "Organization/org" } }],
      status: "available",
      type: { coding: [{ system: "http://snomed.info/sct", code: "119297000", display: "Blood specimen" }] },
      subject: { reference: "Patient/P1", display: "Pasien" },
      request: [{ reference: "ServiceRequest/SR1" }],
      receivedTime: "2026-11-19T02:23:00+00:00",
      extension: [{
        url: "https://fhir.kemkes.go.id/r4/StructureDefinition/ReceivedPerson",
        valueReference: { reference: "Practitioner/PR9", display: "Analis A" },
      }],
    });
    expect(res).not.toHaveProperty("collection"); // pengambilan sampel di luar aplikasi (FG-143)
    const tarik = toFhirSpecimen("it1", blood, refs, { serviceRequestIhsId: "SR1", deleted: true });
    expect(tarik).toMatchObject({ status: "entered-in-error" });
    expect(tarik).not.toHaveProperty("receivedTime");
    expect(tarik).not.toHaveProperty("extension");
  });

  it("Observation.specimen & DiagnosticReport.specimen merujuk Specimen; DR rad tanpa specimen", () => {
    const loinc = { code: "718-7", display: "Hemoglobin [Mass/volume] in Blood" };
    const obs = toFhirLabObservation(
      { nilai: "13.5", satuan: "g/dL", rujukanStr: "12-16", flag: "N", numerik: true },
      loinc, refs, { serviceRequestIhsId: "SR1", issued: t, specimenIhsId: "SP1" },
    );
    expect(obs.specimen).toEqual({ reference: "Specimen/SP1" });
    const dr = toFhirDiagnosticReport("lab", "it1", { code: "58410-2", display: "CBC panel" }, refs, {
      deleted: false, issued: t, observationIhsIds: ["O1"], serviceRequestIhsIds: ["SR1"], specimenIhsIds: ["SP1"],
    });
    expect(dr.specimen).toEqual([{ reference: "Specimen/SP1" }]);
    const rad = toFhirDiagnosticReport("rad", "r1", { code: "24648-8", display: "XR Chest PA" }, refs, {
      deleted: false, issued: t, observationIhsIds: [], serviceRequestIhsIds: ["SR2"],
    });
    expect(rad).not.toHaveProperty("specimen");
    expect(drLabTanpaSpecimen(item)).toMatchObject({ link: "L16", resourceType: "DiagnosticReport", localId: "it1" });
  });
});
