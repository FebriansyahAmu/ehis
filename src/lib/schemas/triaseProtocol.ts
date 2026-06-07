// Zod schema + DTO — Master Skala Klinis: Triase IGD (FLOWS §5 · docs/BACKEND-MASTER-SKALA-KLINIK §A.4.3).
// VOCAB = FE (triaseMock.ts) agar swap UI zero-refactor: TriaseRecord/TriaseLevel/TriaseParameter.
// Matrix sel disimpan ternormalisasi (TriaseProtocolCriteria) di DB; Service rekonstruksi
// `parameter.values: Record<levelKode,string>`. DTO di sini = MIRROR TriaseRecord (+ version).

import { z } from "zod";

// ── Enum (identik vocab FE) ───────────────────────────────────────────────────
/// Warna chip/header level (TriaseLevelTone). Presentasional → String di DB, divalidasi di sini.
export const TriaseTone = z.enum(["red-dark", "rose", "amber", "emerald", "sky", "slate", "violet"]);
export const TriaseStatus = z.enum(["Aktif", "Non_Aktif"]);
/// Hint tipe nilai parameter: Kategori (pilihan teks) · Numerik (ambang TTV) · Teks (bebas).
export const TriaseValueType = z.enum(["Kategori", "Numerik", "Teks"]);

// ── Primitives ────────────────────────────────────────────────────────────────
const kode = z.string().trim().min(1, "Kode wajib").max(40);
const slug = z.string().trim().min(1, "Kode wajib").max(40); // kode level/parameter (per protokol)
const label = z.string().trim().min(1, "Label wajib").max(120);
/// Optimistic concurrency — wajib di update (FLOWS §7.3). Mismatch → CONFLICT_VERSION (409).
const expectedVersion = z.number().int().nonnegative();

// ── Sub-objek matrix ──────────────────────────────────────────────────────────
export const LevelInput = z.object({
  kode: slug,
  label,
  tone: TriaseTone,
  responsTime: z.string().trim().max(60).optional(),
  prioritas: z.number().int().min(1).max(99),
  deskripsi: z.string().trim().max(500).optional(),
});

export const ParameterInput = z.object({
  kode: slug,
  label,
  /// Hint tipe nilai (fondasi auto-klasifikasi). Default Kategori.
  tipeNilai: TriaseValueType.default("Kategori"),
  /// Satuan ukur untuk parameter Numerik (mis. "×/mnt", "mmHg", "%", "°C").
  satuan: z.string().trim().max(20).optional(),
  /// values[levelKode] = DAFTAR item kriteria untuk sel itu (boleh >1). Kunci = level.kode (cek Service).
  values: z.record(z.string(), z.array(z.string().max(500))).default({}),
});

// ── Create / Update ───────────────────────────────────────────────────────────
export const CreateTriaseInput = z.object({
  kode,
  nama: label,
  deskripsi: z.string().trim().max(1000).optional(),
  protokol: z.string().trim().max(200).optional(),
  status: TriaseStatus.default("Aktif"),
  isDefault: z.boolean().default(false),
  levels: z.array(LevelInput).default([]),
  parameters: z.array(ParameterInput).default([]),
});

// Patch: identitas opsional; levels/parameters bila DIKIRIM → replace matrix penuh (Service).
export const UpdateTriaseInput = z.object({
  expectedVersion,
  kode: kode.optional(),
  nama: label.optional(),
  deskripsi: z.string().trim().max(1000).optional(),
  protokol: z.string().trim().max(200).optional(),
  status: TriaseStatus.optional(),
  isDefault: z.boolean().optional(),
  levels: z.array(LevelInput).optional(),
  parameters: z.array(ParameterInput).optional(),
});

// ── Params ────────────────────────────────────────────────────────────────────
export const IdParam = z.object({ id: z.string().uuid("ID tidak valid") });
/// DELETE → optimistic concurrency via query (?expectedVersion=).
export const DeleteQuery = z.object({ expectedVersion: z.coerce.number().int().nonnegative() });
/// PATCH .../default body (set protokol jadi default).
export const SetDefaultInput = z.object({ expectedVersion });

// ── Tipe inferensi ────────────────────────────────────────────────────────────
export type TriaseTone = z.infer<typeof TriaseTone>;
export type TriaseStatus = z.infer<typeof TriaseStatus>;
export type TriaseValueType = z.infer<typeof TriaseValueType>;
export type LevelInput = z.infer<typeof LevelInput>;
export type ParameterInput = z.infer<typeof ParameterInput>;
export type CreateTriaseInput = z.infer<typeof CreateTriaseInput>;
export type UpdateTriaseInput = z.infer<typeof UpdateTriaseInput>;

// ── DTO output (MIRROR FE TriaseRecord/TriaseLevel/TriaseParameter → zero-refactor) ──
export interface TriaseLevelDTO {
  id: string;
  kode: string;
  label: string;
  tone: TriaseTone;
  responsTime: string;
  prioritas: number;
  deskripsi: string;
}

export interface TriaseParameterDTO {
  id: string;
  kode: string;
  label: string;
  /// Hint tipe nilai (fondasi auto-klasifikasi level dari TTV).
  tipeNilai: TriaseValueType;
  /// Satuan ukur (Numerik). undefined = tak ada.
  satuan?: string;
  /// values[levelKode] = daftar item kriteria sel (boleh >1).
  values: Record<string, string[]>;
}

export interface TriaseRecordDTO {
  id: string;
  kode: string;
  nama: string;
  deskripsi: string;
  protokol: string;
  levels: TriaseLevelDTO[];
  parameters: TriaseParameterDTO[];
  status: TriaseStatus;
  // Tambahan (FE TriaseRecord abaikan; dipakai client utk concurrency & badge default).
  isDefault: boolean;
  version: number;
}
