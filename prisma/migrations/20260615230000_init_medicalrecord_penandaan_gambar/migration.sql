-- Rekam Medis — Penandaan Gambar (status lokalis / body-diagram, IGD; domain Outcome/Annotation).
-- Penanda Pin (titik) / Draw (coretan area, jalur titik %) + keterangan + severitas pada citra
-- anatomi nyata (pria/wanita) atau odontogram. Daftar hidup per-item: tambah = INSERT, hapus =
-- soft-delete (jejak medico-legal); tanpa edit. Koordinat % terhadap citra. FK → encounter.kunjungan
-- cascade. Gate clinical.pemeriksaan (reuse — selaras PenandaanAnatomi).

-- CreateTable
CREATE TABLE "medicalrecord"."penandaan_gambar" (
    "id" UUID NOT NULL,
    "kunjungan_id" UUID NOT NULL,
    "model_jenis" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "koordinat_x" DOUBLE PRECISION NOT NULL,
    "koordinat_y" DOUBLE PRECISION NOT NULL,
    "path" JSONB NOT NULL DEFAULT '[]',
    "region" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "deskripsi" TEXT NOT NULL DEFAULT '',
    "severitas" TEXT NOT NULL,
    "pemeriksa" TEXT NOT NULL,
    "author_user_id" UUID,
    "author_pegawai_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "penandaan_gambar_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "penandaan_gambar_kunjungan_id_deleted_at_idx" ON "medicalrecord"."penandaan_gambar"("kunjungan_id", "deleted_at");

-- AddForeignKey
ALTER TABLE "medicalrecord"."penandaan_gambar"
    ADD CONSTRAINT "penandaan_gambar_kunjungan_id_fkey"
    FOREIGN KEY ("kunjungan_id") REFERENCES "encounter"."kunjungan"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
