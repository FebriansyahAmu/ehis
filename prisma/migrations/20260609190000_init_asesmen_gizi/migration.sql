-- Asesmen Medis · Skrining Gizi (MUST) — append-only time-series (riwayat skrining).
-- Hanya skor sumber disimpan; total & risiko = derived. Schema medicalrecord.

CREATE TABLE "medicalrecord"."asesmen_gizi" (
    "id" UUID NOT NULL,
    "kunjungan_id" UUID NOT NULL,
    "skor_bmi" INTEGER NOT NULL,
    "skor_bb" INTEGER NOT NULL,
    "skor_akut" INTEGER NOT NULL,
    "ahli_gizi" TEXT,
    "catatan" TEXT,
    "tanggal" TEXT,
    "petugas" TEXT NOT NULL,
    "author_user_id" UUID,
    "author_pegawai_id" UUID,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "asesmen_gizi_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "asesmen_gizi_kunjungan_id_created_at_idx" ON "medicalrecord"."asesmen_gizi"("kunjungan_id", "created_at");
ALTER TABLE "medicalrecord"."asesmen_gizi" ADD CONSTRAINT "asesmen_gizi_kunjungan_id_fkey"
    FOREIGN KEY ("kunjungan_id") REFERENCES "encounter"."kunjungan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
