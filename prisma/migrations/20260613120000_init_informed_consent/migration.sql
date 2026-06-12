-- Rekam medis — Informed Consent (tab IC, persetujuan tindakan kedokteran PMK 290/2008).
-- Daftar hidup per-item, immutable (add/delete only), soft-delete medico-legal. TTD (PNG data URL
-- base64) disimpan langsung di signature_data TEXT. FK cross-schema → encounter.kunjungan (Cascade).
-- Aditif murni. Acuan: medicalrecord.DiagnosaProsedur + TindakanMedis.

-- CreateTable
CREATE TABLE "medicalrecord"."informed_consent" (
    "id" UUID NOT NULL,
    "kunjungan_id" UUID NOT NULL,
    "no_formulir" TEXT NOT NULL,
    "tindakan_id" UUID,
    "tindakan_nama" TEXT NOT NULL,
    "tindakan_kategori" TEXT,
    "tujuan" TEXT,
    "manfaat" TEXT,
    "risiko" TEXT[],
    "risiko_lain" TEXT,
    "alternatif" TEXT,
    "konsekuensi_tolak" TEXT,
    "pertanyaan_pasien" TEXT,
    "keputusan" TEXT NOT NULL,
    "alasan_tolak" TEXT,
    "penanda_hubungan" TEXT NOT NULL,
    "penanda_nama" TEXT NOT NULL,
    "saksi1" TEXT,
    "saksi2" TEXT,
    "nama_dokter" TEXT NOT NULL,
    "signature_method" TEXT,
    "signature_data" TEXT,
    "signed_at" TIMESTAMPTZ(3),
    "waktu_persetujuan" TIMESTAMPTZ(3) NOT NULL,
    "petugas" TEXT NOT NULL,
    "author_user_id" UUID,
    "author_pegawai_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "informed_consent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "informed_consent_kunjungan_id_deleted_at_idx" ON "medicalrecord"."informed_consent"("kunjungan_id", "deleted_at");

-- AddForeignKey
ALTER TABLE "medicalrecord"."informed_consent" ADD CONSTRAINT "informed_consent_kunjungan_id_fkey" FOREIGN KEY ("kunjungan_id") REFERENCES "encounter"."kunjungan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
