// Zod schema + DTO Penugasan Ruangan (master/SDM Assignment) — FLOWS §5.
// Link Pegawai ⇄ Ruangan(Location). Input = pasangan id (+ peran opsional); identitas &
// nama ruangan dibaca via join (read-only di DTO). Lihat penugasanRuangan.prisma.

import { z } from "zod";

// ── Create (POST /master/penugasan-ruangan) ──────────────────────────────────
export const CreatePenugasanInput = z.object({
  pegawaiId: z.string().uuid("pegawaiId tidak valid"),
  locationId: z.string().uuid("locationId tidak valid"),
  peran: z.string().trim().max(80).optional(),
});
export type CreatePenugasanInput = z.infer<typeof CreatePenugasanInput>;

// ── List/filter (GET /master/penugasan-ruangan) ──────────────────────────────
export const ListQuery = z.object({
  locationId: z.string().uuid().optional(),
  pegawaiId: z.string().uuid().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
export type ListQuery = z.infer<typeof ListQuery>;

export const IdParam = z.object({ id: z.string().uuid("ID tidak valid") });

// ── DTO output (identitas & ruangan dari join; entity Prisma tak bocor) ───────
export interface PenugasanRuanganDTO {
  id: string;
  pegawaiId: string;
  namaTampil: string;   // gelarDepan + nama + gelarBelakang
  nip: string;
  profesi: string | null;
  locationId: string;
  ruanganKode: string;
  ruanganNama: string;
  peran: string | null;
  createdAt: string;    // "ditugaskan sejak"
}
