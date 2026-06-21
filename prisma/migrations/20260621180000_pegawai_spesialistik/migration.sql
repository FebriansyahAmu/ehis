-- Pegawai: tambah kolom spesialistik (bidang spesialisasi, hanya saat profesi = "Dokter Spesialis").
-- Deklarasi HR; kredensial klinis penuh tetap di master.Dokter (spesialis_kode/STR/SIP).
ALTER TABLE "master"."pegawai" ADD COLUMN IF NOT EXISTS "spesialistik" TEXT;
