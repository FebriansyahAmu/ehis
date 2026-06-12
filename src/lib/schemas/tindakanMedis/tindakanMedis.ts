// Zod input + DTO — rekam medis Tindakan Medis (tab Tindakan, per-kunjungan). Pencatatan tindakan
// yang DILAKUKAN + jumlah + biaya snapshot → hilir Billing. Lihat medicalrecord.TindakanMedis.

import { z } from "zod";

const optStr = z.string().trim().optional().transform((v) => (v ? v : undefined));

// ── Create (POST /kunjungan/:id/tindakan) ──────────────────────────────────────
export const TindakanMedisInput = z.object({
  tindakanId: z.string().uuid().optional(),         // ref master.Tindakan (null = non-katalog)
  kode: z.string().trim().max(20).optional(),       // ICD-9-CM snapshot (boleh kosong)
  nama: z.string().trim().min(1, "Nama tindakan wajib").max(500),
  kategori: z.string().trim().min(1, "Kategori wajib").max(120), // master kategori (snapshot)
  jumlah: z.coerce.number().int().min(1).max(999).default(1),
  harga: z.coerce.number().int().min(0).max(2_000_000_000).nullish(), // snapshot tarif; null = belum bertarif
  penjaminKode: z.string().trim().max(20).optional(),
  jenisRuangan: z.string().trim().max(40).optional(),
  pelaksana: optStr,                                // kosong → default nama actor (server)
});
export type TindakanMedisInput = z.infer<typeof TindakanMedisInput>;

// ── Update (PATCH /kunjungan/:id/tindakan/:itemId) — jumlah / pelaksana ─────────
export const TindakanMedisUpdate = z
  .object({
    jumlah: z.coerce.number().int().min(1).max(999).optional(),
    pelaksana: z.string().trim().min(1).max(200).optional(),
  })
  .refine((d) => d.jumlah !== undefined || d.pelaksana !== undefined, {
    message: "Tak ada perubahan",
  });
export type TindakanMedisUpdate = z.infer<typeof TindakanMedisUpdate>;

export const TindakanItemParam = z.object({
  id: z.string().uuid(),
  itemId: z.string().uuid(),
});
export type TindakanItemParam = z.infer<typeof TindakanItemParam>;

// ── DTO (response) ─────────────────────────────────────────────────────────────
export interface TindakanMedisDTO {
  id: string;
  tindakanId: string | null;
  kode: string;
  nama: string;
  kategori: string;
  jumlah: number;
  harga: number | null;
  pelaksana: string;
  dilakukanPada: string; // ISO
  createdAt: string;     // ISO
}
