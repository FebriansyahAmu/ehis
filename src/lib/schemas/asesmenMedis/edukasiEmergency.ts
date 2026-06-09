// Zod + DTO — Asesmen Medis · Edukasi · Emergency (HPK 2). Append-only log + soft-delete.
// Mirror EmergencyEntry + form EmergencyPane (EdukasiPane.tsx). Field terstruktur utuh;
// FE menyusun teks waktu utk tampilan.

import { z } from "zod";

const optStr = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined));

const arrStr = z.array(z.string().trim().min(1)).default([]);

// Tipe instruksi (vocab terkontrol; di DB = TEXT). Selaras TIPE_INSTRUKSI EdukasiPane.
export const EduEmergencyTipe = z.enum([
  "Instruksi Discharge",
  "Follow-up / Kontrol",
  "Emergency Response",
  "Edukasi Pra-Tindakan",
  "Tindak Lanjut Rawat Inap",
]);
export type EduEmergencyTipe = z.infer<typeof EduEmergencyTipe>;

// ── Input (POST /kunjungan/:id/asesmen/edukasi/emergency) ──────────────────────
//  Wajib (FE canAdd): instruksi. petugas diturunkan dari actor (bukan input).
export const EdukasiEmergencyInput = z.object({
  tipe: EduEmergencyTipe,
  instruksi: z.string().trim().min(1, "Instruksi wajib diisi"),
  instruksiObat: optStr,
  diet: optStr,
  aktivitas: optStr,
  tandaBahaya: arrStr,
  followUpDate: optStr,
  followUpLokasi: optStr,
  kontakEmergency: optStr,
  catatan: optStr,
});
export type EdukasiEmergencyInput = z.infer<typeof EdukasiEmergencyInput>;

// ── Param: id item (DELETE /…/emergency/:itemId) ───────────────────────────────
export const EdukasiEmergencyItemParam = z.object({
  id: z.string().uuid(),
  itemId: z.string().uuid(),
});
export type EdukasiEmergencyItemParam = z.infer<typeof EdukasiEmergencyItemParam>;

// ── DTO (GET list) ────────────────────────────────────────────────────────────
export interface EdukasiEmergencyDTO {
  id: string;
  kunjunganId: string;
  tipe: EduEmergencyTipe;
  instruksi: string;
  instruksiObat: string | null;
  diet: string | null;
  aktivitas: string | null;
  tandaBahaya: string[];
  followUpDate: string | null;
  followUpLokasi: string | null;
  kontakEmergency: string | null;
  catatan: string | null;
  petugas: string; // dari user login
  createdAt: string; // ISO (savedAt)
}
