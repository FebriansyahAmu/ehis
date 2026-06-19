// Zod query + DTO — Inventory read (Daftar Barang + detail item). Stok = proyeksi dari ledger.
// DTO menggabungkan field katalog (master) + saldo (inventory) → FE `InventoryItem`+`StockBalance`.

import { z } from "zod";

export const StockListQuery = z.object({
  locationId: z.string().uuid("locationId tidak valid"),
});
export type StockListQuery = z.infer<typeof StockListQuery>;

export const ItemDetailQuery = z.object({
  jenis: z.enum(["Obat", "BMHP"]),
  itemId: z.string().uuid("itemId tidak valid"),
});
export type ItemDetailQuery = z.infer<typeof ItemDetailQuery>;

/** Atur kebijakan reorder (min/ROP/max) satu item di satu lokasi. */
export const SetStockPolicyInput = z
  .object({
    itemJenis: z.enum(["Obat", "BMHP"]),
    itemId: z.string().uuid("itemId tidak valid"),
    locationId: z.string().uuid("locationId tidak valid"),
    min: z.number().int().min(0, "Min tidak boleh negatif"),
    reorderPoint: z.number().int().min(0, "ROP tidak boleh negatif"),
    max: z.number().int().min(0, "Max tidak boleh negatif"),
  })
  .refine((v) => v.min <= v.reorderPoint, { message: "Min tidak boleh melebihi ROP", path: ["min"] })
  .refine((v) => v.max === 0 || v.reorderPoint <= v.max, { message: "ROP tidak boleh melebihi Max", path: ["reorderPoint"] });
export type SetStockPolicyInput = z.infer<typeof SetStockPolicyInput>;

export interface StockPolicyDTO {
  itemJenis: InvItemJenis;
  itemId: string;
  locationId: string;
  min: number;
  reorderPoint: number;
  max: number;
}

export type InvItemJenis = "Obat" | "BMHP";

export interface InvLocationDTO {
  id: string;
  kode: string;
  nama: string;
  tipe: "Gudang" | "Depo" | "Unit";
}

/** Baris Daftar Barang = katalog (snapshot master) + saldo lokasi terpilih. */
export interface InvStockRowDTO {
  itemJenis: InvItemJenis;
  itemId: string;
  kode: string;
  nama: string;
  kategori: string;
  satuan: string;
  isHAM?: boolean;
  isSteril?: boolean;
  hargaSatuan: number;
  qty: number;
  qtyReserved: number;
  min: number;
  max: number;
  reorderPoint: number;
}

export interface InvItemBalanceDTO {
  locationId: string;
  locationNama: string;
  qty: number;
  min: number;
  max: number;
  reorderPoint: number;
}
export interface InvItemBatchDTO {
  id: string;
  batchNo: string;
  locationNama: string;
  qty: number;
  expiryDate: string | null; // ISO date (YYYY-MM-DD) atau null
}
export interface InvItemMovementDTO {
  id: string;
  jenis: string;
  refNo: string | null;
  qty: number;
  waktu: string; // ISO datetime
}

export interface InvItemDetailDTO {
  itemJenis: InvItemJenis;
  itemId: string;
  kode: string;
  nama: string;
  kategori: string;
  satuan: string;
  isHAM?: boolean;
  isSteril?: boolean;
  hargaSatuan: number;
  balances: InvItemBalanceDTO[];
  batches: InvItemBatchDTO[];
  movements: InvItemMovementDTO[];
}
