// Zod schema + DTO — Discharge Planning step 1: Asesmen Pemulangan (SNARS ARK 5).
// Vocab mirror DischargeAsesmen FE (discharge/dischargeShared.ts) → zero-refactor wiring.
// Semua field boleh kosong "" (draft parsial disimpan; kelengkapan = urusan FE/checklist).
// Append-only "latest wins" per kunjungan; pencatat = actor login (Service).

import { z } from "zod";

// ── Vocab terkontrol ("" = belum diisi) ──────────────────────────────────────
const orEmpty = <T extends readonly [string, ...string[]]>(vals: T) =>
  z.enum([...vals, ""] as unknown as [string, ...string[]]).default("");

export const KondisiPulang   = ["Sembuh", "Membaik", "Belum Sembuh", "APS", "Rujuk", "Meninggal"] as const;
export const HubunganCaregiver = ["Suami", "Istri", "Anak", "Orang Tua", "Saudara", "Lainnya"] as const;
export const KemampuanCaregiver = ["Mampu", "Perlu Pendampingan", "Tidak Mampu"] as const;
export const DukunganKeluarga = ["Ada & Mampu", "Ada tapi Terbatas", "Tidak Ada"] as const;
export const KepatuhanObat    = ["Patuh", "Kadang", "Tidak Patuh"] as const;
export const RiwayatReadmisi  = ["Tidak", "1x", ">1x"] as const;

// ── Simpan (POST /kunjungan/:id/discharge/asesmen) ────────────────────────────
export const DischargeAsesmenInput = z.object({
  tanggalRencanaKRS: z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal harus YYYY-MM-DD")]).default(""),
  kondisiPulang: orEmpty(KondisiPulang),
  caregiverNama: z.string().trim().max(120).default(""),
  caregiverHubungan: orEmpty(HubunganCaregiver),
  caregiverKemampuan: orEmpty(KemampuanCaregiver),
  kebutuhanHomecare: z.boolean().default(false),
  jenisHomecare: z.array(z.string().trim().min(1).max(60)).max(20).default([]),
  kebutuhanAlatBantu: z.boolean().default(false),
  alatBantu: z.array(z.string().trim().min(1).max(60)).max(20).default([]),
  dukunganKeluarga: orEmpty(DukunganKeluarga),
  kepatuhanObatSebelumnya: orEmpty(KepatuhanObat),
  riwayatReadmisi: orEmpty(RiwayatReadmisi),
  catatan: z.string().trim().max(2000).default(""),
});
export type DischargeAsesmenInput = z.infer<typeof DischargeAsesmenInput>;

export const IdParam = z.object({ id: z.string().uuid() });

// ── DTO (mirror DischargeAsesmen FE + meta pencatat) ──────────────────────────
export interface DischargeAsesmenDTO {
  tanggalRencanaKRS: string;
  kondisiPulang: string;
  caregiverNama: string;
  caregiverHubungan: string;
  caregiverKemampuan: string;
  kebutuhanHomecare: boolean;
  jenisHomecare: string[];
  kebutuhanAlatBantu: boolean;
  alatBantu: string[];
  dukunganKeluarga: string;
  kepatuhanObatSebelumnya: string;
  riwayatReadmisi: string;
  catatan: string;
  /** Meta revisi terakhir (latest-wins). */
  pencatat: string;
  updatedAt: string; // ISO
}
