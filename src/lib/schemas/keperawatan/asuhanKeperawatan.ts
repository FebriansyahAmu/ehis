// Zod input + DTO — Asuhan Keperawatan (tab Keperawatan, SDKI/SLKI/SIKI). DTO mirror
// AsuhanKeperawatanEntry (FE: lib/data.ts) → zero-refactor wiring (tanggalInput/verifiedAt = ISO).
// Input pakai OPTIONAL murni (tanpa transform pengubah-tipe) → partial PATCH & tipe klien rapi;
// normalisasi (trim/filter/default) dilakukan di Service. kodeSdki = soft-ref D.NNNN.

import { z } from "zod";

// ── Vocab terkontrol (identik union FE) ───────────────────────────────────────
export const StatusLuaranEnum = z.enum([
  "Teratasi", "Teratasi_Sebagian", "Belum_Teratasi", "Dipantau",
]);
export type StatusLuaranDTO = z.infer<typeof StatusLuaranEnum>;

export const ShiftEnum = z.enum(["Pagi", "Siang", "Malam"]);
export const TujuanUnitEnum = z.enum(["Jam", "Hari"]);

const optStr = z.string().trim().optional(); // string | undefined (input = output)
const strArr = z.array(z.string()).optional(); // string[] | undefined

// Blok pengkajian (mayor/minor): subjektif + objektif (narasi bebas).
export const DataPengkajianSchema = z.object({
  subjektif: z.string().optional(),
  objektif: z.string().optional(),
});
// Blok intervensi (SIKI): 4 kelompok.
export const IntervensiSchema = z.object({
  observasi: strArr,
  terapeutik: strArr,
  edukasi: strArr,
  kolaborasi: strArr,
});
// Evaluasi shift (timeline; tanggal/jam = string tampilan, bukan timestamptz).
export const EvaluasiShiftSchema = z.object({
  id: z.string().optional(),
  tanggal: z.string().optional(),
  jam: z.string().optional(),
  shift: ShiftEnum.optional(),
  subjektif: z.string().optional(),
  objektif: z.string().optional(),
  statusLuaran: StatusLuaranEnum,
  perawat: z.string().optional(),
});

// ── Create (POST /kunjungan/:id/asuhan-keperawatan) ────────────────────────────
export const AsuhanKeperawatanInput = z.object({
  kodeSdki: optStr,
  diagnosa: z.string().trim().min(1, "Diagnosa wajib").max(1000),
  penyebab: optStr,
  faktorResiko: optStr,
  dataMayor: DataPengkajianSchema.optional(),
  dataMinor: DataPengkajianSchema.optional(),
  tujuanDurasi: optStr,
  tujuanUnit: TujuanUnitEnum.optional(),
  selama: optStr,
  kriteriaHasil: strArr,
  statusLuaran: StatusLuaranEnum.optional(),
  intervensi: IntervensiSchema.optional(),
  evaluasi: z.array(EvaluasiShiftSchema).optional(),
  tanggalInput: z.string().optional(), // ISO; default now() di Service
  perawat: optStr,                      // default nama actor di Service
});
export type AsuhanKeperawatanInput = z.infer<typeof AsuhanKeperawatanInput>;

// ── Update (PATCH /:itemId) — parsial (edit / verify / evaluasi / status) ──────
export const AsuhanKeperawatanUpdate = z.object({
  kodeSdki: optStr,
  diagnosa: z.string().trim().min(1).max(1000).optional(),
  penyebab: optStr,
  faktorResiko: optStr,
  dataMayor: DataPengkajianSchema.optional(),
  dataMinor: DataPengkajianSchema.optional(),
  tujuanDurasi: optStr,
  tujuanUnit: TujuanUnitEnum.optional(),
  selama: optStr,
  kriteriaHasil: strArr,
  statusLuaran: StatusLuaranEnum.optional(),
  intervensi: IntervensiSchema.optional(),
  evaluasi: z.array(EvaluasiShiftSchema).optional(),
  tanggalInput: z.string().optional(),
  perawat: optStr,
  // Verifikasi (co-sign). verifiedAt di-set Service saat verified→true.
  verified: z.boolean().optional(),
  verifiedBy: optStr,
  aktif: z.boolean().optional(),
});
export type AsuhanKeperawatanUpdate = z.infer<typeof AsuhanKeperawatanUpdate>;

export const IdParam = z.object({ id: z.string().uuid() });
export const ItemParam = z.object({ id: z.string().uuid(), itemId: z.string().uuid() });
export type ItemParam = z.infer<typeof ItemParam>;

// ── DTO (response) — mirror AsuhanKeperawatanEntry FE ──────────────────────────
export interface EvaluasiShiftDTO {
  id: string;
  tanggal: string;
  jam: string;
  shift: "Pagi" | "Siang" | "Malam";
  subjektif: string;
  objektif: string;
  statusLuaran: StatusLuaranDTO;
  perawat: string;
}
export interface AsuhanKeperawatanDTO {
  id: string;
  kodeSdki: string;
  diagnosa: string;
  penyebab: string;
  faktorResiko: string;
  dataMayor: { subjektif: string; objektif: string };
  dataMinor: { subjektif: string; objektif: string };
  tujuanDurasi: string;
  tujuanUnit: "Jam" | "Hari";
  selama: string;
  kriteriaHasil: string[];
  statusLuaran: StatusLuaranDTO;
  intervensi: { observasi: string[]; terapeutik: string[]; edukasi: string[]; kolaborasi: string[] };
  evaluasi: EvaluasiShiftDTO[];
  tanggalInput: string; // ISO
  perawat: string;
  verified: boolean;
  verifiedBy: string;
  verifiedAt: string; // ISO atau ""
  aktif: boolean;
}
