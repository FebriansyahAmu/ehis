-- Asesmen Medis · Edukasi · Pasien & Keluarga (HPK 2) — append-only log edukasi.
-- Schema medicalrecord.

CREATE TABLE "medicalrecord"."asesmen_edukasi_pasien" (
    "id" UUID NOT NULL,
    "kunjungan_id" UUID NOT NULL,
    "penerima" TEXT NOT NULL,
    "nama_penerima" TEXT,
    "hubungan" TEXT,
    "topik" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "media" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "metode" TEXT,
    "hambatan" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "catatan_hambatan" TEXT,
    "pemahaman" TEXT NOT NULL,
    "rencana_tindak_lanjut" TEXT,
    "catatan" TEXT,
    "tanggal" TEXT,
    "jam" TEXT,
    "petugas" TEXT NOT NULL,
    "author_user_id" UUID,
    "author_pegawai_id" UUID,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "asesmen_edukasi_pasien_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "asesmen_edukasi_pasien_kunjungan_id_created_at_idx" ON "medicalrecord"."asesmen_edukasi_pasien"("kunjungan_id", "created_at");
ALTER TABLE "medicalrecord"."asesmen_edukasi_pasien" ADD CONSTRAINT "asesmen_edukasi_pasien_kunjungan_id_fkey"
    FOREIGN KEY ("kunjungan_id") REFERENCES "encounter"."kunjungan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
