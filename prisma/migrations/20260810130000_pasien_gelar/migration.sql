-- Gelar depan/belakang pasien (title kehormatan/akademik) — nullable, additif.
-- Dipisah dari `nama` inti agar penulisan nama rapi & konsisten (UPPERCASE) tanpa mencampur gelar.
ALTER TABLE "pendaftaran"."pasien" ADD COLUMN "gelar_depan" TEXT;
ALTER TABLE "pendaftaran"."pasien" ADD COLUMN "gelar_belakang" TEXT;
