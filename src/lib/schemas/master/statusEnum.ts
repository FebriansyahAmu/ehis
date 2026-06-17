// Zod input + DTO — Master Status Enum (schema "master", model EnumEntry).
// DTO MIRROR EnumEntry FE (lib/master/statusEnumMock.ts) + tambah `groupKey` (tabel flat).
// Kode `<PREFIX>-NNN` AUTO-GEN di Service (counter per grup) → TIDAK ada di input.
// Enum FE-facing (groupKey/tone/status) = pass-through union → zero-refactor wiring.

import { z } from "zod";

// ── Vocab terkontrol ──────────────────────────────────────────────────────────
// 3 grup fixed (= StatusEnumKey di statusEnumMock). Kontrak konsumen, BUKAN data bebas.
// Revisi 2026-06-17: 6 grup lama dihapus (otoritas lain/typed-union — lihat
// docs/BACKEND-MASTER-TEMPLATE&ENUM.md §2.3/§5).
export const EnumGroupKeyEnum = z.enum([
  "kondisi-transfer",
  "mode-transport",
  "hubungan-keluarga",
]);
export type EnumGroupKeyEnum = z.infer<typeof EnumGroupKeyEnum>;

// 9 tone (= EnumTone di statusEnumMock).
export const EnumToneEnum = z.enum([
  "emerald", "sky", "teal", "amber", "orange", "rose", "violet", "slate", "indigo",
]);
export type EnumToneEnum = z.infer<typeof EnumToneEnum>;

export const EnumStatusEnum = z.enum(["Aktif", "NonAktif"]);
export type EnumStatusEnum = z.infer<typeof EnumStatusEnum>;

/**
 * Prefix kode per grup (= scope counter). Format kode = `<PREFIX>-NNN` (pad 3),
 * mis. SPL-001 / KUM-001 / ROB-001. Auto-gen di Service — seperti Asesmen Katalog.
 */
export const ENUM_GROUP_PREFIX: Record<EnumGroupKeyEnum, string> = {
  "kondisi-transfer":  "KTR",
  "mode-transport":    "MTR",
  "hubungan-keluarga": "HKL",
};

const optStr = z.string().trim().optional().transform((v) => (v ? v : undefined));

// ── Create (POST /master/status-enum) — TANPA kode (auto-gen server) ────────────
export const CreateEnumEntryInput = z.object({
  groupKey: EnumGroupKeyEnum,
  label: z.string().trim().min(1, "Label wajib").max(120),
  deskripsi: optStr,
  tone: EnumToneEnum.optional(),   // default 'slate' di Service
  icon: optStr,                    // key ICON_REGISTRY
  urutan: z.coerce.number().int().min(0).optional(), // default: maxUrutan+1 di Service
  status: EnumStatusEnum.optional(), // default Aktif di Service
});
export type CreateEnumEntryInput = z.infer<typeof CreateEnumEntryInput>;

// ── Update (PATCH /master/status-enum/:id) — parsial; kode & groupKey immutable ──
// groupKey immutable: kode terikat prefix grup → ganti grup akan men-drift kode.
export const UpdateEnumEntryInput = z.object({
  label: z.string().trim().min(1).max(120).optional(),
  deskripsi: z.string().trim().optional(), // "" → kosongkan deskripsi
  tone: EnumToneEnum.optional(),
  icon: z.string().trim().optional(),      // "" → hapus icon
  urutan: z.coerce.number().int().min(0).optional(),
  status: EnumStatusEnum.optional(),
});
export type UpdateEnumEntryInput = z.infer<typeof UpdateEnumEntryInput>;

// ── Query list (GET /master/status-enum) ────────────────────────────────────────
export const EnumQuery = z.object({
  q: z.string().trim().optional(),
  groupKey: EnumGroupKeyEnum.optional(),
  status: z.enum(["Semua", "Aktif", "NonAktif"]).optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
});
export type EnumQuery = z.infer<typeof EnumQuery>;

export const IdParam = z.object({ id: z.string().uuid() });
export type IdParam = z.infer<typeof IdParam>;

// ── DTO (response) — MIRROR EnumEntry FE + groupKey (tabel flat) ─────────────────
export interface EnumEntryDTO {
  id: string;
  groupKey: EnumGroupKeyEnum;
  kode: string;
  label: string;
  deskripsi: string;
  tone: EnumToneEnum;
  icon?: string;
  urutan: number;
  status: EnumStatusEnum;
}
