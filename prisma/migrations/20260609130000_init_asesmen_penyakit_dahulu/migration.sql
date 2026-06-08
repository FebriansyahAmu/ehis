-- Asesmen Medis · Riwayat Medis · sub-pane Penyakit Dahulu (RPD) — schema medicalrecord.
-- Append-only "latest wins" (≈1 baris/kunjungan). penyakit = TEXT[] (multi-select).

-- CreateTable
CREATE TABLE "medicalrecord"."asesmen_penyakit_dahulu" (
    "id" UUID NOT NULL,
    "kunjungan_id" UUID NOT NULL,
    "penyakit" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "catatan" TEXT,
    "pemeriksa" TEXT NOT NULL,
    "author_user_id" UUID,
    "author_pegawai_id" UUID,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asesmen_penyakit_dahulu_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "asesmen_penyakit_dahulu_kunjungan_id_created_at_idx" ON "medicalrecord"."asesmen_penyakit_dahulu"("kunjungan_id", "created_at");

-- AddForeignKey (kunjungan, cross-schema same DB)
ALTER TABLE "medicalrecord"."asesmen_penyakit_dahulu"
    ADD CONSTRAINT "asesmen_penyakit_dahulu_kunjungan_id_fkey"
    FOREIGN KEY ("kunjungan_id") REFERENCES "encounter"."kunjungan"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
