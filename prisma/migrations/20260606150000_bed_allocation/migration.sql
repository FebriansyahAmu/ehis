-- BedAllocation: okupansi/reservasi bed (sumber kebenaran okupansi; "tersedia" = dihitung).
-- Double-booking dicegah partial unique index (status aktif), bukan counter.

-- CreateEnum
CREATE TYPE "encounter"."AllocStatus" AS ENUM ('Reserved', 'Occupied', 'Released');

-- CreateTable
CREATE TABLE "encounter"."bed_allocation" (
    "id" UUID NOT NULL,
    "bed_id" UUID NOT NULL,
    "kunjungan_id" UUID NOT NULL,
    "status" "encounter"."AllocStatus" NOT NULL DEFAULT 'Reserved',
    "reserved_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "occupied_at" TIMESTAMPTZ(3),
    "released_at" TIMESTAMPTZ(3),
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bed_allocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bed_allocation_bed_id_idx" ON "encounter"."bed_allocation"("bed_id");
CREATE INDEX "bed_allocation_kunjungan_id_idx" ON "encounter"."bed_allocation"("kunjungan_id");

-- AddForeignKey (kunjungan, same schema)
ALTER TABLE "encounter"."bed_allocation"
    ADD CONSTRAINT "bed_allocation_kunjungan_id_fkey"
    FOREIGN KEY ("kunjungan_id") REFERENCES "encounter"."kunjungan"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Partial unique indexes: 1 alokasi AKTIF per bed & per kunjungan (anti double-booking).
CREATE UNIQUE INDEX "bed_alloc_one_active_per_bed"
    ON "encounter"."bed_allocation"("bed_id")
    WHERE "status" IN ('Reserved', 'Occupied');
CREATE UNIQUE INDEX "bed_alloc_one_active_per_kunjungan"
    ON "encounter"."bed_allocation"("kunjungan_id")
    WHERE "status" IN ('Reserved', 'Occupied');
