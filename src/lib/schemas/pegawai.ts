// Zod schema + DTO Pegawai (master/kepegawaian) — FLOWS §5. Input divalidasi di
// boundary Route SEBELUM Service. Vocab kanonik selaras enum Prisma master.Pegawai.
// Mapping entity→DTO ada di Service (butuh clock+crypto) — di sini hanya TIPE DTO.

import { z } from "zod";

// ── Enum (mirror prisma master.Pegawai) ───────────────────────────────────────
export const JenisKelamin = z.enum(["L", "P"]);
export const StatusPegawai = z.enum(["ASN", "Outsourcing", "Honorer", "Magang", "Mitra"]);

const NIK_RE = /^\d{16}$/;
const ISO_DATE = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD");
const noHp = z.string().trim().min(6).max(20);

// ── Sub-objek ─────────────────────────────────────────────────────────────────
export const KontakDaruratInput = z.object({
  nama: z.string().trim().min(1).max(120),
  hubungan: z.string().trim().min(1).max(40),
  noHp,
  alamat: z.string().trim().max(500).optional(),
});

// Field kepegawaian inti (dipakai create + sebagian update).
const NIP = z.string().trim().min(3).max(40);
const NamaLengkap = z.string().trim().min(1).max(160);
const GelarDepan = z.string().trim().max(40).optional();
const GelarBelakang = z.string().trim().max(60).optional();
const TempatLahir = z.string().trim().max(120).optional();
const UnitKerja = z.string().trim().max(120).optional();
const Agama = z.string().trim().max(40).optional();
const Profesi = z.string().trim().max(60).optional();
const Alamat = z.string().trim().max(500).optional();
const Email = z.string().trim().email().max(160).optional();
const Foto = z.string().trim().max(1000).optional();
const PractitionerId = z.string().uuid("practitionerId tidak valid");

// ── Create (POST /master/pegawai) ─────────────────────────────────────────────
// NIK & NIP WAJIB (kolom NOT NULL + @unique di DB). NIP auto-generate non-ASN =
// fase later (butuh counter/sequence khusus — lihat TODOS_BACKEND B1.1).
export const CreatePegawaiInput = z.object({
  nik: z.string().regex(NIK_RE, "NIK harus 16 digit"),
  nip: NIP,
  namaLengkap: NamaLengkap,
  gelarDepan: GelarDepan,
  gelarBelakang: GelarBelakang,
  jenisKelamin: JenisKelamin,
  agama: Agama,
  tempatLahir: TempatLahir,
  tanggalLahir: ISO_DATE.optional(),
  statusPegawai: StatusPegawai,
  profesi: Profesi,
  unitKerja: UnitKerja,
  tglMasuk: ISO_DATE.optional(),
  alamat: Alamat,
  noHp: noHp.optional(),
  email: Email,
  foto: Foto,
  practitionerId: PractitionerId.optional(),
  kontakDarurat: z.array(KontakDaruratInput).max(5).optional(),
});

// ── Update (PATCH /master/pegawai/:id) ────────────────────────────────────────
// Semua opsional + version guard. `practitionerId` nullable → kirim null utk lepas
// tautan Dokter. `kontakDarurat` bila DIKIRIM → replace seluruh daftar (else skip).
export const UpdatePegawaiInput = z.object({
  nik: z.string().regex(NIK_RE).optional(),
  nip: NIP.optional(),
  namaLengkap: NamaLengkap.optional(),
  gelarDepan: GelarDepan,
  gelarBelakang: GelarBelakang,
  jenisKelamin: JenisKelamin.optional(),
  agama: Agama,
  tempatLahir: TempatLahir,
  tanggalLahir: ISO_DATE.optional(),
  statusPegawai: StatusPegawai.optional(),
  profesi: Profesi,
  unitKerja: UnitKerja,
  tglMasuk: ISO_DATE.optional(),
  alamat: Alamat,
  noHp: noHp.optional(),
  email: Email,
  foto: Foto,
  practitionerId: PractitionerId.nullable().optional(),
  isActive: z.boolean().optional(),
  kontakDarurat: z.array(KontakDaruratInput).max(5).optional(),
  /** Optimistic concurrency (FLOWS §7) — wajib agar update aman. */
  expectedVersion: z.number().int().nonnegative(),
});

// ── List/search (GET /master/pegawai) ─────────────────────────────────────────
export const ListQuery = z.object({
  q: z.string().trim().min(1).max(120).optional(), // nama/NIP (trigram)
  status: StatusPegawai.optional(),
  aktif: z.enum(["true", "false"]).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const IdParam = z.object({ id: z.string().uuid("ID tidak valid") });

// DELETE memakai version guard via query (?expectedVersion=) — anti hapus stale.
export const DeleteQuery = z.object({
  expectedVersion: z.coerce.number().int().nonnegative(),
});

// ── Tipe inferensi ─────────────────────────────────────────────────────────---
export type CreatePegawaiInput = z.infer<typeof CreatePegawaiInput>;
export type UpdatePegawaiInput = z.infer<typeof UpdatePegawaiInput>;
export type ListQuery = z.infer<typeof ListQuery>;
export type KontakDaruratInput = z.infer<typeof KontakDaruratInput>;

// ── DTO output (NIK di-MASK; entity Prisma TIDAK bocor) ────────────────────────
export interface PegawaiKontakDaruratDTO {
  nama: string;
  hubungan: string;
  noHp: string;
  alamat: string | null;
}

/** Item ringkas untuk tabel/list (tanpa kontak darurat — anti over-fetch). */
export interface PegawaiListItemDTO {
  id: string;
  nip: string;
  nikMasked: string | null;
  namaLengkap: string;
  namaTampil: string; // gelarDepan + nama + gelarBelakang
  jenisKelamin: "L" | "P";
  statusPegawai: string;
  profesi: string | null;
  unitKerja: string | null;
  practitionerId: string | null;
  isDokter: boolean;
  isActive: boolean;
  version: number;
  createdAt: string;
}

export interface PegawaiDTO extends PegawaiListItemDTO {
  gelarDepan: string | null;
  gelarBelakang: string | null;
  agama: string | null;
  tempatLahir: string | null;
  tanggalLahir: string | null; // ISO yyyy-mm-dd
  umur: number | null; // dihitung via clock
  tglMasuk: string | null; // ISO yyyy-mm-dd
  alamat: string | null;
  noHp: string | null;
  email: string | null;
  foto: string | null;
  kontakDarurat: PegawaiKontakDaruratDTO[];
}
