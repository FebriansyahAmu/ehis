// Zod schema + DTO Dokter (master/Sumber Daya — Practitioner) — FLOWS §5 · doc §B.
// Dokter = ekstensi klinis 1:1 Pegawai → DTO GABUNGAN (kredensial Dokter ⋈ identitas
// Pegawai read-only). Input HANYA kredensial klinis: identitas diubah di domain Pegawai
// (G4). Vocab `SpesialisKode` mirror enum Prisma master.SpesialisKedokteran + FE.

import { z } from "zod";

// ── Vocab spesialis (mirror prisma master.SpesialisKedokteran + FE SpesialisCode) ──
export const SpesialisKode = z.enum([
  "Umum", "SpJP", "SpPD", "SpA", "SpOG", "SpB", "SpAn", "SpS",
  "SpM", "SpEM", "SpKK", "SpKJ", "SpPK", "SpRad", "SpTHT", "SpU",
]);
export type SpesialisKode = z.infer<typeof SpesialisKode>;

export const StatusPraktik = z.enum(["Aktif", "Cuti", "Non_Aktif"]);
export type StatusPraktik = z.infer<typeof StatusPraktik>;

/// Label spesialis (server-side, untuk DTO). Mirror FE SPESIALIS_LABEL.
export const SPESIALIS_LABEL: Record<SpesialisKode, string> = {
  Umum:  "Dokter Umum",
  SpJP:  "Spesialis Jantung & Pembuluh Darah",
  SpPD:  "Spesialis Penyakit Dalam",
  SpA:   "Spesialis Anak",
  SpOG:  "Spesialis Obstetri & Ginekologi",
  SpB:   "Spesialis Bedah",
  SpAn:  "Spesialis Anestesi",
  SpS:   "Spesialis Saraf",
  SpM:   "Spesialis Mata",
  SpEM:  "Spesialis Emergency Medicine",
  SpKK:  "Spesialis Kulit & Kelamin",
  SpKJ:  "Spesialis Kedokteran Jiwa",
  SpPK:  "Spesialis Patologi Klinik",
  SpRad: "Spesialis Radiologi",
  SpTHT: "Spesialis Telinga Hidung Tenggorok",
  SpU:   "Spesialis Urologi",
};

// ── Field building blocks ───────────────────────────────────────────────────--
const ISO_DATE = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD");
const Kualifikasi = z.string().trim().max(160).optional();
const NoStr = z.string().trim().max(60).optional();
const NoSip = z.string().trim().max(60).optional();
const IhsId = z.string().trim().max(64).optional();

// ── Create (POST /master/dokter) ──────────────────────────────────────────────
// Provisioning: pilih pegawai dokter existing (pegawaiId), lengkapi kredensial (B.10 #4).
// Identitas TIDAK di sini (datang dari Pegawai). `kualifikasi` kosong → auto-fill di Service.
export const CreateDokterInput = z.object({
  pegawaiId: z.string().uuid("pegawaiId tidak valid"),
  spesialisKode: SpesialisKode.default("Umum"),
  kualifikasi: Kualifikasi,
  noStr: NoStr,
  strBerlakuHingga: ISO_DATE.optional(),
  noSip: NoSip,
  sipBerlakuHingga: ISO_DATE.optional(),
  statusPraktik: StatusPraktik.default("Aktif"),
  ihsPractitionerId: IhsId,
});

// ── Update (PATCH /master/dokter/:id) ─────────────────────────────────────────
// Kredensial only + version guard. TIDAK ada field identitas (ditolak — G4).
export const UpdateDokterInput = z.object({
  spesialisKode: SpesialisKode.optional(),
  kualifikasi: Kualifikasi,
  noStr: NoStr,
  strBerlakuHingga: ISO_DATE.nullable().optional(), // null = kosongkan
  noSip: NoSip,
  sipBerlakuHingga: ISO_DATE.nullable().optional(),
  statusPraktik: StatusPraktik.optional(),
  ihsPractitionerId: IhsId,
  /// Optimistic concurrency (FLOWS §7).
  expectedVersion: z.number().int().nonnegative(),
});

// ── List/search (GET /master/dokter) ──────────────────────────────────────────
export const ListQuery = z.object({
  q: z.string().trim().min(1).max(120).optional(), // nama/NIP/STR/SIP
  spesialis: SpesialisKode.optional(),
  status: StatusPraktik.optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const IdParam = z.object({ id: z.string().uuid("ID tidak valid") });

export const DeleteQuery = z.object({
  expectedVersion: z.coerce.number().int().nonnegative(),
});

// ── Tipe inferensi ─────────────────────────────────────────────────────────---
export type CreateDokterInput = z.infer<typeof CreateDokterInput>;
export type UpdateDokterInput = z.infer<typeof UpdateDokterInput>;
export type ListQuery = z.infer<typeof ListQuery>;

// ── DTO output (identitas dari Pegawai; NIK MASKED; entity Prisma TIDAK bocor) ──

/** Item ringkas untuk list/tabel Dokter & Nakes. */
export interface DokterListItemDTO {
  id: string;            // Dokter.id
  pegawaiId: string;
  nip: string;
  nikMasked: string | null;
  namaTampil: string;    // gelarDepan + nama + gelarBelakang (dari Pegawai)
  spesialisKode: SpesialisKode;
  spesialisLabel: string;
  noStr: string | null;
  noSip: string | null;
  statusPraktik: StatusPraktik;
  /// STR/SIP kedaluwarsa? (dihitung via clock di Service) — feed alert lisensi (G8).
  strExpired: boolean;
  sipExpired: boolean;
  version: number;
  createdAt: string;
}

export interface DokterDTO extends DokterListItemDTO {
  // ── Identitas (read-only, sumber = master.Pegawai) ──
  namaLengkap: string;
  jenisKelamin: "L" | "P";
  tanggalLahir: string | null; // ISO yyyy-mm-dd
  email: string | null;
  noHp: string | null;
  profesi: string | null;
  // ── Kredensial klinis ──
  kualifikasi: string | null;
  strBerlakuHingga: string | null; // ISO yyyy-mm-dd
  sipBerlakuHingga: string | null;
  ihsPractitionerId: string | null;
}

/** Dokter (pegawai profesi-dokter) yang BELUM punya profil Dokter → bahan "Lengkapi Profil" (G3). */
export interface DokterTanpaProfilDTO {
  pegawaiId: string;
  nip: string;
  namaTampil: string;
  profesi: string | null;
  unitKerja: string | null;
}
