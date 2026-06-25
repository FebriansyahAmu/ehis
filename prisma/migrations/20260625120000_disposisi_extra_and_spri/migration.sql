-- Disposisi (Pasien Pulang IGD) — kolom tambahan per-jenis yang sebelumnya tak tersimpan:
--   obat_pulang (Sembuh/Membaik) · edukasi_risiko/penandatangan/hubungan_penandatangan (APS).
-- + Tabel encounter.spri (Surat Perintah Rawat Inap) = artefak admisi BPJS dgn lifecycle
--   sendiri (status MenungguRef/Terbit/Dikonsumsi/Batal), dipisah dari Disposisi agar No.
--   Referensi bisa di-revisi setelah kunjungan IGD terkunci. Migrasi ADDITIF (data-preserving).

-- AlterTable
ALTER TABLE "medicalrecord"."disposisi"
    ADD COLUMN "obat_pulang" TEXT,
    ADD COLUMN "edukasi_risiko" TEXT,
    ADD COLUMN "penandatangan" TEXT,
    ADD COLUMN "hubungan_penandatangan" TEXT;

-- CreateTable
CREATE TABLE "encounter"."spri" (
    "id" UUID NOT NULL,
    "kunjungan_id" UUID NOT NULL,
    "no_kartu" TEXT NOT NULL,
    "dpjp_nama" TEXT NOT NULL,
    "dpjp_pegawai_id" UUID,
    "smf_spesialistik" TEXT,
    "poli_kode" TEXT,
    "poli_nama" TEXT,
    "tgl_rencana_rawat" DATE NOT NULL,
    "jenis_perawatan" TEXT NOT NULL,
    "indikasi" TEXT NOT NULL,
    "keterangan" TEXT,
    "no_referensi" TEXT,
    "status" TEXT NOT NULL DEFAULT 'MenungguRef',
    "ri_kunjungan_id" UUID,
    "user" TEXT NOT NULL,
    "created_by_user_id" UUID,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "spri_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "spri_status_created_at_idx" ON "encounter"."spri"("status", "created_at");

-- CreateIndex
CREATE INDEX "spri_kunjungan_id_idx" ON "encounter"."spri"("kunjungan_id");

-- CreateIndex
CREATE INDEX "spri_ri_kunjungan_id_idx" ON "encounter"."spri"("ri_kunjungan_id");

-- AddForeignKey
ALTER TABLE "encounter"."spri"
    ADD CONSTRAINT "spri_kunjungan_id_fkey"
    FOREIGN KEY ("kunjungan_id") REFERENCES "encounter"."kunjungan"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
