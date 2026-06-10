// Zod + DTO — tab CPPT (Catatan Perkembangan Pasien Terintegrasi), per-item.
// DTO mirror CPPTEntry FE. jenisCatatan = metode komunikasi efektif SKP 2
// (SOAP/SBAR/TBAK). Kelengkapan TBAK & keberadaan narasi divalidasi di Service
// (tergantung state akhir, terutama pada patch parsial).

import { z } from "zod";

export const CpptProfesi = z.enum([
  "Dokter", "Perawat", "Bidan", "Apoteker", "Gizi", "Fisioterapi", "Lainnya",
]);
export type CpptProfesi = z.infer<typeof CpptProfesi>;

export const CpptJenis = z.enum(["SOAP", "SBAR", "TBAK"]);
export type CpptJenis = z.infer<typeof CpptJenis>;

export const TbakMetode = z.enum(["Telepon", "Lisan"]);
export type TbakMetode = z.infer<typeof TbakMetode>;

const optStr = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined));

const narasi = {
  subjektif: optStr,
  objektif: optStr,
  asesmen: optStr,
  planning: optStr,
  instruksi: optStr,
};

const tbak = {
  tbakPemberi: optStr,
  tbakMetode: TbakMetode.optional(),
  tbakTulis: z.boolean().optional(),
  tbakBaca: z.boolean().optional(),
  tbakKonfirmasi: z.boolean().optional(),
};

export const CpptItemInput = z.object({
  profesi: CpptProfesi,
  jenisCatatan: CpptJenis.default("SOAP"),
  ...narasi,
  ...tbak,
  perluVerifikasi: z.boolean().default(false), // tab requiresVerification (RI); TBAK selalu dipaksa true di Service
});
export type CpptItemInput = z.infer<typeof CpptItemInput>;

// Patch parsial — koreksi isi catatan (semua field opsional).
export const CpptItemUpdate = z.object({
  profesi: CpptProfesi.optional(),
  jenisCatatan: CpptJenis.optional(),
  subjektif: z.string().trim().optional(),
  objektif: z.string().trim().optional(),
  asesmen: z.string().trim().optional(),
  planning: z.string().trim().optional(),
  instruksi: z.string().trim().optional(),
  tbakPemberi: z.string().trim().optional(),
  tbakMetode: TbakMetode.optional(),
  tbakTulis: z.boolean().optional(),
  tbakBaca: z.boolean().optional(),
  tbakKonfirmasi: z.boolean().optional(),
  perluVerifikasi: z.boolean().optional(),
});
export type CpptItemUpdate = z.infer<typeof CpptItemUpdate>;

export const CpptFlagInput = z.object({ flagged: z.boolean() });
export type CpptFlagInput = z.infer<typeof CpptFlagInput>;

export const CpptItemParam = z.object({
  id: z.string().uuid(),
  itemId: z.string().uuid(),
});
export type CpptItemParam = z.infer<typeof CpptItemParam>;

export interface CpptEntryDTO {
  id: string;
  waktu: string;            // "HH:MM"
  tanggal: string;          // "YYYY-MM-DD"
  profesi: CpptProfesi;
  penulis: string;
  jenisCatatan: CpptJenis;
  subjektif?: string;
  objektif?: string;
  asesmen?: string;
  planning?: string;
  instruksi?: string;
  tbakPemberi?: string;
  tbakMetode?: TbakMetode;
  tbakTulis?: boolean;
  tbakBaca?: boolean;
  tbakKonfirmasi?: boolean;
  verified?: boolean;       // undefined = tak perlu co-sign
  verifiedBy?: string;
  verifiedAt?: string;      // "8 Mei 2025, 17:00"
  flagged?: boolean;
}

export interface CpptDTO {
  kunjunganId: string;
  entries: CpptEntryDTO[];  // terbaru dulu
}
