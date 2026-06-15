// Zod input + DTO — Penandaan Gambar (tab Penandaan Gambar, status lokalis / body-diagram).
// DTO mirror Anotasi FE (BodyMap2D/OdontogramChart) + id + pemeriksa. Daftar hidup per-item:
// create (tandai titik / gambar area) · soft-delete (lepas tanda). TANPA edit (koreksi = hapus + baru).
// Koordinat dalam % terhadap citra. Input pakai OPTIONAL murni; default/normalisasi di Service.

import { z } from "zod";

const ModelJenis = z.enum(["pria", "wanita", "gigi"]);
const Kind = z.enum(["pin", "draw"]);
const Severitas = z.enum(["Normal", "Ringan", "Sedang", "Berat", "Trauma"]);
const Point = z.object({ x: z.number(), y: z.number() });

// ── Create (POST /kunjungan/:id/penandaan-gambar) ──────────────────────────────
export const PenandaanGambarInput = z
  .object({
    mode: ModelJenis,
    kind: Kind,
    koordinat2d: Point, // titik pin / jangkar coretan (%)
    path: z.array(Point).max(2000).optional(), // wajib (≥2) utk kind draw
    region: z.string().trim().min(1, "Region wajib").max(120),
    label: z.string().trim().min(1, "Label wajib").max(200),
    deskripsi: z.string().max(2000).optional(),
    severitas: Severitas,
    pemeriksa: z.string().trim().optional(), // default nama actor di Service
  })
  .refine((d) => d.kind !== "draw" || (Array.isArray(d.path) && d.path.length >= 2), {
    message: "Coretan butuh minimal 2 titik",
    path: ["path"],
  });
export type PenandaanGambarInput = z.infer<typeof PenandaanGambarInput>;

export const IdParam = z.object({ id: z.string().uuid() });
export const ItemParam = z.object({ id: z.string().uuid(), itemId: z.string().uuid() });
export type ItemParam = z.infer<typeof ItemParam>;

// ── DTO (response) — mirror Anotasi FE + id + pemeriksa ────────────────────────
export interface PenandaanGambarDTO {
  id: string;
  mode: "pria" | "wanita" | "gigi";
  kind: "pin" | "draw";
  koordinat2d: { x: number; y: number };
  path: { x: number; y: number }[] | null; // null utk pin
  region: string;
  label: string;
  deskripsi: string;
  severitas: "Normal" | "Ringan" | "Sedang" | "Berat" | "Trauma";
  pemeriksa: string;
  createdAt: string; // "HH:mm" (id-ID, Asia/Jakarta) — mirror Anotasi.createdAt
}
