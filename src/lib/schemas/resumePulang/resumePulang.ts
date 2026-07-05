// Zod schema + DTO — Resume Pulang Rawat Inap (tab Pasien Pulang RI, sub Resume Pulang).
// Salinan discharge summary UNTUK PASIEN (PMK 24/2022). Append-only "latest wins" per
// kunjungan. 4 narasi autofill-able (anamnesis/penunjang/terapi/kondisi) + 3 manual
// (instruksi/pembatasan/diet), semua teks bebas (DPJP suntingan). TTE sign-off = aksi
// terpisah (stamp sekali per revisi; Dokter-only di Service). Pola ResumeMedik.

import { z } from "zod";

export const IdParam = z.object({ id: z.string().uuid() });

// ── Simpan (POST /kunjungan/:id/resume-pulang) ──────────────────────────────────

export const ResumePulangInput = z.object({
  ringkasanAnamnesis: z.string().trim().max(8000).default(""),
  hasilPemeriksaan: z.string().trim().max(8000).default(""),
  terapiDiberikan: z.string().trim().max(8000).default(""),
  kondisiSaatPulang: z.string().trim().max(4000).default(""),
  instruksiPulang: z.string().trim().max(8000).default(""),
  pembatasanAktivitas: z.string().trim().max(4000).default(""),
  dietPulang: z.string().trim().max(4000).default(""),
  tandaTanganPasien: z.boolean().default(false),
});
export type ResumePulangInput = z.infer<typeof ResumePulangInput>;

// ── DTO ─────────────────────────────────────────────────────────────────────────

export interface ResumePulangDTO {
  id: string;
  ringkasanAnamnesis: string;
  hasilPemeriksaan: string;
  terapiDiberikan: string;
  kondisiSaatPulang: string;
  instruksiPulang: string;
  pembatasanAktivitas: string;
  dietPulang: string;
  tandaTanganPasien: boolean;
  pencatat: string;
  /** TTE DPJP — null = revisi ini belum ditandatangani. */
  tteToken: string | null;
  tteSignedBy: string | null;
  tteSignedAt: string | null; // ISO
  updatedAt: string;          // ISO (createdAt revisi terkini)
}
