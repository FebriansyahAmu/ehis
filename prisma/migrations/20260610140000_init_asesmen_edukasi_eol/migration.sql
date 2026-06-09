-- Asesmen Medis · Edukasi · End of Life (Advance Care Planning) — care plan (single-record
-- latest-wins) + family meeting log (per-item, soft-delete). Schema medicalrecord.

-- ── Care plan ─────────────────────────────────────────────────────────────────
CREATE TABLE "medicalrecord"."asesmen_edukasi_eol" (
    "id" UUID NOT NULL,
    "kunjungan_id" UUID NOT NULL,
    "code_status" TEXT NOT NULL,
    "alasan_kode" TEXT,
    "pengambil_keputusan" TEXT NOT NULL,
    "nama_wali" TEXT,
    "hubungan_wali" TEXT,
    "kontak_wali" TEXT,
    "advance_directive" BOOLEAN NOT NULL DEFAULT false,
    "terapi_diinginkan" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "terapi_ditolak" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "tujuan_perawatan" TEXT,
    "gejala_ditangani" TEXT,
    "kebutuhan_spiritual" TEXT,
    "petugas_paliatif" TEXT,
    "tanggal_dnr" TEXT,
    "dokter_dnr" TEXT,
    "catatan_dnr" TEXT,
    "petugas" TEXT NOT NULL,
    "author_user_id" UUID,
    "author_pegawai_id" UUID,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "asesmen_edukasi_eol_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "asesmen_edukasi_eol_kunjungan_id_created_at_idx" ON "medicalrecord"."asesmen_edukasi_eol"("kunjungan_id", "created_at");
ALTER TABLE "medicalrecord"."asesmen_edukasi_eol" ADD CONSTRAINT "asesmen_edukasi_eol_kunjungan_id_fkey"
    FOREIGN KEY ("kunjungan_id") REFERENCES "encounter"."kunjungan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── Family meeting log ────────────────────────────────────────────────────────
CREATE TABLE "medicalrecord"."asesmen_edukasi_eol_meeting" (
    "id" UUID NOT NULL,
    "kunjungan_id" UUID NOT NULL,
    "tanggal" TEXT,
    "peserta" TEXT NOT NULL,
    "topik" TEXT NOT NULL,
    "keputusan" TEXT,
    "author_user_id" UUID,
    "author_pegawai_id" UUID,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(3),
    CONSTRAINT "asesmen_edukasi_eol_meeting_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "asesmen_edukasi_eol_meeting_kunjungan_id_created_at_idx" ON "medicalrecord"."asesmen_edukasi_eol_meeting"("kunjungan_id", "created_at");
ALTER TABLE "medicalrecord"."asesmen_edukasi_eol_meeting" ADD CONSTRAINT "asesmen_edukasi_eol_meeting_kunjungan_id_fkey"
    FOREIGN KEY ("kunjungan_id") REFERENCES "encounter"."kunjungan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
