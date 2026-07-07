// Zod + DTO — tab Diagnosa: koding ICD-10 (diagnosa) + ICD-9-CM (prosedur).
// Daftar hidup per-item (pola Alergi). DTO mirror IGDDiagnosa/Icd9ProsedurEntry FE.

import { z } from "zod";

export const DiagnosaTipe = z.enum(["Utama", "Sekunder", "Komplikasi", "Komorbid"]);
export type DiagnosaTipe = z.infer<typeof DiagnosaTipe>;

export const DiagnosaStatus = z.enum(["Pasti", "Dicurigai", "Diferensial"]);
export type DiagnosaStatus = z.infer<typeof DiagnosaStatus>;

const optStr = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined));

export const DiagnosaItemInput = z.object({
  kodeIcd10: z.string().trim().min(1, "Kode ICD-10 wajib").max(20),
  namaDiagnosis: z.string().trim().min(1, "Nama diagnosis wajib").max(500),
  tipe: DiagnosaTipe,
  status: DiagnosaStatus,
  alasan: optStr,
  analisa: optStr,
  kategori: optStr,
  inaCbg: optStr,
});
export type DiagnosaItemInput = z.infer<typeof DiagnosaItemInput>;

// Patch parsial — semua field opsional (key boleh absen → tak diubah).
export const DiagnosaItemUpdate = z.object({
  tipe: DiagnosaTipe.optional(),
  status: DiagnosaStatus.optional(),
  alasan: z.string().trim().optional(),
  analisa: z.string().trim().optional(),
});
export type DiagnosaItemUpdate = z.infer<typeof DiagnosaItemUpdate>;

export const ProsedurItemInput = z.object({
  kode: z.string().trim().min(1, "Kode ICD-9 wajib").max(20),
  nama: z.string().trim().min(1, "Nama prosedur wajib").max(500),
  kategori: z.string().trim().min(1, "Kategori wajib").max(120),
  catatan: optStr,
});
export type ProsedurItemInput = z.infer<typeof ProsedurItemInput>;

export const DiagnosaItemParam = z.object({
  id: z.string().uuid(),
  itemId: z.string().uuid(),
});
export type DiagnosaItemParam = z.infer<typeof DiagnosaItemParam>;

export interface DiagnosaItemDTO {
  id: string;
  kodeIcd10: string;
  namaDiagnosis: string;
  tipe: DiagnosaTipe;
  status: DiagnosaStatus;
  alasan?: string;
  analisa?: string;
  kategori?: string;
  inaCbg?: string;
  pemeriksa: string;
  createdAt: string; // ISO
}

export interface ProsedurItemDTO {
  id: string;
  kode: string;
  nama: string;
  kategori: string;
  catatan?: string;
  pemeriksa: string;
  createdAt: string; // ISO
}

export interface DiagnosaDTO {
  kunjunganId: string;
  items: DiagnosaItemDTO[];
  prosedur: ProsedurItemDTO[];
}

// ── DTO "Diagnosa Sebelumnya" (longitudinal, read-only) ────────────────────────
//  Diagnosa (semua tipe: Utama/Sekunder/Komplikasi/Komorbid) dari kunjungan-kunjungan
//  SEBELUMNYA pasien yang sama (IGD/RJ/RI), dikelompokkan per kunjungan, terbaru dulu.
//  Dipakai panel referensi "Catatan Diagnosa Medis Sebelumnya" di tab Diagnosa (SNARS AP 1.2).
export interface DiagnosaSebelumnyaItemDTO {
  kodeIcd10: string;
  namaDiagnosis: string;
  tipe: DiagnosaTipe;
  status: DiagnosaStatus;
  pemeriksa: string;
}

export interface DiagnosaSebelumnyaEpisodeDTO {
  kunjunganId: string;
  noKunjungan: string;
  unit: string; // IGD | RawatJalan | RawatInap
  unitLabel: string;
  poli: string | null;
  tanggal: string; // YYYY-MM-DD (WIB) — saat diagnosa terakhir dicatat di kunjungan itu
  diagnosa: DiagnosaSebelumnyaItemDTO[]; // Utama dulu
}

export interface DiagnosaSebelumnyaDTO {
  kunjunganId: string; // kunjungan yang sedang dibuka (pintu)
  patientId: string;
  noRM: string;
  total: number; // total diagnosa lintas kunjungan sebelumnya
  episodes: DiagnosaSebelumnyaEpisodeDTO[]; // kunjungan terbaru dulu
}
