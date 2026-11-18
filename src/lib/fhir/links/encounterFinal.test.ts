import { describe, expect, it } from "vitest";
import { dischargeDispositionOf } from "../conceptMap";
import { toFhirEncounter, type LocalEncounter } from "../adapters/encounter";
import { toFhirChiefComplaint, toFhirKondisiPulang } from "../adapters/encounterCondition";
import { finishedBlockers, keluhanUtamaOf, kondisiPulangOf, lamaKunjunganOf } from "./encounterFinal";

const H = 3_600_000;
const refsKlinis = { orgId: "org", patient: { ihsId: "P1", nama: "Pasien" }, encounter: { ihsId: "E1", display: "Kunjungan" } };

describe("L24 dischargeDisposition", () => {
  const masuk = new Date("2026-01-01T00:00:00Z");
  it("meninggal < 48 jam → exp-lt48h, tepat 48 jam → exp-gt48h (system Kemkes)", () => {
    const lt = dischargeDispositionOf("Meninggal", masuk, new Date(masuk.getTime() + 48 * H - 1));
    const gt = dischargeDispositionOf("Meninggal", masuk, new Date(masuk.getTime() + 48 * H));
    expect(lt?.code).toBe("exp-lt48h");
    expect(gt?.code).toBe("exp-gt48h");
    expect(gt?.system).toBe("http://terminology.kemkes.go.id/CodeSystem/discharge-disposition");
  });
  it("jenis lain tetap HL7; tak dikenal → undefined", () => {
    expect(dischargeDispositionOf("Pulang", masuk, masuk)?.code).toBe("home");
    expect(dischargeDispositionOf("Rawat_Inap", masuk, masuk)?.code).toBe("oth");
    expect(dischargeDispositionOf("Kabur", masuk, masuk)).toBeUndefined();
  });
});

describe("L24 kondisi pulang (D11)", () => {
  const k = (jenis: string, kondisiUmum: string) => kondisiPulangOf("K1", { jenis, kondisiUmum });
  it("Baik/Sedang → stabil · Buruk/Kritis → tidak stabil · Membaik → perbaikan", () => {
    expect(k("Pulang", "Baik")).toMatchObject({ ok: true, kode: { code: "359746009" } });
    expect(k("Rujuk", " Sedang ")).toMatchObject({ ok: true, kode: { code: "359746009" }, lokal: "Sedang" });
    expect(k("APS", "Kritis")).toMatchObject({ ok: true, kode: { code: "162668006" } });
    expect(k("Pulang", "Membaik")).toMatchObject({ ok: true, kode: { code: "268910001" } });
  });
  it("Meninggal & Rawat_Inap → tidak berlaku; nilai turunan status → Issue; nilai asing → kode-tidak-valid", () => {
    expect(k("Meninggal", "Meninggal")).toBeNull();
    expect(k("Rawat_Inap", "Dalam perawatan")).toBeNull();
    expect(k("Rujuk", "Dirujuk ke faskes lain")).toMatchObject({ ok: false, issue: { code: "kode-kosong", link: "L24" } });
    expect(k("Pulang", "Lumayan")).toMatchObject({ ok: false, issue: { code: "kode-tidak-valid" } });
  });
  it("Condition kondisi pulang: problem-list-item + teks lokal", () => {
    const r = k("Pulang", "Baik");
    if (!r || !r.ok) throw new Error("harus siap");
    const c = toFhirKondisiPulang({ kode: r.kode, lokal: r.lokal, recordedAt: new Date("2026-01-01T00:00:00Z") }, refsKlinis);
    expect(c).toMatchObject({ category: [{ coding: [{ code: "problem-list-item" }] }], code: { text: "Kondisi umum: Baik" } });
  });
});

describe("L03 keluhan utama", () => {
  const a = { keluhanUtama: "Demam 3 hari", keluhanSnomedKode: "386661006", keluhanSnomedDisplay: "Fever", createdAt: new Date("2026-01-01T00:00:00Z") };
  it("tanpa anamnesis / tanpa kode → Issue kode-kosong (localId 1 per kunjungan)", () => {
    expect(keluhanUtamaOf("K1", null)).toMatchObject({ ok: false, issue: { link: "L03", code: "kode-kosong", localId: "K1:cc" } });
    expect(keluhanUtamaOf("K1", { ...a, keluhanSnomedKode: null })).toMatchObject({ ok: false });
  });
  it("siap → Condition chief-complaint SNOMED, teks bebas di note", () => {
    const r = keluhanUtamaOf("K1", a);
    if (!r.ok) throw new Error("harus siap");
    const c = toFhirChiefComplaint(r.data, refsKlinis, { ihsId: "PR1", nama: "dr. A" });
    expect(c).toMatchObject({
      category: [{ coding: [{ system: "http://terminology.kemkes.go.id", code: "chief-complaint" }] }],
      code: { coding: [{ system: "http://snomed.info/sct", code: "386661006", display: "Fever" }] },
      note: [{ text: "Demam 3 hari" }],
      recorder: { reference: "Practitioner/PR1" },
    });
  });
});

describe("L01 length & gerbang finished", () => {
  it("RI = hari kalender WIB (min 1); RJ/IGD = menit", () => {
    expect(lamaKunjunganOf("RawatInap", new Date("2022-12-25T08:00:00Z"), new Date("2022-12-30T09:30:27Z")).value).toBe(5);
    expect(lamaKunjunganOf("RawatInap", new Date("2026-01-01T01:00:00Z"), new Date("2026-01-01T05:00:00Z")).value).toBe(1);
    // 23:30 WIB → 00:30 WIB hari berikutnya = 1 hari kalender
    expect(lamaKunjunganOf("RawatInap", new Date("2026-01-01T16:30:00Z"), new Date("2026-01-01T17:30:00Z")).value).toBe(1);
    expect(lamaKunjunganOf("IGD", new Date("2026-01-01T00:00:00Z"), new Date("2026-01-01T01:30:00Z"))).toMatchObject({ value: 90, code: "min" });
  });
  it("tanpa CC atau diagnosis → Issue syarat-finished", () => {
    expect(finishedBlockers("K1", true, 1, 1)).toEqual([]);
    expect(finishedBlockers("K1", false, 0, 0).map((i) => i.code)).toEqual(["syarat-finished", "syarat-finished"]);
  });
  it("S6a: diagnosis Utama terkirim harus tepat satu", () => {
    expect(finishedBlockers("K1", true, 2, 0).map((i) => i.message)).toEqual([expect.stringContaining("Utama belum terkirim")]);
    expect(finishedBlockers("K1", true, 3, 2).map((i) => i.message)).toEqual([expect.stringContaining("2 diagnosis Utama")]);
  });
});

describe("toFhirEncounter (S2)", () => {
  const base: LocalEncounter = {
    noKunjungan: "IGD-1", unit: "IGD", status: "Completed",
    waktuKunjungan: new Date("2026-01-01T00:00:00Z"),
    dilayaniAt: new Date("2026-01-01T00:20:00Z"),
    selesaiAt: new Date("2026-01-01T04:00:00Z"),
    kelas: null, kelasHak: null, titipan: false,
    triagedAt: new Date("2026-01-01T00:05:00Z"),
    disposisi: { jenis: "Meninggal", rujukTujuan: null, instruksi: "", waktuKeluar: new Date("2026-01-01T04:00:00Z") },
  };
  const refs = {
    orgId: "org", patient: { ihsId: "P1", nama: "Pasien" },
    practitioner: { ihsId: "PR1", nama: "dr. A" }, location: { ihsId: "L1", nama: "IGD" },
    diagnoses: [{ ihsId: "C1", display: "I21.9 AMI", rank: 1 }],
    chiefComplaint: { ihsId: "C0", display: "Chest pain" },
  };

  it("finished: triaged · classHistory · length · CC (tanpa rank) + DD · exp-lt48h · location.period", () => {
    const e = toFhirEncounter(base, refs, "finished") as unknown as Record<string, unknown> & {
      statusHistory: { status: string }[]; diagnosis: { use: { coding: { code: string }[] }; rank?: number }[];
    };
    expect(e.statusHistory.map((s) => s.status)).toEqual(["arrived", "triaged", "in-progress", "finished"]);
    expect(e.classHistory).toEqual([{ class: expect.objectContaining({ code: "EMER" }), period: e.period }]);
    expect(e.length).toMatchObject({ value: 240, code: "min" });
    expect(e.diagnosis.map((d) => d.use.coding[0].code)).toEqual(["DD", "CC"]);
    expect(e.diagnosis[1].rank).toBeUndefined();
    expect(e.hospitalization).toMatchObject({ dischargeDisposition: { coding: [{ code: "exp-lt48h" }] } });
    expect(e.location).toMatchObject([{ period: e.period }]);
  });

  it("in-progress: tanpa diagnosis/length/disposisi; triase di luar rentang → tanpa triaged", () => {
    const e = toFhirEncounter({ ...base, status: "InService", triagedAt: new Date("2025-12-31T00:00:00Z") }, refs, "in-progress") as
      unknown as Record<string, unknown> & { statusHistory: { status: string }[] };
    expect(e.statusHistory.map((s) => s.status)).toEqual(["arrived", "in-progress"]);
    expect(e.diagnosis).toBeUndefined();
    expect(e.length).toBeUndefined();
    expect(e.hospitalization).toBeUndefined();
  });
});
