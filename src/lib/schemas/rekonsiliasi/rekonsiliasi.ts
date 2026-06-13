// Zod input + DTO — rekam medis Rekonsiliasi Obat (tab Rekonsiliasi, per fase transisi).
// Append-only: tiap simpan = snapshot baru (parent + children obat). Lihat medicalrecord.Rekonsiliasi.

import { z } from "zod";

export const FASE = ["admisi", "transfer", "discharge"] as const;
export const KEPUTUSAN = ["Lanjut", "Stop", "Sesuaikan", "Tunda"] as const;

const optStr = z.string().trim().max(500).optional().transform((v) => (v ? v : undefined));

// ── Baris obat (child) ──────────────────────────────────────────────────────────
export const RekonsiliasiObatInput = z.object({
  namaObat: z.string().trim().min(1, "Nama obat wajib").max(300),
  dosis: optStr,
  rute: optStr,
  frekuensi: optStr,
  sumber: optStr,
  keputusan: z.enum(KEPUTUSAN).default("Lanjut"),
  gantiDengan: optStr,
  alasan: optStr,
  isHAM: z.coerce.boolean().default(false),
});
export type RekonsiliasiObatInput = z.infer<typeof RekonsiliasiObatInput>;

// ── Create (POST /kunjungan/:id/rekonsiliasi) — 1 snapshot fase ──────────────────
export const RekonsiliasiInput = z.object({
  fase: z.enum(FASE),
  selesai: z.coerce.boolean().default(false),
  catatan: optStr,
  waktu: z.coerce.date().optional(), // "Tanggal & Waktu"; kosong → server pakai now()
  petugas: z.string().trim().min(1).max(200).optional(), // kosong → nama actor (server)
  obatList: z.array(RekonsiliasiObatInput).max(100).default([]),
});
export type RekonsiliasiInput = z.infer<typeof RekonsiliasiInput>;

// ── DTO (response) ───────────────────────────────────────────────────────────────
export interface RekonsiliasiObatDTO {
  id: string;
  namaObat: string;
  dosis: string | null;
  rute: string | null;
  frekuensi: string | null;
  sumber: string | null;
  keputusan: string;
  gantiDengan: string | null;
  alasan: string | null;
  isHAM: boolean;
}

export interface RekonsiliasiDTO {
  id: string;
  fase: string;
  selesai: boolean;
  catatan: string | null;
  waktu: string;   // ISO
  petugas: string;
  obatList: RekonsiliasiObatDTO[];
  createdAt: string; // ISO
}
