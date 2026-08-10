-- Identitas pasien: nama ibu kandung (identifier kedua kanonik) + catatan identitas Mr.X
-- (ciri fisik untuk identifikasi pasien tak dikenal). Additive nullable.
ALTER TABLE "pendaftaran"."pasien" ADD COLUMN "nama_ibu" TEXT;
ALTER TABLE "pendaftaran"."pasien" ADD COLUMN "catatan_identitas" TEXT;
