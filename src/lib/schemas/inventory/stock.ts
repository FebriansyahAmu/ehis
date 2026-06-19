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
