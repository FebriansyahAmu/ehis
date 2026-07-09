-- Rekam Medis — Surat Keterangan Sehat / Berbadan Sehat (tab Surat & Dokumen).
-- surat_keterangan_sehat = surat keterangan sehat jasmani per kunjungan (PMK 269/2008 ·
-- UU 29/2004). LIST append-only + soft-delete (batal = koreksi administratif, pola
-- surat_keterangan_sakit). nomor auto sistem (counter SKH-<YYMM><NNN>). Ciri khas SKBS = blok
-- hasil pemeriksaan fisik (antropometri + tanda vital + golongan darah + penglihatan/buta warna/
-- pendengaran) → kesimpulan "Sehat". TTE Dokter Pemeriksa auto-stamp saat terbit bila actor
-- Dokter (signer server-otoritatif, UU ITE 11/2008). FK → encounter.kunjungan cascade.
-- Gate clinical.rekammedis + ABAC careUnit (route()) — unit-agnostic, tanpa permission baru.

-- CreateTable
CREATE TABLE "medicalrecord"."surat_keterangan_sehat" (
    "id" UUID NOT NULL,
    "kunjungan_id" UUID NOT NULL,
    "nomor" TEXT NOT NULL,
    "tgl_periksa" TEXT NOT NULL,
    "tinggi_badan" INTEGER,
    "berat_badan" INTEGER,
    "tekanan_darah" TEXT NOT NULL DEFAULT '',
    "nadi" INTEGER,
    "golongan_darah" TEXT NOT NULL DEFAULT '',
    "penglihatan" TEXT NOT NULL DEFAULT '',
    "buta_warna" TEXT NOT NULL DEFAULT '',
    "pendengaran" TEXT NOT NULL DEFAULT '',
    "riwayat_penyakit" TEXT NOT NULL DEFAULT '',
    "kesimpulan" TEXT NOT NULL DEFAULT 'Sehat',
    "keperluan" TEXT NOT NULL DEFAULT '',
    "instansi" TEXT NOT NULL DEFAULT '',
    "berlaku_hingga" TEXT NOT NULL DEFAULT '',
    "catatan" TEXT NOT NULL DEFAULT '',
    "pekerjaan" TEXT NOT NULL DEFAULT '',
    "dokter_nama" TEXT NOT NULL DEFAULT '',
    "dokter_id" UUID,
    "pencatat" TEXT NOT NULL,
    "author_user_id" UUID,
    "author_pegawai_id" UUID,
    "tte_token" TEXT,
    "tte_signed_by" TEXT,
    "tte_signed_at" TIMESTAMPTZ(3),
    "deleted_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "surat_keterangan_sehat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicalrecord"."surat_sehat_counter" (
    "scope" TEXT NOT NULL,
    "seq" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "surat_sehat_counter_pkey" PRIMARY KEY ("scope")
);

-- CreateIndex
CREATE UNIQUE INDEX "surat_keterangan_sehat_nomor_key" ON "medicalrecord"."surat_keterangan_sehat"("nomor");
CREATE INDEX "surat_keterangan_sehat_kunjungan_id_deleted_at_idx" ON "medicalrecord"."surat_keterangan_sehat"("kunjungan_id", "deleted_at");

-- AddForeignKey
ALTER TABLE "medicalrecord"."surat_keterangan_sehat"
    ADD CONSTRAINT "surat_keterangan_sehat_kunjungan_id_fkey"
    FOREIGN KEY ("kunjungan_id") REFERENCES "encounter"."kunjungan"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
