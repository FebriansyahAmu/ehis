-- Rekam Medis — Penilaian Fisik (tab Penilaian, sub-menu Fisik). schema "medicalrecord".
-- Append-only time-series: 1 baris = 1 penilaian; riwayat per kunjungan (terbaru dulu).
-- Pemeriksaan fisik umum (free-text) + Keadaan Umum/Kesadaran/Gizi/Mobilitas. FK →
-- encounter.kunjungan cascade. Prefix tabel `penilaian_` (sub-menu tab Penilaian).

-- CreateTable
CREATE TABLE "medicalrecord"."penilaian_fisik" (
    "id" UUID NOT NULL,
    "kunjungan_id" UUID NOT NULL,
    "pemeriksaan_umum" TEXT NOT NULL DEFAULT '',
    "keadaan_umum" TEXT NOT NULL DEFAULT '',
    "kesadaran" TEXT NOT NULL DEFAULT '',
    "gizi" TEXT NOT NULL DEFAULT '',
    "mobilitas" TEXT NOT NULL DEFAULT '',
    "pemeriksa" TEXT NOT NULL,
    "author_user_id" UUID,
    "author_pegawai_id" UUID,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "penilaian_fisik_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "penilaian_fisik_kunjungan_id_created_at_idx" ON "medicalrecord"."penilaian_fisik"("kunjungan_id", "created_at");

-- AddForeignKey
ALTER TABLE "medicalrecord"."penilaian_fisik"
    ADD CONSTRAINT "penilaian_fisik_kunjungan_id_fkey"
    FOREIGN KEY ("kunjungan_id") REFERENCES "encounter"."kunjungan"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
