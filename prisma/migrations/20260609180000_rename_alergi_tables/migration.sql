-- Rename tabel alergi → keluarga asesmen_* (konsisten dgn asesmen_obat/ginekologi/dst).
--   alergi          → asesmen_alergi
--   alergi_asesmen  → asesmen_alergi_nka  (header penanda NKA)
-- Data-preserving (ALTER ... RENAME). Rename juga PK/FK/index agar selaras nama auto Prisma.

-- ── alergi → asesmen_alergi ───────────────────────────────────────────────────
ALTER TABLE "medicalrecord"."alergi" RENAME TO "asesmen_alergi";
ALTER TABLE "medicalrecord"."asesmen_alergi" RENAME CONSTRAINT "alergi_pkey" TO "asesmen_alergi_pkey";
ALTER TABLE "medicalrecord"."asesmen_alergi" RENAME CONSTRAINT "alergi_kunjungan_id_fkey" TO "asesmen_alergi_kunjungan_id_fkey";
ALTER INDEX "medicalrecord"."alergi_kunjungan_id_deleted_at_idx" RENAME TO "asesmen_alergi_kunjungan_id_deleted_at_idx";

-- ── alergi_asesmen → asesmen_alergi_nka ───────────────────────────────────────
ALTER TABLE "medicalrecord"."alergi_asesmen" RENAME TO "asesmen_alergi_nka";
ALTER TABLE "medicalrecord"."asesmen_alergi_nka" RENAME CONSTRAINT "alergi_asesmen_pkey" TO "asesmen_alergi_nka_pkey";
ALTER TABLE "medicalrecord"."asesmen_alergi_nka" RENAME CONSTRAINT "alergi_asesmen_kunjungan_id_fkey" TO "asesmen_alergi_nka_kunjungan_id_fkey";
ALTER INDEX "medicalrecord"."alergi_asesmen_kunjungan_id_key" RENAME TO "asesmen_alergi_nka_kunjungan_id_key";
