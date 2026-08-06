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
// Kecelakaan Kerja (JKK): lingkup kejadian + status Laporan Tahap I (KK1). "" = belum dipilih.
export const LingkupKerja       = z.enum(["", "tempat_kerja", "dinas", "pp"]);
export const StatusLaporanKk    = z.enum(["belum", "proses", "terkirim"]);
// Hasil penetapan penjaminan JKK oleh BPJS TK via e-PLKK (bukan CoB).
export const StatusPenjaminanKk = z.enum(["menunggu", "dijamin", "ditolak"]);

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
  // Kecelakaan Kerja (JKK / BPJS Ketenagakerjaan). penjaminBadan = DERIVASI server (bukan input).
  namaPerusahaan:     z.string().trim().max(200).default(""),
  npp:                z.string().trim().max(40).default(""),
  noKpj:              z.string().trim().max(40).default(""),
  jenisPekerjaan:     z.string().trim().max(120).default(""),
  lokasiKerja:        z.string().trim().max(300).default(""),
  lingkupKerja:       LingkupKerja.default(""),
  statusLaporanKk:    StatusLaporanKk.default("belum"),
  isPlkk:             z.boolean().default(true),
  statusPenjaminanKk: StatusPenjaminanKk.default("menunggu"),
  noJaminanKk:        z.string().trim().max(60).default(""),
  // Suplesi BPJS (perawatan lanjutan KLL) → SEP.jaminan.penjamin.suplesi
  suplesi:            z.boolean().default(false),
  noSepSuplesi:       z.string().trim().max(40).default(""),
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
  npp:                string;
  noKpj:              string;
  jenisPekerjaan:     string;
  lokasiKerja:        string;
  lingkupKerja:       "" | "tempat_kerja" | "dinas" | "pp";
  statusLaporanKk:    "belum" | "proses" | "terkirim";
  isPlkk:             boolean;
  penjaminBadan:      string; // kode badan penyelenggara SEP (derivasi server): "" | "2" | "1,2"
  statusPenjaminanKk: "menunggu" | "dijamin" | "ditolak";
  noJaminanKk:        string;
  suplesi:            boolean;
  noSepSuplesi:       string;
  statusKlaim:        "belum" | "proses" | "selesai" | "ditolak";
  nomorKlaim:         string;
  updatedAt:          string; // ISO — audit
}

// ── Jembatan Kecelakaan → SEP (POST /kunjungan/:id/kecelakaan/sync-sep) ────────
// Hasil sinkronisasi blok jaminan ke SEP aktif. lokasiLaka DITUNDA (referensi wilayah BPJS).
export interface SepJaminanSyncDTO {
  noSep:          string | null;
  lakaLantas:     "BKLL" | "KLL_BKK" | "KLL_KK" | "KK";
  penjamin:       string | null; // badan penyelenggara: "1"=JR "2"=BPJS TK (koma-join) | null bila BKLL
  noLp:           string;
  tglKejadian:    string; // ISO date | ""
  keteranganLaka: string;
  suplesi:        boolean;
  noSepSuplesi:   string;
}

// Kandidat No. SEP suplesi (SEP KLL terbit pasien, lintas kunjungan) — GET .../suplesi-kandidat.
export interface SuplesiKandidatDTO {
  noSep:      string;
  tglSep:     string; // ISO date
  lakaLantas: string;
}
