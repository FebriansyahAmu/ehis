-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "sdm";

-- CreateEnum
CREATE TYPE "sdm"."JenisKelamin" AS ENUM ('L', 'P');

-- CreateEnum
CREATE TYPE "sdm"."StatusPegawai" AS ENUM ('PNS', 'PPPK', 'Kontrak', 'Honorer', 'Magang', 'Mitra');

-- CreateEnum
CREATE TYPE "sdm"."StatusAbsensi" AS ENUM ('Hadir', 'Izin', 'Sakit', 'Cuti', 'Alpa', 'Libur');

-- DropIndex
DROP INDEX "auth"."users_dokter_id_idx";

-- AlterTable
ALTER TABLE "auth"."users" DROP COLUMN "dokter_id",
ADD COLUMN     "pegawai_id" UUID NOT NULL;

-- CreateTable
CREATE TABLE "sdm"."pegawai" (
    "id" UUID NOT NULL,
    "nik_enc" TEXT,
    "nik_hash" TEXT,
    "nip" TEXT NOT NULL,
    "nama_lengkap" TEXT NOT NULL,
    "gelar_depan" TEXT,
    "gelar_belakang" TEXT,
    "jenis_kelamin" "sdm"."JenisKelamin" NOT NULL,
    "tempat_lahir" TEXT,
    "tanggal_lahir" DATE,
    "status_pegawai" "sdm"."StatusPegawai" NOT NULL,
    "jabatan_id" UUID,
    "golongan_id" UUID,
    "unit_kerja" TEXT,
    "tgl_masuk" DATE,
    "alamat" TEXT,
    "no_hp" TEXT,
    "email" CITEXT,
    "foto" TEXT,
    "practitioner_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "pegawai_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sdm"."jabatan" (
    "id" UUID NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "unit_kerja" TEXT,
    "is_struktural" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "jabatan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sdm"."golongan" (
    "id" UUID NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,

    CONSTRAINT "golongan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sdm"."jadwal_shift" (
    "id" UUID NOT NULL,
    "nama" TEXT NOT NULL,
    "jam_mulai" TIME(0) NOT NULL,
    "jam_selesai" TIME(0) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "jadwal_shift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sdm"."absensi" (
    "id" UUID NOT NULL,
    "pegawai_id" UUID NOT NULL,
    "tanggal" DATE NOT NULL,
    "shift_id" UUID,
    "jam_masuk" TIME(0),
    "jam_keluar" TIME(0),
    "status" "sdm"."StatusAbsensi" NOT NULL DEFAULT 'Hadir',
    "keterangan" TEXT,

    CONSTRAINT "absensi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sdm"."pegawai_kontak_darurat" (
    "id" UUID NOT NULL,
    "pegawai_id" UUID NOT NULL,
    "nama" TEXT NOT NULL,
    "hubungan" TEXT NOT NULL,
    "no_hp" TEXT NOT NULL,
    "alamat" TEXT,

    CONSTRAINT "pegawai_kontak_darurat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pegawai_nik_hash_key" ON "sdm"."pegawai"("nik_hash");

-- CreateIndex
CREATE UNIQUE INDEX "pegawai_nip_key" ON "sdm"."pegawai"("nip");

-- CreateIndex
CREATE UNIQUE INDEX "pegawai_email_key" ON "sdm"."pegawai"("email");

-- CreateIndex
CREATE INDEX "pegawai_jabatan_id_idx" ON "sdm"."pegawai"("jabatan_id");

-- CreateIndex
CREATE INDEX "pegawai_golongan_id_idx" ON "sdm"."pegawai"("golongan_id");

-- CreateIndex
CREATE INDEX "pegawai_nama_lengkap_idx" ON "sdm"."pegawai"("nama_lengkap");

-- CreateIndex
CREATE INDEX "pegawai_status_pegawai_idx" ON "sdm"."pegawai"("status_pegawai");

-- CreateIndex
CREATE UNIQUE INDEX "jabatan_kode_key" ON "sdm"."jabatan"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "golongan_kode_key" ON "sdm"."golongan"("kode");

-- CreateIndex
CREATE INDEX "absensi_tanggal_idx" ON "sdm"."absensi"("tanggal");

-- CreateIndex
CREATE UNIQUE INDEX "absensi_pegawai_id_tanggal_key" ON "sdm"."absensi"("pegawai_id", "tanggal");

-- CreateIndex
CREATE INDEX "pegawai_kontak_darurat_pegawai_id_idx" ON "sdm"."pegawai_kontak_darurat"("pegawai_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_pegawai_id_key" ON "auth"."users"("pegawai_id");

-- AddForeignKey
ALTER TABLE "auth"."users" ADD CONSTRAINT "users_pegawai_id_fkey" FOREIGN KEY ("pegawai_id") REFERENCES "sdm"."pegawai"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sdm"."pegawai" ADD CONSTRAINT "pegawai_jabatan_id_fkey" FOREIGN KEY ("jabatan_id") REFERENCES "sdm"."jabatan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sdm"."pegawai" ADD CONSTRAINT "pegawai_golongan_id_fkey" FOREIGN KEY ("golongan_id") REFERENCES "sdm"."golongan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sdm"."absensi" ADD CONSTRAINT "absensi_pegawai_id_fkey" FOREIGN KEY ("pegawai_id") REFERENCES "sdm"."pegawai"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sdm"."pegawai_kontak_darurat" ADD CONSTRAINT "pegawai_kontak_darurat_pegawai_id_fkey" FOREIGN KEY ("pegawai_id") REFERENCES "sdm"."pegawai"("id") ON DELETE CASCADE ON UPDATE CASCADE;
