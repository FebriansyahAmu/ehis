// Zod contract + DTO domain Data Kecelakaan (tab registrasi detail kunjungan).
// Enum FE-facing (vocab UI) — mirror KecelakaanDraft di FE agar draft bisa dikirim apa adanya.
// Persist: encounter.Kecelakaan (1:1 kunjungan). Mapping input↔entity ada di Service.

import { z } from "zod";

// ── Enum (vocab UI, disimpan TEXT) ────────────────────────────
export const JenisKecelakaan    = z.enum(["kll", "kerja", "lainnya"]);
export const StatusLP           = z.enum(["belum", "proses", "ada"]);
export const StatusKoordinasiJR = z.enum(["belum", "dijadwalkan", "verifikasi"]);
export const StatusKlaim        = z.enum(["belum", "proses", "selesai", "ditolak"]);
export const PeranKendaraan     = z.enum(["Korban", "Pelaku", "Keterlibatan"]);

export const KendaraanItemInput = z.object({
  jenis: z.string().trim().max(60).default(""),
  noPol: z.string().trim().max(20).default(""),
  peran: PeranKendaraan.default("Korban"),
});

// ── Upsert (POST /kunjungan/:id/kecelakaan) ───────────────────
// Nama field = FE-facing (statusLP/statusKoordinasiJR) → identik KecelakaanDraft.
export const UpsertKecelakaanInput = z.object({
  jenis:              JenisKecelakaan.default("kll"),
  // Kejadian (shared)
  tanggal:            z.string().trim().max(10).default(""), // YYYY-MM-DD | ""
  waktu:              z.string().trim().max(5).default(""),  // HH:MM | ""
  provinsi:           z.string().trim().max(80).default(""),
  lokasi:             z.string().trim().max(300).default(""),
  kronologi:          z.string().trim().max(2000).default(""),
  mekanismeTrauma:    z.string().trim().max(120).default(""),
  // KLL
  statusLP:           StatusLP.default("belum"),
  noLapPol:           z.string().trim().max(80).default(""),
  satuanPolisi:       z.string().trim().max(120).default(""),
  kendaraan:          z.array(KendaraanItemInput).max(30).default([]),
  penjaminLanjutan:   z.string().trim().max(40).default(""),
  statusKoordinasiJR: StatusKoordinasiJR.default("belum"),
  // Kecelakaan Kerja
  namaPerusahaan:     z.string().trim().max(200).default(""),
  noKpj:              z.string().trim().max(40).default(""),
  jenisPekerjaan:     z.string().trim().max(120).default(""),
  lokasiKerja:        z.string().trim().max(300).default(""),
  // Status klaim
  statusKlaim:        StatusKlaim.default("belum"),
  nomorKlaim:         z.string().trim().max(80).default(""),
});
export type UpsertKecelakaanInput = z.infer<typeof UpsertKecelakaanInput>;

// ── DTO output — shape IDENTIK draft (+ updatedAt) → FE hydrate langsung ───────
export interface KecelakaanKendaraanDTO {
  jenis: string;
  noPol: string;
  peran: "Korban" | "Pelaku" | "Keterlibatan";
}

export interface KecelakaanDTO {
  jenis:              "kll" | "kerja" | "lainnya";
  tanggal:            string;
  waktu:              string;
  provinsi:           string;
  lokasi:             string;
  kronologi:          string;
  mekanismeTrauma:    string;
  statusLP:           "belum" | "proses" | "ada";
  noLapPol:           string;
  satuanPolisi:       string;
  kendaraan:          KecelakaanKendaraanDTO[];
  penjaminLanjutan:   string;
  statusKoordinasiJR: "belum" | "dijadwalkan" | "verifikasi";
  namaPerusahaan:     string;
  noKpj:              string;
  jenisPekerjaan:     string;
  lokasiKerja:        string;
  statusKlaim:        "belum" | "proses" | "selesai" | "ditolak";
  nomorKlaim:         string;
  updatedAt:          string; // ISO — audit
}
