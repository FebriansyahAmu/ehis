// Schema + DTO — "Lab Test Tersedia" (katalog pemeriksaan lab ter-assign untuk konsumsi KLINIS).
// Beda dari /master/lab-test (katalog penuh, gate master.katalog): ini hanya tes lab yang SUDAH
// dipetakan ke ≥1 ruangan LABORATORIUM via Mapping Hub → Layanan Unit (grup Lab), dibaca dengan
// gate clinical.tindakan (Dokter/Perawat — "Tindakan / Order" mencakup order Lab/Rad). Selaras
// tindakanTersedia.ts. Dipakai tab Order Lab (IGD/RI/RJ) untuk cari + estimasi biaya.

import { z } from "zod";
import type { LabKategoriDTO } from "./labTest";

// ── Query (GET /master/lab-test-tersedia) ───────────────────────────────────────
// `ruanganKode` opsional → batasi ke tes yang boleh di ruangan tsb (per-ruangan scoping).
// `penjaminKode`+`jenisRuangan` opsional → sertakan HARGA dari Tarif Matrix utk konteks tsb
// (mis. IGD: penjaminKode=UMUM, jenisRuangan=IGD). Keduanya wajib bareng agar harga ter-resolve.
export const LabTestTersediaQuery = z.object({
  ruanganKode: z.string().trim().min(1).optional(),
  penjaminKode: z.string().trim().min(1).max(20).optional(),
  jenisRuangan: z.string().trim().min(1).max(40).optional(),
});
export type LabTestTersediaQuery = z.infer<typeof LabTestTersediaQuery>;

// ── DTO (response) ───────────────────────────────────────────────────────────────
// 1 baris per tes (distinct), dengan daftar kode ruangan lab tempat ia ter-assign.
export interface LabTestTersediaDTO {
  id: string;
  kode: string;
  nama: string;
  kategori: LabKategoriDTO;
  /** TAT (waktu tunggu hasil), mis. "60 mnt". null bila tak diisi di master. */
  waktuTunggu: string | null;
  /** Kode ruangan laboratorium tempat tes ini boleh dikerjakan (≥1). */
  ruanganKodes: string[];
  /** Harga (rupiah) dari Tarif Matrix utk (penjaminKode, jenisRuangan) di query; null bila belum bertarif / param tak lengkap. */
  harga: number | null;
}
