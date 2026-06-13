// Schema + DTO — "Obat Tersedia" (formularium ter-assign untuk konsumsi KLINIS).
// Beda dari /master/obat (katalog penuh, gate master.katalog): ini hanya obat yang SUDAH masuk
// formularium ≥1 ruangan via Mapping Hub → Formularium, dibaca dengan gate clinical.resep
// (Dokter/Perawat) untuk Rekonsiliasi / Resep. Selaras tindakanTersedia.ts.

import { z } from "zod";

// ── Query (GET /master/obat-tersedia) ───────────────────────────────────────────
// `ruanganKode` opsional → batasi ke obat yang masuk formularium ruangan tsb (per-unit scoping).
export const ObatTersediaQuery = z.object({
  ruanganKode: z.string().trim().min(1).optional(),
});
export type ObatTersediaQuery = z.infer<typeof ObatTersediaQuery>;

// ── DTO (response) ──────────────────────────────────────────────────────────────
// 1 baris per obat (distinct), dengan daftar kode ruangan tempat ia masuk formularium →
// FE bisa filter klien tanpa round-trip tambahan.
export interface ObatTersediaDTO {
  id: string;
  kode: string;
  namaGenerik: string;
  namaDagang: string;
  bentuk: string;
  kekuatan: string;
  satuanTerkecil: string | null;
  kategori: string;
  golongan: string | null;
  isHAM: boolean;
  /** Kode ruangan tempat obat ini masuk formularium (≥1). */
  ruanganKodes: string[];
}
