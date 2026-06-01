-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "encounter";

-- CreateEnum
CREATE TYPE "encounter"."EncounterUnit" AS ENUM ('IGD', 'RawatJalan', 'RawatInap');

-- CreateEnum
CREATE TYPE "encounter"."EncounterStatus" AS ENUM ('Registered', 'Queued', 'InService', 'Completed', 'Closed', 'Billed', 'Claimed', 'Cancelled');

-- CreateEnum
CREATE TYPE "encounter"."CallState" AS ENUM ('Idle', 'Dipanggil');

-- CreateEnum
CREATE TYPE "encounter"."KelasRawat" AS ENUM ('VIP', 'Kelas_1', 'Kelas_2', 'Kelas_3', 'ICU', 'HCU', 'Isolasi');

-- CreateTable
CREATE TABLE "encounter"."encounter" (
    "id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "unit" "encounter"."EncounterUnit" NOT NULL,
    "status" "encounter"."EncounterStatus" NOT NULL DEFAULT 'Registered',
    "no_kunjungan" TEXT NOT NULL,
    "no_pendaftaran" TEXT,
    "antrean_kodebooking" TEXT,
    "dpjp_id" UUID,
    "poli" TEXT,
    "kelas" "encounter"."KelasRawat",
    "bed_id" UUID,
    "triase_level" INTEGER,
    "call_state" "encounter"."CallState",
    "recall_count" INTEGER NOT NULL DEFAULT 0,
    "cara_masuk" TEXT,
    "keluhan" TEXT,
    "penjamin_tipe" "pendaftaran"."TipePenjamin" NOT NULL DEFAULT 'Umum',
    "no_penjamin" TEXT,
    "no_sep" TEXT,
    "no_rujukan" TEXT,
    "invoice_id" UUID,
    "locked_at" TIMESTAMPTZ(3),
    "selesai_at" TIMESTAMPTZ(3),
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "encounter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "encounter_no_kunjungan_key" ON "encounter"."encounter"("no_kunjungan");

-- CreateIndex
CREATE UNIQUE INDEX "encounter_antrean_kodebooking_key" ON "encounter"."encounter"("antrean_kodebooking");

-- CreateIndex
CREATE UNIQUE INDEX "encounter_invoice_id_key" ON "encounter"."encounter"("invoice_id");

-- CreateIndex
CREATE INDEX "encounter_unit_status_created_at_idx" ON "encounter"."encounter"("unit", "status", "created_at");

-- CreateIndex
CREATE INDEX "encounter_patient_id_idx" ON "encounter"."encounter"("patient_id");

-- CreateIndex
CREATE INDEX "encounter_dpjp_id_idx" ON "encounter"."encounter"("dpjp_id");

-- CreateIndex
CREATE INDEX "encounter_created_at_id_idx" ON "encounter"."encounter"("created_at", "id");

-- AddForeignKey
ALTER TABLE "encounter"."encounter" ADD CONSTRAINT "encounter_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "pendaftaran"."pasien"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ── DB guarantees — di luar model Prisma (drift-safe) ────────────────────────
-- Triase IGD valid 1..5 (bila terisi).
ALTER TABLE "encounter"."encounter"
  ADD CONSTRAINT "encounter_triase_range_chk"
  CHECK ("triase_level" IS NULL OR "triase_level" BETWEEN 1 AND 5);
-- Counter panggil ulang tak boleh negatif.
ALTER TABLE "encounter"."encounter"
  ADD CONSTRAINT "encounter_recall_nonneg_chk" CHECK ("recall_count" >= 0);

