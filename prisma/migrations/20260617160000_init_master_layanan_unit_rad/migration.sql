-- Master Layanan Unit RADIOLOGI (schema "master") — link N:N RadCatalog ⇄ Location.
-- Paralel layanan_unit / layanan_unit_lab (selaras keputusan federasi). Additive — objek baru.
-- Join table HARD delete; unik (rad_catalog_id, location_id) → grant idempoten.

-- CreateTable
CREATE TABLE "master"."layanan_unit_rad" (
    "id" UUID NOT NULL,
    "rad_catalog_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "layanan_unit_rad_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "layanan_unit_rad_rad_catalog_id_location_id_key" ON "master"."layanan_unit_rad"("rad_catalog_id", "location_id");

-- CreateIndex
CREATE INDEX "layanan_unit_rad_location_id_idx" ON "master"."layanan_unit_rad"("location_id");

-- CreateIndex
CREATE INDEX "layanan_unit_rad_rad_catalog_id_idx" ON "master"."layanan_unit_rad"("rad_catalog_id");

-- AddForeignKey
ALTER TABLE "master"."layanan_unit_rad" ADD CONSTRAINT "layanan_unit_rad_rad_catalog_id_fkey" FOREIGN KEY ("rad_catalog_id") REFERENCES "master"."rad_catalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "master"."layanan_unit_rad" ADD CONSTRAINT "layanan_unit_rad_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "master"."location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
