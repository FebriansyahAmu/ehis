-- Rekam Medis — Resume Medik Rawat Inap (tab Pasien Pulang RI, sub Resume Medik).
-- resume_medik = dokumen kelengkapan RM + klaim BPJS per kunjungan, append-only
-- "latest wins" (simpan = INSERT baris baru; read ambil created_at terbaru — jejak revisi
-- utuh, pola discharge_checklist). data_klinis = JSONB snapshot agregat medikolegal
-- (TTV masuk/pulang · lab abnormal · rad · obat · tindakan) dibekukan saat simpan.
-- TTE sign-off DPJP = stamp SEKALI per revisi (guard tte_signed_at IS NULL, Dokter-only
-- di Service); revisi baru pasca-sign = baris baru tanpa TTE → wajib tanda tangan ulang.
-- pencatat = actor login. FK → encounter.kunjungan cascade.
-- Gate clinical.rekammedis + ABAC careUnit (route()) — tanpa permission baru.

-- CreateTable
CREATE TABLE "medicalrecord"."resume_medik" (
    "id" UUID NOT NULL,
    "kunjungan_id" UUID NOT NULL,
    "asal_masuk" TEXT NOT NULL DEFAULT '',
    "tanggal_masuk_igd" TEXT NOT NULL DEFAULT '',
    "diagnosis_igd" TEXT NOT NULL DEFAULT '',
    "kondisi_masuk" TEXT NOT NULL DEFAULT '',
    "kondisi_pulang" TEXT NOT NULL DEFAULT '',
    "ringkasan_klinis" TEXT NOT NULL DEFAULT '',
    "data_klinis" JSONB,
    "pencatat" TEXT NOT NULL,
    "author_user_id" UUID,
    "author_pegawai_id" UUID,
    "tte_token" TEXT,
    "tte_signed_by" TEXT,
    "tte_signed_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resume_medik_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "resume_medik_kunjungan_id_created_at_idx" ON "medicalrecord"."resume_medik"("kunjungan_id", "created_at");

-- AddForeignKey
ALTER TABLE "medicalrecord"."resume_medik"
    ADD CONSTRAINT "resume_medik_kunjungan_id_fkey"
    FOREIGN KEY ("kunjungan_id") REFERENCES "encounter"."kunjungan"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
