-- CreateEnum
CREATE TYPE "master"."OrgType" AS ENUM ('prov', 'dept', 'dept_clin', 'team');

-- CreateEnum
CREATE TYPE "master"."LocationType" AS ENUM ('Rawat_Inap', 'Rawat_Jalan', 'ICU', 'HCU', 'Isolasi', 'IGD', 'OK', 'Penunjang');

-- CreateEnum
CREATE TYPE "master"."LocationKelas" AS ENUM ('VIP', 'Kelas_1', 'Kelas_2', 'Kelas_3');

-- CreateEnum
CREATE TYPE "master"."BedStatus" AS ENUM ('active', 'inactive', 'suspended');

-- CreateTable
CREATE TABLE "master"."organization" (
    "id" UUID NOT NULL,
    "parent_id" UUID,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "org_type" "master"."OrgType" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "telp" TEXT,
    "email" CITEXT,
    "alamat" TEXT,
    "rt_rw" TEXT,
    "kode_pos" TEXT,
    "provinsi_kode" TEXT,
    "provinsi_nama" TEXT,
    "kota_kode" TEXT,
    "kota_nama" TEXT,
    "kecamatan_kode" TEXT,
    "kecamatan_nama" TEXT,
    "kelurahan_kode" TEXT,
    "kelurahan_nama" TEXT,
    "gps_lat" DOUBLE PRECISION,
    "gps_lng" DOUBLE PRECISION,
    "is_root" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master"."location" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "location_type" "master"."LocationType" NOT NULL,
    "kelas" "master"."LocationKelas",
    "kapasitas" INTEGER NOT NULL DEFAULT 1,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "override_alamat" BOOLEAN NOT NULL DEFAULT false,
    "alamat" TEXT,
    "rt_rw" TEXT,
    "kode_pos" TEXT,
    "provinsi_kode" TEXT,
    "provinsi_nama" TEXT,
    "kota_kode" TEXT,
    "kota_nama" TEXT,
    "kecamatan_kode" TEXT,
    "kecamatan_nama" TEXT,
    "kelurahan_kode" TEXT,
    "kelurahan_nama" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master"."bed" (
    "id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "status" "master"."BedStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "bed_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organization_kode_key" ON "master"."organization"("kode");

-- CreateIndex
CREATE INDEX "organization_parent_id_idx" ON "master"."organization"("parent_id");

-- CreateIndex
CREATE INDEX "organization_org_type_idx" ON "master"."organization"("org_type");

-- CreateIndex
CREATE UNIQUE INDEX "location_kode_key" ON "master"."location"("kode");

-- CreateIndex
CREATE INDEX "location_organization_id_idx" ON "master"."location"("organization_id");

-- CreateIndex
CREATE INDEX "location_location_type_idx" ON "master"."location"("location_type");

-- CreateIndex
CREATE UNIQUE INDEX "bed_kode_key" ON "master"."bed"("kode");

-- CreateIndex
CREATE INDEX "bed_location_id_idx" ON "master"."bed"("location_id");

-- AddForeignKey
ALTER TABLE "master"."organization" ADD CONSTRAINT "organization_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "master"."organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "master"."location" ADD CONSTRAINT "location_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "master"."organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "master"."bed" ADD CONSTRAINT "bed_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "master"."location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ── Manual constraints (SQL-only; tak diekspresikan Prisma schema, FLOWS §2 hybrid) ──
-- Kapasitas ruangan wajar 1..50 (cermin guard FE; deklaratif = pertahanan kedua).
ALTER TABLE "master"."location"
  ADD CONSTRAINT "location_kapasitas_chk" CHECK ("kapasitas" BETWEEN 1 AND 50);
