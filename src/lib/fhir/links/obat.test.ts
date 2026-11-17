// Test murni link obat S4b (docs/fhir-mapping L19 · L21).
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { toFhirMedicationAdministration } from "../adapters/medication";
import { toFhirPengkajianResep } from "../adapters/pengkajianResep";
import { doseOf, marLocalId, marRencanaOf, marSlotsOf, wibToDate, type MarRow } from "./mar";
import { LINK_BY_ID } from "./registry";
import { Q0007, Q0007_ITEM_RESEP, Q0007_STRUKTUR, q0007ItemsOf, type QrItem } from "./telaah";

const lulusSemua = {
  administrasi: { "adm-identitas": true, "adm-umur-jk": true, "adm-dokter": true, "adm-tanggal": true, "adm-unit": true },
  farmasetik: { "farm-nama-kekuatan": true, "farm-dosis-jumlah": true, "farm-stabilitas": true, "farm-aturan": true, "farm-kompatibilitas": true },
  klinis: { "klin-indikasi": true, "klin-dosis": true, "klin-aturan-lama": true, "klin-duplikasi": true, "klin-rotd": true, "klin-kontraindikasi": true, "klin-interaksi": true },
};
const flat = (items: QrItem[]): Record<string, QrItem> =>
  Object.fromEntries(items.flatMap((g) => [[g.linkId, g], ...(g.item ?? []).map((i) => [i.linkId, i] as const)]));

describe("L19 pengkajian resep → QuestionnaireResponse Q0007", () => {
  it("struktur & teks item = contoh Bundle resmi RI (verbatim)", () => {
    const bundle = JSON.parse(readFileSync("docs/fhir-postman/bundles/bundle-rawat-inap.json", "utf8"));
    const resmi = bundle.entry.find((e: { resource: { resourceType: string } }) => e.resource.resourceType === "QuestionnaireResponse").resource;
    const kita = [...Q0007_STRUKTUR.map((g) => ({ linkId: g.linkId, text: g.text, item: g.items.map((i) => ({ linkId: i.linkId, text: i.text })) })), Q0007_ITEM_RESEP];
    const bentuk = (items: QrItem[]): unknown => items.map((i) => ({ linkId: i.linkId, text: i.text, ...(i.item ? { item: bentuk(i.item) } : {}) }));
    expect(bentuk(kita as QrItem[])).toEqual(bentuk(resmi.item));
  });
  it("lulus semua → 1.x/2.x/3.1 Sesuai, 3.2–3.5 false (makna dibalik)", () => {
    const q = q0007ItemsOf({ id: "T1", answers: lulusSemua });
    if (!q.ok) throw new Error("harus ok");
    const f = flat(q.items);
    expect(f["1.1"].answer).toEqual([{ valueCoding: { system: "http://terminology.kemkes.go.id/CodeSystem/clinical-term", code: "OV000052", display: "Sesuai" } }]);
    expect(["3.2", "3.3", "3.4", "3.5"].map((k) => f[k].answer)).toEqual(Array(4).fill([{ valueBoolean: false }]));
  });
  it("gagal satu butir → item yang tepat berubah", () => {
    const q = q0007ItemsOf({ id: "T1", answers: { ...lulusSemua, klinis: { ...lulusSemua.klinis, "klin-interaksi": false, "klin-dosis": false }, administrasi: { ...lulusSemua.administrasi, "adm-umur-jk": false } } });
    if (!q.ok) throw new Error("harus ok");
    const f = flat(q.items);
    expect(f["3.5"].answer).toEqual([{ valueBoolean: true }]); // ADA interaksi
    expect(f["3.1"].answer?.[0]).toMatchObject({ valueCoding: { code: "OV000053" } }); // dosis tidak tepat
    expect(f["1.1"].answer?.[0]).toMatchObject({ valueCoding: { code: "OV000053" } });
    expect(f["3.2"].answer).toEqual([{ valueBoolean: false }]);
  });
  it("jawaban tidak lengkap → ditahan (Issue L19)", () => {
    const tanpaKlinis = { administrasi: lulusSemua.administrasi, farmasetik: lulusSemua.farmasetik };
    expect(q0007ItemsOf({ id: "T1", answers: tanpaKlinis })).toMatchObject({ ok: false, issue: { link: "L19", code: "kode-kosong", localId: "T1" } });
    expect(q0007ItemsOf({ id: "T1", answers: null })).toMatchObject({ ok: false });
  });
  it("resource: questionnaire Q0007 + item 4 merujuk semua MedicationRequest resep", () => {
    const q = q0007ItemsOf({ id: "T1", answers: lulusSemua });
    if (!q.ok) throw new Error("harus ok");
    const r = toFhirPengkajianResep({ createdAt: new Date("2026-01-01T03:00:00Z") }, q.items, { patient: { ihsId: "P1", nama: "Pasien" }, encounterIhsId: "E1" }, { author: { ihsId: "A1", nama: "Apt" }, medicationRequestIhsIds: ["MR1", "MR2"] });
    expect(r).toMatchObject({
      questionnaire: Q0007, status: "completed", authored: "2026-01-01T03:00:00+00:00",
      author: { reference: "Practitioner/A1" }, source: { reference: "Patient/P1" },
    });
    const items = r.item as QrItem[];
    expect(items.map((i) => i.linkId)).toEqual(["1", "2", "3", "4"]);
    expect(items[3].answer).toEqual([{ valueReference: { reference: "MedicationRequest/MR1" } }, { valueReference: { reference: "MedicationRequest/MR2" } }]);
  });
});

const mar = (p: Partial<MarRow>): MarRow => ({
  id: "M", resepItemId: "I1", dosis: "500 mg", rute: "PO", tanggal: "2026-01-02", shift: "Pagi", status: "Diberikan",
  waktuPemberian: "08:30", perawat2: "", catatan: "", authorPegawaiId: null, createdAt: new Date("2026-01-02T02:00:00Z"), ...p,
});

describe("L21 MAR → MedicationAdministration", () => {
  it("latest wins per slot → 1 resource per slot", () => {
    const slots = marSlotsOf([
      mar({ id: "a", status: "Ditunda", waktuPemberian: null, createdAt: new Date("2026-01-02T01:00:00Z") }),
      mar({ id: "b", createdAt: new Date("2026-01-02T02:00:00Z") }),
      mar({ id: "c", shift: "Siang", createdAt: new Date("2026-01-02T03:00:00Z") }),
    ]);
    expect(slots.map((s) => s.id)).toEqual(["b", "c"]);
    expect(marLocalId(slots[0])).toBe("I1:2026-01-02:Pagi");
  });
  it("jam WIB → UTC; dosis sederhana → UCUM", () => {
    expect(wibToDate("2026-01-02", "08:30")?.toISOString()).toBe("2026-01-02T01:30:00.000Z");
    expect(wibToDate("2026-01-02", "25:00")).toBeNull();
    expect(doseOf("500 mg")).toMatchObject({ value: 500, code: "mg" });
    expect(doseOf("2,5 ml")).toMatchObject({ value: 2.5, code: "mL" });
    expect(doseOf("250 mcg")).toMatchObject({ code: "ug" });
    expect([doseOf("1 tablet"), doseOf("2x1"), doseOf("")]).toEqual([null, null, null]);
  });
  it("status: Diberikan tanpa jam = ditahan · Ditunda = tarik · Ditolak/Tidak tersedia = not-done", () => {
    expect(marRencanaOf(mar({ waktuPemberian: null }))).toMatchObject({ aksi: "tahan", issue: { link: "L21", code: "kode-kosong" } });
    expect(marRencanaOf(mar({ status: "Ditunda", waktuPemberian: null }))).toMatchObject({ aksi: "tarik" });
    expect(marRencanaOf(mar({ status: "Ditolak", waktuPemberian: null }))).toMatchObject({ aksi: "kirim", status: "not-done", alasan: "Pasien menolak obat" });
    expect(marRencanaOf(mar({ status: "TidakTersedia" }))).toMatchObject({ aksi: "kirim", status: "not-done" });
    expect(marRencanaOf(mar({ status: "Hilang" }))).toMatchObject({ aksi: "tahan", issue: { code: "kode-tidak-valid" } });
    expect(marRencanaOf(mar({}))).toMatchObject({ aksi: "kirim", status: "completed" });
  });
  it("resource: Medication contained, request, effectivePeriod, reasonCode 'b', dose UCUM, catatan HAM", () => {
    const refs = {
      orgId: "org", unit: "RawatInap" as const, patient: { ihsId: "P1", nama: "Pasien" }, encounter: { ihsId: "E1" },
      medication: { ihsId: "", nama: "Paracetamol 500 mg Tablet" }, request: { ihsId: "MR1" },
    };
    const med = { resourceType: "Medication", code: { coding: [{ code: "93000001" }] } };
    const waktu = new Date("2026-01-02T01:30:00Z");
    const r = toFhirMedicationAdministration(
      mar({ perawat2: "Ns. B", catatan: "" }), { status: "completed", waktu }, med, refs,
      { performer: { ihsId: "N1", nama: "Ns. A" }, dose: doseOf("500 mg") },
    );
    expect(r).toMatchObject({
      contained: [{ resourceType: "Medication", id: "med" }],
      status: "completed",
      category: { coding: [{ code: "inpatient" }] },
      medicationReference: { reference: "#med" },
      context: { reference: "Encounter/E1" },
      effectivePeriod: { start: "2026-01-02T01:30:00+00:00", end: "2026-01-02T01:30:00+00:00" },
      reasonCode: [{ coding: [{ code: "b", display: "Given as Ordered" }] }],
      request: { reference: "MedicationRequest/MR1" },
      dosage: { text: "500 mg", route: { coding: [{ code: "O" }] }, dose: { value: 500, system: "http://unitsofmeasure.org", code: "mg" } },
      note: [{ text: "Verifikator kedua (HAM): Ns. B" }],
    });
    const tolak = toFhirMedicationAdministration(mar({}), { status: "not-done", alasan: "Pasien menolak obat", waktu }, med, refs, {});
    expect(tolak).toMatchObject({ status: "not-done", statusReason: [{ text: "Pasien menolak obat" }] });
    expect(tolak).not.toHaveProperty("reasonCode");
  });
});

describe("registry S4b obat", () => {
  it("L19 · L21 aktif", () => {
    expect([LINK_BY_ID.L19.status, LINK_BY_ID.L21.status]).toEqual(["aktif", "aktif"]);
  });
});
