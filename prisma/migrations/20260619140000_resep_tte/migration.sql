-- Resep — TTE (Tanda Tangan Elektronik). Tambah serial/token (di-encode jadi barcode pada resep),
-- penanda tangan (dokter DPJP), dan waktu tanda tangan. Mock always-success: order di-tanda-tangani
-- saat dibuat (hanya dokter yang boleh order → clinical.resep:create). Data-preserving (nullable).

ALTER TABLE "medicalrecord"."resep_order" ADD COLUMN IF NOT EXISTS "tte_token" TEXT;
ALTER TABLE "medicalrecord"."resep_order" ADD COLUMN IF NOT EXISTS "tte_signed_by" TEXT;
ALTER TABLE "medicalrecord"."resep_order" ADD COLUMN IF NOT EXISTS "tte_signed_at" TIMESTAMPTZ(3);
