-- Triase: kriteria observasi terpilih (centang dari "Tabel Kriteria Triase").
-- (1) Triase dapat snapshot protokol panduan (protocol_id/kode/nama, nullable —
--     record lama tetap valid). (2) Tabel anak triase_criteria = 1 baris per item
--     kriteria yang dicentang; SNAPSHOT teks parameter/level/nilai (append-only,
--     tahan terhadap perubahan master). Cascade saat triase induk dihapus.
-- Data-preserving: hanya ADD COLUMN nullable + CREATE TABLE baru.

-- AlterTable: protokol panduan pada pengkajian triase
ALTER TABLE "medicalrecord"."triase"
    ADD COLUMN "protocol_id"   UUID,
    ADD COLUMN "protocol_kode" TEXT,
    ADD COLUMN "protocol_nama" TEXT;

-- CreateTable: kriteria triase terpilih (snapshot)
CREATE TABLE "medicalrecord"."triase_criteria" (
    "id" UUID NOT NULL,
    "triase_id" UUID NOT NULL,
    "parameter_kode" TEXT NOT NULL,
    "parameter_label" TEXT NOT NULL,
    "level_kode" TEXT NOT NULL,
    "level_label" TEXT NOT NULL,
    "nilai" TEXT NOT NULL,
    "source_criteria_id" UUID,
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "triase_criteria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "triase_criteria_triase_id_idx" ON "medicalrecord"."triase_criteria"("triase_id");

-- AddForeignKey (triase induk, same schema)
ALTER TABLE "medicalrecord"."triase_criteria"
    ADD CONSTRAINT "triase_criteria_triase_id_fkey"
    FOREIGN KEY ("triase_id") REFERENCES "medicalrecord"."triase"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
