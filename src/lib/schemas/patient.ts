// Zod schema + DTO Patient (FLOWS §5). Input divalidasi di boundary Route SEBELUM Service.
// Vocab = kanonik (selaras enum Prisma pendaftaran). Adapter frontend memetakan saat swap (PAT5).
// Mapping entity→DTO ada di Service (butuh clock+crypto) — di sini hanya TIPE DTO.

import { z } from "zod";

// ── Enum (mirror prisma pendaftaran) ──────────────────────────────────────────
export const Gender = z.enum(["L", "P"]);
export const GolonganDarah = z.enum(["A", "B", "AB", "O", "TidakDiketahui"]);
export const Rhesus = z.enum(["Positif", "Negatif", "TidakDiketahui"]);
export const StatusPerkawinan = z.enum(["BelumKawin", "Kawin", "CeraiHidup", "CeraiMati"]);
export const TipePenjamin = z.enum(["Umum", "BPJS_Non_PBI", "BPJS_PBI", "Asuransi", "Jamkesda"]);
export const JenisAlamat = z.enum(["KTP", "Domisili"]);
export const SumberPendaftaran = z.enum(["WalkIn", "MJKN", "Kiosk"]);

const NIK_RE = /^\d{16}$/;
const ISO_DATE = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD");
const noHp = z.string().trim().min(6).max(20).optional();

// ── Sub-objek ─────────────────────────────────────────────────────────────────
export const AddressInput = z.object({
  jenis: JenisAlamat.default("KTP"),
  alamat: z.string().trim().max(500).optional(),
  rtRw: z.string().trim().max(20).optional(),
  kodePos: z.string().trim().max(10).optional(),
  // Kode + nama wilayah Kemendagri (FHIR administrativeCode).
  provinsiKode: z.string().optional(), provinsiNama: z.string().optional(),
  kotaKode: z.string().optional(), kotaNama: z.string().optional(),
  kecamatanKode: z.string().optional(), kecamatanNama: z.string().optional(),
  kelurahanKode: z.string().optional(), kelurahanNama: z.string().optional(),
  // Kode BPJS apa adanya (≠ Kemendagri).
  bpjsKodeProp: z.string().optional(), bpjsKodeDati2: z.string().optional(),
  bpjsKodeKec: z.string().optional(), bpjsKodeKel: z.string().optional(),
});

export const PenjaminInput = z.object({
  tipe: TipePenjamin,
  nama: z.string().trim().min(1).max(120),
  nomor: z.string().trim().max(40).optional(), // no kartu — di-enc di Service
  kelas: z.enum(["1", "2", "3"]).optional(),
  berlakuSampai: ISO_DATE.optional(),
  noPolis: z.string().trim().max(60).optional(),
  isPrimer: z.boolean().default(true),
});

export const AlergiInput = z.object({
  nama: z.string().trim().min(1).max(120),
  reaksi: z.string().trim().max(200).optional(),
  tingkat: z.enum(["Ringan", "Sedang", "Berat"]).optional(),
});

export const KontakDaruratInput = z.object({
  nama: z.string().trim().min(1).max(120),
  hubungan: z.string().trim().min(1).max(40),
  noHp: z.string().trim().min(6).max(20),
  alamat: z.string().trim().max(500).optional(),
});

// ── Register (POST /patients) ───────────────────────────────────────────────--
export const RegisterPatientInput = z
  .object({
    // Identitas
    nik: z.string().regex(NIK_RE, "NIK harus 16 digit").optional(),
    noKK: z.string().regex(NIK_RE, "No. KK harus 16 digit").optional(),
    isWna: z.boolean().default(false),
    noPaspor: z.string().trim().min(4).max(20).optional(),
    isAnonim: z.boolean().default(false),

    nama: z.string().trim().min(1).max(160),
    gender: Gender,
    tempatLahir: z.string().trim().max(120).optional(),
    tanggalLahir: ISO_DATE.optional(),
    golonganDarah: GolonganDarah.optional(),
    rhesus: Rhesus.optional(),
    statusPerkawinan: StatusPerkawinan.optional(),
    agama: z.string().trim().max(40).optional(),
    pendidikan: z.string().trim().max(40).optional(),
    pekerjaan: z.string().trim().max(80).optional(),
    suku: z.string().trim().max(60).optional(),
    kewarganegaraan: z.string().trim().max(60).default("WNI"),

    // Kontak
    noHp,
    email: z.string().trim().email().max(160).optional(),

    // Alamat (KTP + domisili opsional)
    alamatKtp: AddressInput.optional(),
    alamatDomisili: AddressInput.optional(),

    // Penjamin / alergi / kontak darurat
    penjamin: z.array(PenjaminInput).max(3).optional(),
    alergiAwal: z.array(AlergiInput).max(20).optional(),
    kontakDarurat: z.array(KontakDaruratInput).max(5).optional(),

    sumberDaftar: SumberPendaftaran.optional(),
  })
  // Aturan identitas selaras CHECK DB: non-anonim WAJIB NIK atau paspor.
  .superRefine((v, ctx) => {
    if (v.isAnonim) return;
    if (v.isWna) {
      if (!v.noPaspor) ctx.addIssue({ code: "custom", path: ["noPaspor"], message: "WNA wajib nomor paspor" });
    } else if (!v.nik) {
      ctx.addIssue({ code: "custom", path: ["nik"], message: "NIK wajib (atau tandai WNA/anonim)" });
    }
  });

// ── Complete draft (PATCH /patients/:id) ──────────────────────────────────────
// Semua opsional — melengkapi pasien draft → Service set dataLengkap=true.
export const CompletePatientInput = z.object({
  nik: z.string().regex(NIK_RE).optional(),
  noKK: z.string().regex(NIK_RE).optional(),
  noPaspor: z.string().trim().min(4).max(20).optional(),
  nama: z.string().trim().min(1).max(160).optional(),
  gender: Gender.optional(),
  tempatLahir: z.string().trim().max(120).optional(),
  tanggalLahir: ISO_DATE.optional(),
  golonganDarah: GolonganDarah.optional(),
  rhesus: Rhesus.optional(),
  statusPerkawinan: StatusPerkawinan.optional(),
  agama: z.string().trim().max(40).optional(),
  pendidikan: z.string().trim().max(40).optional(),
  pekerjaan: z.string().trim().max(80).optional(),
  suku: z.string().trim().max(60).optional(),
  kewarganegaraan: z.string().trim().max(60).optional(),
  noHp,
  email: z.string().trim().email().max(160).optional(),
  alamatKtp: AddressInput.optional(),
  alamatDomisili: AddressInput.optional(),
  /** Optimistic concurrency (FLOWS §7) — wajib agar update aman. */
  expectedVersion: z.number().int().nonnegative(),
});

// ── Search/list (GET /patients) ───────────────────────────────────────────────
export const SearchQuery = z.object({
  q: z.string().trim().min(1).max(120).optional(),
  by: z.enum(["nik", "rm", "nama"]).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const IdParam = z.object({ id: z.string().uuid("ID tidak valid") });

// ── Tipe inferensi ─────────────────────────────────────────────────────────---
export type RegisterPatientInput = z.infer<typeof RegisterPatientInput>;
export type CompletePatientInput = z.infer<typeof CompletePatientInput>;
export type SearchQuery = z.infer<typeof SearchQuery>;
export type AddressInput = z.infer<typeof AddressInput>;
export type PenjaminInput = z.infer<typeof PenjaminInput>;

// ── DTO output (NIK/noKartu di-MASK; entity Prisma TIDAK bocor) ────────────────
export interface PatientAddressDTO {
  jenis: "KTP" | "Domisili";
  alamat: string | null;
  rtRw: string | null;
  kodePos: string | null;
  provinsiNama: string | null;
  kotaNama: string | null;
  kecamatanNama: string | null;
  kelurahanNama: string | null;
}

export interface PatientPenjaminDTO {
  id: string;
  tipe: string;
  nama: string;
  nomorMasked: string | null;
  kelas: string | null;
  isPrimer: boolean;
}

export interface PatientDTO {
  id: string;
  noRm: string;
  nikMasked: string | null;
  nama: string;
  gender: "L" | "P";
  tempatLahir: string | null;
  tanggalLahir: string | null; // ISO yyyy-mm-dd
  umur: number | null; // dihitung via clock
  golonganDarah: string | null;
  rhesus: string | null;
  statusPerkawinan: string | null;
  agama: string | null;
  pendidikan: string | null;
  pekerjaan: string | null;
  suku: string | null;
  kewarganegaraan: string;
  isWna: boolean;
  isAnonim: boolean;
  dataLengkap: boolean;
  noHp: string | null;
  email: string | null;
  idSatusehat: string | null;
  sumberDaftar: string | null;
  version: number;
  createdAt: string;
  alamat: PatientAddressDTO[];
  penjamin: PatientPenjaminDTO[];
  alergiAwal: { nama: string; reaksi: string | null; tingkat: string | null }[];
  kontakDarurat: { nama: string; hubungan: string; noHp: string; alamat: string | null }[];
}
