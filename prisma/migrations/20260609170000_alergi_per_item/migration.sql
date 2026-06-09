-- Alergi: ganti model snapshot (asesmen_alergi + item) → model PER-ITEM (FHIR-aligned).
-- Alergi = daftar hidup: 1 baris/alergen, mutable, soft-delete. Header NKA per-kunjungan.
-- DB dev (belum ada data) → drop-replace aman.

-- ── Buang tabel snapshot lama ─────────────────────────────────────────────────
DROP TABLE IF EXISTS "medicalrecord"."asesmen_alergi_item";
DROP TABLE IF EXISTS "medicalrecord"."asesmen_alergi";

-- ── Alergi (per-item) ─────────────────────────────────────────────────────────
CREATE TABLE "medicalrecord"."alergi" (
    "id" UUID NOT NULL,
    "kunjungan_id" UUID NOT NULL,
    "category" TEXT NOT NULL,
    "allergen" TEXT NOT NULL,
    "reactions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "keterangan" TEXT,
    "snomed_code" TEXT,
    "pemeriksa" TEXT NOT NULL,
    "author_user_id" UUID,
    "author_pegawai_id" UUID,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),
    CONSTRAINT "alergi_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "alergi_kunjungan_id_deleted_at_idx" ON "medicalrecord"."alergi"("kunjungan_id", "deleted_at");
ALTER TABLE "medicalrecord"."alergi" ADD CONSTRAINT "alergi_kunjungan_id_fkey"
    FOREIGN KEY ("kunjungan_id") REFERENCES "encounter"."kunjungan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── Alergi Asesmen (header NKA per-kunjungan) ─────────────────────────────────
CREATE TABLE "medicalrecord"."alergi_asesmen" (
    "id" UUID NOT NULL,
    "kunjungan_id" UUID NOT NULL,
    "nka" BOOLEAN NOT NULL DEFAULT false,
    "pemeriksa" TEXT NOT NULL,
    "author_user_id" UUID,
    "author_pegawai_id" UUID,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "alergi_asesmen_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "alergi_asesmen_kunjungan_id_key" ON "medicalrecord"."alergi_asesmen"("kunjungan_id");
ALTER TABLE "medicalrecord"."alergi_asesmen" ADD CONSTRAINT "alergi_asesmen_kunjungan_id_fkey"
    FOREIGN KEY ("kunjungan_id") REFERENCES "encounter"."kunjungan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
