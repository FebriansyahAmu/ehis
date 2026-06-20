-- Rekam Medis — Telaah / Pengkajian Resep (PMK 72/2016 · SatuSehat QuestionnaireResponse).
-- 1 baris = 1 telaah resep oleh Apoteker. Append-only (telaah ulang = baris baru). Mengubah
-- status resep_order (Diterima → Ditelaah | Dikembalikan) di transaksi milik Service.
-- `answers` JSONB = faithful QuestionnaireResponse (grup administrasi/farmasetik/klinis →
-- linkId→boolean). FK → medicalrecord.resep_order cascade.

-- CreateTable
CREATE TABLE "medicalrecord"."resep_telaah" (
    "id" UUID NOT NULL,
    "resep_order_id" UUID NOT NULL,
    "kunjungan_id" UUID NOT NULL,
    "hasil" TEXT NOT NULL,
    "alasan_kembali" TEXT,
    "catatan" TEXT,
    "lulus_administrasi" BOOLEAN NOT NULL,
    "lulus_farmasetik" BOOLEAN NOT NULL,
    "lulus_klinis" BOOLEAN NOT NULL,
    "answers" JSONB NOT NULL DEFAULT '{}',
    "substitusi" JSONB,
    "justifikasi_non_formularium" JSONB,
    "lasa_konfirmasi" BOOLEAN,
    "apoteker" TEXT NOT NULL,
    "author_user_id" UUID,
    "author_pegawai_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resep_telaah_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "resep_telaah_resep_order_id_created_at_idx" ON "medicalrecord"."resep_telaah"("resep_order_id", "created_at");

-- AddForeignKey
ALTER TABLE "medicalrecord"."resep_telaah"
    ADD CONSTRAINT "resep_telaah_resep_order_id_fkey"
    FOREIGN KEY ("resep_order_id") REFERENCES "medicalrecord"."resep_order"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
