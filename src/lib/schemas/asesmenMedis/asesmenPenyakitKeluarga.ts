// Zod + DTO — Asesmen·Riwayat·Penyakit Keluarga (parent + item per anggota). Mirror
// PenyakitKeluargaPane. Append-only "latest wins". FE kirim hanya anggota yg ada data.

import { z } from "zod";

const optStr = z.string().trim().optional().transform((v) => (v ? v : undefined));
const strArr = z.array(z.string().trim().min(1)).default([]);

const KeluargaItemInput = z.object({
  anggota: z.string().trim().min(1, "Anggota keluarga wajib diisi"),
  penyakit: strArr,
  keterangan: optStr,
});

export const AsesmenPenyakitKeluargaInput = z.object({
  riwayatLain: optStr,
  items: z.array(KeluargaItemInput).default([]),
});
export type AsesmenPenyakitKeluargaInput = z.infer<typeof AsesmenPenyakitKeluargaInput>;

export interface AsesmenPenyakitKeluargaItemDTO {
  id: string;
  anggota: string;
  penyakit: string[];
  keterangan: string | null;
  urutan: number;
}

export interface AsesmenPenyakitKeluargaDTO {
  id: string;
  kunjunganId: string;
  riwayatLain: string | null;
  items: AsesmenPenyakitKeluargaItemDTO[];
  pemeriksa: string;
  authorUserId: string | null;
  createdAt: string;
}
