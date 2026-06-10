// Zod input + DTO — Master Referensi ICD-10 & ICD-9-CM (schema "master").
// Inti = CODE · DISPLAY · VERSION (unduhan SatuSehat); atribut lain opsional.
// DTO mirror IcdItem (FE: components/master/icd) → zero-refactor saat wiring.
// Vocab FE ("ICD-10"/"Aktif") ⇄ DB (ICD_10/active) dipetakan di Service.

import { z } from "zod";

// ── Vocab terkontrol (FE-facing) ─────────────────────────────────────────────
export const IcdJenisEnum = z.enum(["ICD-10", "ICD-9"]);
export type IcdJenisDTO = z.infer<typeof IcdJenisEnum>;

export const IcdStatusEnum = z.enum(["Aktif", "Non_Aktif"]);
export type IcdStatusDTO = z.infer<typeof IcdStatusEnum>;

// String opsional (kosong/whitespace → undefined).
const optStr = z.string().trim().optional().transform((v) => (v ? v : undefined));

// Versi default CodeSystem per jenis — fallback bila kolom VERSION kosong saat import.
export const DEFAULT_ICD_VERSION: Record<IcdJenisDTO, string> = {
  "ICD-10": "2010",
  "ICD-9": "2010",
};

// ── Create (POST /master/icd) ────────────────────────────────────────────────
export const CreateIcdInput = z.object({
  jenis: IcdJenisEnum,
  kode: z.string().trim().min(1, "Kode wajib").max(20),
  nama: z.string().trim().min(1, "Display wajib").max(500), // DISPLAY
  version: z.string().trim().min(1, "Versi wajib").max(50), // VERSION
  namaInggris: optStr,
  chapter: optStr,
  blok: optStr,
  inaCbg: optStr,
  status: IcdStatusEnum.optional(), // default Aktif di Service
});
export type CreateIcdInput = z.infer<typeof CreateIcdInput>;

// ── Update (PATCH /master/icd/:id) — parsial; jenis tak diubah (jaga natural key) ─
export const UpdateIcdInput = z.object({
  kode: z.string().trim().min(1).max(20).optional(),
  nama: z.string().trim().min(1).max(500).optional(),
  version: z.string().trim().min(1).max(50).optional(),
  namaInggris: optStr,
  chapter: optStr,
  blok: optStr,
  inaCbg: optStr,
  status: IcdStatusEnum.optional(),
});
export type UpdateIcdInput = z.infer<typeof UpdateIcdInput>;

// ── Bulk import (POST /master/icd/import) ────────────────────────────────────
// Satu request = satu jenis. Klien kirim baris hasil parse (Excel/CSV); BE dedup via
// unique (jenis,kode) + createMany skipDuplicates. Batas per-request: cegah payload liar.
export const IMPORT_MAX = 25000;

export const IcdImportRow = z.object({
  kode: z.string().trim().min(1).max(20),
  display: z.string().trim().min(1).max(500),
  version: z.string().trim().max(50).optional(), // kosong → fallback DEFAULT_ICD_VERSION
  namaInggris: optStr,
  chapter: optStr,
  blok: optStr,
  inaCbg: optStr,
});
export type IcdImportRow = z.infer<typeof IcdImportRow>;

export const ImportIcdInput = z.object({
  jenis: IcdJenisEnum,
  items: z.array(IcdImportRow).min(1, "Tidak ada baris").max(IMPORT_MAX, `Maksimal ${IMPORT_MAX} baris per request`),
});
export type ImportIcdInput = z.infer<typeof ImportIcdInput>;

export interface ImportIcdResult {
  received: number; // total baris diterima
  inserted: number; // baru tersimpan
  skipped: number;  // dilewati (kode sudah ada untuk jenis tsb.)
}

// ── Query list (GET /master/icd) ─────────────────────────────────────────────
export const IcdQuery = z.object({
  jenis: IcdJenisEnum.optional(),
  q: z.string().trim().optional(),                       // cari kode atau display
  status: z.enum(["Semua", "Aktif", "Non_Aktif"]).optional(),
  cursor: z.string().uuid().optional(),                  // id baris terakhir halaman sebelumnya
  limit: z.coerce.number().int().min(1).max(200).optional(),
});
export type IcdQuery = z.infer<typeof IcdQuery>;

export const IdParam = z.object({ id: z.string().uuid() });
export type IdParam = z.infer<typeof IdParam>;

// ── DTO (response) — mirror IcdItem FE ───────────────────────────────────────
export interface IcdDTO {
  id: string;
  jenis: IcdJenisDTO;
  kode: string;     // CODE
  nama: string;     // DISPLAY
  version: string;  // VERSION
  namaInggris?: string;
  chapter?: string;
  blok?: string;
  inaCbg?: string;
  status: IcdStatusDTO;
}
