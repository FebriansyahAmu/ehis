-- Rekam Medis — Asuhan Keperawatan (tab Keperawatan, SDKI/SLKI/SIKI). schema "medicalrecord".
-- 1 baris = 1 diagnosa keperawatan per kunjungan. CRUD + soft-delete (mirror tindakan_medis).
-- Blok pengkajian/intervensi/evaluasi = JSONB; kriteria_hasil = text[]. FK → encounter.kunjungan (cascade).

-- CreateTable
CREATE TABLE "medicalrecord"."asuhan_keperawatan" (
    "id" UUID NOT NULL,
    "kunjungan_id" UUID NOT NULL,
    "kode_sdki" TEXT NOT NULL DEFAULT '',
    "diagnosa" TEXT NOT NULL,
    "penyebab" TEXT NOT NULL DEFAULT '',
    "faktor_resiko" TEXT NOT NULL DEFAULT '',
    "data_mayor" JSONB NOT NULL,
    "data_minor" JSONB NOT NULL,
    "tujuan_durasi" TEXT NOT NULL DEFAULT '',
    "tujuan_unit" TEXT NOT NULL DEFAULT 'Hari',
    "selama" TEXT NOT NULL DEFAULT '',
    "kriteria_hasil" TEXT[],
    "status_luaran" TEXT NOT NULL DEFAULT 'Dipantau',
    "intervensi" JSONB NOT NULL,
    "evaluasi" JSONB NOT NULL DEFAULT '[]',
    "tanggal_input" TIMESTAMPTZ(3) NOT NULL,
    "perawat" TEXT NOT NULL,
    "author_user_id" UUID,
    "author_pegawai_id" UUID,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_by" TEXT,
    "verified_at" TIMESTAMPTZ(3),
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "asuhan_keperawatan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "asuhan_keperawatan_kunjungan_id_deleted_at_idx" ON "medicalrecord"."asuhan_keperawatan"("kunjungan_id", "deleted_at");

-- AddForeignKey
ALTER TABLE "medicalrecord"."asuhan_keperawatan"
    ADD CONSTRAINT "asuhan_keperawatan_kunjungan_id_fkey"
    FOREIGN KEY ("kunjungan_id") REFERENCES "encounter"."kunjungan"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
