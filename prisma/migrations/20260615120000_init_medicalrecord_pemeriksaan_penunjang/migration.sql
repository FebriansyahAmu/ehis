-- Rekam Medis — Pemeriksaan Penunjang (tab Pemeriksaan, sub Penunjang). schema "medicalrecord".
-- Diagnostik bedside NON-Lab/Rad (EKG/Spirometri/EEG/EMG/Audiometri/Ekokardiografi/Treadmill/…);
-- hasil interpretatif. Daftar hidup per-item: tambah=INSERT, hapus=soft-delete (tanpa edit).
-- Per kunjungan. FK → encounter.kunjungan cascade. Mirror informed_consent (add/delete only).

-- CreateTable
CREATE TABLE "medicalrecord"."pemeriksaan_penunjang" (
    "id" UUID NOT NULL,
    "kunjungan_id" UUID NOT NULL,
    "jenis" TEXT NOT NULL,
    "keterangan" TEXT NOT NULL DEFAULT '',
    "hasil" TEXT NOT NULL,
    "kesimpulan" TEXT NOT NULL DEFAULT '',
    "waktu" TIMESTAMPTZ(3),
    "pemeriksa" TEXT NOT NULL,
    "author_user_id" UUID,
    "author_pegawai_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "pemeriksaan_penunjang_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pemeriksaan_penunjang_kunjungan_id_deleted_at_idx" ON "medicalrecord"."pemeriksaan_penunjang"("kunjungan_id", "deleted_at");

-- AddForeignKey
ALTER TABLE "medicalrecord"."pemeriksaan_penunjang"
    ADD CONSTRAINT "pemeriksaan_penunjang_kunjungan_id_fkey"
    FOREIGN KEY ("kunjungan_id") REFERENCES "encounter"."kunjungan"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
