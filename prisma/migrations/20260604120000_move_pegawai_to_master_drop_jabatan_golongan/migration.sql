-- Move HR tables from schema "sdm" to "master" (data-preserving) + drop Jabatan/Golongan.
-- ALTER ... SET SCHEMA = rename namespace; data, constraints, indexes ikut pindah utuh.
-- FK auth.users -> pegawai mereferensi OID tabel → tetap valid setelah pindah schema.

CREATE SCHEMA IF NOT EXISTS "master";

-- Enum types → master
ALTER TYPE "sdm"."JenisKelamin"  SET SCHEMA "master";
ALTER TYPE "sdm"."StatusPegawai" SET SCHEMA "master";
ALTER TYPE "sdm"."StatusAbsensi" SET SCHEMA "master";

-- Hapus link jabatan/golongan (drop kolom → FK constraint ikut terhapus), lalu drop tabel
ALTER TABLE "sdm"."pegawai" DROP COLUMN "jabatan_id";
ALTER TABLE "sdm"."pegawai" DROP COLUMN "golongan_id";
DROP TABLE "sdm"."jabatan";
DROP TABLE "sdm"."golongan";

-- Pindahkan tabel tersisa ke master (data utuh)
ALTER TABLE "sdm"."pegawai"                SET SCHEMA "master";
ALTER TABLE "sdm"."jadwal_shift"           SET SCHEMA "master";
ALTER TABLE "sdm"."absensi"                SET SCHEMA "master";
ALTER TABLE "sdm"."pegawai_kontak_darurat" SET SCHEMA "master";

-- Schema sdm sudah kosong
DROP SCHEMA "sdm";
