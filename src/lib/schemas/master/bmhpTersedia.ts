// Schema + DTO — "BMHP Tersedia" (Ketersediaan Farmasi sub BMHP, untuk konsumsi KLINIS).
// Beda dari /master/bmhp (katalog penuh, gate master.katalog): ini hanya BMHP yang SUDAH
// di-assign ke ≥1 lokasi Farmasi (Mapping Hub → Ketersediaan Farmasi · sub BMHP), dibaca dengan
// gate clinical.tindakan (Dokter/Perawat) untuk tab Order BMHP. FILTER: hanya kode BHP-… (defensif —
// katalog Obat vs BMHP memang tabel terpisah). Selaras obatTersedia.ts / labTestTersedia.ts.

import { z } from "zod";

// ── Query (GET /master/bmhp-tersedia) ────────────────────────────────────────────
// `ruanganKode` opsional → batasi ke BMHP yang ter-assign ke lokasi tsb (per-depo scoping).
export const BmhpTersediaQuery = z.object({
  ruanganKode: z.string().trim().min(1).optional(),
});
export type BmhpTersediaQuery = z.infer<typeof BmhpTersediaQuery>;

// ── DTO (response) ──────────────────────────────────────────────────────────────
// 1 baris per BMHP (distinct), dengan daftar kode lokasi tempat ia tersedia → FE bisa filter klien.
export interface BmhpTersediaDTO {
  id: string;
  kode: string;        // BHP-<YYMM><NNN>
  nama: string;
  merek: string | null;
  kategori: string;
  ukuran: string | null;
  satuan: string;
  /** Harga jual satuan (Rp) dari katalog BMHP — snapshot tarif saat order. */
  hargaSatuan: number;
  isSteril: boolean;
  isSingleUse: boolean;
  /** Kode lokasi Farmasi tempat BMHP ini tersedia (≥1). */
  ruanganKodes: string[];
}
