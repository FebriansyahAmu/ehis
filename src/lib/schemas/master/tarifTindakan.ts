// Zod input + DTO — Master Tarif Tindakan (schema "master"). Mapping Hub → Tarif Matrix.
// Edge = (tindakan × penjaminKode × jenisRuangan) → harga. UPSERT by triple (idempoten value).
// Lihat tarifTindakan.prisma + docs/BACKEND-MAPPING.md §5.

import { z } from "zod";

// Key tier "Jenis Ruangan": locationType[:kelas]. String longgar (decoupled dari enum) supaya
// KRIS/perubahan kelas aman. Min 1 char; FE yang menjamin bentuk kanonik (jenisRuangan.ts).
const jenisRuanganKey = z.string().trim().min(1).max(40);
// Kode penjamin (UMUM/BPJS/INH/…). Belum FK; FE pakai kode stabil dari PENJAMIN_REF.
const penjaminKode = z.string().trim().min(1).max(20);

// ── Upsert satu tarif (POST /master/tarif-tindakan) — idempoten by triple ──────
export const UpsertTarifInput = z.object({
  tindakanId: z.string().uuid("tindakanId tidak valid"),
  penjaminKode,
  jenisRuangan: jenisRuanganKey,
  harga: z.coerce.number().int().min(0, "Harga tak boleh negatif").max(2_000_000_000),
});
export type UpsertTarifInput = z.infer<typeof UpsertTarifInput>;

// ── List/filter (GET /master/tarif-tindakan) ──────────────────────────────────
// Matriks butuh banyak edge (sparse) → limit longgar, FE loop bila cursor.
export const TarifQuery = z.object({
  tindakanId: z.string().uuid().optional(),
  penjaminKode: penjaminKode.optional(),
  jenisRuangan: jenisRuanganKey.optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(2000).default(1000),
});
export type TarifQuery = z.infer<typeof TarifQuery>;

export const IdParam = z.object({ id: z.string().uuid("ID tidak valid") });
export type IdParam = z.infer<typeof IdParam>;

// ── DTO output ────────────────────────────────────────────────────────────────
export interface TarifTindakanDTO {
  id: string;
  tindakanId: string;
  penjaminKode: string;
  jenisRuangan: string;
  harga: number;
}
