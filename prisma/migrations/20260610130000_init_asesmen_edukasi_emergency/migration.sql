-- Asesmen Medis · Edukasi · Emergency — append-only log + soft-delete. Schema medicalrecord.

CREATE TABLE "medicalrecord"."asesmen_edukasi_emergency" (
    "id" UUID NOT NULL,
    "kunjungan_id" UUID NOT NULL,
    "tipe" TEXT NOT NULL,
    "instruksi" TEXT NOT NULL,
    "instruksi_obat" TEXT,
    "diet" TEXT,
    "aktivitas" TEXT,
    "tanda_bahaya" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "follow_up_date" TEXT,
    "follow_up_lokasi" TEXT,
    "kontak_emergency" TEXT,
    "catatan" TEXT,
    "petugas" TEXT NOT NULL,
    "author_user_id" UUID,
    "author_pegawai_id" UUID,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(3),
    CONSTRAINT "asesmen_edukasi_emergency_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "asesmen_edukasi_emergency_kunjungan_id_created_at_idx" ON "medicalrecord"."asesmen_edukasi_emergency"("kunjungan_id", "created_at");
ALTER TABLE "medicalrecord"."asesmen_edukasi_emergency" ADD CONSTRAINT "asesmen_edukasi_emergency_kunjungan_id_fkey"
    FOREIGN KEY ("kunjungan_id") REFERENCES "encounter"."kunjungan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
