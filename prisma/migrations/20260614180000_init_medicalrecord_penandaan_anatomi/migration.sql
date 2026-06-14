-- Rekam Medis — Penandaan Anatomi (tab Pemeriksaan, sub Anatomi / body-map). schema "medicalrecord".
-- Daftar hidup per-item: 1 baris = 1 area tubuh ditandai. Tambah=INSERT, hapus=soft-delete,
-- edit catatan=UPDATE. Per kunjungan. FK → encounter.kunjungan cascade. Mirror asesmen_alergi.

-- CreateTable
CREATE TABLE "medicalrecord"."penandaan_anatomi" (
    "id" UUID NOT NULL,
    "kunjungan_id" UUID NOT NULL,
    "region" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "catatan" TEXT NOT NULL DEFAULT '',
    "pemeriksa" TEXT NOT NULL,
    "author_user_id" UUID,
    "author_pegawai_id" UUID,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "penandaan_anatomi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "penandaan_anatomi_kunjungan_id_deleted_at_idx" ON "medicalrecord"."penandaan_anatomi"("kunjungan_id", "deleted_at");

-- AddForeignKey
ALTER TABLE "medicalrecord"."penandaan_anatomi"
    ADD CONSTRAINT "penandaan_anatomi_kunjungan_id_fkey"
    FOREIGN KEY ("kunjungan_id") REFERENCES "encounter"."kunjungan"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
