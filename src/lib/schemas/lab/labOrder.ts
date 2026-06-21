// Zod input + DTO — tab Order Lab (order pemeriksaan lab ke unit Laboratorium, per-kunjungan).
// 1 order = header (lab tujuan + prioritas + penulis) + items[] (baris tes). Mirror FE OrderLabTab
// + LabOrder (worklist lab). Selaras schemas/resep/resep.ts. Lihat medicalrecord.LabOrder / LabOrderItem.

import { z } from "zod";

const optStr = z.string().trim().optional().transform((v) => (v ? v : undefined));

export const PrioritasLabEnum = z.enum(["CITO", "Segera", "Rutin"]);

// ── Item input ───────────────────────────────────────────────────────────────
export const LabItemInput = z.object({
  labTestId: z.string().uuid().optional(),    // katalog master.LabTest (null = ad-hoc/manual)
  kodeTes: z.string().trim().max(60).default(""),
  namaTes: z.string().trim().min(1, "Nama tes wajib").max(300),
  kategori: z.string().trim().max(60).default(""),
  waktuTunggu: optStr,
  harga: z.coerce.number().int().min(0).max(2_000_000_000).nullish(), // snapshot tarif saat order
});
export type LabItemInput = z.infer<typeof LabItemInput>;

// ── Order input (POST /kunjungan/:id/lab) ─────────────────────────────────────
export const LabOrderInput = z.object({
  labKode: optStr,                            // Location.kode kategori Laboratorium (opsional)
  labNama: z.string().trim().min(1, "Unit Laboratorium wajib").max(120),
  catatan: optStr,
  prioritas: PrioritasLabEnum.default("Rutin"),
  penulis: optStr,                            // kosong → default nama actor (server)
  penulisKontak: optStr,
  items: z.array(LabItemInput).min(1, "Order minimal berisi 1 pemeriksaan"),
});
export type LabOrderInput = z.infer<typeof LabOrderInput>;
/** Bentuk pra-parse (field ber-default opsional) — dipakai pemanggil API/FE. */
export type LabOrderBody = z.input<typeof LabOrderInput>;

// ── Params batalkan order (POST /kunjungan/:id/lab/:labId/cancel) ─────────────
// `id` = kunjungan (dipakai ABAC careUnit route()), `labId` = order yang dibatalkan.
export const LabCancelParams = z.object({
  id: z.string().uuid("Kunjungan tidak valid"),
  labId: z.string().uuid("Order lab tidak valid"),
});
export type LabCancelParams = z.infer<typeof LabCancelParams>;

// ── Param order Lab (GET/POST /lab/orders/:id[/receive]) ──────────────────────
// Lintas-kunjungan (penunjang berdiri-sendiri), by order id.
export const LabOrderIdParam = z.object({
  id: z.string().uuid("Order lab tidak valid"),
});
export type LabOrderIdParam = z.infer<typeof LabOrderIdParam>;

// ── Lab worklist query (GET /lab/orders) ──────────────────────────────────────
export const LabWorklistQuery = z.object({
  labKode: z.string().trim().optional(),
  status: z.string().trim().optional(),
  noRM: z.string().trim().optional(), // filter riwayat per pasien (lintas-kunjungan, semua status)
});
export type LabWorklistQuery = z.infer<typeof LabWorklistQuery>;

// ── Query parameter katalog (GET /lab/test-params) ────────────────────────────
// ids = daftar LabTest.id (comma-separated) → entry hasil ambil parameter dari katalog.
export const LabTestParamsQuery = z.object({
  ids: z.string().trim().min(1, "ids wajib"),
});
export type LabTestParamsQuery = z.infer<typeof LabTestParamsQuery>;

// ── DTO (response) — mirror vocab FE ──────────────────────────────────────────
export interface LabOrderItemDTO {
  id: string;
  labTestId: string | null;
  kodeTes: string;
  namaTes: string;
  kategori: string;
  waktuTunggu: string | null;
  harga: number | null;
}

export interface LabOrderDTO {
  id: string;
  kunjunganId: string;
  labKode: string | null;
  labNama: string;
  catatan: string | null;
  prioritas: string;
  status: string;
  penulis: string;
  penulisKontak: string | null;
  items: LabOrderItemDTO[];
  createdAt: string; // ISO
}

/** Order untuk worklist Lab — header + pasien (join kunjungan) + items. */
export interface LabOrderWorklistDTO extends LabOrderDTO {
  noOrder: string;     // = noKunjungan order ref (snapshot tampil)
  noRM: string;
  namaPasien: string;
  tanggalLahir: string | null; // ISO date (FE hitung usia)
  gender: "L" | "P";
  unit: string;        // "IGD" | "Rawat Inap" | "Rawat Jalan"
}
