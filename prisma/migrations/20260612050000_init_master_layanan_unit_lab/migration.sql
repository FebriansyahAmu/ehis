-- Master / Mapping Hub — Layanan Unit (LABORATORIUM). Link N:N LabTest ⇄ Location.
-- Tabel terpisah dari layanan_unit (Tindakan-only) — grup "Tindakan Laboratorium" di matriks.
-- Join table: HARD delete (tak ada soft-delete/version). Unik (lab_test_id, location_id) cegah dobel
-- → grant idempoten. Aditif murni. Acuan: layanan_unit + labTest.prisma.

-- CreateTable
CREATE TABLE "master"."layanan_unit_lab" (
    "id" UUID NOT NULL,
    "lab_test_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "layanan_unit_lab_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "layanan_unit_lab_lab_test_id_location_id_key" ON "master"."layanan_unit_lab"("lab_test_id", "location_id");

-- CreateIndex
CREATE INDEX "layanan_unit_lab_location_id_idx" ON "master"."layanan_unit_lab"("location_id");

-- CreateIndex
CREATE INDEX "layanan_unit_lab_lab_test_id_idx" ON "master"."layanan_unit_lab"("lab_test_id");

-- AddForeignKey
ALTER TABLE "master"."layanan_unit_lab" ADD CONSTRAINT "layanan_unit_lab_lab_test_id_fkey" FOREIGN KEY ("lab_test_id") REFERENCES "master"."lab_test"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "master"."layanan_unit_lab" ADD CONSTRAINT "layanan_unit_lab_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "master"."location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
