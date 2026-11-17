// Test murni link rencana & pulang S4c (docs/fhir-mapping L15 · L22 · L23 · L25) — kode verbatim playbook.
import { describe, expect, it } from "vitest";
import { TOPIK_EDUKASI_TEMPLATE } from "@/components/rawat-inap/discharge/dischargeShared";
import { compositionSectionsOf } from "../adapters/composition";
import { toFhirCarePlan, toFhirEdukasi, toFhirGoal, toFhirTindakLanjut } from "../adapters/rencana";
import { CAREPLAN_CATEGORY, CAREPLAN_DISCHARGE, EDUKASI_TOPIK, GOAL_STATUS, LOKASI_TINDAK_LANJUT, TINDAK_LANJUT } from "../conceptMap";
import {
  edukasiKodeOf, kriteriaPemulanganIssue, rencanaLocalId, rencanaPemulanganTeks, rujukanDetailOf, rujukanKodeOf, spriIssue,
  tanggalWib,
} from "./rencana";
import { LINK_BY_ID } from "./registry";

const refs = { orgId: "org", patient: { ihsId: "P1", nama: "Pasien" }, encounter: { ihsId: "E1", display: "Kunjungan" } };
const t0 = new Date("2026-01-01T03:00:00Z");
const dokter = { ihsId: "D1", nama: "dr. A" };

describe("L15 edukasi → Procedure", () => {
  it("peta topik mencakup tepat semua template topik FE", () => {
    expect(Object.keys(EDUKASI_TOPIK).sort()).toEqual(TOPIK_EDUKASI_TEMPLATE.map((t) => t.id).sort());
  });
  it("topik berkode → SNOMED; tanpa padanan → ditahan", () => {
    expect(edukasiKodeOf({ id: "E1", topikId: "edu-01", topik: "Diagnosis" })).toMatchObject({ ok: true, coding: { code: "84635008" } });
    expect(edukasiKodeOf({ id: "E1", topikId: "edu-09", topik: "Jadwal kontrol" })).toMatchObject({ ok: false, issue: { link: "L15", code: "kode-kosong" } });
    expect(edukasiKodeOf({ id: "E1", topikId: "edu-99", topik: "?" })).toMatchObject({ ok: false });
  });
  it("2 coding dalam 1 payload (SNOMED topik + KPTL 10913) · category 409073007", () => {
    const k = edukasiKodeOf({ id: "E1", topikId: "edu-05", topik: "Gizi" });
    if (!k.ok) throw new Error("harus ok");
    const r = toFhirEdukasi({ topik: k.coding, waktu: "2026-01-01", deleted: false, note: ["Diet rendah garam", ""] }, refs, { performer: dokter });
    expect(r).toMatchObject({
      status: "completed",
      category: { coding: [{ system: "http://snomed.info/sct", code: "409073007", display: "Education" }], text: "Education" },
      code: { coding: [{ code: "61310001", display: "Nutrition education" }, { system: "http://terminology.kemkes.go.id/CodeSystem/kptl", code: "10913" }] },
      performedPeriod: { start: "2026-01-01", end: "2026-01-01" },
      performer: [{ actor: { reference: "Practitioner/D1" } }],
      note: [{ text: "Diet rendah garam" }],
    });
    expect(toFhirEdukasi({ topik: k.coding, waktu: "2026-01-01", deleted: true, note: [] }, refs, {})).toMatchObject({ status: "entered-in-error" });
  });
});

describe("L22 rencana asuhan → Goal + CarePlan", () => {
  it("Goal nursing, description teks (contoh resmi RI), status ketercapaian", () => {
    const st = GOAL_STATUS.Tercapai_Sebagian;
    const g = toFhirGoal(
      { target: "Sesak berkurang", indikator: "RR < 24", targetWaktu: "3×24 jam", intervensi: ["Posisi semi fowler"], evaluasi: "", lifecycle: st.lifecycle, achievement: st.achievement, statusDate: "2026-01-01" },
      refs,
      { expressedBy: dokter, addresses: { ihsId: "C1", display: "J18.9 Pneumonia" } },
    );
    expect(g).toMatchObject({
      resourceType: "Goal", lifecycleStatus: "active",
      achievementStatus: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/goal-achievement", code: "improving" }] },
      category: [{ coding: [{ code: "nursing" }] }],
      description: { text: "Sesak berkurang — indikator: RR < 24" },
      addresses: [{ reference: "Condition/C1" }],
      note: [{ text: "Target waktu: 3×24 jam" }, { text: "Intervensi: Posisi semi fowler" }],
    });
    expect(g).not.toHaveProperty("encounter"); // Goal R4 tanpa encounter
  });
  it("CarePlan category per unit: RI 736353004 · IGD TK000068 (tabel playbook) · RJ 736271009", () => {
    expect(CAREPLAN_CATEGORY.IGD).toEqual({ system: "http://terminology.kemkes.go.id", code: "TK000068", display: "Emergency care plan" });
    const c = toFhirCarePlan(
      { status: "active", category: CAREPLAN_CATEGORY.RawatInap, title: "Pola napas tidak efektif", description: "x", created: t0 },
      refs,
      { author: dokter, goalIhsIds: ["G1"] },
    );
    expect(c).toMatchObject({
      status: "active", intent: "plan", category: [{ coding: [{ code: "736353004", display: "Inpatient care plan" }] }],
      encounter: { reference: "Encounter/E1" }, author: { reference: "Practitioner/D1" }, goal: [{ reference: "Goal/G1" }],
      created: "2026-01-01T03:00:00+00:00",
    });
  });
});

describe("L23 rencana pemulangan → CarePlan 736372004", () => {
  const a = {
    tanggalRencanaKrs: "2026-01-05", kondisiPulang: "Membaik", caregiverNama: "Budi", caregiverHubungan: "Anak",
    kebutuhanHomecare: true, jenisHomecare: ["Perawatan luka"], kebutuhanAlatBantu: false, alatBantu: [], catatan: "Kontrol poli",
  };
  it("ringkasan teks dari kolom terstruktur; kosong → teks baku", () => {
    expect(rencanaPemulanganTeks(a)).toBe("Rencana pulang 2026-01-05; perkiraan kondisi pulang Membaik; pendamping Budi (Anak); perawatan di rumah: Perawatan luka; Kontrol poli");
    expect(rencanaPemulanganTeks({ ...a, tanggalRencanaKrs: "", kondisiPulang: "", caregiverNama: "", kebutuhanHomecare: false, catatan: "" })).toBe("Perencanaan pemulangan pasien");
    expect(CAREPLAN_DISCHARGE.code).toBe("736372004");
  });
  it("localId per KUNJUNGAN (asesmen latest-wins → PUT resource sama); kriteria OC000055 ditahan D15", () => {
    expect(rencanaLocalId.rencanaPemulangan("K1")).toBe("K1:rencana-pemulangan");
    expect(kriteriaPemulanganIssue("K1")).toMatchObject({ link: "L23", resourceType: "Observation", code: "menunggu-keputusan" });
  });
});

describe("L25 rencana tindak lanjut → ServiceRequest 3457005", () => {
  it("rujukan eksternal: jnsPelayanan BPJS 1 = rawat inap · 2 = rawat jalan · lainnya ditahan", () => {
    const d = rujukanDetailOf({ jnsPelayanan: "2", tipeRujukan: "0", tglRencanaKunjungan: "2026-01-03", tujuanRujukan: { nama: "RS B" }, diagnosa: { kode: "j18.9", nama: "Pneumonia" } });
    expect(d).toMatchObject({ tujuan: "RS B", diagnosa: { kode: "J18.9" } });
    expect(rujukanKodeOf("R1", d)).toMatchObject({ ok: true, coding: { code: "737492002", display: "Outpatient care management" } });
    expect(rujukanKodeOf("R1", { ...d, jnsPelayanan: "1" })).toMatchObject({ ok: true, coding: { code: "737481003" } });
    expect(rujukanKodeOf("R1", rujukanDetailOf(null))).toMatchObject({ ok: false, issue: { link: "L25", localId: "rujukan:R1" } });
  });
  it("bentuk = contoh resmi RI (kontrol 185389009): intent original-order, locationCode, reasonCode, patientInstruction", () => {
    const r = toFhirTindakLanjut(
      {
        identifier: "JK-2601001", status: "active", code: TINDAK_LANJUT.kontrol, text: "Kontrol Poli Dalam", priority: "routine",
        occurrence: "2026-01-10", authoredOn: t0, location: { coding: LOKASI_TINDAK_LANJUT.poli, text: "Poli Dalam" },
        patientInstruction: "Kontrol 2026-01-10 di Poli Dalam",
      },
      refs,
      { requester: dokter, reason: { kode: "J18.9", nama: "Pneumonia" } },
    );
    expect(r).toMatchObject({
      identifier: [{ system: "http://sys-ids.kemkes.go.id/servicerequest/org", value: "JK-2601001" }],
      intent: "original-order", priority: "routine",
      category: [{ coding: [{ system: "http://snomed.info/sct", code: "3457005", display: "Patient referral" }] }],
      code: { coding: [{ code: "185389009", display: "Follow-up visit" }], text: "Kontrol Poli Dalam" },
      occurrenceDateTime: "2026-01-10",
      locationCode: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/v3-RoleCode", code: "OF", display: "Outpatient facility" }], text: "Poli Dalam" }],
      reasonCode: [{ coding: [{ system: "http://hl7.org/fhir/sid/icd-10", code: "J18.9" }] }],
      requester: { reference: "Practitioner/D1" },
    });
  });
  it("SPRI ditahan menunggu D8; localId berprefix tabel", () => {
    expect(spriIssue("S1")).toMatchObject({ localId: "spri:S1", code: "menunggu-keputusan" });
    expect([rencanaLocalId.kontrol("x"), rencanaLocalId.konsultasi("x")]).toEqual(["jadwal-kontrol:x", "konsultasi:x"]);
  });
});

describe("Composition — section baru S4c (urutan contoh resmi RI)", () => {
  it("Perencanaan Perawatan · Edukasi · Rencana Tindak Lanjut", () => {
    const s = compositionSectionsOf(
      { ringkasanKlinis: "" },
      { tandaVital: ["Observation/O1"], rencanaRawat: ["Goal/G1", "CarePlan/CP1"], edukasi: ["Procedure/PE1"], kondisiPulang: ["CarePlan/CP2"], tindakLanjut: ["CarePlan/CP2", "ServiceRequest/SR1"] },
    );
    expect(s.map((x) => x.title)).toEqual(["Pemeriksaan Fisik", "Perencanaan Perawatan", "Edukasi", "Kondisi Saat Meninggalkan Rumah Sakit", "Rencana Tindak Lanjut"]);
    expect(s[1].code?.coding[0].code).toBe("18776-5");
    expect(s[4].entry).toEqual([{ reference: "CarePlan/CP2" }, { reference: "ServiceRequest/SR1" }]);
  });
});

describe("util & registry S4c", () => {
  it("tanggal WIB", () => {
    expect(tanggalWib(new Date("2026-01-01T18:00:00Z"))).toBe("2026-01-02");
  });
  it("L15 · L22 · L23 · L25 aktif", () => {
    expect([LINK_BY_ID.L15, LINK_BY_ID.L22, LINK_BY_ID.L23, LINK_BY_ID.L25].map((l) => l.status)).toEqual(["aktif", "aktif", "aktif", "aktif"]);
  });
});
