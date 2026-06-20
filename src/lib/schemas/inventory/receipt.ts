// Zod input + DTO — Inventory Penerimaan (GoodsReceipt). Create = Draft; posting (terpisah) →
// movement IN. DTO diperkaya nama vendor/lokasi/item (FE tak punya itemById katalog real).

import { z } from "zod";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const optStr = z.string().trim().min(1).optional();

export const GoodsReceiptLineInput = z.object({
  itemJenis: z.enum(["Obat", "BMHP"]),
  itemId: z.string().uuid("itemId tidak valid"),
  batchNo: z.string().trim().min(1).max(60).optional(), // opsional → fallback diturunkan dari ED / "UMUM"
  expiryDate: z.string().regex(ISO_DATE).optional(), // opsional (BMHP/non-ED) → batch null-ED
  qty: z.number().int().positive("Qty harus > 0"),
  hargaBeli: z.number().int().min(0).optional(),
});
export type GoodsReceiptLineInput = z.infer<typeof GoodsReceiptLineInput>;

export const CreateGoodsReceiptInput = z.object({
  tanggal: z.string().regex(ISO_DATE).optional(),
  vendorId: z.string().uuid("vendorId tidak valid"),
  noSuratJalan: optStr,
  noPo: optStr,
  toLocationId: z.string().uuid("Lokasi tujuan tidak valid"),
  lines: z.array(GoodsReceiptLineInput).min(1, "Minimal 1 baris barang"),
});
export type CreateGoodsReceiptInput = z.infer<typeof CreateGoodsReceiptInput>;

export const GoodsReceiptQuery = z.object({
  q: z.string().trim().optional(),
  status: z.enum(["Semua", "Draft", "Diproses", "Selesai", "Dibatalkan"]).optional(),
  vendorId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});
export type GoodsReceiptQuery = z.infer<typeof GoodsReceiptQuery>;

export const IdParam = z.object({ id: z.string().uuid("ID tidak valid") });
export type IdParam = z.infer<typeof IdParam>;

// ── DTO (response) — diperkaya nama untuk tampil langsung ──
export type DocStatus = "Draft" | "Diproses" | "Selesai" | "Dibatalkan";

export interface GoodsReceiptLineDTO {
  itemJenis: "Obat" | "BMHP";
  itemId: string;
  nama: string;
  kode: string;
  batchNo: string;
  expiryDate: string | null;
  qty: number;
  hargaBeli: number;
}

export interface GoodsReceiptDTO {
  id: string;
  noDokumen: string;
  tanggal: string; // YYYY-MM-DD
  vendorId: string;
  vendorNama: string;
  noSuratJalan?: string;
  noPo?: string;
  toLocationId: string;
  toLocationNama: string;
  status: DocStatus;
  petugas: string;
  lines: GoodsReceiptLineDTO[];
}
