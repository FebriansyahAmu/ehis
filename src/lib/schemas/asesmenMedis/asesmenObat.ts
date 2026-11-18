// Zod + DTO — Asesmen·Riwayat·Pemberian Obat (parent + item). Mirror PemberianObatPane.
// Append-only "latest wins"; item = snapshot baris obat. FE filter baris kosong sebelum POST.

import { z } from "zod";
import type { KfaRiwayat, StatusRiwayatObat } from "@/lib/fhir/links/riwayatObat";

const optStr = z.string().trim().optional().transform((v) => (v ? v : undefined));

const ObatItemInput = z.object({
  nama: z.string().trim().min(1, "Nama obat wajib diisi").max(200),
  // Tautan katalog (dipilih dari rekomendasi formularium). Kode KFA TIDAK diterima dari klien — diturunkan
  // server dari master.Obat (anti-spoof); id tak dikenal dilepas di Service.
  obatId: z.string().uuid().optional(),
  status: z.enum(["aktif", "berhenti"]).optional(),
  dosis: optStr,
  frekuensi: optStr,
  rute: optStr,
  sejak: optStr,
  indikasi: optStr,
});

export const AsesmenObatInput = z.object({
  items: z.array(ObatItemInput).default([]),
});
export type AsesmenObatInput = z.infer<typeof AsesmenObatInput>;

export interface AsesmenObatItemDTO {
  id: string;
  nama: string;
  obatId: string | null;
  status: StatusRiwayatObat | null;
  /** Kode KFA yang akan dikirim (diturunkan dari master saat baca) — null = ketik bebas / belum dipetakan. */
  kfa: KfaRiwayat | null;
  dosis: string | null;
  frekuensi: string | null;
  rute: string | null;
  sejak: string | null;
  indikasi: string | null;
  urutan: number;
}

export interface AsesmenObatDTO {
  id: string;
  kunjunganId: string;
  items: AsesmenObatItemDTO[];
  pemeriksa: string;
  authorUserId: string | null;
  createdAt: string;
}
