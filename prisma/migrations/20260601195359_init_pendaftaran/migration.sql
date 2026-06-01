-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "pendaftaran";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateEnum
CREATE TYPE "pendaftaran"."Gender" AS ENUM ('L', 'P');

-- CreateEnum
CREATE TYPE "pendaftaran"."GolonganDarah" AS ENUM ('A', 'B', 'AB', 'O', 'TidakDiketahui');

-- CreateEnum
CREATE TYPE "pendaftaran"."Rhesus" AS ENUM ('Positif', 'Negatif', 'TidakDiketahui');

-- CreateEnum
CREATE TYPE "pendaftaran"."StatusPerkawinan" AS ENUM ('BelumKawin', 'Kawin', 'CeraiHidup', 'CeraiMati');

-- CreateEnum
CREATE TYPE "pendaftaran"."TipePenjamin" AS ENUM ('Umum', 'BPJS_Non_PBI', 'BPJS_PBI', 'Asuransi', 'Jamkesda');

-- CreateEnum
CREATE TYPE "pendaftaran"."JenisAlamat" AS ENUM ('KTP', 'Domisili');

-- CreateEnum
CREATE TYPE "pendaftaran"."SumberPendaftaran" AS ENUM ('WalkIn', 'MJKN', 'Kiosk');

-- CreateTable
CREATE TABLE "pendaftaran"."pasien" (
    "id" UUID NOT NULL,
    "no_rm" TEXT NOT NULL,
    "nik_enc" TEXT,
    "nik_hash" TEXT,
    "no_kk_enc" TEXT,
    "no_kk_hash" TEXT,
    "nama" TEXT NOT NULL,
    "gender" "pendaftaran"."Gender" NOT NULL,
    "tempat_lahir" TEXT,
    "tanggal_lahir" DATE,
    "golongan_darah" "pendaftaran"."GolonganDarah",
    "rhesus" "pendaftaran"."Rhesus",
    "status_perkawinan" "pendaftaran"."StatusPerkawinan",
    "agama" TEXT,
    "pendidikan" TEXT,
    "pekerjaan" TEXT,
    "suku" TEXT,
    "kewarganegaraan" TEXT NOT NULL DEFAULT 'WNI',
    "no_hp" TEXT,
    "email" CITEXT,
    "id_satusehat" TEXT,
    "data_lengkap" BOOLEAN NOT NULL DEFAULT false,
    "is_anonim" BOOLEAN NOT NULL DEFAULT false,
    "sumber_daftar" "pendaftaran"."SumberPendaftaran",
    "merged_into_id" UUID,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "pasien_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pendaftaran"."pasien_alamat" (
    "id" UUID NOT NULL,
    "pasien_id" UUID NOT NULL,
    "jenis" "pendaftaran"."JenisAlamat" NOT NULL,
    "alamat" TEXT,
    "rt_rw" TEXT,
    "kode_pos" TEXT,
    "provinsi_kode" TEXT,
    "provinsi_nama" TEXT,
    "kota_kode" TEXT,
    "kota_nama" TEXT,
    "kecamatan_kode" TEXT,
    "kecamatan_nama" TEXT,
    "kelurahan_kode" TEXT,
    "kelurahan_nama" TEXT,
    "bpjs_kode_prop" TEXT,
    "bpjs_kode_dati2" TEXT,
    "bpjs_kode_kec" TEXT,
    "bpjs_kode_kel" TEXT,

    CONSTRAINT "pasien_alamat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pendaftaran"."pasien_penjamin" (
    "id" UUID NOT NULL,
    "pasien_id" UUID NOT NULL,
    "tipe" "pendaftaran"."TipePenjamin" NOT NULL,
    "nama" TEXT NOT NULL,
    "nomor_enc" TEXT,
    "nomor_hash" TEXT,
    "kelas" TEXT,
    "berlaku_sampai" DATE,
    "no_polis" TEXT,
    "is_primer" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "pasien_penjamin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pendaftaran"."pasien_alergi_awal" (
    "id" UUID NOT NULL,
    "pasien_id" UUID NOT NULL,
    "nama" TEXT NOT NULL,
    "reaksi" TEXT,
    "tingkat" TEXT,

    CONSTRAINT "pasien_alergi_awal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pendaftaran"."pasien_kontak_darurat" (
    "id" UUID NOT NULL,
    "pasien_id" UUID NOT NULL,
    "nama" TEXT NOT NULL,
    "hubungan" TEXT NOT NULL,
    "no_hp" TEXT NOT NULL,
    "alamat" TEXT,

    CONSTRAINT "pasien_kontak_darurat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pasien_no_rm_key" ON "pendaftaran"."pasien"("no_rm");

-- CreateIndex
CREATE UNIQUE INDEX "pasien_nik_hash_key" ON "pendaftaran"."pasien"("nik_hash");

-- CreateIndex
CREATE INDEX "pasien_nama_idx" ON "pendaftaran"."pasien" USING GIN ("nama" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "pasien_tanggal_lahir_idx" ON "pendaftaran"."pasien"("tanggal_lahir");

-- CreateIndex
CREATE INDEX "pasien_merged_into_id_idx" ON "pendaftaran"."pasien"("merged_into_id");

-- CreateIndex
CREATE UNIQUE INDEX "pasien_alamat_pasien_id_jenis_key" ON "pendaftaran"."pasien_alamat"("pasien_id", "jenis");

-- CreateIndex
CREATE INDEX "pasien_penjamin_pasien_id_idx" ON "pendaftaran"."pasien_penjamin"("pasien_id");

-- CreateIndex
CREATE INDEX "pasien_alergi_awal_pasien_id_idx" ON "pendaftaran"."pasien_alergi_awal"("pasien_id");

-- CreateIndex
CREATE INDEX "pasien_kontak_darurat_pasien_id_idx" ON "pendaftaran"."pasien_kontak_darurat"("pasien_id");

-- AddForeignKey
ALTER TABLE "pendaftaran"."pasien" ADD CONSTRAINT "pasien_merged_into_id_fkey" FOREIGN KEY ("merged_into_id") REFERENCES "pendaftaran"."pasien"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pendaftaran"."pasien_alamat" ADD CONSTRAINT "pasien_alamat_pasien_id_fkey" FOREIGN KEY ("pasien_id") REFERENCES "pendaftaran"."pasien"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pendaftaran"."pasien_penjamin" ADD CONSTRAINT "pasien_penjamin_pasien_id_fkey" FOREIGN KEY ("pasien_id") REFERENCES "pendaftaran"."pasien"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pendaftaran"."pasien_alergi_awal" ADD CONSTRAINT "pasien_alergi_awal_pasien_id_fkey" FOREIGN KEY ("pasien_id") REFERENCES "pendaftaran"."pasien"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pendaftaran"."pasien_kontak_darurat" ADD CONSTRAINT "pasien_kontak_darurat_pasien_id_fkey" FOREIGN KEY ("pasien_id") REFERENCES "pendaftaran"."pasien"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── Manual (di luar model Prisma) ────────────────────────────────────────────
-- Sequence noRM: atomik anti-race (ganti max+1 mock). Service: SELECT nextval →
-- format 'RM-{tahun}-{seq:05}'. Reset tahunan = kebijakan Service (opsional).
CREATE SEQUENCE IF NOT EXISTS "pendaftaran"."no_rm_seq" AS BIGINT START 1;

