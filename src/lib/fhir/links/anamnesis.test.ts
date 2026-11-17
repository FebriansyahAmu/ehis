// Test murni link anamnesis & fisik S4d (docs/fhir-mapping L04 · L05 · L10) — kode verbatim playbook + contoh resmi RI.
import { describe, expect, it } from "vitest";
import type { SistemFisikKey } from "@/lib/data";
import { indeksKode, kodeSejajar } from "@/lib/services/asesmenMedis/katalogKode";
import { toFhirRiwayatKeluarga, toFhirRiwayatPenyakit } from "../adapters/anamnesis";
import { compositionSectionsOf } from "../adapters/composition";
import { toFhirPemeriksaanFisik } from "../adapters/pemeriksaan";
import { PEMERIKSAAN_FISIK, type SistemFisikLokal } from "../conceptMap";
import {
  indeksKatalog, pemeriksaanFisikRencana, riwayatKeluargaRencana, riwayatPenyakitRencana, teksSistem,
} from "./anamnesis";
import { LINK_BY_ID } from "./registry";

const refs = { orgId: "org", patient: { ihsId: "P1", nama: "Pasien" }, encounter: { ihsId: "E1", display: "Kunjungan" } };
const K = "K1";
const t1 = new Date("2026-01-01T03:00:00Z");
const t2 = new Date("2026-01-02T03:00:00Z");
const katalog = indeksKatalog([
  { kode: "PD-001", snomedCode: "161501007", snomedDisplay: "H/O: hypertension" },
  { kode: "PD-006", snomedCode: "161527007", snomedDisplay: "H/O: asthma" },
  { kode: "PD-007", snomedCode: null, snomedDisplay: null },
  { kode: "PK-001", snomedCode: "160357008", snomedDisplay: "FH: Hypertension" },
  { kode: "PK-007", snomedCode: "160377001", snomedDisplay: "FH: Asthma" },
  { kode: "PK-005", snomedCode: null, snomedDisplay: null },
]);

// Kunci sistem conceptMap = kunci form EHIS (dua arah, dicek tsc).
const keFormulir: Record<SistemFisikKey, unknown> = PEMERIKSAAN_FISIK;
const dariFormulir: Record<SistemFisikLokal, unknown> = {} as Record<SistemFisikKey, unknown>;

describe("D7 — kode katalog diturunkan server dari nama", () => {
  it("cocok nama (trim, case-insensitive) di kategori; tak ada → ''; nama kembar → item tertua", () => {
    const idx = indeksKode([{ kode: "PD-001", nama: "Hipertensi" }, { kode: "PD-099", nama: "hipertensi " }, { kode: "PD-007", nama: "PPOK" }]);
    expect(kodeSejajar([" Hipertensi", "Gagal Jantung", "ppok"], idx)).toEqual(["PD-001", "", "PD-007"]);
  });
});

describe("L04 riwayat penyakit pribadi → Condition previous-condition", () => {
  const row = (penyakit: string[], penyakitKode: string[], createdAt = t1) =>
    ({ penyakit, penyakitKode, catatan: "Sejak 2020", authorPegawaiId: "PG1", createdAt });

  it("baris terbaru berlaku: berkode SNOMED → kirim; tanpa SNOMED / tak di katalog → Issue kode-kosong", () => {
    const r = riwayatPenyakitRencana(K, [row(["Hipertensi", "PPOK", "Gagal Jantung", "Hipertensi"], ["PD-001", "PD-007", "", "PD-001"])], katalog);
    expect(r.kirim.map((i) => [i.localId, i.coding.code])).toEqual([["K1:riwayat-penyakit:PD-001", "161501007"]]);
    expect(r.issues.map((i) => [i.link, i.code, i.localId])).toEqual([
      ["L04", "kode-kosong", "K1:riwayat-penyakit:PD-007"],
      ["L04", "kode-kosong", "K1:riwayat-penyakit:nama:Gagal Jantung"],
    ]);
    expect(r.tarik).toEqual([]);
  });

  it("penyakit yang dihapus di simpanan terbaru → tarik (data baris lama)", () => {
    const r = riwayatPenyakitRencana(K, [row(["Hipertensi", "Asma Bronkial"], ["PD-001", "PD-006"]), row(["Hipertensi"], ["PD-001"], t2)], katalog);
    expect(r.kirim.map((i) => [i.localId, i.recordedAt])).toEqual([["K1:riwayat-penyakit:PD-001", t2]]);
    expect(r.tarik.map((i) => [i.localId, i.coding.code, i.recordedAt])).toEqual([["K1:riwayat-penyakit:PD-006", "161527007", t1]]);
  });

  it("bentuk = contoh resmi RI (category Kemkes, SNOMED, recorder, note); tanpa clinicalStatus (tak dicatat)", () => {
    const [p] = riwayatPenyakitRencana(K, [row(["Asma Bronkial"], ["PD-006"])], katalog).kirim;
    const res = toFhirRiwayatPenyakit({ ...p, deleted: false }, refs, { ihsId: "D1", nama: "dr. A" });
    expect(res).toMatchObject({
      resourceType: "Condition",
      category: [{ coding: [{ system: "http://terminology.kemkes.go.id", code: "previous-condition", display: "Previous Condition" }] }],
      code: { coding: [{ system: "http://snomed.info/sct", code: "161527007", display: "H/O: asthma" }] },
      subject: { reference: "Patient/P1" },
      encounter: { reference: "Encounter/E1" },
      recorder: { reference: "Practitioner/D1" },
      note: [{ text: "Sejak 2020" }],
    });
    expect(res).not.toHaveProperty("clinicalStatus");
    expect(res).not.toHaveProperty("verificationStatus");
    expect(toFhirRiwayatPenyakit({ ...p, deleted: true }, refs)).toMatchObject({ verificationStatus: { coding: [{ code: "entered-in-error" }] } });
  });

  it("tanpa baris → kosong", () => {
    expect(riwayatPenyakitRencana(K, [], katalog)).toEqual({ kirim: [], tarik: [], issues: [] });
  });
});

describe("L05 riwayat penyakit keluarga → FamilyMemberHistory", () => {
  const item = (anggota: string, anggotaKode: string | null, penyakit: string[], penyakitKode: string[], keterangan: string | null = null) =>
    ({ anggota, anggotaKode, penyakit, penyakitKode, keterangan });

  it("1 FMH per anggota (gabung duplikat) · kondisi tanpa SNOMED = Issue · anggota tanpa kondisi berkode tak dikirim", () => {
    const r = riwayatKeluargaRencana(K, [{ createdAt: t1, items: [
      item("Ibu", "AK-002", ["Hipertensi"], ["PK-001"], "Sejak muda"),
      item("Ibu", "AK-002", ["Asma", "Kanker"], ["PK-007", "PK-005"]),
      item("Paman", null, ["Kanker"], ["PK-005"]),
    ] }], katalog);
    expect(r.kirim).toHaveLength(1);
    expect(r.kirim[0]).toMatchObject({ localId: "K1:riwayat-keluarga:AK-002", anggota: "Ibu", keterangan: "Sejak muda" });
    expect(r.kirim[0].kondisi.map((c) => c.code)).toEqual(["160357008", "160377001"]);
    expect(r.issues.map((i) => i.localId)).toEqual(["K1:riwayat-keluarga:AK-002:PK-005", "K1:riwayat-keluarga:nama-paman:PK-005"]);
  });

  it("anggota hilang di simpanan terbaru → tarik", () => {
    const r = riwayatKeluargaRencana(K, [
      { createdAt: t1, items: [item("Ayah", "AK-001", ["Asma"], ["PK-007"]), item("Ibu", "AK-002", ["Hipertensi"], ["PK-001"])] },
      { createdAt: t2, items: [item("Ibu", "AK-002", ["Hipertensi"], ["PK-001"])] },
    ], katalog);
    expect(r.kirim.map((i) => i.localId)).toEqual(["K1:riwayat-keluarga:AK-002"]);
    expect(r.tarik.map((i) => [i.localId, i.date])).toEqual([["K1:riwayat-keluarga:AK-001", t1]]);
  });

  it("bentuk = tabel playbook (FAMMEMB) + contoh resmi RI (completed, tanpa encounter)", () => {
    const res = toFhirRiwayatKeluarga({ anggota: "Ibu", kondisi: [katalog.get("PK-001")!].map((k) => ({ system: "http://snomed.info/sct", code: k.snomedCode!, display: k.snomedDisplay! })), keterangan: null, date: t1, deleted: false }, refs);
    expect(res).toMatchObject({
      resourceType: "FamilyMemberHistory",
      status: "completed",
      patient: { reference: "Patient/P1" },
      relationship: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/v3-RoleCode", code: "FAMMEMB", display: "Family member" }], text: "Ibu" },
      condition: [{ code: { coding: [{ system: "http://snomed.info/sct", code: "160357008" }] } }],
    });
    expect(res).not.toHaveProperty("encounter");
    expect(toFhirRiwayatKeluarga({ anggota: "Ibu", kondisi: [], keterangan: null, date: t1, deleted: true }, refs)).toMatchObject({ status: "entered-in-error" });
  });
});

describe("L10 pemeriksaan fisik head-to-toe → Observation exam", () => {
  it("5 sistem padan = LOINC verbatim playbook; 6 lainnya ditahan (D12)", () => {
    const kirim = (Object.entries(PEMERIKSAAN_FISIK) as [SistemFisikLokal, { code: string } | null][]).filter(([, c]) => c).map(([s, c]) => [s, c!.code]);
    expect(kirim).toEqual([["kepala", "10199-8"], ["mata", "10197-2"], ["leher", "11411-6"], ["toraks_paru", "11391-0"], ["abdomen", "10191-5"]]);
    expect(Object.keys(keFormulir)).toHaveLength(11);
    expect(dariFormulir).toBeDefined();
  });

  it("baris terbaru: teks kosong dilewati · sistem tanpa kamar = Issue (menunggu-keputusan / di-luar-playbook)", () => {
    const r = pemeriksaanFisikRencana(K, [{ sistem: { kepala: " Normocephali ", tht: "Hidung simetris", jantung: "S1 S2 reguler", leher: "", x: 1 }, waktuPemeriksaan: t1, authorPegawaiId: "PG1" }]);
    expect(r.kirim.map((i) => [i.localId, i.teks])).toEqual([["K1:pemeriksaan-fisik:kepala", "Normocephali"]]);
    expect(r.issues.map((i) => [i.localId, i.code])).toEqual([
      ["K1:pemeriksaan-fisik:tht", "menunggu-keputusan"],
      ["K1:pemeriksaan-fisik:jantung", "di-luar-playbook"],
    ]);
  });

  it("sistem padan dikosongkan di pemeriksaan terbaru → tarik (teks lama)", () => {
    const r = pemeriksaanFisikRencana(K, [
      { sistem: { mata: "Konjungtiva tidak anemis", abdomen: "Supel" }, waktuPemeriksaan: t1, authorPegawaiId: null },
      { sistem: { mata: "Konjungtiva anemis" }, waktuPemeriksaan: t2, authorPegawaiId: null },
    ]);
    expect(r.kirim.map((i) => [i.sistem, i.teks, i.waktu])).toEqual([["mata", "Konjungtiva anemis", t2]]);
    expect(r.tarik.map((i) => [i.sistem, i.teks, i.waktu])).toEqual([["abdomen", "Supel", t1]]);
  });

  it("bentuk = contoh resmi RI (Head: exam · 10199-8 · valueString · performer · issued)", () => {
    const res = toFhirPemeriksaanFisik(PEMERIKSAAN_FISIK.kepala!, "Bentuk kepala simetris", { refs, waktu: t1, performer: { ihsId: "D1", nama: "dr. A" } });
    expect(res).toMatchObject({
      resourceType: "Observation",
      status: "final",
      category: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/observation-category", code: "exam", display: "Exam" }] }],
      code: { coding: [{ system: "http://loinc.org", code: "10199-8", display: "Physical findings of Head Narrative" }] },
      performer: [{ reference: "Practitioner/D1" }],
      valueString: "Bentuk kepala simetris",
    });
    expect(res.effectiveDateTime).toBe(res.issued);
    expect(toFhirPemeriksaanFisik(PEMERIKSAAN_FISIK.kepala!, "x", { refs, waktu: t1 }, true)).toMatchObject({ status: "entered-in-error" });
  });

  it("teksSistem aman untuk JSON rusak", () => {
    expect(teksSistem(null)).toEqual({});
    expect(teksSistem("x")).toEqual({});
  });
});

describe("Composition & registry S4d", () => {
  it("sub-section Anamnesis & Pemeriksaan Fisik mengikuti urutan contoh RI", () => {
    const s = compositionSectionsOf(
      { ringkasanKlinis: "" },
      { keluhanUtama: ["Condition/C0"], riwayatPenyakit: ["Condition/C1"], riwayatKeluarga: ["FamilyMemberHistory/F1"], alergi: ["AllergyIntolerance/A1"], tandaVital: ["Observation/O1"], headToToe: ["Observation/O2"] },
    );
    expect(s.map((x) => x.title)).toEqual(["Anamnesis", "Pemeriksaan Fisik"]);
    expect(s[0].section?.map((x) => [x.title, x.code?.coding[0].code])).toEqual([
      ["Keluhan Utama", "10154-3"],
      ["Riwayat Penyakit Pribadi Terdahulu", "11348-0"],
      ["Riwayat Penyakit Keluarga", "10157-6"],
      ["Riwayat Alergi", "48765-2"],
    ]);
    expect(s[1].section?.map((x) => [x.title, x.code?.coding[0].code])).toEqual([["Tanda Vital", "8716-3"], ["Pemeriksaan Fisik Head to Toe", "10187-3"]]);
  });
  it("L04 · L05 · L10 aktif", () => {
    expect([LINK_BY_ID.L04, LINK_BY_ID.L05, LINK_BY_ID.L10].map((l) => l.status)).toEqual(["aktif", "aktif", "aktif"]);
  });
});
