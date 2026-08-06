-- Kecelakaan Kerja (JKK / BPJS Ketenagakerjaan · e-PLKK) — lengkapi menu Kecelakaan Kerja
-- sesuai regulasi terbaru (PP 82/2019 · Permenaker 5/2021 jo 1/2025 · PMK 141/2018).
-- Lihat docs/KECELAKAAN-KERJA-JKK.md. Semua additive (nullable/default) — anti drift.

-- encounter.Kecelakaan: NPP · lingkup kejadian · status Laporan Tahap I (KK1) · indikator PLKK ·
-- badan penyelenggara penjamin kecelakaan.
ALTER TABLE "encounter"."kecelakaan"
  ADD COLUMN "npp"               TEXT,
  ADD COLUMN "lingkup_kerja"     TEXT,
  ADD COLUMN "status_laporan_kk" TEXT,
  ADD COLUMN "is_plkk"           BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "penjamin_badan"    TEXT;

-- bpjs.SEP: badan penyelenggara penjamin kecelakaan (jaminan.penjamin.penjamin).
ALTER TABLE "bpjs"."sep"
  ADD COLUMN "penjamin" TEXT;
