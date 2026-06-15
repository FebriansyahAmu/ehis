-- Rekam Medis — Penilaian Pediatrik (tab Penilaian, sub-menu Pediatrik).
-- berat lahir + usia gestasi + status imunisasi + tumbuh kembang + catatan. Append-only
-- time-series: 1 baris = 1 penilaian; riwayat per kunjungan (terbaru dulu). FK →
-- encounter.kunjungan cascade. Prefix tabel `penilaian_`.

-- CreateTable
CREATE TABLE "medicalrecord"."penilaian_pediatrik" (
    "id" UUID NOT NULL,
    "kunjungan_id" UUID NOT NULL,
    "berat_lahir" TEXT NOT NULL DEFAULT '',
    "usia_gestasi" TEXT NOT NULL DEFAULT '',
    "imunisasi" TEXT NOT NULL DEFAULT '',
    "tumbuh_kembang" TEXT NOT NULL DEFAULT '',
    "catatan" TEXT NOT NULL DEFAULT '',
    "pemeriksa" TEXT NOT NULL,
    "author_user_id" UUID,
    "author_pegawai_id" UUID,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "penilaian_pediatrik_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "penilaian_pediatrik_kunjungan_id_created_at_idx" ON "medicalrecord"."penilaian_pediatrik"("kunjungan_id", "created_at");

-- AddForeignKey
ALTER TABLE "medicalrecord"."penilaian_pediatrik"
    ADD CONSTRAINT "penilaian_pediatrik_kunjungan_id_fkey"
    FOREIGN KEY ("kunjungan_id") REFERENCES "encounter"."kunjungan"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
