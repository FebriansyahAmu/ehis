-- Master Wilayah (Kemendagri) — referensi tree wilayah, di-seed dari repo cahyadsn/wilayah.
-- parentKode = soft-ref diri sendiri (indexed, TANPA FK) → aman bulk 83k + re-seed idempoten.

CREATE TABLE "master"."wilayah" (
    "kode"        TEXT           NOT NULL,
    "nama"        TEXT           NOT NULL,
    "level"       INTEGER        NOT NULL,
    "parent_kode" TEXT,
    "kode_flat"   TEXT           NOT NULL,
    "created_at"  TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wilayah_pkey" PRIMARY KEY ("kode")
);

CREATE INDEX "wilayah_parent_kode_idx" ON "master"."wilayah" ("parent_kode");
CREATE INDEX "wilayah_level_idx"       ON "master"."wilayah" ("level");
CREATE INDEX "wilayah_nama_idx"        ON "master"."wilayah" ("nama");
