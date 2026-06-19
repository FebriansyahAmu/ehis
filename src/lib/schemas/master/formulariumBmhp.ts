// Zod schema + DTO — Ketersediaan Farmasi (sub BMHP), Mapping Hub.
// Link BMHP ⇄ Ruangan(Location): "BMHP apa jadi daftar standar depo di lokasi farmasi mana".
// Input = pasangan id; kode ruangan dibaca via join (read-only di DTO) → matriks FE nge-key
// kolom by kode. Bentuk PERSIS formularium.ts (versi Obat). Lihat formularium.prisma (FormulariumBmhp).

import { z } from "zod";

// ── Grant satu edge (POST /master/formularium-bmhp) — idempoten ───────────────
export const GrantFormulariumBmhpInput = z.object({
  bmhpId: z.string().uuid("bmhpId tidak valid"),
  locationId: z.string().uuid("locationId tidak valid"),
});
export type GrantFormulariumBmhpInput = z.infer<typeof GrantFormulariumBmhpInput>;

// ── List/filter (GET /master/formularium-bmhp) ────────────────────────────────
// Matriks butuh SEMUA edge (sparse: hanya sel granted) → limit longgar, FE loop bila cursor.
export const FormulariumBmhpQuery = z.object({
  bmhpId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(2000).default(1000),
});
export type FormulariumBmhpQuery = z.infer<typeof FormulariumBmhpQuery>;

export const IdParam = z.object({ id: z.string().uuid("ID tidak valid") });
export type IdParam = z.infer<typeof IdParam>;

// ── DTO output (edge ramping; entity Prisma tak bocor) ────────────────────────
// `ruanganKode` (Location.kode) disertakan agar FE matriks (nge-key kolom by kode) bisa
// langsung membangun map tanpa lookup id→kode terpisah.
export interface FormulariumBmhpEdgeDTO {
  id: string;
  bmhpId: string;
  locationId: string;
  ruanganKode: string;
}
