// Representasi FHIR Patient & Practitioner dari master lokal (profil SATUSEHAT) — UNTUK DITAMPILKAN,
// TIDAK DIKIRIM. Playbook Prerequisites: IHS tenaga kesehatan & pasien diambil dengan GET by NIK;
// pemilik data resminya SDMK (Practitioner) dan Dukcapil/MPI (Patient). Representasi ini menunjukkan
// bentuk resource yang dicocokkan RS dengan data SatuSehat (identifier NIK, nama, gender, tanggal lahir).
// Pure: tanpa DB/IO. NIK diterima apa adanya (konsol mengirim versi dimasker).

import { FHIR_SYSTEM, type FhirResourceBase } from "@/lib/fhir/fhirShared";

const PROFILE = (r: "Patient" | "Practitioner") => `https://fhir.kemkes.go.id/r4/StructureDefinition/${r}`;
const EXT_BIRTH_PLACE = "https://fhir.kemkes.go.id/r4/StructureDefinition/birthPlace";
const EXT_CITIZENSHIP = "https://fhir.kemkes.go.id/r4/StructureDefinition/citizenshipStatus";

const GENDER: Record<string, "male" | "female"> = { L: "male", P: "female" };
const tanggal = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : undefined);

function nikIdentifier(nik: string | null) {
  return nik ? [{ use: "official", system: FHIR_SYSTEM.nik, value: nik }] : [];
}

export interface LocalPatientIdentity {
  nama: string;
  gender: string;
  tanggalLahir: Date | null;
  tempatLahir?: string | null;
  isWna: boolean;
  nik: string | null;
}

export function toFhirPatientView(p: LocalPatientIdentity, opts: { ihsId?: string | null } = {}): FhirResourceBase {
  const extension = [
    ...(p.tempatLahir ? [{ url: EXT_BIRTH_PLACE, valueAddress: { city: p.tempatLahir, country: "ID" } }] : []),
    { url: EXT_CITIZENSHIP, valueCode: p.isWna ? "WNA" : "WNI" },
  ];
  return {
    resourceType: "Patient",
    ...(opts.ihsId ? { id: opts.ihsId } : {}),
    meta: { profile: [PROFILE("Patient")] },
    identifier: nikIdentifier(p.nik),
    active: true,
    name: [{ use: "official", text: p.nama }],
    ...(GENDER[p.gender] ? { gender: GENDER[p.gender] } : {}),
    ...(tanggal(p.tanggalLahir) ? { birthDate: tanggal(p.tanggalLahir) } : {}),
    extension,
  } as FhirResourceBase;
}

export interface LocalPractitionerIdentity {
  namaLengkap: string;
  gelarDepan: string | null;
  gelarBelakang: string | null;
  jenisKelamin: string;
  tanggalLahir: Date | null;
  profesi: string | null;
  nik: string | null;
}

export function toFhirPractitionerView(p: LocalPractitionerIdentity, opts: { ihsId?: string | null } = {}): FhirResourceBase {
  const text = [p.gelarDepan, p.namaLengkap, p.gelarBelakang].filter(Boolean).join(" ");
  return {
    resourceType: "Practitioner",
    ...(opts.ihsId ? { id: opts.ihsId } : {}),
    meta: { profile: [PROFILE("Practitioner")] },
    identifier: nikIdentifier(p.nik),
    active: true,
    name: [{
      use: "official",
      text,
      ...(p.gelarDepan ? { prefix: [p.gelarDepan] } : {}),
      ...(p.gelarBelakang ? { suffix: [p.gelarBelakang] } : {}),
    }],
    ...(GENDER[p.jenisKelamin] ? { gender: GENDER[p.jenisKelamin] } : {}),
    ...(tanggal(p.tanggalLahir) ? { birthDate: tanggal(p.tanggalLahir) } : {}),
    // Kualifikasi resmi (STR/kode SDMK) milik SatuSehat; lokal hanya punya teks profesi.
    ...(p.profesi ? { qualification: [{ code: { text: p.profesi } }] } : {}),
  } as FhirResourceBase;
}
