-- Master Skala Klinis — Triase IGD (docs/BACKEND-MASTER-SKALA-KLINIK.md §A).
-- Protokol triase berbentuk matrix level×parameter → 4 tabel ber-FK (cascade child).
-- Data-preserving (tabel baru; tak menyentuh objek lama). Apply via `prisma migrate deploy`.

-- CreateEnum
CREATE TYPE "master"."TriaseStatus" AS ENUM ('Aktif', 'Non_Aktif');

-- CreateTable: triase_protocol
CREATE TABLE "master"."triase_protocol" (
    "id" UUID NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "deskripsi" TEXT,
    "protokol" TEXT,
    "status" "master"."TriaseStatus" NOT NULL DEFAULT 'Aktif',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "triase_protocol_pkey" PRIMARY KEY ("id")
);

-- CreateTable: triase_level
CREATE TABLE "master"."triase_level" (
    "id" UUID NOT NULL,
    "protocol_id" UUID NOT NULL,
    "kode" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "tone" TEXT NOT NULL,
    "respons_time" TEXT,
    "prioritas" INTEGER NOT NULL,
    "deskripsi" TEXT,
    "urutan" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "triase_level_pkey" PRIMARY KEY ("id")
);

-- CreateTable: triase_parameter
CREATE TABLE "master"."triase_parameter" (
    "id" UUID NOT NULL,
    "protocol_id" UUID NOT NULL,
    "kode" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "urutan" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "triase_parameter_pkey" PRIMARY KEY ("id")
);

-- CreateTable: triase_criteria
CREATE TABLE "master"."triase_criteria" (
    "id" UUID NOT NULL,
    "parameter_id" UUID NOT NULL,
    "level_id" UUID NOT NULL,
    "nilai" TEXT NOT NULL,

    CONSTRAINT "triase_criteria_pkey" PRIMARY KEY ("id")
);

-- Indexes & uniqueness
CREATE UNIQUE INDEX "triase_protocol_kode_key" ON "master"."triase_protocol"("kode");
CREATE UNIQUE INDEX "triase_level_protocol_id_kode_key" ON "master"."triase_level"("protocol_id", "kode");
CREATE INDEX "triase_level_protocol_id_idx" ON "master"."triase_level"("protocol_id");
CREATE UNIQUE INDEX "triase_parameter_protocol_id_kode_key" ON "master"."triase_parameter"("protocol_id", "kode");
CREATE INDEX "triase_parameter_protocol_id_idx" ON "master"."triase_parameter"("protocol_id");
CREATE UNIQUE INDEX "triase_criteria_parameter_id_level_id_key" ON "master"."triase_criteria"("parameter_id", "level_id");
CREATE INDEX "triase_criteria_parameter_id_idx" ON "master"."triase_criteria"("parameter_id");
CREATE INDEX "triase_criteria_level_id_idx" ON "master"."triase_criteria"("level_id");

-- Backstop single-default: ≤ 1 protokol default & aktif (non-deleted) per RS.
-- Service tetap unset-others dalam tx; index ini = jaring pengaman race.
CREATE UNIQUE INDEX "triase_protocol_one_default"
    ON "master"."triase_protocol" ((true))
    WHERE "is_default" AND "status" = 'Aktif' AND "deleted_at" IS NULL;

-- CHECK: prioritas ≥ 1
ALTER TABLE "master"."triase_level"
    ADD CONSTRAINT "triase_level_prioritas_check" CHECK ("prioritas" >= 1);

-- Foreign keys (cascade child saat protokol/level/parameter dihapus)
ALTER TABLE "master"."triase_level"
    ADD CONSTRAINT "triase_level_protocol_id_fkey"
    FOREIGN KEY ("protocol_id") REFERENCES "master"."triase_protocol"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "master"."triase_parameter"
    ADD CONSTRAINT "triase_parameter_protocol_id_fkey"
    FOREIGN KEY ("protocol_id") REFERENCES "master"."triase_protocol"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "master"."triase_criteria"
    ADD CONSTRAINT "triase_criteria_parameter_id_fkey"
    FOREIGN KEY ("parameter_id") REFERENCES "master"."triase_parameter"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "master"."triase_criteria"
    ADD CONSTRAINT "triase_criteria_level_id_fkey"
    FOREIGN KEY ("level_id") REFERENCES "master"."triase_level"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
