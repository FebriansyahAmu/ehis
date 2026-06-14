-- Rekam Medis — Penilaian Nyeri (tab Penilaian, sub-menu Nyeri = asesmen komprehensif).
-- Karakterisasi nyeri (PQRST); SKOR NRS TIDAK disimpan di sini (single source = Observation/TTV).
-- Append-only time-series: 1 baris = 1 asesmen; riwayat per kunjungan (terbaru dulu). FK →
-- encounter.kunjungan cascade. Prefix tabel `penilaian_` (sub-menu tab Penilaian).

-- CreateTable
CREATE TABLE "medicalrecord"."penilaian_nyeri" (
    "id" UUID NOT NULL,
    "kunjungan_id" UUID NOT NULL,
    "lokasi" TEXT NOT NULL DEFAULT '',
    "karakter" TEXT NOT NULL DEFAULT '',
    "durasi" TEXT NOT NULL DEFAULT '',
    "faktor_pemberat" TEXT NOT NULL DEFAULT '',
    "faktor_peringan" TEXT NOT NULL DEFAULT '',
    "tipe_nyeri" TEXT NOT NULL DEFAULT '',
    "dampak_fungsional" TEXT NOT NULL DEFAULT '',
    "rencana_reasesmen" TEXT NOT NULL DEFAULT '',
    "catatan" TEXT NOT NULL DEFAULT '',
    "pemeriksa" TEXT NOT NULL,
    "author_user_id" UUID,
    "author_pegawai_id" UUID,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "penilaian_nyeri_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "penilaian_nyeri_kunjungan_id_created_at_idx" ON "medicalrecord"."penilaian_nyeri"("kunjungan_id", "created_at");

-- AddForeignKey
ALTER TABLE "medicalrecord"."penilaian_nyeri"
    ADD CONSTRAINT "penilaian_nyeri_kunjungan_id_fkey"
    FOREIGN KEY ("kunjungan_id") REFERENCES "encounter"."kunjungan"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
