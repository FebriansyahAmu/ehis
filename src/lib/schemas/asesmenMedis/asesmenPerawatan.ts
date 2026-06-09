// Zod + DTO — Asesmen·Riwayat·Perawatan & Tindakan (parent + 2 daftar: rawat inap +
// pembedahan). Mirror PerawatanTindakanPane. Append-only "latest wins".

import { z } from "zod";

const optStr = z.string().trim().optional().transform((v) => (v ? v : undefined));

const RawatItemInput = z.object({
  rs: optStr,
  unit: optStr,
  tanggal: optStr,
  diagnosa: optStr,
  keterangan: optStr,
});

const BedahItemInput = z.object({
  tanggal: optStr,
  tindakan: optStr,
  rs: optStr,
  dokter: optStr,
  keterangan: optStr,
});

export const AsesmenPerawatanInput = z.object({
  rawat: z.array(RawatItemInput).default([]),
  bedah: z.array(BedahItemInput).default([]),
});
export type AsesmenPerawatanInput = z.infer<typeof AsesmenPerawatanInput>;

export interface AsesmenRawatItemDTO {
  id: string;
  rs: string | null;
  unit: string | null;
  tanggal: string | null;
  diagnosa: string | null;
  keterangan: string | null;
  urutan: number;
}

export interface AsesmenBedahItemDTO {
  id: string;
  tanggal: string | null;
  tindakan: string | null;
  rs: string | null;
  dokter: string | null;
  keterangan: string | null;
  urutan: number;
}

export interface AsesmenPerawatanDTO {
  id: string;
  kunjunganId: string;
  rawat: AsesmenRawatItemDTO[];
  bedah: AsesmenBedahItemDTO[];
  pemeriksa: string;
  authorUserId: string | null;
  createdAt: string;
}
