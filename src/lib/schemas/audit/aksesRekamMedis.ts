// Kontrak log akses BACA rekam medis (PRD Kepatuhan E5 · FR-5.1). Tabel: auth.akses_rekam_medis.

import { z } from "zod";

const Tanggal = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal YYYY-MM-DD");

/** Query halaman Jejak Akses — cari per pasien (No. RM) ATAU per pegawai. */
export const AksesRekamMedisQuery = z
  .object({
    noRm: z.string().trim().min(1).max(32).optional(),
    pegawaiId: z.string().uuid().optional(),
    dari: Tanggal.optional(),
    sampai: Tanggal.optional(),
    cursor: z.string().max(200).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  })
  .refine((q) => Boolean(q.noRm) !== Boolean(q.pegawaiId), {
    message: "Isi salah satu: No. RM atau pegawai",
  });
export type AksesRekamMedisQuery = z.infer<typeof AksesRekamMedisQuery>;

/** Cari pegawai untuk filter (nama / NIP). */
export const AksesPegawaiQuery = z.object({
  q: z.string().trim().min(2).max(60),
});
export type AksesPegawaiQuery = z.infer<typeof AksesPegawaiQuery>;

export type AksesOutcome = "allowed" | "denied";
/** unit = unit kerja sendiri · penunjang = Lab/Rad/Farmasi · global = superuser/role global · audit = membuka log ini. */
export type AksesJalur = "unit" | "penunjang" | "global" | "audit";

export interface AksesRekamMedisDTO {
  id: string;
  firstAt: string;
  lastAt: string;
  hitCount: number;
  outcome: AksesOutcome;
  jalur: AksesJalur;
  domains: string[];
  unit: string | null;
  roles: string[];
  pegawai: { id: string | null; nama: string | null; nip: string | null };
  pasien: { id: string | null; noRm: string | null; nama: string | null };
  kunjungan: { id: string | null; noKunjungan: string | null };
}

export type AksesSubjekDTO =
  | { jenis: "pasien"; id: string; noRm: string; nama: string }
  | { jenis: "pegawai"; id: string; nama: string; nip: string | null };

export interface AksesRekamMedisListDTO {
  subjek: AksesSubjekDTO;
  items: AksesRekamMedisDTO[];
  nextCursor: string | null;
}

export interface AksesPegawaiOptionDTO {
  id: string;
  nama: string;
  nip: string | null;
}
