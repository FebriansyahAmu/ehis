-- Fitur "Selesaikan Kunjungan" — disposisi + lifecycle lock.
-- (1) Kunjungan: waktu selesai efektif vs pertama (audit) + pointer jenis disposisi + alasan reopen.
-- (2) medicalrecord.Disposisi: outcome episode IGD (Pulang/Rawat_Inap/Rujuk/Meninggal/APS),
--     append latest-wins, ditulis atomik via aksi complete. FK → encounter.kunjungan cascade.

-- AlterTable
ALTER TABLE "encounter"."kunjungan"
    ADD COLUMN "selesai_pertama_at" TIMESTAMPTZ(3),
    ADD COLUMN "disposisi" TEXT,
    ADD COLUMN "alasan_reopen" TEXT;

-- CreateTable
CREATE TABLE "medicalrecord"."disposisi" (
    "id" UUID NOT NULL,
    "kunjungan_id" UUID NOT NULL,
    "jenis" TEXT NOT NULL,
    "waktu_keluar" TIMESTAMPTZ(3) NOT NULL,
    "dokter" TEXT NOT NULL,
    "kondisi_umum" TEXT NOT NULL,
    "diagnosa_keluar" TEXT[],
    "instruksi" TEXT NOT NULL DEFAULT '',
    "rujuk_tujuan" TEXT,
    "rujuk_alasan" TEXT,
    "meninggal_waktu" TEXT,
    "meninggal_sebab" TEXT,
    "aps_alasan" TEXT,
    "rawat_inap_ruangan" TEXT,
    "rawat_inap_kelas" TEXT,
    "catatan" TEXT,
    "pemeriksa" TEXT NOT NULL,
    "author_user_id" UUID,
    "author_pegawai_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "disposisi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "disposisi_kunjungan_id_deleted_at_idx" ON "medicalrecord"."disposisi"("kunjungan_id", "deleted_at");

-- AddForeignKey
ALTER TABLE "medicalrecord"."disposisi"
    ADD CONSTRAINT "disposisi_kunjungan_id_fkey"
    FOREIGN KEY ("kunjungan_id") REFERENCES "encounter"."kunjungan"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
