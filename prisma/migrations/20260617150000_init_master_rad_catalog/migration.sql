-- Master Katalog Radiologi (schema "master"). Additive — hanya objek baru.
-- Katalog leaf (tanpa version) + soft-delete. Blok terstruktur (tat/persiapan/kontras/
-- drl/reporting) = JSONB. Kode `RAD-NNNN` auto-gen via counter `rad_catalog_counter`.
-- Kode unik HANYA antar baris hidup → partial unique (soft-delete aman).

-- CreateTable
CREATE TABLE "master"."rad_catalog" (
    "id" UUID NOT NULL,
    "kode" TEXT NOT NULL,
    "kode_icd" TEXT,
    "nama" TEXT NOT NULL,
    "modalitas" TEXT NOT NULL,
    "modalitas_subtype" TEXT,
    "region" TEXT NOT NULL,
    "kategori" TEXT NOT NULL,
    "estimasi_waktu_menit" INTEGER NOT NULL,
    "tat_target" JSONB NOT NULL,
    "persiapan" JSONB NOT NULL,
    "kontras" JSONB NOT NULL,
    "drl_referensi" JSONB,
    "reporting_template" JSONB NOT NULL,
    "deskripsi" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Aktif',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "rad_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master"."rad_catalog_counter" (
    "scope" TEXT NOT NULL DEFAULT 'RAD',
    "last_seq" INTEGER NOT NULL,

    CONSTRAINT "rad_catalog_counter_pkey" PRIMARY KEY ("scope")
);

-- CreateIndex
CREATE INDEX "rad_catalog_modalitas_deleted_at_idx" ON "master"."rad_catalog"("modalitas", "deleted_at");

-- CreateIndex
CREATE INDEX "rad_catalog_kategori_idx" ON "master"."rad_catalog"("kategori");

-- CreateIndex — kode unik antar baris HIDUP (soft-delete aman)
CREATE UNIQUE INDEX "rad_catalog_kode_alive_key" ON "master"."rad_catalog"("kode") WHERE "deleted_at" IS NULL;
