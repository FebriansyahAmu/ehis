-- Modul CLINICAL (rekam medis) — domain pertama: Triase (pengkajian gawat darurat IGD).
-- Append-only: 1 baris = 1 pengkajian; re-triase = baris baru; kunjungan.triaseLevel = cache.

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "clinical";

-- CreateEnum
CREATE TYPE "clinical"."TriaseLevel" AS ENUM ('P1', 'P2', 'P3', 'P4');

-- CreateTable
CREATE TABLE "clinical"."triase" (
    "id" UUID NOT NULL,
    "kunjungan_id" UUID NOT NULL,
    "cara_masuk" TEXT NOT NULL,
    "kondisi_tiba" TEXT NOT NULL,
    "keluhan_utama" TEXT NOT NULL,
    "onset" TEXT NOT NULL,
    "lokasi_keluhan" TEXT,
    "kualitas_keluhan" TEXT,
    "skala_berat" TEXT,
    "faktor_pemberat" TEXT,
    "faktor_peringan" TEXT,
    "gejala_penyerta" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "riwayat_serupa" TEXT,
    "airway_status" TEXT NOT NULL,
    "suara_napas_abnormal" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "breathing_quality" TEXT NOT NULL,
    "pergerakan_dada" TEXT,
    "otot_bantu" TEXT,
    "sianosis" TEXT,
    "nadi_teraba" TEXT NOT NULL,
    "kualitas_nadi" TEXT,
    "crt" TEXT,
    "kondisi_kulit" TEXT,
    "perdarahan" TEXT,
    "avpu" TEXT NOT NULL,
    "pupil" TEXT,
    "refleks_cahaya" TEXT,
    "trauma_luka" TEXT,
    "lokasi_luka" TEXT,
    "suhu_kulit" TEXT,
    "diagnosis_sementara" TEXT,
    "tindakan_triase" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "triage_level" "clinical"."TriaseLevel" NOT NULL,
    "perawat_triase" TEXT NOT NULL,
    "waktu_triase" TIMESTAMPTZ(3) NOT NULL,
    "author_user_id" UUID,
    "author_pegawai_id" UUID,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "triase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "triase_kunjungan_id_created_at_idx" ON "clinical"."triase"("kunjungan_id", "created_at");

-- AddForeignKey (kunjungan, cross-schema same DB)
ALTER TABLE "clinical"."triase"
    ADD CONSTRAINT "triase_kunjungan_id_fkey"
    FOREIGN KEY ("kunjungan_id") REFERENCES "encounter"."kunjungan"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
