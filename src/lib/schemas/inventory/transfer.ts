// Zod input + DTO — Inventory Transfer (StockTransfer, antar lokasi farmasi). Create = Draft
// (reservasi stok di sumber); posting (terpisah) → movement TRANSFER (sumber −, tujuan +) +
// lepas reservasi. DTO diperkaya nama lokasi/item.

import { z } from "zod";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const StockTransferLineInput = z.object({
  itemJenis: z.enum(["Obat", "BMHP"]),
  itemId: z.string().uuid("itemId tidak valid"),
  batchNo: z.string().trim().min(1).max(60).optional(), // kosong = FEFO saat posting
  qty: z.number().int().positive("Qty harus > 0"),
});
export type StockTransferLineInput = z.infer<typeof StockTransferLineInput>;

export const CreateStockTransferInput = z
  .object({
    tanggal: z.string().regex(ISO_DATE).optional(),
    fromLocationId: z.string().uuid("Lokasi sumber tidak valid"),
    toLocationId: z.string().uuid("Lokasi tujuan tidak valid"),
    lines: z.array(StockTransferLineInput).min(1, "Minimal 1 baris barang"),
  })
  .refine((v) => v.fromLocationId !== v.toLocationId, { message: "Sumber & tujuan tidak boleh sama", path: ["toLocationId"] });
export type CreateStockTransferInput = z.infer<typeof CreateStockTransferInput>;

export const StockTransferQuery = z.object({
  q: z.string().trim().optional(),
  status: z.enum(["Semua", "Draft", "Diproses", "Selesai", "Dibatalkan"]).optional(),
  fromLocationId: z.string().uuid().optional(),
  toLocationId: z.string().uuid().optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});
export type StockTransferQuery = z.infer<typeof StockTransferQuery>;

export const IdParam = z.object({ id: z.string().uuid("ID tidak valid") });
export type IdParam = z.infer<typeof IdParam>;

// ── DTO (response) — diperkaya nama ──
export type DocStatus = "Draft" | "Diproses" | "Selesai" | "Dibatalkan";

export interface StockTransferLineDTO {
  itemJenis: "Obat" | "BMHP";
  itemId: string;
  nama: string;
  kode: string;
  batchNo: string | null;
  qty: number;
}

export interface StockTransferDTO {
  id: string;
  noDokumen: string;
  tanggal: string; // YYYY-MM-DD
  fromLocationId: string;
  fromLocationNama: string;
  toLocationId: string;
  toLocationNama: string;
  status: DocStatus;
  petugas: string;
  lines: StockTransferLineDTO[];
}
