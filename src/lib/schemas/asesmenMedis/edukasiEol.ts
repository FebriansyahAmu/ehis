// Zod + DTO — Asesmen Medis · Edukasi · End of Life (Advance Care Planning, HPK 2).
// Care plan = single-record "latest wins"; family meeting = log per-item (soft-delete).
// Mirror form EndOfLifePane + FamilyMeeting (EdukasiPane.tsx).

import { z } from "zod";

const optStr = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined));

const arrStr = z.array(z.string().trim().min(1)).default([]);

// ── Vocab (selaras EndOfLifePane) ─────────────────────────────────────────────
export const EolCodeStatus = z.enum(["full_code", "dnr", "dnar", "comfort_only"]);
export type EolCodeStatus = z.infer<typeof EolCodeStatus>;

export const EolPengambilKeputusan = z.enum([
  "Pasien Sendiri",
  "Keluarga / Wali Sah",
  "Komite Etik RS",
]);
export type EolPengambilKeputusan = z.infer<typeof EolPengambilKeputusan>;

// ── Input: simpan care plan (POST /…/edukasi/eol) ──────────────────────────────
//  Wajib (FE): codeStatus (tombol Simpan disabled tanpa ini). petugas dari actor.
export const EdukasiEolInput = z.object({
  codeStatus: EolCodeStatus,
  alasanKode: optStr,
  pengambilKeputusan: EolPengambilKeputusan.default("Pasien Sendiri"),
  namaWali: optStr,
  hubunganWali: optStr,
  kontakWali: optStr,
  advanceDirective: z.boolean().default(false),
  terapiDiinginkan: arrStr,
  terapiDitolak: arrStr,
  tujuanPerawatan: optStr,
  gejalaDitangani: optStr,
  kebutuhanSpiritual: optStr,
  petugasPaliatif: optStr,
  tanggalDNR: optStr,
  dokterDNR: optStr,
  catatanDNR: optStr,
});
export type EdukasiEolInput = z.infer<typeof EdukasiEolInput>;

// ── Input: tambah family meeting (POST /…/edukasi/eol/meeting) ─────────────────
export const EdukasiEolMeetingInput = z.object({
  tanggal: optStr,
  peserta: z.string().trim().min(1, "Peserta wajib diisi"),
  topik: z.string().trim().min(1, "Topik wajib diisi"),
  keputusan: optStr,
});
export type EdukasiEolMeetingInput = z.infer<typeof EdukasiEolMeetingInput>;

// ── Param: id meeting (DELETE /…/eol/meeting/:itemId) ──────────────────────────
export const EdukasiEolMeetingParam = z.object({
  id: z.string().uuid(),
  itemId: z.string().uuid(),
});
export type EdukasiEolMeetingParam = z.infer<typeof EdukasiEolMeetingParam>;

// ── DTO ────────────────────────────────────────────────────────────────────---
export interface EdukasiEolPlanDTO {
  id: string;
  kunjunganId: string;
  codeStatus: EolCodeStatus;
  alasanKode: string | null;
  pengambilKeputusan: EolPengambilKeputusan;
  namaWali: string | null;
  hubunganWali: string | null;
  kontakWali: string | null;
  advanceDirective: boolean;
  terapiDiinginkan: string[];
  terapiDitolak: string[];
  tujuanPerawatan: string | null;
  gejalaDitangani: string | null;
  kebutuhanSpiritual: string | null;
  petugasPaliatif: string | null;
  tanggalDNR: string | null;
  dokterDNR: string | null;
  catatanDNR: string | null;
  petugas: string; // dari user login
  createdAt: string; // ISO
}

export interface EdukasiEolMeetingDTO {
  id: string;
  tanggal: string | null;
  peserta: string;
  topik: string;
  keputusan: string | null;
  createdAt: string; // ISO
}

// Respons GET — agregat care plan terbaru (null bila belum ada) + log pertemuan.
export interface EdukasiEolDTO {
  kunjunganId: string;
  plan: EdukasiEolPlanDTO | null;
  meetings: EdukasiEolMeetingDTO[];
}
