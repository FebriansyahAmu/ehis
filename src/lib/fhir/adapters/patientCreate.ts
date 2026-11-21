// Payload POST Patient (pasien ber-NIK) — Playbook MPI "Pasien dengan NIK", langkah 2 "POST Create
// Patient record": dikirim HANYA bila GET by NIK tidak menemukan pasien. SatuSehat meneruskan
// elemen identitas ke Dukcapil untuk dicocokkan dengan data KTP → nama/tanggal lahir/jenis kelamin/
// alamat KTP harus sama persis dengan KTP (nama TANPA gelar).
//
// Wajib (tabel Playbook): identifier NIK · name · birthDate · gender · address + extension
// administrativeCode. Opsional: tempat lahir (birthPlace) · No. KK · telecom.
// Pure: tanpa DB/IO. NIK/KK diterima apa adanya (pratinjau konsol mengirim versi dimasker).

import { FHIR_SYSTEM, type FhirResourceBase } from "@/lib/fhir/fhirShared";

const SYS_KK = "https://fhir.kemkes.go.id/id/kk";
const EXT_ADMIN_CODE = "https://fhir.kemkes.go.id/r4/StructureDefinition/administrativeCode";
const EXT_BIRTH_PLACE = "https://fhir.kemkes.go.id/r4/StructureDefinition/birthPlace";
const EXT_CITIZENSHIP = "https://fhir.kemkes.go.id/r4/StructureDefinition/citizenshipStatus";
const SYS_MARITAL = "http://terminology.hl7.org/CodeSystem/v3-MaritalStatus";

const GENDER: Record<string, "male" | "female"> = { L: "male", P: "female" };
const MARITAL: Record<string, { code: string; display: string }> = {
  BelumKawin: { code: "S", display: "Never Married" },
  Kawin: { code: "M", display: "Married" },
  CeraiHidup: { code: "D", display: "Divorced" },
  CeraiMati: { code: "W", display: "Widowed" },
};

export interface LocalPatientAddress {
  alamat: string | null;
  rtRw: string | null;
  kodePos: string | null;
  provinsiKode: string | null;
  kotaKode: string | null;
  kotaNama: string | null;
  kecamatanKode: string | null;
  kelurahanKode: string | null;
}

export interface LocalPatientForCreate {
  nik: string | null;
  noKk: string | null;
  nama: string;
  gender: string;
  tanggalLahir: Date | null;
  tempatLahir: string | null;
  statusPerkawinan: string | null;
  noHp: string | null;
  isWna: boolean;
  isAnonim?: boolean;
  /** Alamat KTP (Dukcapil mencocokkan dengan KTP, bukan domisili). */
  alamatKtp: LocalPatientAddress | null;
}

/** Kode wilayah Kemendagri dotted (71.74.04.1004) → kode datar FHIR (7174041004). */
export const flatKode = (k: string | null | undefined) => (k ?? "").replace(/\D/g, "");

const KODE_LEN = { province: 2, city: 4, district: 6, village: 10 } as const;

/** "002/001", "2 / 1", "RT 002 RW 001" → { rt: "2", rw: "1" } (angka tanpa nol depan, seperti contoh Playbook). */
export function parseRtRw(v: string | null): { rt: string | null; rw: string | null } {
  const nums = (v ?? "").match(/\d+/g) ?? [];
  const clean = (n: string | undefined) => (n ? String(Number(n)) : null);
  return { rt: clean(nums[0]), rw: clean(nums[1]) };
}

function adminCodes(a: LocalPatientAddress) {
  return {
    province: flatKode(a.provinsiKode),
    city: flatKode(a.kotaKode),
    district: flatKode(a.kecamatanKode),
    village: flatKode(a.kelurahanKode),
  };
}

export interface PatientCreateCheck {
  /** Elemen wajib Playbook yang belum ada → POST diblokir. */
  kurang: string[];
  /** Elemen opsional yang sebaiknya dilengkapi (tidak memblokir). */
  saran: string[];
}

/** Cek kelengkapan sebelum POST. NIK dicek terpisah oleh service (dekripsi + 16 digit). */
export function checkPatientCreate(p: LocalPatientForCreate): PatientCreateCheck {
  const kurang: string[] = [];
  const saran: string[] = [];
  if (p.isAnonim) kurang.push("Pasien anonim (Mr.X) — lengkapi identitas dulu");
  else if (p.isWna) kurang.push("Pasien WNA — POST Patient by NIK hanya untuk WNI");
  else if (!p.nik) kurang.push("NIK 16 digit");
  if (!p.nama.trim()) kurang.push("Nama sesuai KTP");
  if (!GENDER[p.gender]) kurang.push("Jenis kelamin");
  if (!p.tanggalLahir) kurang.push("Tanggal lahir");

  const a = p.alamatKtp;
  if (!a) {
    kurang.push("Alamat KTP");
  } else {
    if (!a.alamat?.trim()) kurang.push("Alamat KTP (jalan/dusun)");
    const kode = adminCodes(a);
    const label = { province: "provinsi", city: "kabupaten/kota", district: "kecamatan", village: "kelurahan/desa" } as const;
    const salah = (Object.keys(KODE_LEN) as (keyof typeof KODE_LEN)[]).filter((k) => kode[k].length !== KODE_LEN[k]);
    if (salah.length) {
      kurang.push(`Kode wilayah Kemendagri ${salah.map((k) => label[k]).join(", ")} — pilih ulang wilayah di data pasien`);
    } else if (!(kode.city.startsWith(kode.province) && kode.district.startsWith(kode.city) && kode.village.startsWith(kode.district))) {
      kurang.push("Kode wilayah tidak berjenjang (kelurahan bukan bagian kecamatan/kota) — pilih ulang wilayah");
    }
    const { rt, rw } = parseRtRw(a.rtRw);
    if (!rt || !rw) saran.push("RT/RW alamat KTP");
    if (!a.kodePos?.trim()) saran.push("Kode pos");
  }
  if (!p.tempatLahir?.trim()) saran.push("Tempat lahir");
  if (!p.noHp?.trim()) saran.push("No. HP");
  return { kurang, saran };
}

/** Body POST /Patient. Panggil HANYA bila `checkPatientCreate(p).kurang` kosong. */
export function toFhirPatientCreate(p: LocalPatientForCreate): FhirResourceBase {
  const a = p.alamatKtp;
  const kode = a ? adminCodes(a) : null;
  const { rt, rw } = parseRtRw(a?.rtRw ?? null);
  const marital = p.statusPerkawinan ? MARITAL[p.statusPerkawinan] : undefined;
  const hp = p.noHp?.replace(/[^\d+]/g, "");

  return {
    resourceType: "Patient",
    identifier: [
      { use: "official", system: FHIR_SYSTEM.nik, value: p.nik },
      ...(p.noKk ? [{ use: "official", system: SYS_KK, value: p.noKk }] : []),
    ],
    active: true,
    name: [{ use: "official", text: p.nama.trim() }],
    ...(hp ? { telecom: [{ system: "phone", value: hp, use: "mobile" }] } : {}),
    gender: GENDER[p.gender],
    birthDate: p.tanggalLahir?.toISOString().slice(0, 10),
    deceasedBoolean: false,
    ...(a && kode
      ? {
          address: [{
            use: "home",
            line: [a.alamat?.trim()],
            ...(a.kotaNama ? { city: a.kotaNama } : {}),
            ...(a.kodePos?.trim() ? { postalCode: a.kodePos.trim() } : {}),
            country: "ID",
            extension: [{
              url: EXT_ADMIN_CODE,
              extension: [
                { url: "province", valueCode: kode.province },
                { url: "city", valueCode: kode.city },
                { url: "district", valueCode: kode.district },
                { url: "village", valueCode: kode.village },
                ...(rt ? [{ url: "rt", valueCode: rt }] : []),
                ...(rw ? [{ url: "rw", valueCode: rw }] : []),
              ],
            }],
          }],
        }
      : {}),
    ...(marital ? { maritalStatus: { coding: [{ system: SYS_MARITAL, ...marital }], text: marital.display } } : {}),
    multipleBirthInteger: 0,
    communication: [{
      language: { coding: [{ system: "urn:ietf:bcp:47", code: "id-ID", display: "Indonesian" }], text: "Indonesian" },
      preferred: true,
    }],
    extension: [
      ...(p.tempatLahir?.trim() ? [{ url: EXT_BIRTH_PLACE, valueAddress: { city: p.tempatLahir.trim(), country: "ID" } }] : []),
      { url: EXT_CITIZENSHIP, valueCode: "WNI" },
    ],
  } as FhirResourceBase;
}
