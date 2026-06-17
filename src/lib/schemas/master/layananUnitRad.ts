// Zod schema + DTO Layanan Unit RADIOLOGI (master/Mapping Hub) — FLOWS §5.
// Link RadCatalog ⇄ Ruangan(Location): "pemeriksaan radiologi apa boleh dilakukan di ruangan mana".
// Input = pasangan id; kode ruangan dibaca via join (read-only di DTO). Tabel terpisah dari
// LayananUnit (Tindakan) / LayananUnitLab. Selaras layananUnitLab.ts. Lihat layananUnit.prisma.

import { z } from "zod";

// ── Grant satu edge (POST /master/layanan-unit-rad) — idempoten ────────────────
export const GrantLayananRadInput = z.object({
  radCatalogId: z.string().uuid("radCatalogId tidak valid"),
  locationId: z.string().uuid("locationId tidak valid"),
});
export type GrantLayananRadInput = z.infer<typeof GrantLayananRadInput>;

// ── List/filter (GET /master/layanan-unit-rad) ────────────────────────────────
export const LayananRadQuery = z.object({
  radCatalogId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(1000).default(500),
});
export type LayananRadQuery = z.infer<typeof LayananRadQuery>;

export const IdParam = z.object({ id: z.string().uuid("ID tidak valid") });

// ── DTO output (edge ramping; entity Prisma tak bocor) ────────────────────────
export interface LayananUnitRadEdgeDTO {
  id: string;
  radCatalogId: string;
  locationId: string;
  ruanganKode: string;
}
