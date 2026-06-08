// Zod schema + DTO — Asesmen Medis · Riwayat · Penyakit Dahulu (RPD). Mirror
// PenyakitDahuluPane (AsesmenMedisTab.tsx): daftar penyakit (multi-select) + catatan.
// Append-only "latest wins". DTO mirror FE → wiring zero-refactor.

import { z } from "zod";

const optStr = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined));

// ── Input (POST /kunjungan/:id/asesmen/penyakit-dahulu) ────────────────────────
export const AsesmenPenyakitDahuluInput = z.object({
  penyakit: z.array(z.string().trim().min(1)).default([]),
  catatan: optStr,
});
export type AsesmenPenyakitDahuluInput = z.infer<typeof AsesmenPenyakitDahuluInput>;

// ── DTO (GET) ───────────────────────────────────────────────────────────────--
export interface AsesmenPenyakitDahuluDTO {
  id: string;
  kunjunganId: string;
  penyakit: string[];
  catatan: string | null;
  pemeriksa: string; // nama pencatat (dari user login)
  authorUserId: string | null;
  createdAt: string; // ISO
}
