-- Rekam Medis — Serah Terima Shift (handover keperawatan SBAR, IGD/RI; closed-loop).
-- Perawat KELUAR (sesi login) menyusun SBAR → perawat MASUK menekan "Terima" → distempel
-- penerima + waktu. Daftar hidup per-item: tambah = INSERT, terima = UPDATE-stamp (sekali),
-- hapus = soft-delete (jejak medico-legal). tanggal/jam = string FE; created_at/received_at =
-- anchor timestamptz. TTV tidak disimpan (single-source Observation). FK → encounter.kunjungan
-- cascade. Gate clinical.keperawatan (Perawat penulis utama).

-- CreateTable
CREATE TABLE "medicalrecord"."serah_terima" (
    "id" UUID NOT NULL,
    "kunjungan_id" UUID NOT NULL,
    "tanggal" TEXT NOT NULL,
    "shift" TEXT NOT NULL,
    "jam_serah_terima" TEXT NOT NULL,
    "situation" TEXT NOT NULL,
    "background" TEXT NOT NULL,
    "assessment" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "perawat_keluar" TEXT NOT NULL,
    "author_user_id" UUID,
    "author_pegawai_id" UUID,
    "perawat_masuk" TEXT NOT NULL DEFAULT '',
    "jam_terima" TEXT,
    "received_by_user_id" UUID,
    "received_by_pegawai_id" UUID,
    "received_at" TIMESTAMPTZ(3),
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "serah_terima_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "serah_terima_kunjungan_id_deleted_at_idx" ON "medicalrecord"."serah_terima"("kunjungan_id", "deleted_at");

-- AddForeignKey
ALTER TABLE "medicalrecord"."serah_terima"
    ADD CONSTRAINT "serah_terima_kunjungan_id_fkey"
    FOREIGN KEY ("kunjungan_id") REFERENCES "encounter"."kunjungan"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
