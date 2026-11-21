// Kontrak resolve IHS Patient SatuSehat (FH2). Dipakai route + FE adapter (import type).

import { z } from "zod";

export const PatientIdParam = z.object({ patientId: z.string().uuid() });

export const ResolvePatientInput = z.object({
  /** Resolve ulang walau sudah terpetakan (mis. setelah koreksi NIK). */
  force: z.boolean().optional(),
});

export const ResolveBatchInput = z.object({
  limit: z.number().int().min(1).max(100).default(25),
});

/** NIK lewat BODY (bukan query string) agar tak tercatat di log URL. */
export const NikLookupInput = z.object({
  nik: z.string().regex(/^\d{16}$/, "NIK harus 16 digit"),
});

export type PatientIhsStatus = "cached" | "resolved" | "not_found" | "no_nik" | "failed";

export interface PatientIhsDTO {
  patientId: string;
  noRm: string;
  mode: "mock" | "sandbox" | "prod";
  status: PatientIhsStatus;
  ihsId: string | null;
  lastSyncAt: string | null;
  message?: string;
  /**
   * Cocokkan identitas lokal vs SatuSehat (data quality, SKP 1). `null` = SatuSehat tak
   * mengembalikan field itu. `false` = BEDA → periksa ulang NIK/identitas di registrasi.
   */
  verifikasi?: { gender: boolean | null; tanggalLahir: boolean | null };
}

export interface PatientBatchDTO {
  mode: "mock" | "sandbox" | "prod";
  diproses: number;
  counts: Record<PatientIhsStatus, number>;
  /** Hanya yang gagal / tak ditemukan / tak cocok. */
  perhatian: PatientIhsDTO[];
  sisa: boolean;
  durationMs: number;
}

/**
 * Daftarkan pasien ke SatuSehat (Playbook MPI "Pasien dengan NIK"): GET by NIK dulu; POST Patient
 * HANYA bila tidak ditemukan.
 * - `cached`     sudah terpetakan di mode ini — tidak ada panggilan
 * - `resolved`   GET menemukan pasien → dipetakan TANPA POST
 * - `created`    POST berhasil → IHS baru dipetakan
 * - `incomplete` elemen wajib belum lengkap → tidak ada panggilan
 * - `failed`     GET/POST gagal (mis. data tidak cocok Dukcapil) → peta tidak berubah
 */
export type PatientRegisterOutcome = "cached" | "resolved" | "created" | "incomplete" | "failed";

export interface PatientRegisterDTO {
  patientId: string;
  noRm: string;
  mode: "mock" | "sandbox" | "prod";
  outcome: PatientRegisterOutcome;
  ihsId: string | null;
  lastSyncAt: string | null;
  message: string;
  /** Elemen wajib yang belum ada (outcome `incomplete`). */
  kurang?: string[];
  /** Rincian penolakan SatuSehat per elemen (OperationOutcome), bila ada. */
  issues?: string[];
}

/** Kesiapan POST Patient untuk ditampilkan di konsol (tanpa panggilan SatuSehat). */
export interface PatientCreateCheckDTO {
  siap: boolean;
  kurang: string[];
  saran: string[];
}

export interface NikLookupDTO {
  mode: "mock" | "sandbox" | "prod";
  found: boolean;
  ihsId: string | null;
  nama: string | null;
  gender: string | null;
  tanggalLahir: string | null;
}
