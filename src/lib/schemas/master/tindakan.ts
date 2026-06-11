// Zod input + DTO — Master Katalog Tindakan (schema "master").
// DTO mirror TindakanRecord (FE: lib/master/tindakanMock.ts) → zero-refactor saat wiring.
// Nilai enum kategori/kompleksitas IDENTIK dgn union FE (Tindakan_Medis dst) → tak ada
// vocab-map; hanya status "Aktif"/"NonAktif" ⇄ active (boolean) dipetakan di Service.

import { z } from "zod";

// ── Vocab terkontrol (FE-facing, identik union TindakanRecord) ────────────────
export const TindakanKategoriEnum = z.enum([
  "Konsultasi", "Tindakan_Medis", "Diagnostik", "Bedah_Minor", "Bedah_Mayor",
  "Bedah_Khusus", "Obstetri", "Pediatrik", "Resusitasi", "Anestesi", "Spesialistik",
  "Non_Kategori", "Prosedur_Bedah", "Prosedur_Non_Bedah", "Keperawatan", "Tindakan_Invasif",
]);
export type TindakanKategoriDTO = z.infer<typeof TindakanKategoriEnum>;

export const KompleksitasEnum = z.enum(["Sederhana", "Sedang", "Khusus", "Canggih"]);
export type KompleksitasDTO = z.infer<typeof KompleksitasEnum>;

export const TindakanStatusEnum = z.enum(["Aktif", "NonAktif"]);
export type TindakanStatusDTO = z.infer<typeof TindakanStatusEnum>;

// String opsional (kosong/whitespace → undefined).
const optStr = z.string().trim().optional().transform((v) => (v ? v : undefined));
// String yang boleh DIKOSONGKAN eksplisit (clear): "" / null → null; absen → undefined.
const clearableStr = z
  .union([z.string(), z.null()])
  .optional()
  .transform((v) => (v == null ? v ?? undefined : v.trim() === "" ? null : v.trim()));

// ── Create (POST /master/tindakan) — kode boleh kosong (diisi belakangan) ──────
export const CreateTindakanInput = z.object({
  nama: z.string().trim().min(1, "Nama tindakan wajib").max(300),
  kode: z.string().trim().max(20).optional(), // ICD-9-CM
  kategori: TindakanKategoriEnum.optional(), // default Konsultasi di Service
  kptlAktif: z.boolean().optional(),
  nomorKptl: clearableStr,
  kompleksitas: KompleksitasEnum.nullish(), // null = tanpa kompleksitas
  spesialisDefault: z.array(z.string().trim()).optional(),
  unitDefault: z.array(z.string().trim()).optional(),
  deskripsi: optStr,
  status: TindakanStatusEnum.optional(), // default Aktif di Service
});
export type CreateTindakanInput = z.infer<typeof CreateTindakanInput>;

// ── Update (PATCH /master/tindakan/:id) — parsial ──────────────────────────────
export const UpdateTindakanInput = z.object({
  nama: z.string().trim().min(1).max(300).optional(),
  kode: z.string().trim().max(20).optional(),
  kategori: TindakanKategoriEnum.optional(),
  kptlAktif: z.boolean().optional(),
  nomorKptl: clearableStr,
  kompleksitas: KompleksitasEnum.nullish(),
  spesialisDefault: z.array(z.string().trim()).optional(),
  unitDefault: z.array(z.string().trim()).optional(),
  deskripsi: clearableStr,
  status: TindakanStatusEnum.optional(),
});
export type UpdateTindakanInput = z.infer<typeof UpdateTindakanInput>;

// ── Query list (GET /master/tindakan) ──────────────────────────────────────────
export const TindakanQuery = z.object({
  q: z.string().trim().optional(), // cari kode atau nama
  kategori: TindakanKategoriEnum.optional(),
  kompleksitas: KompleksitasEnum.optional(),
  status: z.enum(["Semua", "Aktif", "NonAktif"]).optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});
export type TindakanQuery = z.infer<typeof TindakanQuery>;

export const IdParam = z.object({ id: z.string().uuid() });
export type IdParam = z.infer<typeof IdParam>;

// ── DTO (response) — mirror TindakanRecord FE ──────────────────────────────────
// Catatan: `spesialisDefault: string[]` (kode spesialis). FE TindakanRecord pakai
// `SpesialisCode[]`; saat wiring, narrow via cast di api client (`as SpesialisCode[]`)
// — string yang disimpan = kode yang sama, jadi aman.
export interface TindakanDTO {
  id: string;
  kode: string;
  nama: string;
  kategori: TindakanKategoriDTO;
  kptlAktif: boolean;
  nomorKptl?: string | null;
  kompleksitas?: KompleksitasDTO | null;
  spesialisDefault: string[];
  unitDefault: string[];
  deskripsi?: string;
  status: TindakanStatusDTO;
}
