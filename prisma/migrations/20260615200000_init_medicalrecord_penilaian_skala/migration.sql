-- Rekam Medis — Penilaian Skala (tab Penilaian, sub-menu Asesmen Risiko — generik).
-- SATU tabel untuk semua skala risiko tervalidasi yang ditarik dari master.skala_instrument
-- (Morse/Braden/Barthel/Humpty Dumpty/dst). skala_kode/skala_nama = SNAPSHOT denormalisasi
-- (bukan FK lintas-schema — hasil historis stabil walau instrumen master berubah/non-aktif).
-- jawaban = JSONB [{itemId,itemLabel,score,optionLabel}]. Append-only time-series; riwayat per
-- kunjungan (terbaru dulu). FK → encounter.kunjungan cascade. Prefix tabel `penilaian_`.

-- CreateTable
CREATE TABLE "medicalrecord"."penilaian_skala" (
    "id" UUID NOT NULL,
    "kunjungan_id" UUID NOT NULL,
    "skala_kode" TEXT NOT NULL,
    "skala_nama" TEXT NOT NULL,
    "kategori" TEXT NOT NULL DEFAULT 'Risiko',
    "total_skor" INTEGER NOT NULL,
    "total_max" INTEGER NOT NULL,
    "interpretasi_label" TEXT NOT NULL DEFAULT '',
    "interpretasi_tone" TEXT NOT NULL DEFAULT '',
    "jawaban" JSONB NOT NULL DEFAULT '[]',
    "catatan" TEXT NOT NULL DEFAULT '',
    "pemeriksa" TEXT NOT NULL,
    "author_user_id" UUID,
    "author_pegawai_id" UUID,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "penilaian_skala_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "penilaian_skala_kunjungan_id_created_at_idx" ON "medicalrecord"."penilaian_skala"("kunjungan_id", "created_at");

-- AddForeignKey
ALTER TABLE "medicalrecord"."penilaian_skala"
    ADD CONSTRAINT "penilaian_skala_kunjungan_id_fkey"
    FOREIGN KEY ("kunjungan_id") REFERENCES "encounter"."kunjungan"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
