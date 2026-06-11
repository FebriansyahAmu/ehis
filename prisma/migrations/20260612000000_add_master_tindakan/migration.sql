-- Master Katalog Tindakan (schema "master"). Additive — hanya objek baru.
-- Enum kategori/kompleksitas nilainya identik union FE (tindakanMock.ts).

-- CreateEnum
CREATE TYPE "master"."TindakanKategori" AS ENUM ('Konsultasi', 'Tindakan_Medis', 'Diagnostik', 'Bedah_Minor', 'Bedah_Mayor', 'Bedah_Khusus', 'Obstetri', 'Pediatrik', 'Resusitasi', 'Anestesi', 'Spesialistik');

-- CreateEnum
CREATE TYPE "master"."TingkatKompleksitas" AS ENUM ('Sederhana', 'Sedang', 'Khusus', 'Canggih');

-- CreateTable
CREATE TABLE "master"."tindakan" (
    "id" UUID NOT NULL,
    "kode" TEXT NOT NULL DEFAULT '',
    "nama" TEXT NOT NULL,
    "kategori" "master"."TindakanKategori" NOT NULL DEFAULT 'Konsultasi',
    "kptl_aktif" BOOLEAN NOT NULL DEFAULT false,
    "nomor_kptl" TEXT,
    "kompleksitas" "master"."TingkatKompleksitas",
    "spesialis_default" TEXT[],
    "unit_default" TEXT[],
    "deskripsi" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "tindakan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tindakan_kategori_active_idx" ON "master"."tindakan"("kategori", "active");

-- CreateIndex
CREATE INDEX "tindakan_kode_idx" ON "master"."tindakan"("kode");
