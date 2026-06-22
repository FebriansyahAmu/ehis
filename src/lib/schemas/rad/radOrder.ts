// Zod input + DTO — tab Order Radiologi (order pemeriksaan rad ke unit Radiologi, per-kunjungan).
// 1 order = header (rad tujuan + prioritas + klinis/indikasi + penulis) + items[] (baris pemeriksaan).
// Mirror FE OrderRadTab + alur LabOrder. Lihat medicalrecord.RadOrder / RadOrderItem. Selaras
// schemas/lab/labOrder.ts. `modalitas` = method FHIR snapshot (XR/CT/MR/RF/US/MG/DXA/NM).

import { z } from "zod";

const optStr = z.string().trim().optional().transform((v) => (v ? v : undefined));

export const PrioritasRadEnum = z.enum(["CITO", "Segera", "Rutin"]);

// ── Item input ───────────────────────────────────────────────────────────────
export const RadItemInput = z.object({
  radCatalogId: z.string().uuid().optional(),  // katalog master.RadCatalog (null = ad-hoc/manual)
  kode: z.string().trim().max(60).default(""),
  nama: z.string().trim().min(1, "Nama pemeriksaan wajib").max(300),
  modalitas: z.string().trim().max(20).default(""), // method FHIR (XR/CT/…)
  region: z.string().trim().max(60).default(""),
  waktuTunggu: optStr,
  persiapan: optStr,
  harga: z.coerce.number().int().min(0).max(2_000_000_000).nullish(), // snapshot tarif saat order
});
export type RadItemInput = z.infer<typeof RadItemInput>;

// ── Order input (POST /kunjungan/:id/rad) ─────────────────────────────────────
export const RadOrderInput = z.object({
  radKode: optStr,                            // Location.kode kategori Radiologi (opsional)
  radNama: z.string().trim().min(1, "Unit Radiologi wajib").max(120),
  catatan: optStr,                            // klinis & indikasi
  prioritas: PrioritasRadEnum.default("Rutin"),
  penulis: optStr,                            // kosong → default nama actor (server)
  penulisKontak: optStr,
  items: z.array(RadItemInput).min(1, "Order minimal berisi 1 pemeriksaan"),
});
export type RadOrderInput = z.infer<typeof RadOrderInput>;
/** Bentuk pra-parse (field ber-default opsional) — dipakai pemanggil API/FE. */
export type RadOrderBody = z.input<typeof RadOrderInput>;

// ── Params batalkan order (POST /kunjungan/:id/rad/:radId/cancel) ─────────────
// `id` = kunjungan (dipakai ABAC careUnit route()), `radId` = order yang dibatalkan.
export const RadCancelParams = z.object({
  id: z.string().uuid("Kunjungan tidak valid"),
  radId: z.string().uuid("Order radiologi tidak valid"),
});
export type RadCancelParams = z.infer<typeof RadCancelParams>;

// ── Param order Rad (GET/POST /rad/orders/:id[/receive]) ──────────────────────
// Lintas-kunjungan (penunjang berdiri-sendiri), by order id.
export const RadOrderIdParam = z.object({
  id: z.string().uuid("Order radiologi tidak valid"),
});
export type RadOrderIdParam = z.infer<typeof RadOrderIdParam>;

// ── Rad worklist query (GET /rad/orders) ──────────────────────────────────────
export const RadWorklistQuery = z.object({
  radKode: z.string().trim().optional(),
  status: z.string().trim().optional(),
  noRM: z.string().trim().optional(), // filter riwayat per pasien (lintas-kunjungan, semua status)
});
export type RadWorklistQuery = z.infer<typeof RadWorklistQuery>;

// ── DTO (response) — mirror vocab FE ──────────────────────────────────────────
export interface RadOrderItemDTO {
  id: string;
  radCatalogId: string | null;
  kode: string;
  nama: string;
  modalitas: string;   // method FHIR snapshot
  region: string;
  waktuTunggu: string | null;
  persiapan: string | null;
  harga: number | null;
}

export interface RadOrderDTO {
  id: string;
  kunjunganId: string;
  radKode: string | null;
  radNama: string;
  catatan: string | null;
  prioritas: string;
  status: string;
  penulis: string;
  penulisKontak: string | null;
  items: RadOrderItemDTO[];
  createdAt: string; // ISO
}

/** Roster petugas Radiologi (SDM Assignment ke Location Radiologi) — cek penerima/radiografer/radiolog
 *  & sumber dropdown validator. GET /rad/orders/:id/petugas. */
export interface RadPetugasDTO {
  pegawaiId: string;
  namaTampil: string;
  profesi: string | null;
}

/** Order untuk worklist Rad — header + pasien (join kunjungan) + items. */
export interface RadOrderWorklistDTO extends RadOrderDTO {
  noOrder: string;     // = noKunjungan order ref (snapshot tampil)
  noRM: string;
  namaPasien: string;
  tanggalLahir: string | null; // ISO date (FE hitung usia)
  gender: "L" | "P";
  unit: string;        // "IGD" | "Rawat Inap" | "Rawat Jalan"
}
