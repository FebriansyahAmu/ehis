// Test murni S6a — L17 ACSN radiologi · L27 riwayat perjalanan penyakit (ClinicalImpression) · perapian L13.
// Bentuk dibandingkan dengan bundle resmi docs/fhir-postman/bundles (RJ/IGD/RI).
import { describe, expect, it } from "vitest";
import { acsnScope, formatAcsn, isAcsnValid } from "@/lib/services/rad/acsn";
import { toFhirServiceRequest } from "../adapters/diagnostic";
import { toFhirRiwayatPerjalanan } from "../adapters/anamnesis";
import { toFhirCondition, toFhirDiagnosaMasuk } from "../adapters/clinical";
import { toFhirEncounter, type LocalEncounter } from "../adapters/encounter";
import { compositionSectionsOf } from "../adapters/composition";
import { dicomModalityOf } from "../conceptMap";
import { radSrSiap } from "./radiologi";
import { riwayatPerjalananRencana } from "./riwayatPerjalanan";
import { diagnosaMasukOf, diagnosaSiap, indeksIcd10 } from "./diagnosa";
import { LINK_BY_ID } from "./registry";

const refs = { orgId: "org", patient: { ihsId: "P1", nama: "Pasien" }, encounter: { ihsId: "E1", display: "Kunjungan" } };
const t = new Date("2026-11-18T02:00:00Z");

describe("L17 ACSN", () => {
  it("scope = tanggal WIB (UTC+7), urutan ≥4 digit, maks 16 karakter", () => {
    expect(acsnScope(new Date("2026-11-17T17:30:00Z"))).toBe("R261118"); // 00:30 WIB 18 Nov
    expect(acsnScope(new Date("2026-11-17T16:59:00Z"))).toBe("R261117"); // 23:59 WIB 17 Nov
    expect(formatAcsn("R261118", 7)).toBe("R2611180007");
    expect(formatAcsn("R261118", 12345)).toBe("R26111812345");
    expect(() => formatAcsn("R261118", 0)).toThrow(RangeError);
    expect(isAcsnValid("R2611180007")).toBe(true);
    expect(isAcsnValid("R26111800070000000")).toBe(false); // > 16
    expect(isAcsnValid("P20240001XY")).toBe(false); // bukan pola EHIS
    expect(isAcsnValid(null)).toBe(false);
  });

  it("gerbang SR rad: tanpa ACSN → kode-kosong · format salah → kode-tidak-valid · modality DICOM", () => {
    expect(radSrSiap({ id: "i1", nama: "USG", acsn: null, modalitas: "US" })).toMatchObject({ ok: false, issue: { link: "L17", code: "kode-kosong" } });
    expect(radSrSiap({ id: "i1", nama: "USG", acsn: "X1", modalitas: "US" })).toMatchObject({ ok: false, issue: { code: "kode-tidak-valid" } });
    expect(radSrSiap({ id: "i1", nama: "Foto", acsn: "R2611180001", modalitas: "XR" })).toEqual({ ok: true, acsn: "R2611180001", modality: "DX" });
    expect(dicomModalityOf("CT.angio")).toBe("CT");
    expect(dicomModalityOf("DXA")).toBeNull(); // BMD di luar playbook → orderDetail dilewati
    expect(dicomModalityOf("??")).toBeNull();
  });

  it("ServiceRequest rad: identifier[1] ACSN + orderDetail DCM seperti contoh resmi; lab tanpa keduanya", () => {
    const order = { id: "O1", prioritas: "CITO", status: "Diterima", catatan: null, createdAt: t, deleted: false };
    const loinc = { code: "24648-8", display: "XR Chest PA upright" };
    const rad = toFhirServiceRequest("rad", order, { id: "i1", nama: "Foto Thorax" }, loinc, refs, { acsn: "R2611180001", modality: "DX" });
    expect(rad.identifier).toEqual([
      { system: "http://sys-ids.kemkes.go.id/servicerequest/org", value: "i1" },
      {
        use: "usual",
        type: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/v2-0203", code: "ACSN" }] },
        system: "http://sys-ids.kemkes.go.id/acsn/org",
        value: "R2611180001",
      },
    ]);
    expect(rad.orderDetail).toEqual([{ coding: [{ system: "http://dicom.nema.org/resources/ontology/DCM", code: "DX" }], text: "Modality Code: DX" }]);
    const lab = toFhirServiceRequest("lab", order, { id: "i2", nama: "DL" }, { code: "58410-2", display: "CBC panel" }, refs, {});
    expect(lab.identifier).toHaveLength(1);
    expect(lab).not.toHaveProperty("orderDetail");
  });
});

describe("L27 riwayat perjalanan penyakit → ClinicalImpression", () => {
  const row = (rps: string | null) => ({ rps, authorPegawaiId: "PG1", createdAt: t });

  it("rencana: tanpa anamnesis kosong · narasi → kirim · kosong/'-' → tarik (latest wins, 1 per kunjungan)", () => {
    expect(riwayatPerjalananRencana("K1", null)).toEqual({ kirim: [], tarik: [], issues: [] });
    expect(riwayatPerjalananRencana("K1", row("  Demam 3 hari, batuk.  ")).kirim).toEqual([
      { localId: "K1:riwayat-perjalanan", summary: "Demam 3 hari, batuk.", waktu: t, authorPegawaiId: "PG1" },
    ]);
    const kosong = riwayatPerjalananRencana("K1", row(" - "));
    expect(kosong.kirim).toEqual([]);
    expect(kosong.tarik.map((i) => i.localId)).toEqual(["K1:riwayat-perjalanan"]);
  });

  it("bentuk = contoh resmi RI (312850006, completed, summary; tanpa identifier/investigation/prognosis)", () => {
    const res = toFhirRiwayatPerjalanan({ summary: "Demam 3 hari", waktu: t, deleted: false }, refs, { ihsId: "PR1", nama: "dr. A" });
    expect(res).toMatchObject({
      resourceType: "ClinicalImpression",
      status: "completed",
      code: { coding: [{ system: "http://snomed.info/sct", code: "312850006", display: "History of disorder" }] },
      subject: { reference: "Patient/P1" },
      encounter: { reference: "Encounter/E1" },
      effectiveDateTime: "2026-11-18T02:00:00+00:00",
      date: "2026-11-18T02:00:00+00:00",
      assessor: { reference: "Practitioner/PR1" },
      summary: "Demam 3 hari",
    });
    for (const k of ["identifier", "investigation", "prognosisCodeableConcept"]) expect(res).not.toHaveProperty(k);
    expect(toFhirRiwayatPerjalanan({ summary: "", waktu: t, deleted: true }, refs)).toMatchObject({ status: "entered-in-error" });
  });

  it("Composition: section Perencanaan Perawatan (contoh RI) · registry L27 aktif", () => {
    const secs = compositionSectionsOf({ ringkasanKlinis: "" }, { rencanaRawat: ["ClinicalImpression/CI1"] });
    expect(secs.find((s) => s.title === "Perencanaan Perawatan")?.entry).toEqual([{ reference: "ClinicalImpression/CI1" }]);
    expect(LINK_BY_ID.L27).toMatchObject({ status: "aktif", resourceTypes: ["ClinicalImpression"] });
  });
});

describe("L13 perapian", () => {
  const icd = indeksIcd10([{ kode: "a15.0", display: "Tb lung confirm sputum microscopy with or without culture" }, { kode: "I10", display: "Essential (primary) hypertension" }]);

  it("display dari master ICD-10; kode di luar master ditahan; tanpa kode ditahan", () => {
    expect(diagnosaSiap({ id: "d1", kodeIcd10: " a15.0 ", namaDiagnosis: "TB paru BTA+" }, icd))
      .toEqual({ ok: true, kode: "A15.0", display: "Tb lung confirm sputum microscopy with or without culture" });
    expect(diagnosaSiap({ id: "d2", kodeIcd10: "Z99.99", namaDiagnosis: "X" }, icd)).toMatchObject({ ok: false, issue: { link: "L13", code: "kode-tidak-valid" } });
    expect(diagnosaSiap({ id: "d3", kodeIcd10: "", namaDiagnosis: "X" }, icd)).toMatchObject({ ok: false, issue: { code: "kode-kosong" } });
  });

  it("Condition: coding.display = master, nama lokal → code.text hanya bila berbeda", () => {
    const base = { kodeIcd10: "a15.0", status: "Pasti", deleted: false, createdAt: t, display: "Tb lung confirm sputum microscopy with or without culture" };
    const beda = toFhirCondition({ ...base, namaDiagnosis: "TB paru BTA+" }, refs);
    expect(beda.code).toEqual({
      coding: [{ system: "http://hl7.org/fhir/sid/icd-10", code: "A15.0", display: "Tb lung confirm sputum microscopy with or without culture" }],
      text: "TB paru BTA+",
    });
    const sama = toFhirCondition({ ...base, namaDiagnosis: base.display }, refs);
    expect(sama.code).not.toHaveProperty("text");
  });

  it("diagnosa masuk: null bila kosong · di luar master ditahan · bentuk = contoh resmi IGD (tanpa verificationStatus)", () => {
    expect(diagnosaMasukOf("K1", null, icd, t)).toBeNull();
    expect(diagnosaMasukOf("K1", "Q99", icd, t)).toMatchObject({ ok: false, issue: { localId: "K1:diagnosa-masuk", code: "kode-tidak-valid" } });
    const m = diagnosaMasukOf("K1", "i10", icd, t);
    expect(m).toEqual({ ok: true, item: { localId: "K1:diagnosa-masuk", kode: "I10", display: "Essential (primary) hypertension", waktu: t } });
    if (!m?.ok) throw new Error("diagnosa masuk seharusnya siap");
    const res = toFhirDiagnosaMasuk(m.item, refs);
    expect(res).toMatchObject({
      resourceType: "Condition",
      clinicalStatus: { coding: [{ code: "active" }] },
      category: [{ coding: [{ code: "encounter-diagnosis" }] }],
      code: { coding: [{ code: "I10", display: "Essential (primary) hypertension" }] },
      onsetDateTime: "2026-11-18T02:00:00+00:00",
      recordedDate: "2026-11-18T02:00:00+00:00",
    });
    expect(res).not.toHaveProperty("verificationStatus");
  });

  it("Encounter finished: diagnosis DD (rank) + AD + CC (tanpa rank)", () => {
    const local: LocalEncounter = {
      noKunjungan: "IGD-1", unit: "IGD", status: "Completed",
      waktuKunjungan: new Date("2026-01-01T00:00:00Z"), dilayaniAt: new Date("2026-01-01T00:20:00Z"),
      selesaiAt: new Date("2026-01-01T04:00:00Z"), kelas: null, kelasHak: null, titipan: false,
      disposisi: { jenis: "Pulang", rujukTujuan: null, instruksi: "", waktuKeluar: new Date("2026-01-01T04:00:00Z") },
    };
    const e = toFhirEncounter(local, {
      orgId: "org", patient: { ihsId: "P1", nama: "Pasien" },
      diagnoses: [{ ihsId: "C1", display: "I21.9 AMI", rank: 1 }],
      admissionDiagnosis: { ihsId: "C2", display: "I10 Essential (primary) hypertension" },
      chiefComplaint: { ihsId: "C0", display: "Chest pain" },
    }, "finished") as unknown as { diagnosis: { use: { coding: { code: string; display: string }[] }; rank?: number }[] };
    expect(e.diagnosis.map((d) => [d.use.coding[0].code, d.rank])).toEqual([["DD", 1], ["AD", undefined], ["CC", undefined]]);
    expect(e.diagnosis[1].use.coding[0].display).toBe("Admission diagnosis");
  });
});
