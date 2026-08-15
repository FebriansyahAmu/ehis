// Adapter FormState → RegisterPatientInput (kontrak API kanonik).
// Memetakan: mode identitas (WNI/WNA/Anonim) → isWna/isAnonim + jalur NIK/paspor;
// golongan darah + rhesus; status perkawinan Dukcapil; kode wilayah Kemendagri (dari
// kodeWilayah dotted); perkiraan umur Mr.X → estimasi tanggal lahir; alergi ber-severitas.
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
/** Nama pasien → UPPERCASE (rapi & konsisten); undefined bila kosong. */
const undefUpper = (s: string): string | undefined => (s.trim() ? s.trim().toUpperCase() : undefined);

/** Kode wilayah Kemendagri dotted "11.01.03.2001" → kode per level (leluhur = prefix). */
function wilayahCodes(kodeWilayah: string): {
  provinsiKode?: string; kotaKode?: string; kecamatanKode?: string; kelurahanKode?: string;
} {
  const p = (kodeWilayah || "").trim();
  if (!p.includes(".") && !p) return {};
  const parts = p.split(".");
  return {
    provinsiKode: parts[0] || undefined,
    kotaKode: parts.length >= 2 ? parts.slice(0, 2).join(".") : undefined,
    kecamatanKode: parts.length >= 3 ? parts.slice(0, 3).join(".") : undefined,
    kelurahanKode: parts.length >= 4 ? parts.slice(0, 4).join(".") : undefined,
  };
}

export function formToRegisterInput(form: FormState, prefill?: PasienBaruPrefill): RegisterPatientInput {
  const anon = form.identitas === "Anonim";
  const wna = form.identitas === "WNA";
  const gol = parseGolDarah(form.golonganDarah);

  // Tanggal lahir: Anonim → estimasi dari perkiraan umur (tahun lahir perkiraan, 1 Jan).
  let tanggalLahir = undef(form.tanggalLahir);
  if (anon && form.perkiraanUmur.trim()) {
    const umur = parseInt(form.perkiraanUmur, 10);
    if (!Number.isNaN(umur) && umur > 0) tanggalLahir = `${new Date().getFullYear() - umur}-01-01`;
  }

  // Alamat KTP — di-drop untuk Anonim bila kosong total.
  const hasKtp = !!(form.alamat.trim() || form.provinsi || form.kota);
  const alamatKtp: RegisterPatientInput["alamatKtp"] = (anon && !hasKtp)
    ? undefined
    : {
        jenis: "KTP",
        alamat: undef(form.alamat),
        rtRw: undef(form.rtRw),
        kodePos: undef(form.kodePos),
        provinsiNama: undef(form.provinsi),
        kotaNama: undef(form.kota),
        kecamatanNama: undef(form.kecamatan),
        kelurahanNama: undef(form.kelurahan),
        ...wilayahCodes(form.kodeWilayah),
      };

  const alamatDomisili: RegisterPatientInput["alamatDomisili"] =
    !anon && form.samaAlamat === "tidak"
      ? {
          jenis: "Domisili",
          alamat: undef(form.alamatDomisili),
          rtRw: undef(form.rtRwDomisili),
          kodePos: undef(form.kodePosDomisili),
          provinsiNama: undef(form.provinsiDomisili),
          kotaNama: undef(form.kotaDomisili),
          kecamatanNama: undef(form.kecamatanDomisili),
          kelurahanNama: undef(form.kelurahanDomisili),
          ...wilayahCodes(form.kodeWilayahDomisili),
        }
      : undefined;

  const penjamin: RegisterPatientInput["penjamin"] = prefill?.penjamin
    ? [{
        tipe: prefill.penjamin.tipe,
        nama: prefill.penjamin.nama,
        nomor: prefill.penjamin.nomor,
        kelas: prefill.penjamin.kelas,
        isPrimer: true,
      }]
    : undefined;

  // Kontak darurat hanya dikirim bila nama + noHp lengkap (server: noHp min 6).
  const kontakDarurat: RegisterPatientInput["kontakDarurat"] =
    form.kontakDaruratNama.trim() && form.kontakDaruratNoHp.trim()
      ? [{
          nama: form.kontakDaruratNama.trim().toUpperCase(),
          hubungan: form.kontakDaruratHubungan || "Lainnya",
          noHp: form.kontakDaruratNoHp.trim(),
        }]
      : undefined;

  const alergiAwal: RegisterPatientInput["alergiAwal"] = form.alergi.length
    ? form.alergi.map((a) => ({
        nama: a.nama,
        reaksi: a.reaksi.trim() || undefined,
        tingkat: (a.tingkat || undefined) as "Ringan" | "Sedang" | "Berat" | undefined,
      }))
    : undefined;

  return {
    nik: (!anon && !wna) ? form.nik : undefined,
    noKK: (!anon && !wna) ? undef(form.noKK) : undefined,
    noPaspor: wna ? undef(form.noPaspor) : undefined,
    isWna: wna,
    isAnonim: anon,
    nama: form.namaLengkap.trim().toUpperCase(),
    gelarDepan: anon ? undefined : undef(form.gelarDepan),
    gelarBelakang: anon ? undefined : undef(form.gelarBelakang),
    namaIbu: anon ? undefined : undefUpper(form.namaIbu),
    catatanIdentitas: anon ? undef(form.catatanIdentitas) : undefined,
    gender: (form.gender || "L") as "L" | "P",
    tempatLahir: undef(form.tempatLahir),
    tanggalLahir,
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
    alergiAwal,
    kontakDarurat,
    sumberDaftar: "WalkIn",
  };
}
