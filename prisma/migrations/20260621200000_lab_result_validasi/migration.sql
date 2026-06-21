-- Rekam Medis — Validasi Hasil Lab. Tambah kolom validasi (SpPK) ke lab_result: di-stamp sekali
-- saat order Divalidasi → Selesai (rilis hasil). Hasil (values) tetap immutable; validasi hanya
-- menstempel header (validator + catatan + waktu). Selaras pola SerahTerima (terima = UPDATE-stamp).
ALTER TABLE "medicalrecord"."lab_result" ADD COLUMN IF NOT EXISTS "validator" TEXT;
ALTER TABLE "medicalrecord"."lab_result" ADD COLUMN IF NOT EXISTS "validator_user_id" UUID;
ALTER TABLE "medicalrecord"."lab_result" ADD COLUMN IF NOT EXISTS "catatan_validator" TEXT;
ALTER TABLE "medicalrecord"."lab_result" ADD COLUMN IF NOT EXISTS "validated_at" TIMESTAMPTZ(3);
