-- CreateEnum
CREATE TYPE "master"."IcdJenis" AS ENUM ('ICD_10', 'ICD_9');

-- CreateTable
CREATE TABLE "master"."icd_code" (
    "id" UUID NOT NULL,
    "jenis" "master"."IcdJenis" NOT NULL,
    "kode" TEXT NOT NULL,
    "display" TEXT NOT NULL,
    "cs_version" TEXT NOT NULL,
    "nama_inggris" TEXT,
    "chapter" TEXT,
    "blok" TEXT,
    "ina_cbg" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "icd_code_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "icd_code_jenis_kode_key" ON "master"."icd_code"("jenis", "kode");

-- CreateIndex
CREATE INDEX "icd_code_jenis_active_idx" ON "master"."icd_code"("jenis", "active");
