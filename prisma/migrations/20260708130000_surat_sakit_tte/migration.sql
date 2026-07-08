-- Rekam Medis — Surat Keterangan Sakit: TTE Dokter Pemeriksa (additive, nullable).
-- Auto-stamp saat create bila actor Dokter (signer server-otoritatif, anti-spoof, UU ITE
-- 11/2008); non-Dokter → NULL (surat terbit tanpa TTE, cetak pakai TTD manual). Data-preserving.

ALTER TABLE "medicalrecord"."surat_keterangan_sakit"
    ADD COLUMN "tte_token" TEXT,
    ADD COLUMN "tte_signed_by" TEXT,
    ADD COLUMN "tte_signed_at" TIMESTAMPTZ(3);
