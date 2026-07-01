-- Rekam Medis — Intake / Output (Balance Cairan, tab Intake/Output, SNARS PP).
-- intake_output = entri cairan masuk/keluar per-shift (append-only time-series + soft-delete
-- entered-in-error). intake_output_target = order DPJP restriksi intake + target balance
-- (latest-wins append-only). Shared lintas unit (key kunjungan_id). FK → encounter.kunjungan
-- cascade. Gate clinical.rekammedis + ABAC careUnit (route()).

-- CreateTable
CREATE TABLE "medicalrecord"."intake_output" (
    "id" UUID NOT NULL,
    "kunjungan_id" UUID NOT NULL,
    "tipe" TEXT NOT NULL,
    "kategori" TEXT NOT NULL,
    "sub_kategori" TEXT NOT NULL DEFAULT '',
    "volume" INTEGER NOT NULL,
    "shift" TEXT NOT NULL,
    "catatan" TEXT NOT NULL DEFAULT '',
    "waktu" TIMESTAMPTZ(3) NOT NULL,
    "pencatat" TEXT NOT NULL,
    "author_user_id" UUID,
    "author_pegawai_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "intake_output_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicalrecord"."intake_output_target" (
    "id" UUID NOT NULL,
    "kunjungan_id" UUID NOT NULL,
    "restriksi_intake" INTEGER,
    "target_balance" INTEGER,
    "catatan" TEXT NOT NULL DEFAULT '',
    "updated_by" TEXT NOT NULL,
    "author_user_id" UUID,
    "author_pegawai_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "intake_output_target_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "intake_output_kunjungan_id_waktu_idx" ON "medicalrecord"."intake_output"("kunjungan_id", "waktu");

-- CreateIndex
CREATE INDEX "intake_output_target_kunjungan_id_created_at_idx" ON "medicalrecord"."intake_output_target"("kunjungan_id", "created_at");

-- AddForeignKey
ALTER TABLE "medicalrecord"."intake_output"
    ADD CONSTRAINT "intake_output_kunjungan_id_fkey"
    FOREIGN KEY ("kunjungan_id") REFERENCES "encounter"."kunjungan"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicalrecord"."intake_output_target"
    ADD CONSTRAINT "intake_output_target_kunjungan_id_fkey"
    FOREIGN KEY ("kunjungan_id") REFERENCES "encounter"."kunjungan"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
