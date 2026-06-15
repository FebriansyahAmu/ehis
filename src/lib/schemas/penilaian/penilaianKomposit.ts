// Zod input + DTO — Penilaian Komposit (tab Penilaian, sub-menu Jantung / Kanker).
// Asesmen spesifik-penyakit = narasi + vocab + klasifikasi master (kategori Penyakit). Append-only
// (read/create). `data` = snapshot JSONB utuh (schemaless di BE — bentuk per `jenis` diatur FE).
// tanggal/waktu derive dari createdAt (TZ Asia/Jakarta) di Service.

import { z } from "zod";

export const KompositJenisEnum = z.enum(["Jantung", "Kanker"]);

// ── Create (POST /kunjungan/:id/penilaian-komposit) ────────────────────────────
export const PenilaianKompositInput = z.object({
  jenis: KompositJenisEnum,
  ringkasan: z.string().optional(),
  data: z.record(z.string(), z.unknown()).optional(), // blob form (narasi+vocab+skala[])
  pemeriksa: z.string().trim().optional(),            // default nama actor di Service
});
export type PenilaianKompositInput = z.infer<typeof PenilaianKompositInput>;

export const IdParam = z.object({ id: z.string().uuid() });

// ── Query list (GET /kunjungan/:id/penilaian-komposit?jenis=) ──────────────────
export const PenilaianKompositQuery = z.object({
  jenis: KompositJenisEnum.optional(),
});
export type PenilaianKompositQuery = z.infer<typeof PenilaianKompositQuery>;

// ── DTO (response) ─────────────────────────────────────────────────────────────
export interface PenilaianKompositDTO {
  id: string;
  jenis: z.infer<typeof KompositJenisEnum>;
  ringkasan: string;
  data: Record<string, unknown>;
  pemeriksa: string;
  tanggal: string; // "DD Mon YYYY" (TZ Asia/Jakarta)
  waktu: string;   // ISO createdAt
}
