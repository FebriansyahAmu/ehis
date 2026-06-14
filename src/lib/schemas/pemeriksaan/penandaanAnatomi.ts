// Zod input + DTO — Penandaan Anatomi (tab Pemeriksaan, sub Anatomi / body-map). DTO mirror
// RegionNote FE (AnatomiPane) + id. Daftar hidup per-item: create (tandai area) · update (catatan) ·
// soft-delete (lepas tanda). Input pakai OPTIONAL murni; normalisasi/default di Service.

import { z } from "zod";

// ── Create (POST /kunjungan/:id/penandaan-anatomi) ─────────────────────────────
export const PenandaanAnatomiInput = z.object({
  region: z.string().trim().min(1, "Region wajib").max(100),
  label: z.string().trim().min(1, "Label wajib").max(200),
  catatan: z.string().optional(),
  pemeriksa: z.string().trim().optional(), // default nama actor di Service
});
export type PenandaanAnatomiInput = z.infer<typeof PenandaanAnatomiInput>;

// ── Update (PATCH /:itemId) — edit catatan ─────────────────────────────────────
export const PenandaanAnatomiUpdate = z.object({
  catatan: z.string().optional(),
});
export type PenandaanAnatomiUpdate = z.infer<typeof PenandaanAnatomiUpdate>;

export const IdParam = z.object({ id: z.string().uuid() });
export const ItemParam = z.object({ id: z.string().uuid(), itemId: z.string().uuid() });
export type ItemParam = z.infer<typeof ItemParam>;

// ── DTO (response) — mirror RegionNote FE + id ─────────────────────────────────
export interface PenandaanAnatomiDTO {
  id: string;
  region: string;
  label: string;
  catatan: string;
}
