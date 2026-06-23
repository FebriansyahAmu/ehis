// Zod input + DTO — tab Order BMHP (permintaan BMHP ke depo Farmasi, per-kunjungan).
// 1 order = header (depo + catatan + pemohon) + items[] (baris BMHP). Mirror FE BmhpOrderTab +
// alur ResepOrder/LabOrder. Lihat medicalrecord.BmhpOrder / BmhpItem. Selaras schemas/resep/resep.ts.

import { z } from "zod";

const optStr = z.string().trim().optional().transform((v) => (v ? v : undefined));

export const PrioritasBmhpEnum = z.enum(["CITO", "Segera", "Rutin"]);

// ── Item input ───────────────────────────────────────────────────────────────
export const BmhpItemInput = z.object({
  bmhpId: z.string().uuid().optional(),     // katalog master.Bmhp (null = ad-hoc/manual)
  kode: z.string().trim().max(60).default(""),
  nama: z.string().trim().min(1, "Nama BMHP wajib").max(300),
  satuan: z.string().trim().max(40).default(""),
  kategori: z.string().trim().max(80).default(""),
  jumlah: z.coerce.number().int().min(1).max(9999).default(1),
  keterangan: optStr,
  harga: z.coerce.number().int().min(0).max(2_000_000_000).nullish(), // snapshot harga satuan saat order
});
export type BmhpItemInput = z.infer<typeof BmhpItemInput>;

// ── Order input (POST /kunjungan/:id/bmhp) ────────────────────────────────────
export const BmhpOrderInput = z.object({
  depoKode: optStr,                         // Location.kode kategori Farmasi (opsional)
  depoNama: z.string().trim().min(1, "Depo Farmasi wajib").max(120),
  catatan: optStr,
  prioritas: PrioritasBmhpEnum.default("Rutin"),
  penulis: optStr,                          // kosong → default nama actor (server)
  penulisKontak: optStr,
  items: z.array(BmhpItemInput).min(1, "Order minimal berisi 1 BMHP"),
});
export type BmhpOrderInput = z.infer<typeof BmhpOrderInput>;
/** Bentuk pra-parse (field ber-default opsional) — dipakai pemanggil API/FE. */
export type BmhpOrderBody = z.input<typeof BmhpOrderInput>;

// ── Params batalkan order (POST /kunjungan/:id/bmhp/:bmhpOrderId/cancel) ───────
// `id` = kunjungan (dipakai ABAC careUnit route()), `bmhpOrderId` = order yang dibatalkan.
export const BmhpCancelParams = z.object({
  id: z.string().uuid("Kunjungan tidak valid"),
  bmhpOrderId: z.string().uuid("Order BMHP tidak valid"),
});
export type BmhpCancelParams = z.infer<typeof BmhpCancelParams>;

// ── DTO (response) — mirror vocab FE ──────────────────────────────────────────
export interface BmhpItemDTO {
  id: string;
  bmhpId: string | null;
  kode: string;
  nama: string;
  satuan: string;
  kategori: string;
  jumlah: number;
  keterangan: string | null;
  /** Snapshot harga satuan (Rp) saat order. null = belum bertarif. Biaya baris = harga × jumlah. */
  harga: number | null;
}

export interface BmhpOrderDTO {
  id: string;
  kunjunganId: string;
  depoKode: string | null;
  depoNama: string;
  catatan: string | null;
  prioritas: string;
  status: string;
  penulis: string;
  penulisKontak: string | null;
  items: BmhpItemDTO[];
  createdAt: string; // ISO
}
