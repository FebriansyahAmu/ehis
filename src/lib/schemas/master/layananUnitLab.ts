// Zod schema + DTO Layanan Unit LAB (master/Mapping Hub) — FLOWS §5.
// Link LabTest ⇄ Ruangan(Location): "tes lab apa boleh dikerjakan di ruangan mana". Input = pasangan
// id; kode ruangan dibaca via join (read-only di DTO) supaya matriks FE bisa di-key by kode.
// Tabel terpisah dari LayananUnit (Tindakan-only). Selaras layananUnit.ts. Lihat layananUnit.prisma.

import { z } from "zod";

// ── Grant satu edge (POST /master/layanan-unit-lab) — idempoten ────────────────
export const GrantLayananLabInput = z.object({
  labTestId: z.string().uuid("labTestId tidak valid"),
  locationId: z.string().uuid("locationId tidak valid"),
});
export type GrantLayananLabInput = z.infer<typeof GrantLayananLabInput>;

// ── List/filter (GET /master/layanan-unit-lab) ────────────────────────────────
// Matriks butuh SEMUA edge (sparse: hanya sel granted) → limit longgar, FE loop bila cursor.
export const LayananLabQuery = z.object({
  labTestId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(1000).default(500),
});
export type LayananLabQuery = z.infer<typeof LayananLabQuery>;

export const IdParam = z.object({ id: z.string().uuid("ID tidak valid") });

// ── DTO output (edge ramping; entity Prisma tak bocor) ────────────────────────
// `ruanganKode` (Location.kode) disertakan agar FE matriks (yang nge-key kolom by kode)
// bisa langsung membangun map tanpa lookup id→kode terpisah.
export interface LayananUnitLabEdgeDTO {
  id: string;
  labTestId: string;
  locationId: string;
  ruanganKode: string;
}
