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

/** Penyesuaian cepat stok satu item (movement ADJUST) — alternatif ringan vs opname penuh. */
export const AdjustStockInput = z
  .object({
    itemJenis: z.enum(["Obat", "BMHP"]),
    itemId: z.string().uuid("itemId tidak valid"),
    locationId: z.string().uuid("locationId tidak valid"),
    /** `set` = jadikan stok = value · `delta` = tambah/kurang value (boleh negatif). */
    mode: z.enum(["set", "delta"]),
    value: z.number().int("Nilai harus bilangan bulat"),
    /** Kategori alasan (Koreksi/Rusak/Hilang/Kadaluwarsa/Temuan/Lainnya). */
    alasan: z.string().trim().min(1, "Alasan wajib").max(60),
    catatan: z.string().trim().max(200).optional(),
  })
  .refine((v) => v.mode !== "set" || v.value >= 0, { message: "Jumlah set tidak boleh negatif", path: ["value"] })
  .refine((v) => v.mode !== "delta" || v.value !== 0, { message: "Selisih tidak boleh 0", path: ["value"] });
export type AdjustStockInput = z.infer<typeof AdjustStockInput>;

export interface AdjustStockResultDTO {
  itemJenis: InvItemJenis;
  itemId: string;
  locationId: string;
  qtyBefore: number;
  qtyAfter: number;
  delta: number;
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

// ── Stok klinis (advisory overlay untuk picker Resep) ──────────────────────────
// Read RINGAN saldo Obat di satu depo, keyed by `itemId` (UUID master Obat) — FE merge ke
// katalog formularium. Gate KLINIS (`clinical.resep:read`), BUKAN inventory.* (klinisi tak punya).
export const StokKlinisQuery = z.object({
  lokasiId: z.string().uuid("Lokasi tidak valid"),
});
export type StokKlinisQuery = z.infer<typeof StokKlinisQuery>;

export type StokKlinisStatus = "Aman" | "Menipis" | "Habis";

export interface StokKlinisRow {
  itemId: string; // UUID master Obat (kunci merge ke katalog formularium)
  qtyOnHand: number;
  qtyReserved: number;
  available: number; // qtyOnHand − qtyReserved (≥0)
  reorderPoint: number;
  status: StokKlinisStatus;
  nearestED: string | null; // ED batch terdekat (YYYY-MM-DD) atau null
}
