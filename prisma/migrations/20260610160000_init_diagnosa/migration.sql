-- Tab Diagnosa: koding ICD-10 (diagnosa) + ICD-9-CM (prosedur) per kunjungan.
-- Per-item + soft-delete. Invariant deklaratif (partial unique):
--   1 Utama aktif per kunjungan · kode unik per kunjungan (baris aktif saja).

CREATE TABLE "medicalrecord"."diagnosa" (
    "id" UUID NOT NULL,
    "kunjungan_id" UUID NOT NULL,
    "kode_icd10" TEXT NOT NULL,
    "nama_diagnosis" TEXT NOT NULL,
    "tipe" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "alasan" TEXT,
    "analisa" TEXT,
    "kategori" TEXT,
    "ina_cbg" TEXT,
    "pemeriksa" TEXT NOT NULL,
    "author_user_id" UUID,
    "author_pegawai_id" UUID,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),
    CONSTRAINT "diagnosa_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "diagnosa_kunjungan_id_deleted_at_idx"
    ON "medicalrecord"."diagnosa"("kunjungan_id", "deleted_at");

CREATE UNIQUE INDEX "diagnosa_utama_satu_per_kunjungan"
    ON "medicalrecord"."diagnosa"("kunjungan_id")
    WHERE "tipe" = 'Utama' AND "deleted_at" IS NULL;

CREATE UNIQUE INDEX "diagnosa_kode_unik_per_kunjungan"
    ON "medicalrecord"."diagnosa"("kunjungan_id", "kode_icd10")
    WHERE "deleted_at" IS NULL;

ALTER TABLE "medicalrecord"."diagnosa" ADD CONSTRAINT "diagnosa_kunjungan_id_fkey"
    FOREIGN KEY ("kunjungan_id") REFERENCES "encounter"."kunjungan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "medicalrecord"."diagnosa_prosedur" (
    "id" UUID NOT NULL,
    "kunjungan_id" UUID NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kategori" TEXT NOT NULL,
    "catatan" TEXT,
    "pemeriksa" TEXT NOT NULL,
    "author_user_id" UUID,
    "author_pegawai_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(3),
    CONSTRAINT "diagnosa_prosedur_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "diagnosa_prosedur_kunjungan_id_deleted_at_idx"
    ON "medicalrecord"."diagnosa_prosedur"("kunjungan_id", "deleted_at");

CREATE UNIQUE INDEX "diagnosa_prosedur_kode_unik_per_kunjungan"
    ON "medicalrecord"."diagnosa_prosedur"("kunjungan_id", "kode")
    WHERE "deleted_at" IS NULL;

ALTER TABLE "medicalrecord"."diagnosa_prosedur" ADD CONSTRAINT "diagnosa_prosedur_kunjungan_id_fkey"
    FOREIGN KEY ("kunjungan_id") REFERENCES "encounter"."kunjungan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
