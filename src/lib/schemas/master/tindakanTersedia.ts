// Schema + DTO — "Tindakan Tersedia" (katalog ter-assign untuk konsumsi KLINIS).
// Beda dari /master/tindakan (katalog penuh, gate master.katalog): ini hanya tindakan yang
// SUDAH dipetakan ke ≥1 ruangan via Mapping Hub → Layanan Unit, dibaca dengan gate
// clinical.tindakan (Dokter/Perawat). Lab & Radiologi TIDAK termuat — keduanya bukan entri
// master.LayananUnit (Lab = tabel paralel LayananUnitLab; Rad = menu Order tersendiri).

import { z } from "zod";
import type { TindakanKategoriDTO, KompleksitasDTO } from "./tindakan";

// ── Query (GET /master/tindakan-tersedia) ──────────────────────────────────────
// `ruanganKode` opsional → batasi ke tindakan yang boleh di ruangan tsb (per-ruangan scoping).
// Tanpa filter → semua tindakan ter-assign (di ruangan manapun).
export const TindakanTersediaQuery = z.object({
  ruanganKode: z.string().trim().min(1).optional(),
});
export type TindakanTersediaQuery = z.infer<typeof TindakanTersediaQuery>;

// ── DTO (response) ─────────────────────────────────────────────────────────────
// 1 baris per tindakan (distinct), dengan daftar kode ruangan tempat ia ter-assign →
// FE bisa filter klien tanpa round-trip tambahan.
export interface TindakanTersediaDTO {
  id: string;
  kode: string;
  nama: string;
  kategori: TindakanKategoriDTO;
  kompleksitas: KompleksitasDTO | null;
  /** Kode ruangan tempat tindakan ini boleh dilakukan (≥1). */
  ruanganKodes: string[];
}
