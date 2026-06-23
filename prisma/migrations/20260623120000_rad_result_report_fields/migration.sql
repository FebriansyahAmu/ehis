-- Tambah kolom laporan ekspertise (single report) ke rad_result (additive, tabel kosong).
ALTER TABLE "medicalrecord"."rad_result"
  ADD COLUMN "indikasi_klinis" TEXT,
  ADD COLUMN "teknik"          TEXT,
  ADD COLUMN "temuan"          TEXT,
  ADD COLUMN "kesan"           TEXT,
  ADD COLUMN "saran"           TEXT,
  ADD COLUMN "radiolog_sip"    TEXT;
