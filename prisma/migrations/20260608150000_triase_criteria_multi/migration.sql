-- Matrix Triase: izinkan BANYAK kriteria per sel (parameter × level).
-- Drop unique (parameter,level) → boleh >1 baris; tambah kolom urutan (urutan item dalam sel).
-- Data-preserving: baris existing dapat urutan=0.

DROP INDEX "master"."triase_criteria_parameter_id_level_id_key";

ALTER TABLE "master"."triase_criteria" ADD COLUMN "urutan" INTEGER NOT NULL DEFAULT 0;

-- Index komposit non-unique (ambil item terurut per sel).
CREATE INDEX "triase_criteria_parameter_id_level_id_idx"
    ON "master"."triase_criteria"("parameter_id", "level_id");
