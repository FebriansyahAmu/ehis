// Zod input + DTO — Penilaian Nyeri (tab Penilaian, sub-menu Nyeri = asesmen komprehensif).
// Karakterisasi nyeri (PQRST); SKOR NRS TIDAK di sini — single source = Observation/TTV. Append-only
// (read/create). DTO mirror field NyeriPanel + tanggal/waktu derive dari createdAt (TZ Asia/Jakarta).
// Input OPTIONAL murni; normalisasi/default di Service.

import { z } from "zod";

// ── Create (POST /kunjungan/:id/penilaian-nyeri) ───────────────────────────────
export const PenilaianNyeriInput = z.object({
  lokasi: z.string().optional(),
  karakter: z.string().optional(),
  durasi: z.string().optional(),
  faktorPemberat: z.string().optional(),
  faktorPeringan: z.string().optional(),
  tipeNyeri: z.string().optional(),         // Nosiseptif/Neuropatik/Campuran (vocab bebas)
  dampakFungsional: z.string().optional(),
  rencanaReasesmen: z.string().optional(),
  catatan: z.string().optional(),
  pemeriksa: z.string().trim().optional(),  // default nama actor di Service
});
export type PenilaianNyeriInput = z.infer<typeof PenilaianNyeriInput>;

export const IdParam = z.object({ id: z.string().uuid() });

// ── DTO (response) — field karakterisasi + tanggal tampilan ────────────────────
export interface PenilaianNyeriDTO {
  id: string;
  lokasi: string;
  karakter: string;
  durasi: string;
  faktorPemberat: string;
  faktorPeringan: string;
  tipeNyeri: string;
  dampakFungsional: string;
  rencanaReasesmen: string;
  catatan: string;
  pemeriksa: string;
  tanggal: string; // "DD Mon YYYY" (TZ Asia/Jakarta) — tampilan riwayat
  waktu: string;   // ISO createdAt
}
