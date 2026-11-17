// Test murni koreksi kamar S3 (docs/fhir-mapping L06 · L08 · L14 · L16 · L18/L20 · L26).
import { describe, expect, it } from "vitest";
import { TindakanKategoriEnum } from "@/lib/schemas/master/tindakan";
import { PROCEDURE_CATEGORY } from "../conceptMap";
import { toFhirAllergy, toFhirProcedure, toFhirVitalObservations } from "../adapters/clinical";
import { kfaProductOf, toFhirMedication } from "../adapters/medication";
import { compositionSectionsOf, toFhirComposition } from "../adapters/composition";
import { alergiKodeOf } from "./alergi";
import { cekKodeLab, kategoriKodeLabOf } from "./labTerminologi";

const refs = { orgId: "org", patient: { ihsId: "P1", nama: "Pasien" }, encounter: { ihsId: "E1", display: "Kunjungan" } };
const t0 = new Date("2026-01-01T00:00:00Z");

describe("L08 tanda vital", () => {
  it("tanpa nyeri & GCS; nilai 0 = tidak diisi", () => {
    const obs = toFhirVitalObservations(
      { tdSistolik: 120, tdDiastolik: 80, nadi: 0, respirasi: 20, suhu: 36.8, spo2: 98, beratBadan: null, tinggiBadan: 0, waktuObservasi: t0 },
      refs,
    );
    expect(obs.map((o) => o.key)).toEqual(["sbp", "dbp", "rr", "temp", "spo2"]);
  });
});

describe("L06 alergi", () => {
  const a = { id: "A1", category: "Obat", allergen: "Ibuprofen 400 mg", snomedCode: null, bzaKode: "91000110" };
  it("obat → KFA zat aktif 91 (system kfa)", () => {
    const k = alergiKodeOf(a);
    expect(k).toMatchObject({ ok: true, coding: { system: "http://sys-ids.kemkes.go.id/kfa", code: "91000110" } });
    if (!k.ok) return;
    const res = toFhirAllergy({ ...a, reactions: [], severity: "Berat", status: "Terkonfirmasi", keterangan: null, createdAt: t0, deleted: false }, k.coding, refs);
    expect(res).toMatchObject({ category: ["medication"], criticality: "high", code: { coding: [{ code: "91000110" }] } });
  });
  it("obat tanpa BZA / bukan 91 → Issue; makanan pakai SNOMED", () => {
    expect(alergiKodeOf({ ...a, bzaKode: null })).toMatchObject({ ok: false, issue: { code: "kode-kosong", link: "L06" } });
    expect(alergiKodeOf({ ...a, bzaKode: "93001019" })).toMatchObject({ ok: false, issue: { code: "kode-tidak-valid" } });
    expect(alergiKodeOf({ ...a, category: "Makanan", snomedCode: "226963000" }))
      .toMatchObject({ ok: true, coding: { system: "http://snomed.info/sct", code: "226963000" } });
    expect(alergiKodeOf({ ...a, category: "Makanan" })).toMatchObject({ ok: false, issue: { code: "kode-kosong" } });
  });
});

describe("L14 procedure", () => {
  it("setiap kategori katalog tindakan terpetakan (null = sengaja tanpa category)", () => {
    for (const k of TindakanKategoriEnum.options) expect(k in PROCEDURE_CATEGORY).toBe(true);
    expect(PROCEDURE_CATEGORY.Diagnostik?.code).toBe("103693007");
  });
  it("reasonReference ke Condition Utama bila terkirim, cadangan reasonCode", () => {
    const p = { kode: "93.94", nama: "Nebulizer", waktu: t0, deleted: false };
    const withRef = toFhirProcedure(p, refs, { category: PROCEDURE_CATEGORY.Tindakan_Medis, reasonCondition: { ihsId: "C1", display: "J45 Asma" }, reason: { kode: "J45", nama: "Asma" } });
    expect(withRef).toMatchObject({ category: { coding: [{ code: "277132007" }] }, reasonReference: [{ reference: "Condition/C1" }] });
    expect(withRef.reasonCode).toBeUndefined();
    const fallback = toFhirProcedure(p, refs, { reason: { kode: "J45", nama: "Asma" } });
    expect(fallback.reasonCode).toBeDefined();
    expect(fallback.category).toBeUndefined();
  });
});

describe("L16 terminologi lab resmi", () => {
  const kat = kategoriKodeLabOf([
    { code: "58410-2", permintaanHasil: "Permintaan" },
    { code: "718-7", permintaanHasil: "Hasil" },
    { code: "2093-3", permintaanHasil: "Permintaan & Hasil" },
  ]);
  const sr = { resourceType: "ServiceRequest" as const, localId: "X", nama: "Tes" };
  const obs = { resourceType: "Observation" as const, localId: "Y", nama: "Param" };
  it("Permintaan → SR, Hasil → Observation, Permintaan & Hasil → keduanya", () => {
    expect(cekKodeLab(kat, "58410-2", "permintaan", sr)).toBeNull();
    expect(cekKodeLab(kat, "718-7", "hasil", obs)).toBeNull();
    expect(cekKodeLab(kat, "2093-3", "permintaan", sr)).toBeNull();
    expect(cekKodeLab(kat, "2093-3", "hasil", obs)).toBeNull();
  });
  it("salah kategori / tak ada di lampiran → ditahan", () => {
    expect(cekKodeLab(kat, "718-7", "permintaan", sr)).toMatchObject({ code: "kategori-salah", link: "L16" });
    expect(cekKodeLab(kat, "58410-2", "hasil", obs)).toMatchObject({ code: "kategori-salah" });
    expect(cekKodeLab(kat, "1234-5", "hasil", obs)).toMatchObject({ code: "kode-tidak-valid" });
  });
});

describe("L18/L20 Medication per paket (D6)", () => {
  const kfa = { poaKode: "93001019", poaNama: "Produk aktual", povKode: "92000001", povNama: "Produk virtual" };
  it("request: 93 diutamakan, cadangan 92 · dispense: hanya 93", () => {
    expect(kfaProductOf(kfa, "request")?.code).toBe("93001019");
    expect(kfaProductOf({ povKode: "92000001" }, "request")?.code).toBe("92000001");
    expect(kfaProductOf({ povKode: "92000001" }, "dispense")).toBeNull();
    expect(kfaProductOf({ poaKode: "92000001" }, "dispense")).toBeNull(); // prefix salah tidak diterima
  });
  it("identifier = id paket; resep dihapus → entered-in-error", () => {
    const m = toFhirMedication({ id: "OBAT", namaGenerik: "X", namaDagang: "Y", status: "Aktif", kfa }, "org",
      { identifier: "RESEP-1", untuk: "dispense", deleted: true });
    expect(m).toMatchObject({ identifier: [{ value: "RESEP-1" }], status: "entered-in-error", code: { coding: [{ code: "93001019" }] } });
  });
});

describe("L26 composition", () => {
  it("section bersarang, kosong dihilangkan, entry unik, narasi di Perjalanan Kunjungan", () => {
    const s = compositionSectionsOf(
      { ringkasanKlinis: "Pasien pulang <stabil>" },
      { keluhanUtama: ["Condition/C0"], diagnosis: ["Condition/C1", "Condition/C1"], tindakan: ["Procedure/PR1"] },
    );
    expect(s.map((x) => x.title)).toEqual(["Anamnesis", "Diagnosis", "Tindakan/Prosedur Medis", "Perjalanan Kunjungan Pasien"]);
    expect(s[0].section?.map((x) => x.title)).toEqual(["Keluhan Utama"]);
    expect(s[1].code).toBeUndefined(); // induk Diagnosis tanpa kode (contoh resmi)
    expect(s[1].section?.[0].entry).toEqual([{ reference: "Condition/C1" }]);
    expect(JSON.stringify(s[3].text)).toContain("&lt;stabil&gt;");
  });
  it("type per unit + attester saat TTE", () => {
    const c = toFhirComposition(
      { kunjunganId: "K", noKunjungan: "RJ-1", unit: "RawatJalan", ringkasanKlinis: "", signedAt: t0, createdAt: t0 },
      { orgId: "org", patient: { ihsId: "P1", nama: "P" }, encounter: { ihsId: "E1", nama: "E" }, author: { ihsId: "D1", nama: "dr. A" } },
      {},
    );
    expect(c).toMatchObject({ status: "final", type: { coding: [{ code: "88645-7" }] }, attester: [{ mode: "legal", party: { reference: "Practitioner/D1" } }] });
    expect(c.section).toEqual([]);
  });
});
