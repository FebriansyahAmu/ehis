// Zod + DTO — Asesmen Medis · Edukasi · Pasien & Keluarga (HPK 2). Append-only log:
// tiap simpan = 1 catatan sesi edukasi (riwayat). Mirror EduPKEntry + form PasienKeluargaPane
// (EdukasiPane.tsx). DTO bawa field terstruktur; FE menyusun teks penerima/waktu utk tampilan.

import { z } from "zod";

const optStr = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined));

const arrStr = z.array(z.string().trim().min(1)).default([]);

// ── Vocab (selaras EdukasiPane) ───────────────────────────────────────────────
export const EduPenerima = z.enum(["Pasien", "Keluarga", "Wali"]);
export type EduPenerima = z.infer<typeof EduPenerima>;

export const EduPemahaman = z.enum(["paham", "perlu_ulang", "tidak_paham"]);
export type EduPemahaman = z.infer<typeof EduPemahaman>;

// ── Input (POST /kunjungan/:id/asesmen/edukasi/pasien) ─────────────────────────
//  Wajib (FE canAdd): topik (≥1) + pemahaman. petugas diturunkan dari actor (bukan input).
export const EdukasiPasienInput = z.object({
  penerima: EduPenerima,
  namaPenerima: optStr,
  hubungan: optStr,
  topik: z.array(z.string().trim().min(1)).min(1, "Minimal satu topik edukasi"),
  media: arrStr,
  metode: optStr,
  hambatan: arrStr,
  catatanHambatan: optStr,
  pemahaman: EduPemahaman,
  rencanaTindakLanjut: optStr,
  catatan: optStr,
  tanggal: optStr, // date
  jam: optStr, // time (field FE `waktu`)
});
export type EdukasiPasienInput = z.infer<typeof EdukasiPasienInput>;

// ── Param: id item (DELETE /…/edukasi/pasien/:itemId) ──────────────────────────
export const EdukasiPasienItemParam = z.object({
  id: z.string().uuid(),
  itemId: z.string().uuid(),
});
export type EdukasiPasienItemParam = z.infer<typeof EdukasiPasienItemParam>;

// ── DTO (GET list) — field terstruktur (mirror form); penerima/waktu disusun FE ─
export interface EdukasiPasienDTO {
  id: string;
  kunjunganId: string;
  penerima: EduPenerima;
  namaPenerima: string | null;
  hubungan: string | null;
  topik: string[];
  media: string[];
  metode: string | null;
  hambatan: string[];
  catatanHambatan: string | null;
  pemahaman: EduPemahaman;
  rencanaTindakLanjut: string | null;
  catatan: string | null;
  tanggal: string | null;
  jam: string | null;
  petugas: string; // nama edukator (dari user login)
  createdAt: string; // ISO (savedAt)
}
