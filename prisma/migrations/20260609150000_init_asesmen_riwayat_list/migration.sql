-- Asesmen Medis · Riwayat Medis — 4 pane berdaftar (parent + child snapshot, append-only):
-- Pemberian Obat · Penyakit Keluarga · Perawatan&Pembedahan · Obstetri. Schema medicalrecord.

-- ── Pemberian Obat ────────────────────────────────────────────────────────────
CREATE TABLE "medicalrecord"."asesmen_obat" (
    "id" UUID NOT NULL,
    "kunjungan_id" UUID NOT NULL,
    "pemeriksa" TEXT NOT NULL,
    "author_user_id" UUID,
    "author_pegawai_id" UUID,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "asesmen_obat_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "asesmen_obat_kunjungan_id_created_at_idx" ON "medicalrecord"."asesmen_obat"("kunjungan_id", "created_at");
ALTER TABLE "medicalrecord"."asesmen_obat" ADD CONSTRAINT "asesmen_obat_kunjungan_id_fkey"
    FOREIGN KEY ("kunjungan_id") REFERENCES "encounter"."kunjungan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "medicalrecord"."asesmen_obat_item" (
    "id" UUID NOT NULL,
    "asesmen_obat_id" UUID NOT NULL,
    "nama" TEXT NOT NULL,
    "dosis" TEXT,
    "frekuensi" TEXT,
    "rute" TEXT,
    "sejak" TEXT,
    "indikasi" TEXT,
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "asesmen_obat_item_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "asesmen_obat_item_asesmen_obat_id_idx" ON "medicalrecord"."asesmen_obat_item"("asesmen_obat_id");
ALTER TABLE "medicalrecord"."asesmen_obat_item" ADD CONSTRAINT "asesmen_obat_item_asesmen_obat_id_fkey"
    FOREIGN KEY ("asesmen_obat_id") REFERENCES "medicalrecord"."asesmen_obat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── Penyakit Keluarga ─────────────────────────────────────────────────────────
CREATE TABLE "medicalrecord"."asesmen_penyakit_keluarga" (
    "id" UUID NOT NULL,
    "kunjungan_id" UUID NOT NULL,
    "riwayat_lain" TEXT,
    "pemeriksa" TEXT NOT NULL,
    "author_user_id" UUID,
    "author_pegawai_id" UUID,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "asesmen_penyakit_keluarga_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "asesmen_penyakit_keluarga_kunjungan_id_created_at_idx" ON "medicalrecord"."asesmen_penyakit_keluarga"("kunjungan_id", "created_at");
ALTER TABLE "medicalrecord"."asesmen_penyakit_keluarga" ADD CONSTRAINT "asesmen_penyakit_keluarga_kunjungan_id_fkey"
    FOREIGN KEY ("kunjungan_id") REFERENCES "encounter"."kunjungan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "medicalrecord"."asesmen_penyakit_keluarga_item" (
    "id" UUID NOT NULL,
    "asesmen_penyakit_keluarga_id" UUID NOT NULL,
    "anggota" TEXT NOT NULL,
    "penyakit" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "keterangan" TEXT,
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "asesmen_penyakit_keluarga_item_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "asesmen_penyakit_keluarga_item_asesmen_penyakit_keluarga_id_idx" ON "medicalrecord"."asesmen_penyakit_keluarga_item"("asesmen_penyakit_keluarga_id");
ALTER TABLE "medicalrecord"."asesmen_penyakit_keluarga_item" ADD CONSTRAINT "asesmen_penyakit_keluarga_item_asesmen_penyakit_keluarga_id_fkey"
    FOREIGN KEY ("asesmen_penyakit_keluarga_id") REFERENCES "medicalrecord"."asesmen_penyakit_keluarga"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── Perawatan & Tindakan (rawat inap + pembedahan) ────────────────────────────
CREATE TABLE "medicalrecord"."asesmen_perawatan" (
    "id" UUID NOT NULL,
    "kunjungan_id" UUID NOT NULL,
    "pemeriksa" TEXT NOT NULL,
    "author_user_id" UUID,
    "author_pegawai_id" UUID,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "asesmen_perawatan_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "asesmen_perawatan_kunjungan_id_created_at_idx" ON "medicalrecord"."asesmen_perawatan"("kunjungan_id", "created_at");
ALTER TABLE "medicalrecord"."asesmen_perawatan" ADD CONSTRAINT "asesmen_perawatan_kunjungan_id_fkey"
    FOREIGN KEY ("kunjungan_id") REFERENCES "encounter"."kunjungan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "medicalrecord"."asesmen_rawat_inap_item" (
    "id" UUID NOT NULL,
    "asesmen_perawatan_id" UUID NOT NULL,
    "rs" TEXT,
    "unit" TEXT,
    "tanggal" TEXT,
    "diagnosa" TEXT,
    "keterangan" TEXT,
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "asesmen_rawat_inap_item_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "asesmen_rawat_inap_item_asesmen_perawatan_id_idx" ON "medicalrecord"."asesmen_rawat_inap_item"("asesmen_perawatan_id");
ALTER TABLE "medicalrecord"."asesmen_rawat_inap_item" ADD CONSTRAINT "asesmen_rawat_inap_item_asesmen_perawatan_id_fkey"
    FOREIGN KEY ("asesmen_perawatan_id") REFERENCES "medicalrecord"."asesmen_perawatan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "medicalrecord"."asesmen_pembedahan_item" (
    "id" UUID NOT NULL,
    "asesmen_perawatan_id" UUID NOT NULL,
    "tanggal" TEXT,
    "tindakan" TEXT,
    "rs" TEXT,
    "dokter" TEXT,
    "keterangan" TEXT,
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "asesmen_pembedahan_item_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "asesmen_pembedahan_item_asesmen_perawatan_id_idx" ON "medicalrecord"."asesmen_pembedahan_item"("asesmen_perawatan_id");
ALTER TABLE "medicalrecord"."asesmen_pembedahan_item" ADD CONSTRAINT "asesmen_pembedahan_item_asesmen_perawatan_id_fkey"
    FOREIGN KEY ("asesmen_perawatan_id") REFERENCES "medicalrecord"."asesmen_perawatan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── Obstetri (+ persalinan) ───────────────────────────────────────────────────
CREATE TABLE "medicalrecord"."asesmen_obstetri" (
    "id" UUID NOT NULL,
    "kunjungan_id" UUID NOT NULL,
    "metode_kb" TEXT,
    "kb_sejak" TEXT,
    "kb_keterangan" TEXT,
    "gravida" TEXT,
    "para" TEXT,
    "abortus" TEXT,
    "anc_kunjungan" TEXT,
    "anc_usia_kehamilan" TEXT,
    "anc_tempat" TEXT,
    "anc_petugas" TEXT,
    "anc_catatan" TEXT,
    "pemeriksa" TEXT NOT NULL,
    "author_user_id" UUID,
    "author_pegawai_id" UUID,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "asesmen_obstetri_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "asesmen_obstetri_kunjungan_id_created_at_idx" ON "medicalrecord"."asesmen_obstetri"("kunjungan_id", "created_at");
ALTER TABLE "medicalrecord"."asesmen_obstetri" ADD CONSTRAINT "asesmen_obstetri_kunjungan_id_fkey"
    FOREIGN KEY ("kunjungan_id") REFERENCES "encounter"."kunjungan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "medicalrecord"."asesmen_persalinan_item" (
    "id" UUID NOT NULL,
    "asesmen_obstetri_id" UUID NOT NULL,
    "tahun" TEXT,
    "usia_kehamilan" TEXT,
    "jenis" TEXT,
    "bb_lahir" TEXT,
    "kondisi_anak" TEXT,
    "keterangan" TEXT,
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "asesmen_persalinan_item_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "asesmen_persalinan_item_asesmen_obstetri_id_idx" ON "medicalrecord"."asesmen_persalinan_item"("asesmen_obstetri_id");
ALTER TABLE "medicalrecord"."asesmen_persalinan_item" ADD CONSTRAINT "asesmen_persalinan_item_asesmen_obstetri_id_fkey"
    FOREIGN KEY ("asesmen_obstetri_id") REFERENCES "medicalrecord"."asesmen_obstetri"("id") ON DELETE CASCADE ON UPDATE CASCADE;
