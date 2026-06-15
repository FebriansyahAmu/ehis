// Zod input + DTO — Serah Terima Shift (tab Serah Terima, handover keperawatan SBAR, closed-loop).
// DTO mirror HandoverEntry FE (HandoverTab.tsx) → zero-refactor. Daftar hidup per kunjungan:
// create (perawat keluar menyusun SBAR) · receive/PATCH (perawat masuk "Terima") · soft-delete.
// tanggal/jam = string FE (DateTimePicker → split). TTV tidak disimpan (single-source Observation).

import { z } from "zod";

const Shift = z.enum(["Pagi", "Siang", "Malam"]);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal harus YYYY-MM-DD");
const jam = z.string().regex(/^\d{2}:\d{2}$/, "Jam harus HH:mm");

// ── Create (POST /kunjungan/:id/serah-terima) ──────────────────────────────────
export const SerahTerimaInput = z.object({
  tanggal: isoDate,
  shift: Shift,
  jamSerahTerima: jam,
  situation: z.string().trim().min(1, "Situation wajib").max(5000),
  background: z.string().trim().min(1, "Background wajib").max(5000),
  assessment: z.string().trim().min(1, "Assessment wajib").max(5000),
  recommendation: z.string().trim().min(1, "Recommendation wajib").max(5000),
  perawatKeluar: z.string().trim().optional(), // default nama actor di Service
});
export type SerahTerimaInput = z.infer<typeof SerahTerimaInput>;

// ── Receive / "Terima" (PATCH /kunjungan/:id/serah-terima/:itemId) ─────────────
//  Penerima = nama actor (sesi login perawat masuk); jamTerima distempel Service (WIB).
export const ReceiveInput = z.object({
  perawatMasuk: z.string().trim().optional(), // default nama actor di Service
});
export type ReceiveInput = z.infer<typeof ReceiveInput>;

export const IdParam = z.object({ id: z.string().uuid() });
export const ItemParam = z.object({ id: z.string().uuid(), itemId: z.string().uuid() });
export type ItemParam = z.infer<typeof ItemParam>;

// ── DTO (response) — mirror HandoverEntry FE ───────────────────────────────────
export interface SerahTerimaDTO {
  id: string;
  tanggal: string; // "YYYY-MM-DD"
  shift: "Pagi" | "Siang" | "Malam";
  jamSerahTerima: string; // "HH:mm"
  perawatKeluar: string; // pemberi (sesi login penyusun)
  perawatMasuk: string; // penerima — "" = belum diterima
  jamTerima?: string; // "HH:mm" saat diterima
  situation: string;
  background: string;
  assessment: string;
  recommendation: string;
}
