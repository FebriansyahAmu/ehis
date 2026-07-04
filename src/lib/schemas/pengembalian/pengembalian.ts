// Zod schema + DTO — Pengembalian Obat pasien pulang (PMK 72/2016 Ps. 20; tab Pasien Pulang RI,
// sub Kembalian Obat). Vocab mirror pengembalianShared FE → zero-refactor wiring.
// perawatPenyerah/apotekerPenerima TIDAK dikirim client (actor login, Service). Workflow:
// Draft (editable) → Diverifikasi (Apoteker, stamp sekali). jumlahKembalikan ≤ sisa per item.

import { z } from "zod";

export const KondisiObat = ["Baik", "Rusak", "Kadaluarsa"] as const;
export const AlasanKembalian = ["Pasien Pulang", "Ganti Terapi", "Obat Berlebih", "Reaksi Obat", "Lainnya"] as const;

const TGL = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal harus YYYY-MM-DD");

// ── 1 item kembalian (snapshot ResepItem + isian) ──────────────────────────────
export const PengembalianItemInput = z.object({
  resepItemId: z.string().uuid().optional(),
  namaObat: z.string().trim().min(1, "Nama obat wajib").max(300),
  satuan: z.string().trim().max(40).default("Unit"),
  isHAM: z.boolean().default(false),
  isNarPsi: z.boolean().default(false),
  jumlahDispensasi: z.coerce.number().int().min(0).max(99999).default(0),
  jumlahDiberikan: z.coerce.number().int().min(0).max(99999).default(0),
  jumlahKembalikan: z.coerce.number().int().min(0).max(99999).default(0),
  kondisi: z.enum(KondisiObat).default("Baik"),
  alasan: z.enum(AlasanKembalian).default("Pasien Pulang"),
}).refine(
  (i) => i.jumlahKembalikan <= Math.max(0, i.jumlahDispensasi - i.jumlahDiberikan),
  { message: "Jumlah kembalikan melebihi sisa (dispensasi − diberikan)", path: ["jumlahKembalikan"] },
);
export type PengembalianItemInput = z.infer<typeof PengembalianItemInput>;

// ── Buat dokumen (POST /kunjungan/:id/pengembalian) ─────────────────────────────
export const PengembalianCreateInput = z.object({
  resepOrderId: z.string().uuid().optional(), // soft-ref order resep sumber
  noResepRef: z.string().trim().max(80).default(""),
  tanggal: TGL,
  catatan: z.string().trim().max(2000).default(""),
  items: z.array(PengembalianItemInput).min(1, "Minimal 1 item obat"),
});
export type PengembalianCreateInput = z.infer<typeof PengembalianCreateInput>;

// ── Ubah draft (PATCH /kunjungan/:id/pengembalian/:itemId) — replace-all items ──
export const PengembalianUpdateInput = z.object({
  tanggal: TGL.optional(),
  catatan: z.string().trim().max(2000).optional(),
  items: z.array(PengembalianItemInput).min(1, "Minimal 1 item obat"),
});
export type PengembalianUpdateInput = z.infer<typeof PengembalianUpdateInput>;

export const IdParam = z.object({ id: z.string().uuid() });
export const ItemParam = z.object({ id: z.string().uuid(), itemId: z.string().uuid() });

// ── DTO (mirror PengembalianRecord FE) ──────────────────────────────────────────
export interface PengembalianItemDTO {
  id: string;
  resepItemId: string | null;
  namaObat: string;
  satuan: string;
  isHAM: boolean;
  isNarPsi: boolean;
  jumlahDispensasi: number;
  jumlahDiberikan: number;
  jumlahKembalikan: number;
  kondisi: string;
  alasan: string;
}

export interface PengembalianDTO {
  id: string;
  resepOrderId: string | null;
  noResepRef: string;
  tanggal: string;
  status: string; // Draft | Diverifikasi
  catatan: string;
  perawatPenyerah: string;
  apotekerPenerima: string;
  verifiedAt: string | null; // ISO
  items: PengembalianItemDTO[];
  createdAt: string; // ISO
}
