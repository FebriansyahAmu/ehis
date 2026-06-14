-- Rekam Medis — Penilaian Status Klinis (tab Penilaian, sub-menu Status).
-- status + tingkat kesadaran + catatan. Append-only time-series: 1 baris = 1 penilaian; riwayat
-- per kunjungan (terbaru dulu). FK → encounter.kunjungan cascade. Prefix tabel `penilaian_`.

-- CreateTable
CREATE TABLE "medicalrecord"."penilaian_status" (
    "id" UUID NOT NULL,
    "kunjungan_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT '',
    "kesadaran" TEXT NOT NULL DEFAULT '',
    "catatan" TEXT NOT NULL DEFAULT '',
    "pemeriksa" TEXT NOT NULL,
    "author_user_id" UUID,
    "author_pegawai_id" UUID,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "penilaian_status_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "penilaian_status_kunjungan_id_created_at_idx" ON "medicalrecord"."penilaian_status"("kunjungan_id", "created_at");

-- AddForeignKey
ALTER TABLE "medicalrecord"."penilaian_status"
    ADD CONSTRAINT "penilaian_status_kunjungan_id_fkey"
    FOREIGN KEY ("kunjungan_id") REFERENCES "encounter"."kunjungan"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
