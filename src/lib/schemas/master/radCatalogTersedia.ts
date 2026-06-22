// Schema + DTO — "Rad Catalog Tersedia" (katalog pemeriksaan radiologi ter-assign untuk konsumsi KLINIS).
// Beda dari /master/rad-catalog (katalog penuh, gate master.katalog): ini hanya pemeriksaan yang SUDAH
// dipetakan ke ≥1 ruangan RADIOLOGI via Mapping Hub → Layanan Unit (grup Rad), dibaca dengan gate
// clinical.tindakan (Dokter/Perawat — "Tindakan / Order" mencakup order Lab/Rad). Selaras
// labTestTersedia.ts. Dipakai tab Order Radiologi (IGD/RI/RJ) untuk cari + estimasi biaya.

import { z } from "zod";
import type { RadModalitasDTO, RadRegionDTO, RadKategoriDTO } from "./radCatalog";

// ── Query (GET /master/rad-catalog-tersedia) ──────────────────────────────────────
// `ruanganKode` opsional → batasi ke pemeriksaan yang boleh di ruangan tsb (per-ruangan scoping).
// `penjaminKode`+`jenisRuangan` opsional → sertakan HARGA dari Tarif Matrix utk konteks tsb
// (mis. IGD: penjaminKode=UMUM, jenisRuangan=IGD). Keduanya wajib bareng agar harga ter-resolve.
export const RadCatalogTersediaQuery = z.object({
  ruanganKode: z.string().trim().min(1).optional(),
  penjaminKode: z.string().trim().min(1).max(20).optional(),
  jenisRuangan: z.string().trim().min(1).max(40).optional(),
});
export type RadCatalogTersediaQuery = z.infer<typeof RadCatalogTersediaQuery>;

// ── DTO (response) ────────────────────────────────────────────────────────────────
// 1 baris per pemeriksaan (distinct), dengan daftar kode ruangan radiologi tempat ia ter-assign.
// `modalitas` = method FHIR (XR/CT/MR/RF/US/MG/DXA/NM) — FE memetakan ke label display.
// `waktuTunggu` & `persiapan` di-format di Service dari blok JSONB (TAT rutin + persiapan).
export interface RadCatalogTersediaDTO {
  id: string;
  kode: string;
  nama: string;
  modalitas: RadModalitasDTO;
  modalitasSubtype: string | null;
  region: RadRegionDTO;
  kategori: RadKategoriDTO;
  /** Estimasi tunggu hasil (human-readable, dari TAT rutin), mis. "1–2 jam". null bila tak diisi. */
  waktuTunggu: string | null;
  /** Ringkasan persiapan pasien (puasa/premedikasi/instruksi), atau null bila tak ada. */
  persiapan: string | null;
  /** Kode ruangan radiologi tempat pemeriksaan ini boleh dikerjakan (≥1). */
  ruanganKodes: string[];
  /** Harga (rupiah) dari Tarif Matrix utk (penjaminKode, jenisRuangan) di query; null bila belum bertarif / param tak lengkap. */
  harga: number | null;
}
