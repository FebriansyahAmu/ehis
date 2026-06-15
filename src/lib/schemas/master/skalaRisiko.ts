// Zod input + DTO — Master Skala Risiko (schema "master", model SkalaInstrument · kategori "Risiko").
// DTO MIRROR SkalaRecord (FE: lib/master/skalaCommon.ts) → zero-refactor wiring. Kode `SR-NNNN`
// AUTO-GEN di Service (counter) → TIDAK ada di input. kategori di-set Service ("Risiko"). items[] +
// interpretasi[] = blok JSONB (di-set/replace utuh). Enum identik union FE → pass-through.

import { z } from "zod";

// ── Vocab terkontrol (identik union skalaCommon) ──────────────────────────────
export const ScoringModeEnum = z.enum(["sum_items", "select_value"]);
export const ArahEnum = z.enum(["higher_is_worse", "lower_is_worse"]);
export const SkalaStatusEnum = z.enum(["Aktif", "Non_Aktif"]);
export const ModulEnum = z.enum(["IGD", "RI", "RJ", "ICU"]);
export const ToneEnum = z.enum(["emerald", "yellow", "amber", "orange", "rose", "red", "sky"]);

// ── Struktur penilaian ────────────────────────────────────────────────────────
export const SkalaOptionSchema = z.object({
  score: z.number().int(),
  label: z.string().trim().min(1),
  detail: z.string().trim().optional(),
});
export const SkalaItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().trim().min(1),
  maxScore: z.number().int(),
  options: z.array(SkalaOptionSchema),
});
export const SkalaInterpretasiSchema = z.object({
  id: z.string().min(1),
  min: z.number().int(),
  max: z.number().int(),
  label: z.string().trim().min(1),
  tone: ToneEnum,
  action: z.string().trim().default(""),
});

const optStr = z.string().trim().optional().transform((v) => (v ? v : undefined));
const modulList = z.array(ModulEnum).optional().transform((a) => a ?? []);

// ── Create (POST /master/skala-risiko) — TANPA kode/kategori (server) ──────────
export const CreateSkalaRisikoInput = z.object({
  nama: z.string().trim().min(1, "Nama skala wajib").max(200),
  singkat: optStr,
  deskripsi: optStr,
  referensi: optStr,
  scoringMode: ScoringModeEnum.optional(),     // default sum_items di Service
  arah: ArahEnum.optional(),                    // default higher_is_worse di Service
  totalMax: z.number().int().min(0).optional(), // derived FE; default 0
  items: z.array(SkalaItemSchema).optional(),
  interpretasi: z.array(SkalaInterpretasiSchema).optional(),
  konsumenModul: modulList,
  status: SkalaStatusEnum.optional(),           // default Aktif di Service
});
export type CreateSkalaRisikoInput = z.infer<typeof CreateSkalaRisikoInput>;

// ── Update (PATCH /master/skala-risiko/:id) — parsial, kode immutable ─────────
export const UpdateSkalaRisikoInput = z.object({
  nama: z.string().trim().min(1).max(200).optional(),
  singkat: optStr,
  deskripsi: optStr,
  referensi: optStr,
  scoringMode: ScoringModeEnum.optional(),
  arah: ArahEnum.optional(),
  totalMax: z.number().int().min(0).optional(),
  items: z.array(SkalaItemSchema).optional(),
  interpretasi: z.array(SkalaInterpretasiSchema).optional(),
  konsumenModul: z.array(ModulEnum).optional(),
  status: SkalaStatusEnum.optional(),
});
export type UpdateSkalaRisikoInput = z.infer<typeof UpdateSkalaRisikoInput>;

// ── Query list (GET /master/skala-risiko) ─────────────────────────────────────
export const SkalaRisikoQuery = z.object({
  q: z.string().trim().optional(),
  modul: ModulEnum.optional(),
  status: z.enum(["Semua", "Aktif", "Non_Aktif"]).optional(),
  limit: z.coerce.number().int().min(1).max(300).optional(),
});
export type SkalaRisikoQuery = z.infer<typeof SkalaRisikoQuery>;

export const IdParam = z.object({ id: z.string().uuid() });
export type IdParam = z.infer<typeof IdParam>;

// ── DTO (response) — MIRROR SkalaRecord FE (tanpa kategori; itu internal) ──────
export interface SkalaOptionDTO {
  score: number;
  label: string;
  detail?: string;
}
export interface SkalaItemDTO {
  id: string;
  label: string;
  maxScore: number;
  options: SkalaOptionDTO[];
}
export interface SkalaInterpretasiDTO {
  id: string;
  min: number;
  max: number;
  label: string;
  tone: z.infer<typeof ToneEnum>;
  action: string;
}
export interface SkalaRisikoDTO {
  id: string;
  kode: string;
  nama: string;
  singkat: string;
  deskripsi: string;
  scoringMode: z.infer<typeof ScoringModeEnum>;
  arah: z.infer<typeof ArahEnum>;
  items: SkalaItemDTO[];
  totalMax: number;
  interpretasi: SkalaInterpretasiDTO[];
  referensi: string;
  konsumenModul: z.infer<typeof ModulEnum>[];
  status: z.infer<typeof SkalaStatusEnum>;
}
