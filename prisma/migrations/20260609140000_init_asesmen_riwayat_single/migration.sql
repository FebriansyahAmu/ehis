-- Asesmen Medis · Riwayat Medis — 4 pane single-record (append-only "latest wins"):
-- Gaya Hidup (Lainnya) · Faktor Resiko · Tuberkulosis · Ginekologi. Schema medicalrecord.

-- ── Gaya Hidup ────────────────────────────────────────────────────────────────
CREATE TABLE "medicalrecord"."asesmen_gaya_hidup" (
    "id" UUID NOT NULL,
    "kunjungan_id" UUID NOT NULL,
    "merokok_status" TEXT,
    "rokok_per_hari" TEXT,
    "merokok_sejak" TEXT,
    "berhenti_sejak" TEXT,
    "paparan_asap" BOOLEAN,
    "paparan_detail" TEXT,
    "catatan" TEXT,
    "pemeriksa" TEXT NOT NULL,
    "author_user_id" UUID,
    "author_pegawai_id" UUID,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "asesmen_gaya_hidup_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "asesmen_gaya_hidup_kunjungan_id_created_at_idx" ON "medicalrecord"."asesmen_gaya_hidup"("kunjungan_id", "created_at");
ALTER TABLE "medicalrecord"."asesmen_gaya_hidup"
    ADD CONSTRAINT "asesmen_gaya_hidup_kunjungan_id_fkey"
    FOREIGN KEY ("kunjungan_id") REFERENCES "encounter"."kunjungan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── Faktor Resiko ─────────────────────────────────────────────────────────────
CREATE TABLE "medicalrecord"."asesmen_faktor_resiko" (
    "id" UUID NOT NULL,
    "kunjungan_id" UUID NOT NULL,
    "penyakit" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "penyakit_lain" TEXT,
    "perilaku" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "perilaku_lain" TEXT,
    "pemeriksa" TEXT NOT NULL,
    "author_user_id" UUID,
    "author_pegawai_id" UUID,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "asesmen_faktor_resiko_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "asesmen_faktor_resiko_kunjungan_id_created_at_idx" ON "medicalrecord"."asesmen_faktor_resiko"("kunjungan_id", "created_at");
ALTER TABLE "medicalrecord"."asesmen_faktor_resiko"
    ADD CONSTRAINT "asesmen_faktor_resiko_kunjungan_id_fkey"
    FOREIGN KEY ("kunjungan_id") REFERENCES "encounter"."kunjungan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── Tuberkulosis ──────────────────────────────────────────────────────────────
CREATE TABLE "medicalrecord"."asesmen_tuberkulosis" (
    "id" UUID NOT NULL,
    "kunjungan_id" UUID NOT NULL,
    "riwayat_tbc" BOOLEAN,
    "tahun_pengobatan" TEXT,
    "status_oat" TEXT,
    "kontak_tbc" BOOLEAN,
    "penunjang" TEXT,
    "tcm_dilakukan" BOOLEAN,
    "tcm_hasil" TEXT,
    "sputum_dilakukan" BOOLEAN,
    "sputum_hasil" TEXT,
    "sputum_grade" TEXT,
    "catatan" TEXT,
    "pemeriksa" TEXT NOT NULL,
    "author_user_id" UUID,
    "author_pegawai_id" UUID,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "asesmen_tuberkulosis_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "asesmen_tuberkulosis_kunjungan_id_created_at_idx" ON "medicalrecord"."asesmen_tuberkulosis"("kunjungan_id", "created_at");
ALTER TABLE "medicalrecord"."asesmen_tuberkulosis"
    ADD CONSTRAINT "asesmen_tuberkulosis_kunjungan_id_fkey"
    FOREIGN KEY ("kunjungan_id") REFERENCES "encounter"."kunjungan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── Ginekologi ────────────────────────────────────────────────────────────────
CREATE TABLE "medicalrecord"."asesmen_ginekologi" (
    "id" UUID NOT NULL,
    "kunjungan_id" UUID NOT NULL,
    "status_menstruasi" TEXT,
    "hpht" TEXT,
    "siklus" TEXT,
    "lama_menstruasi" TEXT,
    "dismenorea" BOOLEAN,
    "menoragia" BOOLEAN,
    "keputihan" BOOLEAN,
    "pap_smear" BOOLEAN,
    "pap_tahun" TEXT,
    "pap_hasil" TEXT,
    "iva" BOOLEAN,
    "iva_tahun" TEXT,
    "iva_hasil" TEXT,
    "catatan" TEXT,
    "pemeriksa" TEXT NOT NULL,
    "author_user_id" UUID,
    "author_pegawai_id" UUID,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "asesmen_ginekologi_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "asesmen_ginekologi_kunjungan_id_created_at_idx" ON "medicalrecord"."asesmen_ginekologi"("kunjungan_id", "created_at");
ALTER TABLE "medicalrecord"."asesmen_ginekologi"
    ADD CONSTRAINT "asesmen_ginekologi_kunjungan_id_fkey"
    FOREIGN KEY ("kunjungan_id") REFERENCES "encounter"."kunjungan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
