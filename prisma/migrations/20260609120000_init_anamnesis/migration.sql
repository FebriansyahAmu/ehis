-- Domain klinis ke-3: Anamnesis (Asesmen Medis · sub-menu Anamnesis) — schema medicalrecord.
-- Append-only "latest wins" (≈1 baris/kunjungan; koreksi = baris baru). Mirror AnamnesisIGDForm.
-- sumber_anamnesis = TEXT (vocab terkontrol divalidasi di Zod, bukan enum Postgres).

-- CreateTable
CREATE TABLE "medicalrecord"."anamnesis" (
    "id" UUID NOT NULL,
    "kunjungan_id" UUID NOT NULL,
    "sumber_anamnesis" TEXT NOT NULL,
    "keluhan_utama" TEXT NOT NULL,
    "riwayat_penyakit_sekarang" TEXT NOT NULL,
    "onset_durasi" TEXT,
    "mekanisme_cedera" TEXT,
    "faktor_pemberat" TEXT,
    "faktor_peringan" TEXT,
    "status_generalis" TEXT NOT NULL,
    "obat_saat_ini" TEXT,
    "pemeriksa" TEXT NOT NULL,
    "author_user_id" UUID,
    "author_pegawai_id" UUID,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anamnesis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "anamnesis_kunjungan_id_created_at_idx" ON "medicalrecord"."anamnesis"("kunjungan_id", "created_at");

-- AddForeignKey (kunjungan, cross-schema same DB)
ALTER TABLE "medicalrecord"."anamnesis"
    ADD CONSTRAINT "anamnesis_kunjungan_id_fkey"
    FOREIGN KEY ("kunjungan_id") REFERENCES "encounter"."kunjungan"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
