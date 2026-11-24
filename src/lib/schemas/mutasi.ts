// Kontrak mutasi pasien (pindah ruangan/bed dalam kunjungan yang sama — IGD · Rawat Inap).
//   GET  /kunjungan/:id/mutasi                              → MutasiStateDTO
//   GET  /kunjungan/:id/mutasi/opsi                         → MutasiOpsiDTO (ruangan + peta bed)
//   POST /kunjungan/:id/mutasi                              → ajukan (reservasi bed tujuan)
//   POST /kunjungan/:id/mutasi/:mutasiId/selesai            → konfirmasi pasien sudah pindah
//   POST /kunjungan/:id/mutasi/:mutasiId/batal              → batalkan reservasi
//   POST /kunjungan/:id/mutasi/:mutasiId/lembar-transfer    → simpan lembar transfer (opsional)

import { z } from "zod";

export const MutasiParam = z.object({
  id: z.string().uuid("id kunjungan tidak valid"),
  mutasiId: z.string().uuid("id mutasi tidak valid"),
});
export type MutasiParam = z.infer<typeof MutasiParam>;

const optText = (max: number) =>
  z.string().trim().max(max).optional().transform((v) => (v ? v : undefined));

export const AjukanMutasiInput = z.object({
  keRuanganId: z.string().uuid("Ruangan tujuan tidak valid"),
  keBedId: z.string().uuid("Bed tujuan tidak valid").optional(),
  alasan: z.string().trim().min(3, "Alasan mutasi wajib diisi").max(300),
  catatan: optText(1000),
});
export type AjukanMutasiInput = z.infer<typeof AjukanMutasiInput>;

export const BatalMutasiInput = z.object({
  alasan: z.string().trim().min(3, "Alasan pembatalan wajib diisi").max(300),
});
export type BatalMutasiInput = z.infer<typeof BatalMutasiInput>;

// ── Lembar transfer pasien (opsional) ──

export const KONDISI_UMUM = ["Baik", "Sedang", "Lemah", "Kritis"] as const;
export const KESADARAN = ["Compos Mentis", "Apatis", "Somnolen", "Sopor", "Koma"] as const;
export const ALAT_TERPASANG = [
  "Infus", "Syringe pump", "Kateter urin", "NGT", "Oksigen nasal", "Oksigen masker",
  "Monitor", "Ventilator", "Drain", "Bidai / spalk",
] as const;
export const RISIKO = [
  "Risiko jatuh", "Alergi", "Isolasi / infeksi", "Restrain", "Gangguan menelan", "Luka tekan",
] as const;
export const DOKUMEN_DIBAWA = [
  "Rekam medis", "Hasil laboratorium", "Hasil radiologi", "Obat-obatan", "Informed consent",
] as const;
export const PENDAMPING = ["Perawat", "Perawat + dokter", "Petugas transport"] as const;

const intIn = (min: number, max: number) => z.number().int().min(min).max(max).optional();

export const LembarTransferInput = z.object({
  /** Jam dinding RS dari DateTimePicker ("YYYY-MM-DDTHH:mm") — dikonversi server ke instan. */
  waktuTransfer: z.string().trim().min(1, "Waktu transfer wajib diisi").max(40),
  diagnosa: optText(500),
  kondisiUmum: z.enum(KONDISI_UMUM).optional(),
  kesadaran: z.enum(KESADARAN).optional(),
  gcsE: intIn(1, 4),
  gcsV: intIn(1, 5),
  gcsM: intIn(1, 6),
  tdSistolik: intIn(30, 300),
  tdDiastolik: intIn(10, 200),
  nadi: intIn(10, 300),
  respirasi: intIn(2, 80),
  suhu: z.number().min(30).max(45).optional(),
  spo2: intIn(30, 100),
  skalaNyeri: intIn(0, 10),
  alatTerpasang: z.array(z.enum(ALAT_TERPASANG)).max(ALAT_TERPASANG.length).default([]),
  alatLain: optText(300),
  obatCairan: optText(1500),
  risiko: z.array(z.enum(RISIKO)).max(RISIKO.length).default([]),
  perhatian: optText(1500),
  dokumenDibawa: z.array(z.enum(DOKUMEN_DIBAWA)).max(DOKUMEN_DIBAWA.length).default([]),
  pendamping: z.enum(PENDAMPING).optional(),
  petugasPenerima: optText(120),
  catatan: optText(1500),
});
export type LembarTransferInput = z.infer<typeof LembarTransferInput>;

/** Lembar tersimpan: input + waktuTransfer sebagai ISO instan. */
export type LembarTransferData = Omit<LembarTransferInput, "waktuTransfer"> & { waktuTransfer: string };

// ── DTO ──

export type MutasiStatus = "Diajukan" | "Selesai" | "Dibatalkan";

export interface LokasiDTO {
  ruanganId: string | null;
  ruanganNama: string | null;
  bedId: string | null;
  bedKode: string | null;
  kelas: string | null;
}

export interface MutasiDTO {
  id: string;
  status: MutasiStatus;
  dari: LokasiDTO;
  ke: LokasiDTO;
  alasan: string;
  catatan: string | null;
  diajukanOleh: string;
  diajukanAt: string;
  selesaiOleh: string | null;
  selesaiAt: string | null;
  dibatalkanOleh: string | null;
  dibatalkanAt: string | null;
  alasanBatal: string | null;
  lembarTransfer: LembarTransferData | null;
  lembarDiisiOleh: string | null;
  lembarDiisiAt: string | null;
  version: number;
}

export interface MutasiStateDTO {
  kunjunganId: string;
  unit: string;
  /** Status kunjungan — mutasi hanya untuk pasien yang sedang dilayani (InService). */
  kunjunganStatus: string;
  lokasi: LokasiDTO;
  pending: MutasiDTO | null;
  riwayat: MutasiDTO[];
}

export type BedState = "available" | "occupied" | "reserved" | "current" | "target" | "unavailable";

export interface MutasiBedDTO {
  id: string;
  kode: string;
  nama: string;
  state: BedState;
  /** Pasien lain pemakai/pemesan bed (nama saja). */
  pasienNama: string | null;
}

export interface MutasiRoomDTO {
  id: string;
  kode: string;
  nama: string;
  locationType: string;
  /** Kelas kamar efektif (RI); null untuk IGD. */
  kelas: string | null;
  beds: MutasiBedDTO[];
  tersedia: number;
}

export interface MutasiOpsiDTO {
  rooms: MutasiRoomDTO[];
}
