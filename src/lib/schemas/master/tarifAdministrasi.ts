// Zod input + DTO — Master Tarif Administrasi (schema "master"). Mapping Hub → Tarif (sub-tab Administrasi).
// Edge = (unit × penjaminKode) → biaya administrasi/kunjungan. UPSERT by pair (idempoten value).
// Pola paralel tarifKamar. Lihat tarifAdministrasi.prisma + docs/BACKEND-MAPPING.md §5.

import { z } from "zod";

// Unit layanan — selaras kunjungan.unit. String longgar (allow-list di bawah).
export const UNIT_ADMIN = ["IGD", "RawatInap", "RawatJalan"] as const;
const unit = z.enum(UNIT_ADMIN);
const penjaminKode = z.string().trim().min(1).max(20);
const komponen = z.coerce.number().int().min(0, "Komponen tak boleh negatif").max(2_000_000_000).optional();
// Metadata SK penetapan tarif (opsional). tglSk = tanggal saja (YYYY-MM-DD).
const noSk = z.string().trim().max(80).optional();
const tglSk = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal YYYY-MM-DD").optional();

// ── Upsert satu tarif administrasi (POST /master/tarif-administrasi) — idempoten by (unit, penjamin) ──
export const UpsertTarifAdministrasiInput = z.object({
  unit,
  penjaminKode,
  harga: z.coerce.number().int().min(0, "Harga tak boleh negatif").max(2_000_000_000),
  jasaSarana: komponen,
  jasaMedis: komponen,
  jasaParamedis: komponen,
  noSk,
  tglSk,
});
export type UpsertTarifAdministrasiInput = z.infer<typeof UpsertTarifAdministrasiInput>;

// ── List/filter (GET /master/tarif-administrasi) ──────────────────────────────
export const TarifAdministrasiQuery = z.object({
  penjaminKode: penjaminKode.optional(),
  unit: unit.optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(500).default(200),
});
export type TarifAdministrasiQuery = z.infer<typeof TarifAdministrasiQuery>;

export const IdParam = z.object({ id: z.string().uuid("ID tidak valid") });
export type IdParam = z.infer<typeof IdParam>;

// ── DTO output ────────────────────────────────────────────────────────────────
export interface TarifAdministrasiDTO {
  id: string;
  unit: string;
  penjaminKode: string;
  harga: number;
  jasaSarana: number | null;
  jasaMedis: number | null;
  jasaParamedis: number | null;
  /** Metadata SK penetapan tarif (opsional). tglSk = "YYYY-MM-DD". */
  noSk: string | null;
  tglSk: string | null;
}
