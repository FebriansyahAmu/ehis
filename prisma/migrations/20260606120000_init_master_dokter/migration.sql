-- Master / Sumber Daya — Dokter (Practitioner). Ekstensi klinis 1:1 master.Pegawai.
-- Aditif murni (tabel + 2 enum baru); Pegawai.practitioner_id sudah ada (pointer).
-- no_str/no_sip UNIQUE pada kolom NULLABLE → Postgres anggap NULL distinct (uniqueness
-- hanya saat terisi). Acuan: docs/BACKEND-MASTER-SUMBER-DAYA.md §B.

-- CreateEnum
CREATE TYPE "master"."SpesialisKedokteran" AS ENUM ('Umum', 'SpJP', 'SpPD', 'SpA', 'SpOG', 'SpB', 'SpAn', 'SpS', 'SpM', 'SpEM', 'SpKK', 'SpKJ', 'SpPK', 'SpRad', 'SpTHT', 'SpU');

-- CreateEnum
CREATE TYPE "master"."StatusPraktik" AS ENUM ('Aktif', 'Cuti', 'Non_Aktif');

-- CreateTable
CREATE TABLE "master"."dokter" (
    "id" UUID NOT NULL,
    "pegawai_id" UUID NOT NULL,
    "spesialis_kode" "master"."SpesialisKedokteran" NOT NULL DEFAULT 'Umum',
    "kualifikasi" TEXT,
    "no_str" TEXT,
    "str_berlaku_hingga" DATE,
    "no_sip" TEXT,
    "sip_berlaku_hingga" DATE,
    "status_praktik" "master"."StatusPraktik" NOT NULL DEFAULT 'Aktif',
    "ihs_practitioner_id" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "dokter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dokter_pegawai_id_key" ON "master"."dokter"("pegawai_id");

-- CreateIndex
CREATE UNIQUE INDEX "dokter_no_str_key" ON "master"."dokter"("no_str");

-- CreateIndex
CREATE UNIQUE INDEX "dokter_no_sip_key" ON "master"."dokter"("no_sip");

-- CreateIndex
CREATE INDEX "dokter_spesialis_kode_idx" ON "master"."dokter"("spesialis_kode");

-- CreateIndex
CREATE INDEX "dokter_status_praktik_idx" ON "master"."dokter"("status_praktik");

-- AddForeignKey
ALTER TABLE "master"."dokter" ADD CONSTRAINT "dokter_pegawai_id_fkey" FOREIGN KEY ("pegawai_id") REFERENCES "master"."pegawai"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
