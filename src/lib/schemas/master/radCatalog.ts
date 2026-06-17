// Zod input + DTO — Master Katalog Radiologi (schema "master", model RadCatalog).
// DTO mirror RadCatalogRecord (FE: lib/master/radCatalogMock.ts) → zero-refactor wiring.
// Kode `RAD-NNNN` AUTO-GEN di Service (counter) → TIDAK ada di input. `kodeIcd` opsional.
// modalitas = method FHIR (XR/CT/MR/RF/US/MG/DXA/NM); blok terstruktur = JSONB.

import { z } from "zod";

// ── Vocab terkontrol (FE-facing, identik union RadCatalogRecord) ──────────────
export const RadModalitasEnum = z.enum(["XR", "CT", "MR", "RF", "US", "MG", "DXA", "NM"]);
export type RadModalitasDTO = z.infer<typeof RadModalitasEnum>;

export const RadRegionEnum = z.enum([
  "Kepala_Leher", "Thorax", "Abdomen", "Pelvis",
  "Ekstremitas_Atas", "Ekstremitas_Bawah", "Tulang_Belakang",
  "Mammae", "Ginekologi", "Vaskular", "Whole_Body", "Lainnya",
]);
export type RadRegionDTO = z.infer<typeof RadRegionEnum>;

export const RadKategoriEnum = z.enum(["Diagnostik", "Intervensi", "Skrining"]);
export type RadKategoriDTO = z.infer<typeof RadKategoriEnum>;

export const RadJenisKontrasEnum = z.enum([
  "Tanpa", "IV_Iodinasi", "Oral", "Rektal", "Gadolinium", "Kombinasi",
]);
export type RadJenisKontrasDTO = z.infer<typeof RadJenisKontrasEnum>;

export const RadStatusEnum = z.enum(["Aktif", "Non_Aktif"]);
export type RadStatusDTO = z.infer<typeof RadStatusEnum>;

// String opsional top-level (kosong/whitespace → undefined). NB: transform membuat key
// "required-with-undefined" pada OUTPUT — aman utk field top-level yang dikirim eksplisit.
const optStr = z.string().trim().optional().transform((v) => (v ? v : undefined));
// String/number opsional NESTED — TANPA transform → key tetap opsional (cocok tipe FE bersarang).
const nstr = z.string().trim().optional();
const optNum = z.coerce.number().min(0).optional();
const strList = z.array(z.string().trim()).optional().transform((a) => (a ?? []).filter(Boolean));

// ── Blok terstruktur (JSONB) ──────────────────────────────────────────────────
export const TatTargetSchema = z.object({
  cito: z.coerce.number().int().min(1).max(10080),
  semiCito: z.coerce.number().int().min(1).max(10080),
  rutin: z.coerce.number().int().min(1).max(10080),
});
export const PersiapanSchema = z.object({
  puasaJam: optNum,
  premedikasi: nstr,
  kontraindikasi: strList,
  instruksiPasien: nstr,
  catatanKhusus: nstr,
});
export const KontrasSchema = z.object({
  jenis: RadJenisKontrasEnum,
  dosisMl: optNum,
  kecepatanInjeksiMlSec: optNum,
  premedikasiSteroidJikaAlergi: z.boolean().optional(),
  catatan: nstr,
});
export const DrlSchema = z.object({
  ctdiVol: optNum,
  dlp: optNum,
  dap: optNum,
  waktuFluoroMenit: optNum,
  entranceDose: optNum,
  catatan: nstr,
});
export const ReportingTemplateSchema = z.object({
  struktur: strList,
  templateTemuan: nstr,
});

const kodeIcd = z.string().trim().max(20).optional().transform((v) => (v ? v : undefined));

// ── Create (POST /master/rad-catalog) — TANPA kode (auto-gen di Service) ───────
export const CreateRadCatalogInput = z.object({
  nama: z.string().trim().min(1, "Nama pemeriksaan wajib").max(300),
  kodeIcd,
  modalitas: RadModalitasEnum.optional(), // default XR di Service
  modalitasSubtype: optStr,
  region: RadRegionEnum.optional(), // default Thorax di Service
  kategori: RadKategoriEnum.optional(), // default Diagnostik di Service
  estimasiWaktuMenit: z.coerce.number().int().min(1).max(1440).optional(),
  tatTarget: TatTargetSchema.optional(),
  persiapan: PersiapanSchema.optional(),
  kontras: KontrasSchema.optional(),
  drlReferensi: DrlSchema.nullish(),
  reportingTemplate: ReportingTemplateSchema.optional(),
  deskripsi: optStr,
  status: RadStatusEnum.optional(), // default Aktif di Service
});
export type CreateRadCatalogInput = z.infer<typeof CreateRadCatalogInput>;

// ── Update (PATCH /master/rad-catalog/:id) — parsial, kode immutable (auto) ────
export const UpdateRadCatalogInput = z.object({
  nama: z.string().trim().min(1).max(300).optional(),
  kodeIcd,
  modalitas: RadModalitasEnum.optional(),
  modalitasSubtype: optStr,
  region: RadRegionEnum.optional(),
  kategori: RadKategoriEnum.optional(),
  estimasiWaktuMenit: z.coerce.number().int().min(1).max(1440).optional(),
  tatTarget: TatTargetSchema.optional(),
  persiapan: PersiapanSchema.optional(),
  kontras: KontrasSchema.optional(),
  drlReferensi: DrlSchema.nullish(),
  reportingTemplate: ReportingTemplateSchema.optional(),
  deskripsi: optStr,
  status: RadStatusEnum.optional(),
});
export type UpdateRadCatalogInput = z.infer<typeof UpdateRadCatalogInput>;

// ── Query list (GET /master/rad-catalog) ──────────────────────────────────────
export const RadCatalogQuery = z.object({
  q: z.string().trim().optional(), // cari kode/nama/kodeIcd
  modalitas: RadModalitasEnum.optional(),
  kategori: RadKategoriEnum.optional(),
  status: z.enum(["Semua", "Aktif", "Non_Aktif"]).optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
});
export type RadCatalogQuery = z.infer<typeof RadCatalogQuery>;

export const IdParam = z.object({ id: z.string().uuid() });
export type IdParam = z.infer<typeof IdParam>;

// ── DTO (response) — mirror RadCatalogRecord FE ────────────────────────────────
export interface TatTargetDTO { cito: number; semiCito: number; rutin: number }
export interface PersiapanDTO {
  puasaJam?: number;
  premedikasi?: string;
  kontraindikasi: string[];
  instruksiPasien?: string;
  catatanKhusus?: string;
}
export interface KontrasDTO {
  jenis: RadJenisKontrasDTO;
  dosisMl?: number;
  kecepatanInjeksiMlSec?: number;
  premedikasiSteroidJikaAlergi?: boolean;
  catatan?: string;
}
export interface DrlDTO {
  ctdiVol?: number;
  dlp?: number;
  dap?: number;
  waktuFluoroMenit?: number;
  entranceDose?: number;
  catatan?: string;
}
export interface ReportingTemplateDTO {
  struktur: string[];
  templateTemuan?: string;
}

export interface RadCatalogDTO {
  id: string;
  kode: string;
  kodeIcd?: string;
  nama: string;
  modalitas: RadModalitasDTO;
  modalitasSubtype?: string;
  region: RadRegionDTO;
  kategori: RadKategoriDTO;
  estimasiWaktuMenit: number;
  tatTargetMenit: TatTargetDTO;
  persiapan: PersiapanDTO;
  kontras: KontrasDTO;
  drlReferensi?: DrlDTO;
  reportingTemplate: ReportingTemplateDTO;
  deskripsi?: string;
  status: RadStatusDTO;
}
