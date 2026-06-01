// Adapter FormState (vocab form lama) → RegisterPatientInput (kontrak API kanonik).
// Memetakan perbedaan vocab: statusPerkawinan Dukcapil, golongan darah + rhesus, sumber.
// Validasi otoritatif tetap di server (Zod) — ini hanya pembentukan payload.

import type { FormState } from "./pasienBaruTypes";
import type { PasienBaruPrefill } from "./PasienBaruModal";
import type { RegisterPatientInput } from "@/lib/api/patients";

type SP = NonNullable<RegisterPatientInput["statusPerkawinan"]>;
const STATUS_PERKAWINAN: Record<string, SP> = {
  "Belum Menikah": "BelumKawin",
  Menikah: "Kawin",
  "Cerai Hidup": "CeraiHidup",
  "Cerai Mati": "CeraiMati",
};

type Gol = NonNullable<RegisterPatientInput["golonganDarah"]>;
type Rh = NonNullable<RegisterPatientInput["rhesus"]>;
/** "A+" → { golonganDarah:"A", rhesus:"Positif" }. "Tidak Diketahui" → TidakDiketahui. */
function parseGolDarah(v: string): { golonganDarah?: Gol; rhesus?: Rh } {
  if (!v || v === "Tidak Diketahui") return v ? { golonganDarah: "TidakDiketahui" } : {};
  const sign = v.slice(-1);
  const abo = v.slice(0, -1) as Gol;
  if (sign === "+" || sign === "-") return { golonganDarah: abo, rhesus: sign === "+" ? "Positif" : "Negatif" };
  return { golonganDarah: v as Gol };
}

const undef = (s: string): string | undefined => (s.trim() ? s.trim() : undefined);

export function formToRegisterInput(form: FormState, prefill?: PasienBaruPrefill): RegisterPatientInput {
  const gol = parseGolDarah(form.golonganDarah);

  const alamatKtp: RegisterPatientInput["alamatKtp"] = {
    jenis: "KTP",
    alamat: undef(form.alamat),
    rtRw: undef(form.rtRw),
    kodePos: undef(form.kodePos),
    kelurahanNama: undef(form.kelurahan),
    kecamatanNama: undef(form.kecamatan),
    kotaNama: undef(form.kota),
    provinsiNama: undef(form.provinsi),
  };

  const alamatDomisili: RegisterPatientInput["alamatDomisili"] =
    form.samaAlamat === "tidak"
      ? {
          jenis: "Domisili",
          alamat: undef(form.alamatDomisili),
          kodePos: undef(form.kodePosDomisili),
          kelurahanNama: undef(form.kelurahanDomisili),
          kecamatanNama: undef(form.kecamatanDomisili),
          kotaNama: undef(form.kotaDomisili),
          provinsiNama: undef(form.provinsiDomisili),
        }
      : undefined;

  const penjamin: RegisterPatientInput["penjamin"] = prefill?.penjamin
    ? [
        {
          tipe: prefill.penjamin.tipe,
          nama: prefill.penjamin.nama,
          nomor: prefill.penjamin.nomor,
          kelas: prefill.penjamin.kelas,
          isPrimer: true,
        },
      ]
    : undefined;

  const kontakDarurat: RegisterPatientInput["kontakDarurat"] = form.kontakDaruratNama.trim()
    ? [
        {
          nama: form.kontakDaruratNama.trim(),
          hubungan: form.kontakDaruratHubungan,
          noHp: form.kontakDaruratNoHp.trim(),
        },
      ]
    : undefined;

  return {
    nik: form.nik,
    nama: form.namaLengkap.trim(),
    gender: (form.gender || "L") as "L" | "P",
    isWna: false,
    isAnonim: false,
    tempatLahir: undef(form.tempatLahir),
    tanggalLahir: undef(form.tanggalLahir),
    golonganDarah: gol.golonganDarah,
    rhesus: gol.rhesus,
    statusPerkawinan: form.statusPerkawinan ? STATUS_PERKAWINAN[form.statusPerkawinan] : undefined,
    agama: undef(form.agama),
    pendidikan: undef(form.pendidikan),
    pekerjaan: undef(form.pekerjaan),
    suku: undef(form.suku),
    kewarganegaraan: form.kewarganegaraan || "WNI",
    noHp: undef(form.noHp),
    email: undef(form.email),
    alamatKtp,
    alamatDomisili,
    penjamin,
    alergiAwal: form.alergi.length ? form.alergi.map((nama) => ({ nama })) : undefined,
    kontakDarurat,
    sumberDaftar: "WalkIn",
  };
}
