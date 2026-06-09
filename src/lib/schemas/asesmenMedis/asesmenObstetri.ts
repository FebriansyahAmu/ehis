// Zod + DTO — Asesmen·Riwayat·Obstetri (KB + GPA + ANC scalar; persalinan = daftar).
// Mirror ObstetriPane. Append-only "latest wins".

import { z } from "zod";

const optStr = z.string().trim().optional().transform((v) => (v ? v : undefined));

const PersalinanItemInput = z.object({
  tahun: optStr,
  usiaKehamilan: optStr,
  jenis: optStr,
  bbLahir: optStr,
  kondisiAnak: optStr,
  keterangan: optStr,
});

export const AsesmenObstetriInput = z.object({
  // KB
  metodeKb: optStr,
  kbSejak: optStr,
  kbKeterangan: optStr,
  // GPA
  gravida: optStr,
  para: optStr,
  abortus: optStr,
  // ANC
  ancKunjungan: optStr,
  ancUsiaKehamilan: optStr,
  ancTempat: optStr,
  ancPetugas: optStr,
  ancCatatan: optStr,
  // Persalinan
  persalinan: z.array(PersalinanItemInput).default([]),
});
export type AsesmenObstetriInput = z.infer<typeof AsesmenObstetriInput>;

export interface AsesmenPersalinanItemDTO {
  id: string;
  tahun: string | null;
  usiaKehamilan: string | null;
  jenis: string | null;
  bbLahir: string | null;
  kondisiAnak: string | null;
  keterangan: string | null;
  urutan: number;
}

export interface AsesmenObstetriDTO {
  id: string;
  kunjunganId: string;
  metodeKb: string | null;
  kbSejak: string | null;
  kbKeterangan: string | null;
  gravida: string | null;
  para: string | null;
  abortus: string | null;
  ancKunjungan: string | null;
  ancUsiaKehamilan: string | null;
  ancTempat: string | null;
  ancPetugas: string | null;
  ancCatatan: string | null;
  persalinan: AsesmenPersalinanItemDTO[];
  pemeriksa: string;
  authorUserId: string | null;
  createdAt: string;
}
