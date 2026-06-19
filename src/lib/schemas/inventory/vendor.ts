// Zod input + DTO — Inventory Rekanan (Vendor/PBF/Distributor). DTO = FE `Vendor` (mirror penuh).
// Kode auto `VND-<NNN>` (global) di Service. Enum FE-facing (jenis/status) = native enum DB.

import { z } from "zod";
import type { Vendor } from "@/lib/inventory/inventoryMock";

export const VendorJenisEnum = z.enum(["PBF", "Distributor", "Manufaktur"]);
export const VendorStatusEnum = z.enum(["Aktif", "Non_Aktif"]);

// Optional string — kunci object BENAR-BENAR opsional (tanpa .transform agar tak jadi required key).
const optStr = z.string().trim().min(1).optional();

// ── Create (POST /inventory/vendors) ──
export const CreateVendorInput = z.object({
  nama: z.string().trim().min(1, "Nama rekanan wajib").max(200),
  jenis: VendorJenisEnum,
  izinPbf: optStr,
  kontakNama: z.string().trim().min(1, "Nama kontak wajib").max(120),
  telp: z.string().trim().min(1, "Telepon wajib").max(40),
  email: optStr,
  alamat: z.string().trim().max(300).optional().transform((v) => v ?? ""),
  leadTimeHari: z.number().int().min(0).max(365).optional(),
  status: VendorStatusEnum.optional(),
});
export type CreateVendorInput = z.infer<typeof CreateVendorInput>;

// ── Update (PATCH /inventory/vendors/:id) — parsial ──
export const UpdateVendorInput = z.object({
  nama: z.string().trim().min(1).max(200).optional(),
  jenis: VendorJenisEnum.optional(),
  izinPbf: optStr,
  kontakNama: z.string().trim().min(1).max(120).optional(),
  telp: z.string().trim().min(1).max(40).optional(),
  email: optStr,
  alamat: z.string().trim().max(300).optional(),
  leadTimeHari: z.number().int().min(0).max(365).optional(),
  status: VendorStatusEnum.optional(),
});
export type UpdateVendorInput = z.infer<typeof UpdateVendorInput>;

// ── Query list (GET /inventory/vendors) ──
export const VendorQuery = z.object({
  q: z.string().trim().optional(),
  jenis: VendorJenisEnum.optional(),
  status: z.enum(["Semua", "Aktif", "Non_Aktif"]).optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(300).optional(),
});
export type VendorQuery = z.infer<typeof VendorQuery>;

export const IdParam = z.object({ id: z.string().uuid("ID tidak valid") });
export type IdParam = z.infer<typeof IdParam>;

// ── DTO (response) = FE Vendor (mirror penuh) ──
export type VendorDTO = Vendor;
