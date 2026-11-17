import { describe, expect, it } from "vitest";
import {
  ALLERGY_CATEGORY, CONDITION_VERIFICATION, DISCHARGE_DISPOSITION, ENCOUNTER_CLASS, KELAS_RANK,
  SERVICE_CLASS_INPATIENT, UPGRADE_CLASS, lookup,
} from "./conceptMap";
import { DisposisiJenis } from "@/lib/schemas/disposisi/disposisi";
import { canonicalJson, toFhirDateTime } from "./fhirShared";
import { LINKS, LINK_BY_ID } from "./links/registry";
import { diagnosaFinalOf, diagnosaUtamaOf } from "./links/diagnosa";

describe("conceptMap", () => {
  it("setiap jenis disposisi lokal punya kode dischargeDisposition", () => {
    for (const j of DisposisiJenis.options) expect(DISCHARGE_DISPOSITION[j]?.code).toBeTruthy();
  });

  it("class Encounter sesuai playbook per unit", () => {
    expect(ENCOUNTER_CLASS.IGD.code).toBe("EMER");
    expect(ENCOUNTER_CLASS.RawatJalan.code).toBe("AMB");
    expect(ENCOUNTER_CLASS.RawatInap.code).toBe("IMP");
  });

  it("kelas RI tanpa kode playbook (ICU/HCU/Isolasi) dipetakan null", () => {
    expect(SERVICE_CLASS_INPATIENT.ICU).toBeNull();
    expect(SERVICE_CLASS_INPATIENT.Kelas_1?.code).toBe("1");
    expect(lookup(KELAS_RANK, "VIP")).toBeGreaterThan(lookup(KELAS_RANK, "Kelas_3") ?? 0);
  });

  it("display upgrade kelas mengikuti tabel playbook RI", () => {
    expect(UPGRADE_CLASS["titip-rawat"].display).toBe("Titip Kelas Perawatan");
  });

  it("lookup aman untuk nilai tak dikenal / prototype", () => {
    expect(lookup(CONDITION_VERIFICATION, "Pasti")?.code).toBe("confirmed");
    expect(lookup(CONDITION_VERIFICATION, "toString")).toBeUndefined();
    expect(lookup(ALLERGY_CATEGORY, null)).toBeUndefined();
  });
});

describe("fhirShared", () => {
  it("toFhirDateTime mengirim UTC +00:00 (playbook), tanpa milidetik", () => {
    // 2023-08-23 17:35:12 WIB = 10:35:12 UTC (contoh playbook)
    expect(toFhirDateTime(new Date("2023-08-23T17:35:12.345+07:00"))).toBe("2023-08-23T10:35:12+00:00");
  });

  it("canonicalJson stabil terhadap urutan key, urutan array dipertahankan", () => {
    const a = { b: 1, a: { d: [3, { y: 1, x: 2 }], c: null } };
    const b = { a: { c: null, d: [3, { x: 2, y: 1 }] }, b: 1 };
    expect(canonicalJson(a)).toBe(canonicalJson(b));
    expect(canonicalJson({ v: [2, 1] })).not.toBe(canonicalJson({ v: [1, 2] }));
  });
});

describe("registry link", () => {
  it("L01–L26 lengkap, unik, dan ber-dokumen", () => {
    expect(LINKS).toHaveLength(26);
    expect(new Set(LINKS.map((l) => l.id)).size).toBe(26);
    for (const l of LINKS) {
      expect(LINK_BY_ID[l.id]).toBe(l);
      expect(l.doc).toMatch(new RegExp(`^${l.id}-[a-z-]+\\.md$`));
    }
  });
});

describe("helper diagnosa (L13)", () => {
  const d = (id: string, tipe: string, status = "Pasti", deleted = false, kode = "A00") =>
    ({ id, tipe, status, deletedAt: deleted ? new Date() : null, kodeIcd10: kode, namaDiagnosis: id });

  it("diagnosa final: Pasti · Utama dulu · urut input · tanpa terhapus/komorbid/dicurigai", () => {
    const rows = [d("s1", "Sekunder"), d("u1", "Utama"), d("x", "Utama", "Dicurigai"), d("k", "Komorbid"), d("s2", "Sekunder"), d("del", "Utama", "Pasti", true)];
    expect(diagnosaFinalOf(rows).map((r) => r.id)).toEqual(["u1", "s1", "s2"]);
  });

  it("diagnosa utama = alasan order, kode dinormalkan", () => {
    expect(diagnosaUtamaOf([d("u", "Utama", "Pasti", false, " i10 ")])).toEqual({ kode: "I10", nama: "u" });
    expect(diagnosaUtamaOf([d("u", "Utama", "Pasti", false, "  ")])).toBeUndefined();
  });
});
