-- Master Tarif Rad Catalog (schema "master") — tarif pemeriksaan radiologi per (penjamin × jenis ruangan).
-- Paralel TarifTindakan & TarifLabTest (selaras LayananUnit ⇄ LayananUnitLab ⇄ LayananUnitRad).
-- Additive — hanya objek baru. Edge leaf (upsert by triple, tanpa version). harga = INT (rupiah).

-- CreateTable
CREATE TABLE "master"."tarif_rad_catalog" (
    "id" UUID NOT NULL,
    "rad_catalog_id" UUID NOT NULL,
    "penjamin_kode" TEXT NOT NULL,
    "jenis_ruangan" TEXT NOT NULL,
    "harga" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "tarif_rad_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tarif_rad_catalog_rad_catalog_id_penjamin_kode_jenis_ruanga_key" ON "master"."tarif_rad_catalog"("rad_catalog_id", "penjamin_kode", "jenis_ruangan");

-- CreateIndex
CREATE INDEX "tarif_rad_catalog_rad_catalog_id_idx" ON "master"."tarif_rad_catalog"("rad_catalog_id");

-- CreateIndex
CREATE INDEX "tarif_rad_catalog_penjamin_kode_idx" ON "master"."tarif_rad_catalog"("penjamin_kode");

-- AddForeignKey
ALTER TABLE "master"."tarif_rad_catalog" ADD CONSTRAINT "tarif_rad_catalog_rad_catalog_id_fkey" FOREIGN KEY ("rad_catalog_id") REFERENCES "master"."rad_catalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
