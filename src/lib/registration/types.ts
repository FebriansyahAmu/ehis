// REG0.1 — Kontrak data registrasi (mock-first, mirror schema target Prisma).
// Lihat TODO-REGISTRASI.md REG0/REG1.1 + docs/API-ANTREAN.md.

import type {
  PatientMaster,
  UnitKunjungan,
  GolonganDarah,
  StatusPerkawinan,
} from "@/lib/data";

// Subset unit yang bisa didaftarkan sebagai kunjungan baru (Lab/Rad = order, bukan kunjungan).
export type JenisKunjunganUnit = Extract<UnitKunjungan, "IGD" | "Rawat Jalan" | "Rawat Inap">;

export type JenisKunjungan = "Baru" | "Lanjutan";

// ── Pasien baru ────────────────────────────────────────────
// Input minimal untuk membentuk PatientMaster. Field turunan (id, noRM, age,
// terdaftar, riwayatKunjungan, billing) digenerate oleh store.
export interface NewPatientInput {
  nik: string;
  name: string;
  gender: "L" | "P";
  tanggalLahir: string;            // ISO yyyy-mm-dd (dari input date)
  tempatLahir: string;
  statusPerkawinan?: StatusPerkawinan;
  agama?: string;
  golonganDarah?: GolonganDarah;
  pekerjaan?: string;
  pendidikan?: string;
  suku?: string;
  kewarganegaraan?: string;

  // Alamat
  alamat: string;
  rtRw?: string;
  kelurahan?: string;
  kecamatan?: string;
  kota: string;
  provinsi: string;
  kodePos?: string;

  // Kontak
  noHp: string;
  email?: string;
  alergi?: string[];
  kontakDarurat: { nama: string; hubungan: string; noHp: string; alamat?: string };

  // Penjamin — default Umum bila tak diisi
  penjamin?: PatientMaster["penjamin"];

  // Forward-looking (REG1.1) — belum disimpan ke PatientMaster sampai field `noKK` ditambah.
  noKK?: string;

  // Asal pendaftaran
  sumber?: "Walk-in" | "MJKN";
}

// ── Pendaftaran kunjungan ──────────────────────────────────
// Input untuk membentuk KunjunganRecord baru pada seorang pasien (seed maupun baru).
export interface PendaftaranKunjunganInput {
  unit: JenisKunjunganUnit;
  tanggal?: string;                // default: hari ini
  dokter: string;
  keluhan: string;
  caraMasuk?: string;
  jenisKunjungan?: JenisKunjungan;

  poli?: string;                   // Rawat Jalan
  kelas?: string;                  // Rawat Inap
  triase?: number;                 // IGD (1..5)

  penjamin?: string;
  noPenjamin?: string;
  noSEP?: string;
  noRujukan?: string;
  kodeICD?: string;
  diagnosa?: string;

  kodebooking?: string;            // link ke antrean (spine TaskID — docs/API-ANTREAN.md)
}

// ── WS Pasien Baru (Mobile JKN → RS) ───────────────────────
// Payload `POST /pasien` (contracts/WS-ANTREAN-RS.md no.7). Dipakai untuk autofill
// PasienBaruModal saat pasien baru online.
export interface BpjsPesertaAutofill {
  nomorkartu: string;
  nik: string;
  nomorkk: string;
  nama: string;
  jeniskelamin: "L" | "P";
  tanggallahir: string;            // yyyy-mm-dd
  nohp: string;
  alamat: string;
  kodeprop: string;  namaprop: string;
  kodedati2: string; namadati2: string;
  kodekec: string;   namakec: string;
  kodekel: string;   namakel: string;
  rw: string;                      // ⚠️ berisi no. RT (label terbalik di spec BPJS)
  rt: string;                      // ⚠️ berisi no. RW
}
