// Zod input + DTO — Entry Hasil Lab (nilai pemeriksaan per parameter utk 1 LabOrder).
// 1 hasil = header (analis + catatan + criticalNotifs) + values[] (baris per parameter).
// Mirror FE HasilItem/CriticalNotif (labShared). Lihat medicalrecord.LabResult / LabResultValue.
// Selaras schemas/lab/labOrder.ts.

import { z } from "zod";

const optStr = z.string().trim().optional().transform((v) => (v ? v : undefined));

export const FlagEnum = z.enum(["N", "H", "L", "C"]);

// ── Notifikasi nilai kritis (snapshot konfirmasi ke dokter pengirim) ──
export const CriticalNotifInput = z.object({
  testNama: z.string().trim().min(1).max(300),
  nilai: z.string().trim().max(120),
  threshold: z.string().trim().max(120),
  konfirmasiOleh: optStr,
  metode: z.enum(["Telepon", "SMS", "WhatsApp", "Langsung"]).optional(),
  waktu: optStr,
  confirmed: z.boolean().default(false),
});
export type CriticalNotifInput = z.infer<typeof CriticalNotifInput>;

// ── Nilai per parameter ──
export const LabValueInput = z.object({
  rowKey: z.string().trim().min(1).max(120),
  labTestId: z.string().uuid().nullish(),
  labParameterId: z.string().uuid().nullish(),
  kodeTes: z.string().trim().max(60).default(""),
  nama: z.string().trim().min(1, "Nama parameter wajib").max(300),
  kategori: z.string().trim().max(60).default(""),
  nilai: optStr,
  satuan: z.string().trim().max(40).default(""),
  rujukanStr: z.string().trim().max(120).default("—"),
  nilaiMin: z.number().nullish(),
  nilaiMax: z.number().nullish(),
  criticalLow: z.number().nullish(),
  criticalHigh: z.number().nullish(),
  flag: FlagEnum.nullish(),
  urutan: z.number().int().min(0).optional(),
});
export type LabValueInput = z.infer<typeof LabValueInput>;

// ── Save entry hasil (POST /lab/orders/:id/hasil) ──
export const SaveLabResultInput = z.object({
  analis: optStr, // kosong → default nama actor (user login)
  catatan: optStr,
  criticalNotifs: z.array(CriticalNotifInput).optional(),
  values: z.array(LabValueInput).min(1, "Minimal 1 parameter hasil"),
});
export type SaveLabResultInput = z.infer<typeof SaveLabResultInput>;
/** Bentuk pra-parse (field ber-default opsional) — dipakai pemanggil API/FE. */
export type SaveLabResultBody = z.input<typeof SaveLabResultInput>;

// ── Validasi hasil (POST /lab/orders/:id/validasi) — SpPK stamp + Divalidasi → Selesai ──
export const ValidateLabResultInput = z.object({
  validator: optStr,        // kosong → default nama actor (SpPK login)
  catatanValidator: optStr,
});
export type ValidateLabResultInput = z.infer<typeof ValidateLabResultInput>;
export type ValidateLabResultBody = z.input<typeof ValidateLabResultInput>;

// ── DTO (response) ──
export interface LabValueDTO {
  id: string;
  rowKey: string;
  labTestId: string | null;
  labParameterId: string | null;
  kodeTes: string;
  nama: string;
  kategori: string;
  nilai: string | null;
  satuan: string;
  rujukanStr: string;
  nilaiMin: number | null;
  nilaiMax: number | null;
  criticalLow: number | null;
  criticalHigh: number | null;
  flag: "N" | "H" | "L" | "C" | null;
  urutan: number;
}

export interface LabResultDTO {
  id: string;
  labOrderId: string;
  kunjunganId: string;
  analis: string;
  catatan: string | null;
  criticalNotifs: CriticalNotifInput[];
  values: LabValueDTO[];
  /** Validasi (SpPK) — null bila belum divalidasi. */
  validator: string | null;
  catatanValidator: string | null;
  validatedAt: string | null; // ISO
  createdAt: string; // ISO
}
