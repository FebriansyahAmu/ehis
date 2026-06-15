-- Rekam Medis — Penilaian Komposit (tab Penilaian, sub-menu Jantung / Kanker).
-- Asesmen spesifik-penyakit = narasi + vocab + klasifikasi baku (dikomposisi dari
-- master.skala_instrument kategori Penyakit). Disimpan sebagai SNAPSHOT JSONB utuh (`data`,
-- termasuk data.skala[] hasil klasifikasi). SATU tabel diskriminasi `jenis` (Jantung|Kanker).
-- Append-only time-series; riwayat per kunjungan per jenis (terbaru dulu). FK → encounter.kunjungan
-- cascade. Prefix tabel `penilaian_`.

-- CreateTable
CREATE TABLE "medicalrecord"."penilaian_komposit" (
    "id" UUID NOT NULL,
    "kunjungan_id" UUID NOT NULL,
    "jenis" TEXT NOT NULL,
    "ringkasan" TEXT NOT NULL DEFAULT '',
    "data" JSONB NOT NULL DEFAULT '{}',
    "pemeriksa" TEXT NOT NULL,
    "author_user_id" UUID,
    "author_pegawai_id" UUID,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "penilaian_komposit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "penilaian_komposit_kunjungan_id_jenis_created_at_idx" ON "medicalrecord"."penilaian_komposit"("kunjungan_id", "jenis", "created_at");

-- AddForeignKey
ALTER TABLE "medicalrecord"."penilaian_komposit"
    ADD CONSTRAINT "penilaian_komposit_kunjungan_id_fkey"
    FOREIGN KEY ("kunjungan_id") REFERENCES "encounter"."kunjungan"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
