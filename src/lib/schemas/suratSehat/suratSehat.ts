// Zod schema + DTO — Surat Keterangan Sehat / Berbadan Sehat (tab Surat & Dokumen).
// `nomor` auto sistem (counter, Service) — TIDAK dikirim client. TTE Dokter Pemeriksa
// auto-stamp saat create bila actor Dokter (signer server-otoritatif) — TIDAK diterima client.
// Ciri khas SKBS = blok hasil pemeriksaan fisik → kesimpulan "Sehat".

import { z } from "zod";

const TGL = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal harus YYYY-MM-DD");
const TGL_OPT = z.union([z.literal(""), TGL]).default(""); // "" = tanpa masa berlaku

// ── Tambah (POST /kunjungan/:id/surat-sehat) ───────────────────────────────────
export const SuratSehatInput = z.object({
  tglPeriksa: TGL, // tanggal pemeriksaan

  // ── Antropometri + tanda vital ──
  tinggiBadan: z.number().int().min(0).max(300).nullable().default(null),  // cm
  beratBadan: z.number().int().min(0).max(500).nullable().default(null),   // kg
  tekananDarah: z.string().trim().max(20).default(""),                     // "120/80"
  nadi: z.number().int().min(0).max(400).nullable().default(null),         // x/menit

  // ── Pemeriksaan khusus SKBS ──
  golonganDarah: z.string().trim().max(10).default(""),
  penglihatan: z.string().trim().max(60).default(""),
  butaWarna: z.string().trim().max(60).default(""),
  pendengaran: z.string().trim().max(60).default(""),
  riwayatPenyakit: z.string().trim().max(500).default(""),

  // ── Kesimpulan & keperluan ──
  kesimpulan: z.string().trim().max(60).default("Sehat"),
  keperluan: z.string().trim().max(120).default(""),
  instansi: z.string().trim().max(160).default(""),  // ditujukan kepada
  berlakuHingga: TGL_OPT,                            // masa berlaku (opsional)
  catatan: z.string().trim().max(1000).default(""),

  pekerjaan: z.string().trim().max(120).default(""),

  dokterId: z.string().uuid().optional(),
  dokterNama: z.string().trim().max(160).default(""),
});
export type SuratSehatInput = z.infer<typeof SuratSehatInput>;

export const IdParam = z.object({ id: z.string().uuid() });
export const ItemParam = z.object({ id: z.string().uuid(), itemId: z.string().uuid() });

// ── DTO ─────────────────────────────────────────────────────────────────────────
export interface SuratSehatDTO {
  id: string;
  nomor: string;               // SKH-<YYMM><NNN> (auto sistem)
  tglPeriksa: string;          // "YYYY-MM-DD"
  tinggiBadan: number | null;
  beratBadan: number | null;
  tekananDarah: string;
  nadi: number | null;
  golonganDarah: string;
  penglihatan: string;
  butaWarna: string;
  pendengaran: string;
  riwayatPenyakit: string;
  kesimpulan: string;
  keperluan: string;
  instansi: string;
  berlakuHingga: string;
  catatan: string;
  pekerjaan: string;
  dokterId: string | null;
  dokterNama: string;
  pencatat: string;
  // ── TTE Dokter Pemeriksa (null = terbit tanpa TTE / dibuat non-Dokter) ──
  tteToken: string | null;
  tteSignedBy: string | null;
  tteSignedAt: string | null;  // ISO
  createdAt: string;           // ISO
}
