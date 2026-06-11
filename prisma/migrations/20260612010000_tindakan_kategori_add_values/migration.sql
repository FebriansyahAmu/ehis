-- Tambah 5 nilai enum master.TindakanKategori. Idempoten (IF NOT EXISTS → skip bila duplikat).
-- Hanya ADD VALUE (tak dipakai di migrasi yang sama) → aman dalam transaksi (PG12+).

ALTER TYPE "master"."TindakanKategori" ADD VALUE IF NOT EXISTS 'Non_Kategori';
ALTER TYPE "master"."TindakanKategori" ADD VALUE IF NOT EXISTS 'Prosedur_Bedah';
ALTER TYPE "master"."TindakanKategori" ADD VALUE IF NOT EXISTS 'Prosedur_Non_Bedah';
ALTER TYPE "master"."TindakanKategori" ADD VALUE IF NOT EXISTS 'Keperawatan';
ALTER TYPE "master"."TindakanKategori" ADD VALUE IF NOT EXISTS 'Tindakan_Invasif';
