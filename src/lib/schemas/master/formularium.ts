// Zod schema + DTO Formularium Unit (master/Mapping Hub).
// Link Obat ⇄ Ruangan(Location): "obat apa masuk formularium di ruangan mana" — universal lintas
// penjamin. Input = pasangan id; kode ruangan dibaca via join (read-only di DTO) supaya matriks FE
// bisa nge-key kolom by kode. Bentuk PERSIS layananUnit.ts. Lihat formularium.prisma.

import { z } from "zod";

// ── Grant satu edge (POST /master/formularium) — idempoten ────────────────────
export const GrantFormulariumInput = z.object({
  obatId: z.string().uuid("obatId tidak valid"),
  locationId: z.string().uuid("locationId tidak valid"),
});
export type GrantFormulariumInput = z.infer<typeof GrantFormulariumInput>;

// ── List/filter (GET /master/formularium) ─────────────────────────────────────
// Matriks butuh SEMUA edge (sparse: hanya sel granted) → limit longgar, FE loop bila cursor.
export const FormulariumQuery = z.object({
  obatId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(2000).default(1000),
});
export type FormulariumQuery = z.infer<typeof FormulariumQuery>;

export const IdParam = z.object({ id: z.string().uuid("ID tidak valid") });
export type IdParam = z.infer<typeof IdParam>;

// ── DTO output (edge ramping; entity Prisma tak bocor) ────────────────────────
// `ruanganKode` (Location.kode) disertakan agar FE matriks (yang nge-key kolom by kode)
// bisa langsung membangun map tanpa lookup id→kode terpisah.
export interface FormulariumEdgeDTO {
  id: string;
  obatId: string;
  locationId: string;
  ruanganKode: string;
}
