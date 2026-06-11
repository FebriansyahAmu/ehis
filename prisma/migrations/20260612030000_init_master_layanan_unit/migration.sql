-- Master / Mapping Hub — Layanan Unit. Link N:N Tindakan ⇄ Location.
-- Join table: HARD delete (tak ada soft-delete/version). Unik (tindakan_id, location_id) cegah dobel
-- → grant idempoten. Aditif murni. Acuan: docs/BACKEND-MASTER-KATALOG-KLINIS.md §A.8 + penugasan_ruangan.

-- CreateTable
CREATE TABLE "master"."layanan_unit" (
    "id" UUID NOT NULL,
    "tindakan_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "layanan_unit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "layanan_unit_tindakan_id_location_id_key" ON "master"."layanan_unit"("tindakan_id", "location_id");

-- CreateIndex
CREATE INDEX "layanan_unit_location_id_idx" ON "master"."layanan_unit"("location_id");

-- CreateIndex
CREATE INDEX "layanan_unit_tindakan_id_idx" ON "master"."layanan_unit"("tindakan_id");

-- AddForeignKey
ALTER TABLE "master"."layanan_unit" ADD CONSTRAINT "layanan_unit_tindakan_id_fkey" FOREIGN KEY ("tindakan_id") REFERENCES "master"."tindakan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "master"."layanan_unit" ADD CONSTRAINT "layanan_unit_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "master"."location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
