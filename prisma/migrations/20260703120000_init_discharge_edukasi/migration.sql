-- Rekam Medis — Discharge Planning step 2: Edukasi Bertahap (tab Discharge Planning RI,
-- SNARS HPK 2). discharge_edukasi = 1 baris per sesi/log pemberian edukasi per topik.
-- Add + soft-delete only (koreksi = hapus baris lama + baris baru; jejak medico-legal utuh).
-- Topik = soft-ref template FE ("edu-01"…) + SNAPSHOT judul/kategori (tahan perubahan template).
-- petugas = actor login (server-otoritatif). FK → encounter.kunjungan cascade.
-- Gate clinical.rekammedis + ABAC careUnit (route()). Step Checklist = tabel menyusul.

-- CreateTable
CREATE TABLE "medicalrecord"."discharge_edukasi" (
    "id" UUID NOT NULL,
    "kunjungan_id" UUID NOT NULL,
    "topik_id" TEXT NOT NULL,
    "topik" TEXT NOT NULL,
    "kategori" TEXT NOT NULL,
    "tanggal" TEXT NOT NULL,
    "profesi" TEXT NOT NULL,
    "metode" TEXT NOT NULL,
    "penerima" TEXT NOT NULL,
    "pemahaman" TEXT NOT NULL,
    "catatan" TEXT NOT NULL DEFAULT '',
    "petugas" TEXT NOT NULL,
    "author_user_id" UUID,
    "author_pegawai_id" UUID,
    "deleted_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discharge_edukasi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "discharge_edukasi_kunjungan_id_topik_id_idx" ON "medicalrecord"."discharge_edukasi"("kunjungan_id", "topik_id");

-- AddForeignKey
ALTER TABLE "medicalrecord"."discharge_edukasi"
    ADD CONSTRAINT "discharge_edukasi_kunjungan_id_fkey"
    FOREIGN KEY ("kunjungan_id") REFERENCES "encounter"."kunjungan"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
