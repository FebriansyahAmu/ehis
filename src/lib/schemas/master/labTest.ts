// Zod input + DTO — Master Katalog Laboratorium (schema "master").
// Model Tes → Parameter. DTO mirror LabTestRecord (FE: lib/master/labTestCatalog.ts) →
// zero-refactor saat wiring. `kategori` divalidasi via enum FE-facing (boleh spasi).
// Vocab FE⇄DB hanya status "Aktif"/"NonAktif" ⇄ active; sisanya pass-through (TEXT).
// Update mengganti parameters secara REPLACE-ALL (anak Tes, bukan entitas mandiri).

import { z } from "zod";

// ── Vocab terkontrol ──────────────────────────────────────
export const LabKategoriEnum = z.enum([
  "Hematologi", "Kimia Klinik", "Koagulasi", "Urinalisis", "Feses",
  "Serologi", "Imunologi", "Mikrobiologi", "Toksikologi", "Analisa Gas Darah",
]);
export type LabKategoriDTO = z.infer<typeof LabKategoriEnum>;

export const LabResultTypeEnum = z.enum(["Numerik", "Kualitatif"]);
export type LabResultTypeDTO = z.infer<typeof LabResultTypeEnum>;

export const LabStatusEnum = z.enum(["Aktif", "NonAktif"]);
export type LabStatusDTO = z.infer<typeof LabStatusEnum>;

const GenderEnum = z.enum(["L", "P", "LP"]);

const optStr = z.string().trim().optional().transform((v) => (v ? v : undefined));

// ── Rentang rujukan (numerik) ─────────────────────────────
export const RujukanRowInput = z.object({
  gender: GenderEnum.default("LP"),
  usiaMin: z.number().int().min(0).max(150).optional(),
  usiaMax: z.number().int().min(0).max(150).optional(),
  low: z.number(),
  high: z.number(),
  keterangan: optStr,
});
export type RujukanRowInput = z.infer<typeof RujukanRowInput>;

// ── Parameter (analit) ────────────────────────────────────
export const ParameterInput = z.object({
  nama: z.string().trim().min(1, "Nama parameter wajib").max(200),
  satuan: z.string().trim().max(40).optional(), // "" untuk kualitatif
  tipeHasil: LabResultTypeEnum.optional(),       // default Numerik di Service
  nilaiNormalText: optStr,                        // kualitatif
  rujukan: z.array(RujukanRowInput).optional(),
  criticalLow: z.number().nullish(),
  criticalHigh: z.number().nullish(),
  deltaAbsolute: z.number().nullish(),
  deltaPercent: z.number().nullish(),
  metode: optStr,
  urutan: z.number().int().min(0).optional(),
});
export type ParameterInput = z.infer<typeof ParameterInput>;

// ── Create (POST /master/lab-test) ────────────────────────
export const CreateLabTestInput = z.object({
  nama: z.string().trim().min(1, "Nama tes wajib").max(300),
  kode: z.string().trim().max(30).optional(),
  kategori: LabKategoriEnum.optional(), // default Hematologi di Service
  spesimen: optStr,
  metode: optStr,
  waktuTunggu: optStr,
  keterangan: optStr,
  status: LabStatusEnum.optional(), // default Aktif di Service
  parameters: z.array(ParameterInput).optional(),
});
export type CreateLabTestInput = z.infer<typeof CreateLabTestInput>;

// ── Update (PATCH /master/lab-test/:id) — parsial; parameters = replace-all ─────
export const UpdateLabTestInput = z.object({
  nama: z.string().trim().min(1).max(300).optional(),
  kode: z.string().trim().max(30).optional(),
  kategori: LabKategoriEnum.optional(),
  spesimen: optStr,
  metode: optStr,
  waktuTunggu: optStr,
  keterangan: optStr,
  status: LabStatusEnum.optional(),
  parameters: z.array(ParameterInput).optional(), // bila ada → ganti seluruh parameter
});
export type UpdateLabTestInput = z.infer<typeof UpdateLabTestInput>;

// ── Query list (GET /master/lab-test) ─────────────────────
export const LabTestQuery = z.object({
  q: z.string().trim().optional(), // cari kode/nama
  kategori: LabKategoriEnum.optional(),
  status: z.enum(["Semua", "Aktif", "NonAktif"]).optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});
export type LabTestQuery = z.infer<typeof LabTestQuery>;

export const IdParam = z.object({ id: z.string().uuid() });
export type IdParam = z.infer<typeof IdParam>;

// ── DTO (response) — mirror LabTestRecord FE ──────────────
export interface LabRujukanDTO {
  gender: "L" | "P" | "LP";
  usiaMin?: number;
  usiaMax?: number;
  low: number;
  high: number;
  keterangan?: string;
}

export interface LabParameterDTO {
  id: string;
  nama: string;
  satuan: string;
  tipeHasil: LabResultTypeDTO;
  nilaiNormalText?: string;
  rujukan: LabRujukanDTO[];
  criticalLow?: number | null;
  criticalHigh?: number | null;
  deltaAbsolute?: number | null;
  deltaPercent?: number | null;
  metode?: string;
  urutan: number;
}

export interface LabTestDTO {
  id: string;
  kode: string;
  nama: string;
  kategori: LabKategoriDTO;
  spesimen?: string;
  metode?: string;
  waktuTunggu?: string;
  keterangan?: string;
  status: LabStatusDTO;
  parameters: LabParameterDTO[];
}
