-- Rekam Medis — Resume Pulang Rawat Inap (tab Pasien Pulang RI, sub Resume Pulang).
-- resume_pulang = salinan discharge summary UNTUK PASIEN (PMK 24/2022), append-only
-- "latest wins" (simpan = INSERT baris baru; read ambil created_at terbaru — jejak revisi
-- utuh, pola resume_medik). Narasi bebas: 4 field autofill-able (anamnesis · penunjang ·
-- terapi · kondisi pulang) dikomposisi FE dari domain hidup lalu disunting DPJP + 3 field
-- manual (instruksi · pembatasan · diet). TTE sign-off DPJP = stamp SEKALI per revisi
-- (guard tte_signed_at IS NULL, Dokter-only di Service); revisi baru pasca-sign = tanpa TTE.
-- pencatat = actor login. FK → encounter.kunjungan cascade. Gate clinical.rekammedis +
-- ABAC careUnit (route()) — tanpa permission baru; allowWhenLocked (dilengkapi pasca-pulang).

-- CreateTable
CREATE TABLE "medicalrecord"."resume_pulang" (
    "id" UUID NOT NULL,
    "kunjungan_id" UUID NOT NULL,
    "ringkasan_anamnesis" TEXT NOT NULL DEFAULT '',
    "hasil_pemeriksaan" TEXT NOT NULL DEFAULT '',
    "terapi_diberikan" TEXT NOT NULL DEFAULT '',
    "kondisi_saat_pulang" TEXT NOT NULL DEFAULT '',
    "instruksi_pulang" TEXT NOT NULL DEFAULT '',
    "pembatasan_aktivitas" TEXT NOT NULL DEFAULT '',
    "diet_pulang" TEXT NOT NULL DEFAULT '',
    "tanda_tangan_pasien" BOOLEAN NOT NULL DEFAULT false,
    "pencatat" TEXT NOT NULL,
    "author_user_id" UUID,
    "author_pegawai_id" UUID,
    "tte_token" TEXT,
    "tte_signed_by" TEXT,
    "tte_signed_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resume_pulang_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "resume_pulang_kunjungan_id_created_at_idx" ON "medicalrecord"."resume_pulang"("kunjungan_id", "created_at");

-- AddForeignKey
ALTER TABLE "medicalrecord"."resume_pulang"
    ADD CONSTRAINT "resume_pulang_kunjungan_id_fkey"
    FOREIGN KEY ("kunjungan_id") REFERENCES "encounter"."kunjungan"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
