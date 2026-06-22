// Zod input + DTO — Entry Hasil Radiologi (ekspertise/bacaan radiolog per pemeriksaan utk 1 RadOrder).
// 1 hasil = header (radiografer + radiolog + catatan + criticalNotifs) + items[] (temuan/kesan per
// pemeriksaan). Mirror FE HasilRad. Lihat medicalrecord.RadResult / RadResultItem. Selaras
// schemas/lab/labResult.ts.

import { z } from "zod";

const optStr = z.string().trim().optional().transform((v) => (v ? v : undefined));

// ── Notifikasi temuan kritis (ACR critical results — snapshot konfirmasi ke dokter pengirim) ──
export const RadCriticalNotifInput = z.object({
  temuan: z.string().trim().min(1).max(500),       // temuan kritis yang dikomunikasikan
  konfirmasiOleh: optStr,
  metode: z.enum(["Telepon", "SMS", "WhatsApp", "Langsung"]).optional(),
  waktu: optStr,
  confirmed: z.boolean().default(false),
});
export type RadCriticalNotifInput = z.infer<typeof RadCriticalNotifInput>;

// ── Bacaan per pemeriksaan ──
export const RadResultItemInput = z.object({
  rowKey: z.string().trim().min(1).max(120),
  radOrderItemId: z.string().uuid().nullish(),
  kode: z.string().trim().max(60).default(""),
  nama: z.string().trim().min(1, "Nama pemeriksaan wajib").max(300),
  modalitas: z.string().trim().max(20).default(""), // method FHIR snapshot
  proyeksi: optStr,
  temuan: optStr,
  kesan: optStr,
  urutan: z.number().int().min(0).optional(),
});
export type RadResultItemInput = z.infer<typeof RadResultItemInput>;

// ── Save entry hasil (POST /rad/orders/:id/hasil) ──
export const SaveRadResultInput = z.object({
  radiografer: optStr,
  radiolog: optStr, // kosong → default nama actor (user login)
  catatan: optStr,
  criticalNotifs: z.array(RadCriticalNotifInput).optional(),
  items: z.array(RadResultItemInput).min(1, "Minimal 1 pemeriksaan dibaca"),
});
export type SaveRadResultInput = z.infer<typeof SaveRadResultInput>;
/** Bentuk pra-parse (field ber-default opsional) — dipakai pemanggil API/FE. */
export type SaveRadResultBody = z.input<typeof SaveRadResultInput>;

// ── Validasi hasil (POST /rad/orders/:id/validasi) — radiolog stamp + Divalidasi → Selesai ──
// validatorPegawaiId = radiolog terpilih (HARUS ter-assign Radiologi — diverifikasi server; nama
// diturunkan dari roster, anti-spoof). `validator` (nama) hanya fallback utk actor bypass.
export const ValidateRadResultInput = z.object({
  validatorPegawaiId: z.string().uuid().optional(),
  validator: optStr,        // fallback nama (actor bypass) — non-bypass: diturunkan dari roster
  catatanValidator: optStr,
});
export type ValidateRadResultInput = z.infer<typeof ValidateRadResultInput>;
export type ValidateRadResultBody = z.input<typeof ValidateRadResultInput>;

// ── DTO (response) ──
export interface RadResultItemDTO {
  id: string;
  radOrderItemId: string | null;
  rowKey: string;
  kode: string;
  nama: string;
  modalitas: string;
  proyeksi: string | null;
  temuan: string | null;
  kesan: string | null;
  urutan: number;
}

export interface RadResultDTO {
  id: string;
  radOrderId: string;
  kunjunganId: string;
  radiografer: string | null;
  radiolog: string;
  catatan: string | null;
  criticalNotifs: RadCriticalNotifInput[];
  items: RadResultItemDTO[];
  /** Validasi (radiolog) — null bila belum divalidasi. */
  validator: string | null;
  catatanValidator: string | null;
  validatedAt: string | null; // ISO
  createdAt: string; // ISO
}
