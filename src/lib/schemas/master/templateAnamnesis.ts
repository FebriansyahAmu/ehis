// Zod input + DTO — Master Template Anamnesis (schema "master", model TemplateAnamnesis).
// DTO mirror TemplateAnamnesisItem (FE: lib/master/templateAnamnesisMock.ts) → zero-refactor.
// Enum kategori/modul/status IDENTIK union FE → pass-through. TANPA kode (identitas = uuid).

import { z } from "zod";

// ── Vocab terkontrol (FE-facing, identik union templateAnamnesisMock) ─────────
export const ModulContextEnum = z.enum(["IGD", "RI", "RJ"]);
export type ModulContextDTO = z.infer<typeof ModulContextEnum>;

export const ChiefComplaintEnum = z.enum([
  "Kardiovaskular", "Respirasi", "Neurologi", "Pencernaan", "Endokrin",
  "Infeksi", "Trauma", "Muskuloskeletal", "Urologi", "Mata_THT",
  "Kontrol_Rutin", "Lainnya",
]);
export type ChiefComplaintDTO = z.infer<typeof ChiefComplaintEnum>;

export const TemplateStatusEnum = z.enum(["Aktif", "NonAktif"]);
export type TemplateStatusDTO = z.infer<typeof TemplateStatusEnum>;

// String opsional (kosong/whitespace → undefined).
const optStr = z.string().trim().optional().transform((v) => (v ? v : undefined));
// Daftar modul bersih + minimal 1 (template harus relevan ke ≥1 modul).
const modulList = z.array(ModulContextEnum).min(1, "Pilih minimal 1 modul (context tag)");

// ── Create (POST /master/template-anamnesis) ──────────────────────────────────
export const CreateTemplateAnamnesisInput = z.object({
  label: z.string().trim().min(1, "Label template wajib").max(200),
  kategori: ChiefComplaintEnum.optional(), // default "Lainnya" di Service
  contextTags: modulList,
  keluhanUtama: z.string().trim().min(1, "Keluhan utama wajib").max(500),
  rps: optStr,
  onsetDurasi: optStr,
  mekanismeCedera: optStr,
  faktorPemberat: optStr,
  faktorPemerut: optStr,
  statusGeneralis: optStr,
  catatanPerawat: optStr,
  status: TemplateStatusEnum.optional(), // default "Aktif" di Service
});
export type CreateTemplateAnamnesisInput = z.infer<typeof CreateTemplateAnamnesisInput>;

// ── Update (PATCH /master/template-anamnesis/:id) — parsial ───────────────────
export const UpdateTemplateAnamnesisInput = z.object({
  label: z.string().trim().min(1).max(200).optional(),
  kategori: ChiefComplaintEnum.optional(),
  contextTags: modulList.optional(),
  keluhanUtama: z.string().trim().min(1).max(500).optional(),
  rps: optStr,
  onsetDurasi: optStr,
  mekanismeCedera: optStr,
  faktorPemberat: optStr,
  faktorPemerut: optStr,
  statusGeneralis: optStr,
  catatanPerawat: optStr,
  status: TemplateStatusEnum.optional(),
});
export type UpdateTemplateAnamnesisInput = z.infer<typeof UpdateTemplateAnamnesisInput>;

// ── Query list (GET /master/template-anamnesis) ───────────────────────────────
export const TemplateAnamnesisQuery = z.object({
  q: z.string().trim().optional(), // cari label/keluhan
  kategori: ChiefComplaintEnum.optional(),
  modul: ModulContextEnum.optional(), // filter context tag
  status: z.enum(["Semua", "Aktif", "NonAktif"]).optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(300).optional(),
});
export type TemplateAnamnesisQuery = z.infer<typeof TemplateAnamnesisQuery>;

// ── Query konsumen klinis (GET /master/template-anamnesis-tersedia?modul=) ─────
export const TemplateTersediaQuery = z.object({
  modul: ModulContextEnum, // wajib — picker selalu beri konteks modul
});
export type TemplateTersediaQuery = z.infer<typeof TemplateTersediaQuery>;

export const IdParam = z.object({ id: z.string().uuid() });
export type IdParam = z.infer<typeof IdParam>;

// ── DTO (response) — mirror TemplateAnamnesisItem FE ──────────────────────────
export interface TemplateAnamnesisDTO {
  id: string;
  label: string;
  kategori: ChiefComplaintDTO;
  contextTags: ModulContextDTO[];
  keluhanUtama: string;
  rps: string;
  onsetDurasi: string;
  mekanismeCedera?: string; // undefined bila tak diisi (kolom nullable)
  faktorPemberat: string;
  faktorPemerut: string;
  statusGeneralis: string;
  catatanPerawat?: string;
  status: TemplateStatusDTO;
}

// ── DTO ringkas KONSUMEN KLINIS (picker "Template Cepat" IGD/RI/RJ) ───────────
//  Hanya field pre-fill form anamnesis. mekanismeCedera/catatanPerawat = "" bila kosong.
export interface AnamnesisTemplateDTO {
  id: string;
  label: string;
  kategori: ChiefComplaintDTO;
  keluhanUtama: string;
  rps: string;
  onsetDurasi: string;
  mekanismeCedera: string;
  faktorPemberat: string;
  faktorPemerut: string;
  statusGeneralis: string;
  catatanPerawat: string;
}
