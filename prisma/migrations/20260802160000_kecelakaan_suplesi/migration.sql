-- Suplesi BPJS pada encounter.Kecelakaan — jembatan Kecelakaan→SEP.jaminan.penjamin.suplesi.
-- Kolom wilayah kejadian (lokasiLaka) DITUNDA (butuh referensi wilayah BPJS; kode ≠ Kemendagri).

ALTER TABLE "encounter"."kecelakaan"
  ADD COLUMN "suplesi"        BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "no_sep_suplesi" TEXT;
