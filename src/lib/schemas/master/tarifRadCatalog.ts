// Zod input + DTO — Master Tarif Rad Catalog (schema "master"). Mapping Hub → Tarif Matrix (grup Rad).
// Edge = (radCatalog × penjaminKode × jenisRuangan) → harga. UPSERT by triple (idempoten value).
// Paralel tarifLabTest.ts / tarifTindakan.ts. Lihat tarifRadCatalog.prisma + docs/BACKEND-MAPPING.md §5.

import { z } from "zod";

// Key tier "Jenis Ruangan": locationType[:kelas]. String longgar (decoupled dari enum).
const jenisRuanganKey = z.string().trim().min(1).max(40);
// Kode penjamin (UMUM/BPJS/…). Belum FK; FE pakai kode stabil dari TARIF_PENJAMIN.
const penjaminKode = z.string().trim().min(1).max(20);

// ── Upsert satu tarif rad (POST /master/tarif-rad-catalog) — idempoten by triple ──
export const UpsertTarifRadInput = z.object({
  radCatalogId: z.string().uuid("radCatalogId tidak valid"),
  penjaminKode,
  jenisRuangan: jenisRuanganKey,
  harga: z.coerce.number().int().min(0, "Harga tak boleh negatif").max(2_000_000_000),
});
export type UpsertTarifRadInput = z.infer<typeof UpsertTarifRadInput>;

// ── List/filter (GET /master/tarif-rad-catalog) ───────────────────────────────
export const TarifRadQuery = z.object({
  radCatalogId: z.string().uuid().optional(),
  penjaminKode: penjaminKode.optional(),
  jenisRuangan: jenisRuanganKey.optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(2000).default(1000),
});
export type TarifRadQuery = z.infer<typeof TarifRadQuery>;

export const IdParam = z.object({ id: z.string().uuid("ID tidak valid") });
export type IdParam = z.infer<typeof IdParam>;

// ── DTO output ────────────────────────────────────────────────────────────────
export interface TarifRadCatalogDTO {
  id: string;
  radCatalogId: string;
  penjaminKode: string;
  jenisRuangan: string;
  harga: number;
}
