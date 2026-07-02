// Zod schema + DTO — Konsultasi antar-SMF (tab Konsultasi IGD/RI/RJ + worklist konsultan RJ).
// Vocab mirror KonsultasiItem FE (konsultasiShared.ts) → zero-refactor wiring. Closed-loop SBAR:
// Terkirim → Diterima → Dijawab (auto-CPPT) → Selesai. Nama aktor server-otoritatif di Service.

import { z } from "zod";

// ── Vocab terkontrol ──────────────────────────────────────────────────────────
export const KonsultasiUrgency = z.enum(["CITO", "Urgen", "Rutin"]);
export type KonsultasiUrgency = z.infer<typeof KonsultasiUrgency>;

// "Ditolak" = vocab FE (belum ada aksi tolak — follow-up); tidak pernah ditulis Service.
export const KonsultasiStatus = z.enum(["Terkirim", "Diterima", "Dijawab", "Selesai", "Ditolak"]);
export type KonsultasiStatus = z.infer<typeof KonsultasiStatus>;

const optStr = z.string().trim().optional().transform((v) => (v ? v : undefined));

// ── Create (POST /kunjungan/:id/konsultasi) ───────────────────────────────────
export const KonsultasiCreateInput = z.object({
  urgency: KonsultasiUrgency,
  smfId: z.string().trim().min(1, "SMF tujuan wajib dipilih"),
  smfNama: z.string().trim().min(1),
  smfSingkatan: z.string().trim().min(1),
  dokterKonsultan: optStr, // dokter tujuan spesifik (opsional)
  situation: z.string().trim().min(1, "Situation wajib diisi"),
  background: optStr,
  assessment: optStr,
  recommendation: z.string().trim().min(1, "Recommendation wajib diisi"),
  dokterPeminta: optStr, // default nama actor di Service
});
export type KonsultasiCreateInput = z.infer<typeof KonsultasiCreateInput>;

// ── Jawab (POST /konsultasi/:id/jawab — konsultan) ────────────────────────────
export const KonsultasiJawabInput = z.object({
  asesmen: z.string().trim().min(1, "Asesmen konsultan wajib diisi"),
  rekomendasi: z.string().trim().min(1, "Rekomendasi wajib diisi"),
  tindakLanjut: z.string().trim().min(1, "Tindak lanjut wajib diisi"),
  followUp: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal harus YYYY-MM-DD").optional(),
  konsultan: optStr, // default nama actor di Service (server otoritatif)
});
export type KonsultasiJawabInput = z.infer<typeof KonsultasiJawabInput>;

// ── Query worklist (GET /konsultasi) ──────────────────────────────────────────
export const KonsultasiWorklistQuery = z.object({
  // "aktif" = Terkirim+Diterima (default worklist); atau 1 status spesifik; "semua".
  status: z.enum(["aktif", "semua", "Terkirim", "Diterima", "Dijawab", "Selesai"]).optional(),
});
export type KonsultasiWorklistQuery = z.infer<typeof KonsultasiWorklistQuery>;

export const IdParam = z.object({ id: z.string().uuid() });
export const ItemParam = z.object({ id: z.string().uuid(), itemId: z.string().uuid() });

// ── DTO (mirror KonsultasiItem FE + spine) ────────────────────────────────────
export interface KonsultasiJawabanDTO {
  konsultan: string;
  asesmen: string;
  rekomendasi: string;
  tindakLanjut: string;
  followUp?: string;
}

export interface KonsultasiDTO {
  id: string;
  kunjunganId: string;
  noRM: string;
  tanggalRequest: string; // "YYYY-MM-DD"
  waktuRequest: string;   // "HH:mm"
  urgency: KonsultasiUrgency;
  smfId: string;
  smfNama: string;
  smfSingkatan: string;
  dokterKonsultan?: string;
  dokterPeminta: string;
  situation: string;
  background: string;
  assessment: string;
  recommendation: string;
  status: KonsultasiStatus;
  waktuDiterima?: string;
  waktuDijawab?: string;
  waktuSelesai?: string;
  jawaban?: KonsultasiJawabanDTO;
}

/** Worklist konsultan: DTO + identitas pasien/kunjungan asal (join). */
export interface KonsultasiWorklistDTO extends KonsultasiDTO {
  pasienNama: string;
  unitAsal: string;      // IGD/RawatInap/RawatJalan
  noKunjungan: string;
}
