// Zod input + DTO — Master Tarif Lab Test (schema "master"). Mapping Hub → Tarif Matrix (grup Lab).
// Edge = (labTest × penjaminKode × jenisRuangan) → harga. UPSERT by triple (idempoten value).
// Paralel tarifTindakan.ts. Lihat tarifLabTest.prisma + docs/BACKEND-MAPPING.md §5.

import { z } from "zod";

// Key tier "Jenis Ruangan": locationType[:kelas]. String longgar (decoupled dari enum).
const jenisRuanganKey = z.string().trim().min(1).max(40);
// Kode penjamin (UMUM/BPJS/…). Belum FK; FE pakai kode stabil dari TARIF_PENJAMIN.
const penjaminKode = z.string().trim().min(1).max(20);

// ── Upsert satu tarif lab (POST /master/tarif-lab-test) — idempoten by triple ──
export const UpsertTarifLabInput = z.object({
  labTestId: z.string().uuid("labTestId tidak valid"),
  penjaminKode,
  jenisRuangan: jenisRuanganKey,
  harga: z.coerce.number().int().min(0, "Harga tak boleh negatif").max(2_000_000_000),
});
export type UpsertTarifLabInput = z.infer<typeof UpsertTarifLabInput>;

// ── List/filter (GET /master/tarif-lab-test) ──────────────────────────────────
export const TarifLabQuery = z.object({
  labTestId: z.string().uuid().optional(),
  penjaminKode: penjaminKode.optional(),
  jenisRuangan: jenisRuanganKey.optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(2000).default(1000),
});
export type TarifLabQuery = z.infer<typeof TarifLabQuery>;

export const IdParam = z.object({ id: z.string().uuid("ID tidak valid") });
export type IdParam = z.infer<typeof IdParam>;

// ── DTO output ────────────────────────────────────────────────────────────────
export interface TarifLabTestDTO {
  id: string;
  labTestId: string;
  penjaminKode: string;
  jenisRuangan: string;
  harga: number;
}
