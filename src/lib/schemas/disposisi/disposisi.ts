// Zod input + DTO — Disposisi / Outcome episode (tab Pasien Pulang, IGD).
// DisposisiInput = payload disposisi yang menyertai aksi "complete" (Selesaikan Kunjungan);
// ditulis atomik di kunjunganService.transition. DTO mirror PasienPulang FE. waktuKeluar =
// waktuSelesai lifecycle (single moment). TTV keluar TIDAK di sini (single-source Observation).

import { z } from "zod";

export const DisposisiJenis = z.enum(["Pulang", "Rawat_Inap", "Rujuk", "Meninggal", "APS"]);
export type DisposisiJenis = z.infer<typeof DisposisiJenis>;

// ── Input (menyertai complete) ─────────────────────────────────────────────────
export const DisposisiInput = z.object({
  jenis: DisposisiJenis,
  dokter: z.string().trim().optional(), // default nama actor di Service
  kondisiUmum: z.string().trim().min(1, "Kondisi umum wajib").max(120),
  diagnosaKeluar: z.array(z.string().trim().min(1)).max(50).optional(),
  instruksi: z.string().max(4000).optional(),
  // blok per-jenis (opsional)
  rujukTujuan: z.string().max(300).optional(),
  rujukAlasan: z.string().max(2000).optional(),
  meninggalWaktu: z.string().max(60).optional(),
  meninggalSebab: z.string().max(2000).optional(),
  apsAlasan: z.string().max(2000).optional(),
  rawatInapRuangan: z.string().max(200).optional(),
  rawatInapKelas: z.string().max(60).optional(),
  catatan: z.string().max(2000).optional(),
});
export type DisposisiInput = z.infer<typeof DisposisiInput>;

export const IdParam = z.object({ id: z.string().uuid() });

// ── DTO (response GET /kunjungan/:id/disposisi) ────────────────────────────────
export interface DisposisiDTO {
  id: string;
  jenis: "Pulang" | "Rawat_Inap" | "Rujuk" | "Meninggal" | "APS";
  waktuKeluar: string; // ISO
  dokter: string;
  kondisiUmum: string;
  diagnosaKeluar: string[];
  instruksi: string;
  rujukTujuan?: string;
  rujukAlasan?: string;
  meninggalWaktu?: string;
  meninggalSebab?: string;
  apsAlasan?: string;
  rawatInapRuangan?: string;
  rawatInapKelas?: string;
  catatan?: string;
  pemeriksa: string;
  createdAt: string; // ISO
}
