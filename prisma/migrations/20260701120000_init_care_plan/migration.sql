-- Rekam Medis — Rencana Asuhan Terintegrasi / RAT (tab Rencana Asuhan, SNARS PP 1 & PP 2).
-- Model Goal-centric & PROBLEM-ORIENTED: parent care_plan_masalah (masalah aktif; boleh
-- di-link Diagnosa/SDKI via sumber+ref_kode → anti-redundan) + anak care_plan_goal (goal
-- terukur per PPA: target outcome + indikator + batas waktu + status tercapai). Verifikasi
-- DPJP co-sign di level masalah (granular). Shared lintas unit (key kunjungan_id, tanpa kolom
-- unit). FK → encounter.kunjungan cascade. Gate clinical.careplan + ABAC careUnit (route()).

-- CreateTable
CREATE TABLE "medicalrecord"."care_plan_masalah" (
    "id" UUID NOT NULL,
    "kunjungan_id" UUID NOT NULL,
    "masalah" TEXT NOT NULL,
    "sumber" TEXT NOT NULL DEFAULT 'Manual',
    "ref_kode" TEXT NOT NULL DEFAULT '',
    "fase" TEXT,
    "prioritas" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Aktif',
    "tanggal_input" TIMESTAMPTZ(3) NOT NULL,
    "pencatat" TEXT NOT NULL,
    "author_user_id" UUID,
    "author_pegawai_id" UUID,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_by" TEXT,
    "verified_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "care_plan_masalah_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicalrecord"."care_plan_goal" (
    "id" UUID NOT NULL,
    "masalah_id" UUID NOT NULL,
    "ppa" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "indikator" TEXT NOT NULL DEFAULT '',
    "target_waktu" TEXT NOT NULL DEFAULT '',
    "intervensi" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'Belum_Tercapai',
    "evaluasi" TEXT NOT NULL DEFAULT '',
    "waktu" TIMESTAMPTZ(3) NOT NULL,
    "pencatat" TEXT NOT NULL,
    "author_user_id" UUID,
    "author_pegawai_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "care_plan_goal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "care_plan_masalah_kunjungan_id_deleted_at_idx" ON "medicalrecord"."care_plan_masalah"("kunjungan_id", "deleted_at");

-- CreateIndex
CREATE INDEX "care_plan_goal_masalah_id_deleted_at_idx" ON "medicalrecord"."care_plan_goal"("masalah_id", "deleted_at");

-- AddForeignKey
ALTER TABLE "medicalrecord"."care_plan_masalah"
    ADD CONSTRAINT "care_plan_masalah_kunjungan_id_fkey"
    FOREIGN KEY ("kunjungan_id") REFERENCES "encounter"."kunjungan"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicalrecord"."care_plan_goal"
    ADD CONSTRAINT "care_plan_goal_masalah_id_fkey"
    FOREIGN KEY ("masalah_id") REFERENCES "medicalrecord"."care_plan_masalah"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
