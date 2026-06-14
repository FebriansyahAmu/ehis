-- Rekam Medis — Pemeriksaan Fisik (tab Pemeriksaan, SNARS AP 1). schema "medicalrecord".
-- Append-only "latest wins" (mirip anamnesis): re-pemeriksaan = baris baru; latest by created_at.
-- Status generalis + head-to-toe (sistem JSONB) + temuan (text[]). FK → encounter.kunjungan cascade.

-- CreateTable
CREATE TABLE "medicalrecord"."pemeriksaan_fisik" (
    "id" UUID NOT NULL,
    "kunjungan_id" UUID NOT NULL,
    "ku" TEXT NOT NULL,
    "kesadaran" TEXT NOT NULL,
    "gizi" TEXT NOT NULL,
    "mobilitas" TEXT,
    "orientasi" JSONB NOT NULL,
    "catatan_generalis" TEXT,
    "sistem" JSONB NOT NULL,
    "temuan_abnormal" TEXT[],
    "temuan_lain" TEXT[],
    "catatan_umum" TEXT,
    "body_markings" JSONB NOT NULL DEFAULT '[]',
    "waktu_pemeriksaan" TIMESTAMPTZ(3) NOT NULL,
    "dokter_pemeriksa" TEXT NOT NULL,
    "perawat" TEXT NOT NULL,
    "author_user_id" UUID,
    "author_pegawai_id" UUID,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pemeriksaan_fisik_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pemeriksaan_fisik_kunjungan_id_created_at_idx" ON "medicalrecord"."pemeriksaan_fisik"("kunjungan_id", "created_at");

-- AddForeignKey
ALTER TABLE "medicalrecord"."pemeriksaan_fisik"
    ADD CONSTRAINT "pemeriksaan_fisik_kunjungan_id_fkey"
    FOREIGN KEY ("kunjungan_id") REFERENCES "encounter"."kunjungan"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
