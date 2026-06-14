// Zod input + DTO — Penilaian Fisik (tab Penilaian, sub-menu Fisik). Append-only time-series
// (read/create); riwayat ditampilkan di panel kanan. DTO mirror field FisikPanel + tanggal/waktu
// derive dari createdAt (TZ Asia/Jakarta di Service). Input OPTIONAL murni; normalisasi/default di Service.

import { z } from "zod";

// ── Create (POST /kunjungan/:id/penilaian-fisik) ───────────────────────────────
export const PenilaianFisikInput = z.object({
  pemeriksaanUmum: z.string().optional(), // pemeriksaan fisik umum (free-text)
  keadaanUmum: z.string().optional(),
  kesadaran: z.string().optional(),
  gizi: z.string().optional(),
  mobilitas: z.string().optional(),
  pemeriksa: z.string().trim().optional(), // default nama actor di Service
});
export type PenilaianFisikInput = z.infer<typeof PenilaianFisikInput>;

export const IdParam = z.object({ id: z.string().uuid() });

// ── DTO (response) — field terstruktur (FE susun teks riwayat) + tanggal tampilan ──
export interface PenilaianFisikDTO {
  id: string;
  pemeriksaanUmum: string;
  keadaanUmum: string;
  kesadaran: string;
  gizi: string;
  mobilitas: string;
  pemeriksa: string;
  tanggal: string; // "DD Mon YYYY" (TZ Asia/Jakarta) — tampilan riwayat
  waktu: string;   // ISO createdAt
}
