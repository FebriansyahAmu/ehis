// Zod schema + DTO — Discharge Planning step 2: Edukasi Bertahap (SNARS HPK 2).
// Vocab mirror EdukasiLog FE (discharge/dischargeShared.ts) → zero-refactor wiring.
// 1 log = 1 sesi edukasi per topik; add + soft-delete only (koreksi = hapus + baris baru).
// petugas TIDAK dikirim client — nama actor login (server-otoritatif, Service).

import { z } from "zod";

// ── Vocab terkontrol (wajib terisi — log tanpa evaluasi tidak bermakna) ────────
export const ProfesiEdukasi   = ["Perawat", "Dokter", "Apoteker", "Ahli Gizi", "Fisioterapis"] as const;
export const MetodeEdukasi    = ["Lisan", "Demonstrasi", "Leaflet", "Video"] as const;
export const PenerimaEdukasi  = ["Pasien", "Keluarga", "Keduanya"] as const;
export const PemahamanEdukasi = ["Paham", "Perlu Ulang", "Tidak Paham"] as const;

// ── Tambah log (POST /kunjungan/:id/discharge/edukasi) ─────────────────────────
export const DischargeEdukasiInput = z.object({
  topikId: z.string().trim().min(1).max(40),   // soft-ref template FE ("edu-01"…)
  topik: z.string().trim().min(1).max(200),    // snapshot judul topik
  kategori: z.string().trim().min(1).max(60),  // snapshot kategori
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal harus YYYY-MM-DD"),
  profesi: z.enum(ProfesiEdukasi),
  metode: z.enum(MetodeEdukasi),
  penerima: z.enum(PenerimaEdukasi),
  pemahaman: z.enum(PemahamanEdukasi),
  catatan: z.string().trim().max(2000).default(""),
});
export type DischargeEdukasiInput = z.infer<typeof DischargeEdukasiInput>;

export const IdParam = z.object({ id: z.string().uuid() });
export const ItemParam = z.object({ id: z.string().uuid(), itemId: z.string().uuid() });

// ── DTO (mirror EdukasiLog FE + snapshot topik) ────────────────────────────────
export interface DischargeEdukasiDTO {
  id: string;
  topikId: string;
  topik: string;
  kategori: string;
  tanggal: string; // "YYYY-MM-DD"
  petugas: string; // actor login saat mencatat
  profesi: string;
  metode: string;
  penerima: string;
  pemahaman: string;
  catatan: string;
  createdAt: string; // ISO
}
