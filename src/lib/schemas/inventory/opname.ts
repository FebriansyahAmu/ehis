// Zod input + DTO — Inventory Stok Opname (OpnameSession). Create = snapshot saldo lokasi (qtySistem,
// qtyFisik null) status Counting. Save = isi qtyFisik/alasan (Counting↔Review). Post = movement
// OPNAME per selisih (qtyFisik − qtySistem) → Posted. DTO diperkaya nama lokasi/item.

import { z } from "zod";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const CreateOpnameInput = z.object({
  tanggal: z.string().regex(ISO_DATE).optional(),
  locationId: z.string().uuid("Lokasi tidak valid"),
});
export type CreateOpnameInput = z.infer<typeof CreateOpnameInput>;

export const OpnameCountLine = z.object({
  itemRowId: z.string().uuid("Baris tidak valid"),
  qtyFisik: z.number().int().min(0).nullable(),
  alasan: z.string().trim().max(200).optional(),
});
export const SaveOpnameCountsInput = z.object({
  items: z.array(OpnameCountLine).min(1, "Minimal 1 baris"),
});
export type SaveOpnameCountsInput = z.infer<typeof SaveOpnameCountsInput>;

export const OpnameQuery = z.object({
  q: z.string().trim().optional(),
  status: z.enum(["Semua", "Draft", "Counting", "Review", "Posted"]).optional(),
  locationId: z.string().uuid().optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});
export type OpnameQuery = z.infer<typeof OpnameQuery>;

export const IdParam = z.object({ id: z.string().uuid("ID tidak valid") });
export type IdParam = z.infer<typeof IdParam>;

// ── DTO (response) — diperkaya nama ──
export type OpnameStatus = "Draft" | "Counting" | "Review" | "Posted";

export interface OpnameLineDTO {
  id: string;
  itemJenis: "Obat" | "BMHP";
  itemId: string;
  nama: string;
  kode: string;
  satuan: string;
  qtySistem: number;
  qtyFisik: number | null;
  alasan?: string;
}

export interface OpnameDTO {
  id: string;
  noDokumen: string;
  tanggal: string; // YYYY-MM-DD
  locationId: string;
  locationNama: string;
  status: OpnameStatus;
  petugas: string;
  lines: OpnameLineDTO[];
}
