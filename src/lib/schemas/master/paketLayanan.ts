// Zod input + DTO — Master Paket Layanan (schema "master", model PaketLayanan).
// Katalog paket (bundel layanan). Kode `PKT-NNNN` AUTO-GEN di Service (counter) → TIDAK di input.
// items = snapshot [{ nama, qty }] (self-contained). Konsumen: registrasi Ubah Paket.

import { z } from "zod";

// ── Vocab terkontrol (FE-facing) ──────────────────────────────────────────────
export const PaketKategoriEnum = z.enum([
  "MCU", "Persalinan", "Bedah", "Dialisis", "Rehabilitasi", "Lainnya",
]);
export type PaketKategoriDTO = z.infer<typeof PaketKategoriEnum>;

export const PaketStatusEnum = z.enum(["Aktif", "Non_Aktif", "Draft"]);
export type PaketStatusDTO = z.infer<typeof PaketStatusEnum>;

export const PaketBadgeEnum = z.enum(["Populer", "Baru", "Promo"]);

// Item bundel — baris layanan (nama bebas + qty). Snapshot, tanpa ref tarif.
export const PaketItemSchema = z.object({
  nama: z.string().trim().min(1, "Nama layanan wajib").max(200),
  qty: z.coerce.number().int().min(1).max(999).default(1),
});
export type PaketItemDTO = z.infer<typeof PaketItemSchema>;

const optStr = z.string().trim().optional().transform((v) => (v ? v : undefined));
const rupiah = z.coerce.number().int().min(0, "Harga tak boleh negatif").max(2_000_000_000);
const pct = z.coerce.number().int().min(0).max(100);

// ── Create (POST /master/paket-layanan) — TANPA kode (auto-gen di Service) ─────
export const CreatePaketInput = z.object({
  nama: z.string().trim().min(1, "Nama paket wajib").max(200),
  kategori: PaketKategoriEnum.optional(),        // default Lainnya di Service
  deskripsi: optStr,
  items: z.array(PaketItemSchema).default([]),
  hargaUmum: rupiah,
  hargaBpjs: rupiah.optional(),
  diskonPct: pct.optional(),
  badge: PaketBadgeEnum.optional(),
  status: PaketStatusEnum.optional(),            // default Aktif di Service
});
export type CreatePaketInput = z.infer<typeof CreatePaketInput>;

// ── Update (PATCH /master/paket-layanan/:id) — parsial, kode immutable ─────────
export const UpdatePaketInput = z.object({
  nama: z.string().trim().min(1).max(200).optional(),
  kategori: PaketKategoriEnum.optional(),
  deskripsi: optStr,
  items: z.array(PaketItemSchema).optional(),
  hargaUmum: rupiah.optional(),
  hargaBpjs: rupiah.nullable().optional(),       // null = hapus tarif BPJS
  diskonPct: pct.nullable().optional(),
  badge: PaketBadgeEnum.nullable().optional(),
  status: PaketStatusEnum.optional(),
});
export type UpdatePaketInput = z.infer<typeof UpdatePaketInput>;

// ── List/filter (GET /master/paket-layanan) ───────────────────────────────────
export const PaketQuery = z.object({
  q: optStr,
  kategori: PaketKategoriEnum.optional(),
  status: z.union([PaketStatusEnum, z.literal("Semua")]).optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(500).default(200),
});
export type PaketQuery = z.infer<typeof PaketQuery>;

export const IdParam = z.object({ id: z.string().uuid("ID tidak valid") });
export type IdParam = z.infer<typeof IdParam>;

// ── DTO output ────────────────────────────────────────────────────────────────
export interface PaketDTO {
  id: string;
  kode: string;
  nama: string;
  kategori: string;
  deskripsi: string;
  items: PaketItemDTO[];
  hargaUmum: number;
  hargaBpjs: number | null;
  diskonPct: number | null;
  badge: string | null;
  status: string;
}
