// Zod schema + DTO Layanan Unit (master/Mapping Hub) — FLOWS §5.
// Link Tindakan ⇄ Ruangan(Location): "tindakan apa boleh di ruangan mana". Input = pasangan id;
// kode ruangan dibaca via join (read-only di DTO) supaya matriks FE bisa di-key by kode.
// Selaras penugasanRuangan.ts. Lihat layananUnit.prisma.

import { z } from "zod";

// ── Grant satu edge (POST /master/layanan-unit) — idempoten ───────────────────
export const GrantLayananInput = z.object({
  tindakanId: z.string().uuid("tindakanId tidak valid"),
  locationId: z.string().uuid("locationId tidak valid"),
});
export type GrantLayananInput = z.infer<typeof GrantLayananInput>;

// ── List/filter (GET /master/layanan-unit) ────────────────────────────────────
// Matriks butuh SEMUA edge (sparse: hanya sel granted) → limit longgar, FE loop bila cursor.
export const LayananQuery = z.object({
  tindakanId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(1000).default(500),
});
export type LayananQuery = z.infer<typeof LayananQuery>;

export const IdParam = z.object({ id: z.string().uuid("ID tidak valid") });

// ── DTO output (edge ramping; entity Prisma tak bocor) ────────────────────────
// `ruanganKode` (Location.kode) disertakan agar FE matriks (yang nge-key kolom by kode)
// bisa langsung membangun map tanpa lookup id→kode terpisah.
export interface LayananUnitEdgeDTO {
  id: string;
  tindakanId: string;
  locationId: string;
  ruanganKode: string;
}
