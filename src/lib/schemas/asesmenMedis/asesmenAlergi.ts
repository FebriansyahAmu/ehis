// Zod + DTO — Asesmen Medis · sub-menu Alergi (MODEL PER-ITEM, FHIR-aligned).
// Alergi = daftar hidup: tiap alergen = 1 baris dengan siklus hidup sendiri (tambah/hapus
// per-aksi, bukan snapshot seluruh daftar tiap simpan). Mirror AllergyEntry. Vocab
// terkontrol (category/severity/status) = enum Zod, di DB = TEXT (precedent). DTO mirror FE.

import { z } from "zod";

// ── Vocab (selaras AllergyCategory/Severity/Status di AsesmenMedisTab) ─────────--
export const AlergiKategori = z.enum(["Obat", "Makanan", "Lainnya"]);
export type AlergiKategori = z.infer<typeof AlergiKategori>;

export const AlergiSeverity = z.enum(["Ringan", "Sedang", "Berat"]);
export type AlergiSeverity = z.infer<typeof AlergiSeverity>;

export const AlergiStatus = z.enum(["Terkonfirmasi", "Dicurigai"]);
export type AlergiStatus = z.infer<typeof AlergiStatus>;

// ── Helpers ────────────────────────────────────────────────────────────────---
const optStr = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined));

// ── Input: tambah 1 alergen (POST /kunjungan/:id/asesmen/alergi) ───────────────
export const AlergiItemInput = z.object({
  category: AlergiKategori,
  allergen: z.string().trim().min(1, "Nama alergen wajib diisi"),
  reactions: z.array(z.string().trim().min(1)).min(1, "Minimal satu jenis reaksi"),
  severity: AlergiSeverity,
  status: AlergiStatus,
  keterangan: optStr,
  snomedCode: optStr,
});
export type AlergiItemInput = z.infer<typeof AlergiItemInput>;

// ── Input: set assertion NKA (PATCH /kunjungan/:id/asesmen/alergi) ─────────────
export const AlergiNkaInput = z.object({ nka: z.boolean() });
export type AlergiNkaInput = z.infer<typeof AlergiNkaInput>;

// ── Param: id item (DELETE /…/alergi/:itemId) ──────────────────────────────────
export const AlergiItemParam = z.object({
  id: z.string().uuid(),
  itemId: z.string().uuid(),
});
export type AlergiItemParam = z.infer<typeof AlergiItemParam>;

// ── DTO ────────────────────────────────────────────────────────────────────---
export interface AlergiItemDTO {
  id: string;
  category: AlergiKategori;
  allergen: string;
  reactions: string[];
  severity: AlergiSeverity;
  status: AlergiStatus;
  keterangan: string | null;
  snomedCode: string | null;
  pemeriksa: string;
  createdAt: string; // ISO
}

// Respons GET — agregat daftar alergi aktif + assertion NKA kunjungan.
export interface AlergiDTO {
  kunjunganId: string;
  nka: boolean;
  items: AlergiItemDTO[];
}
