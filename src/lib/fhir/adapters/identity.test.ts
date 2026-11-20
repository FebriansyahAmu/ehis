// Unit test representasi FHIR Patient & Practitioner (profil SATUSEHAT, tampilan konsol — tidak dikirim).

import { describe, it, expect } from "vitest";
import { toFhirPatientView, toFhirPractitionerView } from "@/lib/fhir/adapters/identity";

describe("toFhirPatientView", () => {
  it("identifier NIK, nama, gender, tanggal lahir, extension tempat lahir & kewarganegaraan", () => {
    const r = toFhirPatientView(
      { nama: "BUDI SANTOSO", gender: "L", tanggalLahir: new Date("1980-05-17T00:00:00.000Z"), tempatLahir: "Bandung", isWna: false, nik: "3201••••••••0001" },
      { ihsId: "P02478375538" },
    ) as unknown as Record<string, unknown>;

    expect(r).toMatchObject({
      resourceType: "Patient",
      id: "P02478375538",
      meta: { profile: ["https://fhir.kemkes.go.id/r4/StructureDefinition/Patient"] },
      identifier: [{ use: "official", system: "https://fhir.kemkes.go.id/id/nik", value: "3201••••••••0001" }],
      name: [{ use: "official", text: "BUDI SANTOSO" }],
      gender: "male",
      birthDate: "1980-05-17",
    });
    expect(r.extension).toEqual([
      { url: "https://fhir.kemkes.go.id/r4/StructureDefinition/birthPlace", valueAddress: { city: "Bandung", country: "ID" } },
      { url: "https://fhir.kemkes.go.id/r4/StructureDefinition/citizenshipStatus", valueCode: "WNI" },
    ]);
  });

  it("tanpa NIK & belum terpetakan: identifier kosong, tanpa id; WNA", () => {
    const r = toFhirPatientView({ nama: "X", gender: "P", tanggalLahir: null, isWna: true, nik: null }) as unknown as Record<string, unknown>;
    expect(r.id).toBeUndefined();
    expect(r.identifier).toEqual([]);
    expect(r.gender).toBe("female");
    expect(r.birthDate).toBeUndefined();
    expect(r.extension).toEqual([{ url: "https://fhir.kemkes.go.id/r4/StructureDefinition/citizenshipStatus", valueCode: "WNA" }]);
  });
});

describe("toFhirPractitionerView", () => {
  it("nama bergelar (prefix/suffix), gender, kualifikasi teks profesi", () => {
    const r = toFhirPractitionerView(
      {
        namaLengkap: "Budi Santoso", gelarDepan: "dr.", gelarBelakang: "Sp.JP", jenisKelamin: "L",
        tanggalLahir: new Date("1975-01-02T00:00:00.000Z"), profesi: "Dokter Spesialis", nik: "3171••••••••0002",
      },
      { ihsId: "N10000001" },
    ) as unknown as Record<string, unknown>;

    expect(r).toMatchObject({
      resourceType: "Practitioner",
      id: "N10000001",
      meta: { profile: ["https://fhir.kemkes.go.id/r4/StructureDefinition/Practitioner"] },
      identifier: [{ system: "https://fhir.kemkes.go.id/id/nik", value: "3171••••••••0002" }],
      name: [{ use: "official", text: "dr. Budi Santoso Sp.JP", prefix: ["dr."], suffix: ["Sp.JP"] }],
      gender: "male",
      birthDate: "1975-01-02",
      qualification: [{ code: { text: "Dokter Spesialis" } }],
    });
  });
});
