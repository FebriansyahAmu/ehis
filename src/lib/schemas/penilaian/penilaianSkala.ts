// Zod input + DTO — Penilaian Skala (tab Penilaian, sub-menu Asesmen Risiko — generik).
// SATU kontrak untuk semua skala risiko master (Morse/Braden/Barthel/dst). Append-only
// (read/create). Klien mengirim SNAPSHOT instrumen + jawaban + skor terhitung; server hanya
// memvalidasi & menyimpan (single source skoring = master/FE, BE tak menghitung ulang).
// tanggal/waktu derive dari createdAt (TZ Asia/Jakarta) di Service.

import { z } from "zod";
import { ModulEnum } from "@/lib/schemas/master/skalaRisiko";

// ── Jawaban per item (snapshot) ────────────────────────────────────────────────
export const PenilaianSkalaJawabanSchema = z.object({
  itemId: z.string().trim().min(1),
  itemLabel: z.string().trim().default(""),
  score: z.number().int(),
  optionLabel: z.string().trim().default(""),
});

// ── Create (POST /kunjungan/:id/penilaian-skala) ───────────────────────────────
export const PenilaianSkalaInput = z.object({
  skalaKode: z.string().trim().min(1, "Kode skala wajib"),
  skalaNama: z.string().trim().min(1, "Nama skala wajib"),
  kategori: z.string().trim().optional(),       // default "Risiko" di Service
  totalSkor: z.number().int(),
  totalMax: z.number().int().min(0),
  interpretasiLabel: z.string().trim().optional(),
  interpretasiTone: z.string().trim().optional(),
  jawaban: z.array(PenilaianSkalaJawabanSchema).optional(),
  catatan: z.string().optional(),
  pemeriksa: z.string().trim().optional(),       // default nama actor di Service
});
export type PenilaianSkalaInput = z.infer<typeof PenilaianSkalaInput>;

export const IdParam = z.object({ id: z.string().uuid() });

// ── Query — daftar instrumen master ter-assign unit (GET /master/skala-tersedia) ──
export const SkalaKategoriEnum = z.enum(["Risiko", "Penyakit", "Umum"]);
export const SkalaTersediaQuery = z.object({
  modul: ModulEnum.optional(),              // IGD/RI/RJ/ICU — filter konsumenModul (assignment per unit)
  kategori: SkalaKategoriEnum.optional(),   // default "Risiko" (di route) — pilih katalog
});
export type SkalaTersediaQuery = z.infer<typeof SkalaTersediaQuery>;

// ── DTO (response) ─────────────────────────────────────────────────────────────
export interface PenilaianSkalaJawaban {
  itemId: string;
  itemLabel: string;
  score: number;
  optionLabel: string;
}
export interface PenilaianSkalaDTO {
  id: string;
  skalaKode: string;
  skalaNama: string;
  kategori: string;
  totalSkor: number;
  totalMax: number;
  interpretasiLabel: string;
  interpretasiTone: string;
  jawaban: PenilaianSkalaJawaban[];
  catatan: string;
  pemeriksa: string;
  tanggal: string; // "DD Mon YYYY" (TZ Asia/Jakarta) — tampilan riwayat
  waktu: string;   // ISO createdAt
}
