// Test murni S5a — L07 riwayat pengobatan → MedicationStatement (playbook Tabel 3/4 item 6 + skenario KFA 92/93).
import { describe, expect, it } from "vitest";
import { cariObat, dtoToRiwayatObat, labelObat, riwayatObatToInput } from "@/components/shared/asesmen/riwayatObat/riwayatObatShared";
import type { ObatTersediaDTO } from "@/lib/api/master/obatTersedia";
import { toFhirRiwayatObat } from "../adapters/anamnesis";
import { compositionSectionsOf } from "../adapters/composition";
import { LINK_BY_ID } from "./registry";
import { kfaRiwayatOf, riwayatObatRencana, type KfaProduk } from "./riwayatObat";

const refs = { orgId: "org", patient: { ihsId: "P1", nama: "Pasien" }, encounter: { ihsId: "E1", display: "Kunjungan" } };
const K = "K1";
const t1 = new Date("2026-01-01T03:00:00Z");
const t2 = new Date("2026-01-02T03:00:00Z");
// Kode = baris skenario resmi playbook (Ampicillin Trihydrate 500 mg Tablet).
const AMP: KfaProduk = { povKode: "92001087", povNama: "Ampicillin Trihydrate 500 mg Tablet", poaKode: "93005512", poaNama: "Ampicillin Trihydrate 500 mg Tablet (PHARMA LABORATORIES)" };
const kfaMap = new Map<string, KfaProduk | null>([["O-AMP", AMP], ["O-AKT", { poaKode: "93005512", poaNama: "Produk aktual" }], ["O-NOKFA", null]]);

const item = (p: Partial<{ nama: string; obatId: string | null; status: string | null; dosis: string; frekuensi: string; rute: string; sejak: string; indikasi: string }>) => ({
  nama: "Ampicillin 500 mg", obatId: "O-AMP", status: "aktif", dosis: null, frekuensi: null, rute: null, sejak: null, indikasi: null, ...p,
});

describe("L07 kode KFA riwayat obat", () => {
  it("template 92 diutamakan; aktual 93 cadangan; format salah ditolak", () => {
    expect(kfaRiwayatOf(AMP)).toEqual({ kode: "92001087", nama: "Ampicillin Trihydrate 500 mg Tablet", jenis: "template" });
    expect(kfaRiwayatOf({ poaKode: "93005512", poaNama: "X" })).toMatchObject({ kode: "93005512", jenis: "aktual" });
    expect(kfaRiwayatOf({ povKode: "93005512", poaKode: "92001087" })).toBeNull(); // prefix tertukar = tidak sah
    expect(kfaRiwayatOf(null)).toBeNull();
  });
});

describe("L07 rencana (latest wins)", () => {
  it("tertaut + KFA + status → kirim; ketik bebas / tanpa KFA / tanpa status → Issue kode-kosong", () => {
    const r = riwayatObatRencana(K, [{ createdAt: t1, items: [
      item({ dosis: "500 mg", frekuensi: "3×/hari", rute: "Oral", sejak: "2 minggu", indikasi: "ISK" }),
      item({ nama: "Jamu pegal linu", obatId: null }),
      item({ nama: "Obat X", obatId: "O-NOKFA" }),
      item({ nama: "Obat aktual", obatId: "O-AKT", status: null }),
      item({ nama: "Ampicillin dobel" }), // obat sama dua kali → sekali saja
    ] }], kfaMap);
    expect(r.kirim).toHaveLength(1);
    expect(r.kirim[0]).toMatchObject({
      localId: "K1:riwayat-obat:O-AMP", status: "active", kfa: { kode: "92001087" },
      dosis: "500 mg · 3×/hari · Oral", catatan: ["Sejak: 2 minggu", "Indikasi: ISK"],
    });
    expect(r.issues.map((i) => [i.link, i.code, i.localId])).toEqual([
      ["L07", "kode-kosong", "K1:riwayat-obat:nama:Jamu pegal linu"],
      ["L07", "kode-kosong", "K1:riwayat-obat:O-NOKFA"],
      ["L07", "kode-kosong", "K1:riwayat-obat:O-AKT"],
    ]);
  });

  it("obat yang dihapus di simpanan terbaru → tarik; status berhenti → completed", () => {
    const r = riwayatObatRencana(K, [
      { createdAt: t1, items: [item({}), item({ nama: "Produk aktual", obatId: "O-AKT" })] },
      { createdAt: t2, items: [item({ status: "berhenti" })] },
    ], kfaMap);
    expect(r.kirim.map((i) => [i.localId, i.status, i.dateAsserted])).toEqual([["K1:riwayat-obat:O-AMP", "completed", t2]]);
    expect(r.tarik.map((i) => [i.localId, i.kfa.kode, i.dateAsserted])).toEqual([["K1:riwayat-obat:O-AKT", "93005512", t1]]);
  });

  it("tanpa simpanan → kosong", () => {
    expect(riwayatObatRencana(K, [], kfaMap)).toEqual({ kirim: [], tarik: [], issues: [] });
  });
});

describe("L07 bentuk MedicationStatement", () => {
  it("status · medicationCodeableConcept KFA · subject · context · dateAsserted · dosage.text · note; tanpa category", () => {
    const [o] = riwayatObatRencana(K, [{ createdAt: t1, items: [item({ dosis: "500 mg", frekuensi: "3×/hari" })] }], kfaMap).kirim;
    const res = toFhirRiwayatObat({ ...o, deleted: false }, refs);
    expect(res).toMatchObject({
      resourceType: "MedicationStatement",
      status: "active",
      medicationCodeableConcept: { coding: [{ system: "http://sys-ids.kemkes.go.id/kfa", code: "92001087", display: "Ampicillin Trihydrate 500 mg Tablet" }] },
      subject: { reference: "Patient/P1" },
      context: { reference: "Encounter/E1" },
      dosage: [{ text: "500 mg · 3×/hari" }],
    });
    expect(res.dateAsserted).toBe("2026-01-01T03:00:00+00:00");
    expect(res).not.toHaveProperty("category");
    expect(res).not.toHaveProperty("note");
    expect(toFhirRiwayatObat({ ...o, deleted: true }, refs)).toMatchObject({ status: "entered-in-error" });
  });

  it("section Riwayat Pengobatan 10160-0 sesudah Riwayat Alergi (urutan contoh RI) · registry L07 aktif", () => {
    const [anamnesis] = compositionSectionsOf({ ringkasanKlinis: "" }, { alergi: ["AllergyIntolerance/A1"], riwayatObat: ["MedicationStatement/M1"] });
    expect(anamnesis.section?.map((x) => [x.title, x.code?.coding[0].code])).toEqual([
      ["Riwayat Alergi", "48765-2"],
      ["Riwayat Pengobatan", "10160-0"],
    ]);
    expect(LINK_BY_ID.L07.status).toBe("aktif");
  });
});

describe("Form riwayat obat (shared IGD/RI/RJ)", () => {
  const obat = (p: Partial<ObatTersediaDTO>): ObatTersediaDTO => ({
    id: "x", kode: "OBT-1", namaGenerik: "", namaDagang: "", bentuk: "Tablet", kekuatan: "", satuanTerkecil: null,
    kategori: "", golongan: null, isHAM: false, efekSamping: null, hargaSatuan: null, bza: [], kfaProduk: null, ruanganKodes: [], ...p,
  });
  const list = [
    obat({ id: "a", namaGenerik: "Captopril", kekuatan: "25 mg" }),
    obat({ id: "b", namaGenerik: "Amlodipine", kekuatan: "10 mg", namaDagang: "Norvask" }),
    obat({ id: "c", namaGenerik: "Amlodipine", kekuatan: "5 mg", kfaProduk: { povKode: "92000001", povNama: "Amlodipine 5 mg Tablet" } }),
    obat({ id: "d", namaGenerik: "Kalium Klorida", kekuatan: "600 mg", namaDagang: "KSR" }),
  ];

  it("rekomendasi: awalan nama dulu, obat ber-KFA didahulukan; kosong → tanpa saran", () => {
    expect(cariObat(list, "aml").map((o) => o.id)).toEqual(["c", "b"]);
    expect(cariObat(list, "norv").map((o) => o.id)).toEqual(["b"]);
    expect(cariObat(list, "klorida").map((o) => o.id)).toEqual(["d"]); // awalan kata
    expect(cariObat(list, "  ")).toEqual([]);
    expect(labelObat(list[2])).toBe("Amlodipine 5 mg");
  });

  it("payload simpan tidak membawa kode KFA (diturunkan server) & baris kosong dibuang", () => {
    const rows = dtoToRiwayatObat({
      id: "A", kunjunganId: K, pemeriksa: "p", authorUserId: null, createdAt: t1.toISOString(),
      items: [{ id: "i1", nama: "Amlodipine 5 mg", obatId: "c", status: "aktif", kfa: { kode: "92000001", nama: "x", jenis: "template" }, dosis: null, frekuensi: null, rute: "Oral", sejak: null, indikasi: null, urutan: 0 }],
    });
    const input = riwayatObatToInput([...rows, { ...rows[0], key: "k2", nama: "  " }]);
    expect(input.items).toEqual([{ nama: "Amlodipine 5 mg", obatId: "c", status: "aktif", dosis: undefined, frekuensi: undefined, rute: "Oral", sejak: undefined, indikasi: undefined }]);
    expect(dtoToRiwayatObat(null)).toHaveLength(1);
  });
});
