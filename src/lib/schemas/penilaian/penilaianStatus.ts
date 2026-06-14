// Zod input + DTO — Penilaian Status Klinis (tab Penilaian, sub-menu Status). Append-only
// (read/create). DTO mirror field StatusPanel + tanggal/waktu derive dari createdAt (TZ Asia/Jakarta).
// Input OPTIONAL murni; normalisasi/default di Service.

import { z } from "zod";

// ── Create (POST /kunjungan/:id/penilaian-status) ──────────────────────────────
export const PenilaianStatusInput = z.object({
  status: z.string().optional(),    // Stabil/Tidak Stabil/Kritis/Mengancam Jiwa/Meninggal (vocab bebas)
  kesadaran: z.string().optional(), // Compos Mentis/Apatis/Somnolen/Sopor/Koma
  catatan: z.string().optional(),
  pemeriksa: z.string().trim().optional(), // default nama actor di Service
});
export type PenilaianStatusInput = z.infer<typeof PenilaianStatusInput>;

export const IdParam = z.object({ id: z.string().uuid() });

// ── DTO (response) — field status + tanggal tampilan ───────────────────────────
export interface PenilaianStatusDTO {
  id: string;
  status: string;
  kesadaran: string;
  catatan: string;
  pemeriksa: string;
  tanggal: string; // "DD Mon YYYY" (TZ Asia/Jakarta) — tampilan riwayat
  waktu: string;   // ISO createdAt
}
