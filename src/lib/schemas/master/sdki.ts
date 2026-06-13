// Zod input + DTO — Master Katalog Keperawatan (schema "master", model Sdki).
// DTO mirror SdkiItem (FE: lib/master/sdkiMock.ts) → zero-refactor saat wiring.
// Enum kategori/jenis/status IDENTIK union FE → pass-through (validasi Zod saja).
// Kode `D.NNNN` AUTO-GEN di Service (counter) → TIDAK ada di input create/update.

import { z } from "zod";

// ── Vocab terkontrol (FE-facing, identik union SdkiItem) ──────────────────────
export const SdkiKategoriEnum = z.enum([
  "Fisiologis", "Psikologis", "Perilaku", "Relasional", "Lingkungan",
]);
export type SdkiKategoriDTO = z.infer<typeof SdkiKategoriEnum>;

export const SdkiJenisEnum = z.enum(["Aktual", "Risiko", "Promosi_Kesehatan"]);
export type SdkiJenisDTO = z.infer<typeof SdkiJenisEnum>;

export const SdkiStatusEnum = z.enum(["Aktif", "Non_Aktif"]);
export type SdkiStatusDTO = z.infer<typeof SdkiStatusEnum>;

// String opsional (kosong/whitespace → undefined).
const optStr = z.string().trim().optional().transform((v) => (v ? v : undefined));
// Daftar string bersih (buang entri kosong).
const strList = z.array(z.string().trim()).optional().transform((a) => (a ?? []).filter(Boolean));

// Blok data klinis (mayor/minor): subjektif + objektif.
export const SdkiDataSchema = z.object({
  subjektif: strList,
  objektif: strList,
});
// Blok intervensi (SIKI): 4 kelompok.
export const SdkiIntervensiSchema = z.object({
  observasi: strList,
  terapeutik: strList,
  edukasi: strList,
  kolaborasi: strList,
});

// ── Create (POST /master/sdki) — TANPA kode (auto-gen di Service) ─────────────
export const CreateSdkiInput = z.object({
  nama: z.string().trim().min(1, "Nama diagnosa wajib").max(300),
  kategori: SdkiKategoriEnum.optional(), // default Fisiologis di Service
  subKategori: optStr,
  jenis: SdkiJenisEnum.optional(), // default Aktual di Service
  penyebabUmum: optStr,
  faktorResiko: optStr,
  dataMayor: SdkiDataSchema.optional(),
  dataMinor: SdkiDataSchema.optional(),
  kriteriaHasil: strList,
  intervensi: SdkiIntervensiSchema.optional(),
  status: SdkiStatusEnum.optional(), // default Aktif di Service
});
export type CreateSdkiInput = z.infer<typeof CreateSdkiInput>;

// ── Update (PATCH /master/sdki/:id) — parsial, kode immutable (auto) ──────────
export const UpdateSdkiInput = z.object({
  nama: z.string().trim().min(1).max(300).optional(),
  kategori: SdkiKategoriEnum.optional(),
  subKategori: optStr,
  jenis: SdkiJenisEnum.optional(),
  penyebabUmum: optStr,
  faktorResiko: optStr,
  dataMayor: SdkiDataSchema.optional(),
  dataMinor: SdkiDataSchema.optional(),
  kriteriaHasil: strList,
  intervensi: SdkiIntervensiSchema.optional(),
  status: SdkiStatusEnum.optional(),
});
export type UpdateSdkiInput = z.infer<typeof UpdateSdkiInput>;

// ── Query list (GET /master/sdki) ────────────────────────────────────────────
export const SdkiQuery = z.object({
  q: z.string().trim().optional(), // cari kode/nama/sub-kategori
  kategori: SdkiKategoriEnum.optional(),
  jenis: SdkiJenisEnum.optional(),
  status: z.enum(["Semua", "Aktif", "Non_Aktif"]).optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(300).optional(),
});
export type SdkiQuery = z.infer<typeof SdkiQuery>;

export const IdParam = z.object({ id: z.string().uuid() });
export type IdParam = z.infer<typeof IdParam>;

// ── DTO (response) — mirror SdkiItem FE ────────────────────────────────────────
export interface SdkiDataDTO {
  subjektif: string[];
  objektif: string[];
}
export interface SdkiIntervensiDTO {
  observasi: string[];
  terapeutik: string[];
  edukasi: string[];
  kolaborasi: string[];
}
export interface SdkiDTO {
  id: string;
  kode: string;
  nama: string;
  kategori: SdkiKategoriDTO;
  subKategori: string;
  jenis: SdkiJenisDTO;
  penyebabUmum: string;
  faktorResiko?: string;
  dataMayor: SdkiDataDTO;
  dataMinor: SdkiDataDTO;
  kriteriaHasil: string[];
  intervensi: SdkiIntervensiDTO;
  status: SdkiStatusDTO;
}
