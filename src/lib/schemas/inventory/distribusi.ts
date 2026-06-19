// Zod input + DTO — Inventory Distribusi (DistribusiRequest, amprahan depo ke gudang/depo).
// Create = Draft (reservasi stok di sumber per qtyMinta); posting/fulfill (terpisah) → movement
// TRANSFER (sumber −, tujuan +) + lepas reservasi + isi qtyKeluar. DTO diperkaya nama lokasi/item.

import { z } from "zod";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const DistribusiLineInput = z.object({
  itemJenis: z.enum(["Obat", "BMHP"]),
  itemId: z.string().uuid("itemId tidak valid"),
  qtyMinta: z.number().int().positive("Qty diminta harus > 0"),
});
export type DistribusiLineInput = z.infer<typeof DistribusiLineInput>;

export const CreateDistribusiInput = z
  .object({
    tanggal: z.string().regex(ISO_DATE).optional(),
    fromLocationId: z.string().uuid("Lokasi sumber tidak valid"),
    toLocationId: z.string().uuid("Lokasi tujuan tidak valid"),
    pemohon: z.string().trim().min(1, "Pemohon wajib diisi").max(120),
    lines: z.array(DistribusiLineInput).min(1, "Minimal 1 baris barang"),
  })
  .refine((v) => v.fromLocationId !== v.toLocationId, { message: "Sumber & tujuan tidak boleh sama", path: ["toLocationId"] });
export type CreateDistribusiInput = z.infer<typeof CreateDistribusiInput>;

export const DistribusiQuery = z.object({
  q: z.string().trim().optional(),
  status: z.enum(["Semua", "Draft", "Diproses", "Selesai", "Dibatalkan"]).optional(),
  fromLocationId: z.string().uuid().optional(),
  toLocationId: z.string().uuid().optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});
export type DistribusiQuery = z.infer<typeof DistribusiQuery>;

export const IdParam = z.object({ id: z.string().uuid("ID tidak valid") });
export type IdParam = z.infer<typeof IdParam>;

// ── DTO (response) — diperkaya nama ──
export type DocStatus = "Draft" | "Diproses" | "Selesai" | "Dibatalkan";

export interface DistribusiLineDTO {
  itemJenis: "Obat" | "BMHP";
  itemId: string;
  nama: string;
  kode: string;
  qtyMinta: number;
  qtyKeluar: number;
}

export interface DistribusiDTO {
  id: string;
  noDokumen: string;
  tanggal: string; // YYYY-MM-DD
  fromLocationId: string;
  fromLocationNama: string;
  toLocationId: string;
  toLocationNama: string;
  status: DocStatus;
  pemohon: string;
  petugas: string | null;
  lines: DistribusiLineDTO[];
}
