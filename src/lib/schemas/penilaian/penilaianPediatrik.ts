// Zod input + DTO — Penilaian Pediatrik (tab Penilaian, sub-menu Pediatrik). Append-only
// (read/create). DTO mirror field PediatrikPanel + tanggal/waktu derive dari createdAt (TZ Asia/Jakarta).
// Input OPTIONAL murni; normalisasi/default di Service.

import { z } from "zod";

// ── Create (POST /kunjungan/:id/penilaian-pediatrik) ───────────────────────────
export const PenilaianPediatrikInput = z.object({
  beratLahir: z.string().optional(),
  usiaGestasi: z.string().optional(),
  imunisasi: z.string().optional(),     // Lengkap/Tidak lengkap (vocab bebas)
  tumbuhKembang: z.string().optional(), // Sesuai usia/Terlambat
  catatan: z.string().optional(),
  pemeriksa: z.string().trim().optional(), // default nama actor di Service
});
export type PenilaianPediatrikInput = z.infer<typeof PenilaianPediatrikInput>;

export const IdParam = z.object({ id: z.string().uuid() });

// ── DTO (response) — field pediatrik + tanggal tampilan ────────────────────────
export interface PenilaianPediatrikDTO {
  id: string;
  beratLahir: string;
  usiaGestasi: string;
  imunisasi: string;
  tumbuhKembang: string;
  catatan: string;
  pemeriksa: string;
  tanggal: string; // "DD Mon YYYY" (TZ Asia/Jakarta) — tampilan riwayat
  waktu: string;   // ISO createdAt
}
