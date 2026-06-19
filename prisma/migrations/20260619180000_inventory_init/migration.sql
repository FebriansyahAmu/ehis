-- Inventory (Logistik) — schema baru `inventory`. Layer stok di atas master Obat+BMHP.
-- Ledger (stock_movement) = sumber kebenaran; saldo (stock_batch/stock_balance) = proyeksi.
-- Di-generate via `prisma migrate diff` (DDL Prisma-exact); statement drift tabel lain (ambient)
-- SENGAJA dibuang — hanya statement schema `inventory` di sini.

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "inventory";

-- CreateEnum
CREATE TYPE "inventory"."ItemJenis" AS ENUM ('Obat', 'BMHP');
CREATE TYPE "inventory"."MovementJenis" AS ENUM ('IN', 'OUT', 'TRANSFER', 'ADJUST', 'OPNAME');
CREATE TYPE "inventory"."DocStatus" AS ENUM ('Draft', 'Diproses', 'Selesai', 'Dibatalkan');
CREATE TYPE "inventory"."OpnameStatus" AS ENUM ('Draft', 'Counting', 'Review', 'Posted');
CREATE TYPE "inventory"."VendorJenis" AS ENUM ('PBF', 'Distributor', 'Manufaktur');
CREATE TYPE "inventory"."VendorStatus" AS ENUM ('Aktif', 'Non_Aktif');

-- CreateTable
CREATE TABLE "inventory"."inv_counter" (
    "kind" TEXT NOT NULL,
    "periode" TEXT NOT NULL,
    "last_seq" INTEGER NOT NULL,

    CONSTRAINT "inv_counter_pkey" PRIMARY KEY ("kind","periode")
);

-- CreateTable
CREATE TABLE "inventory"."stock_movement" (
    "id" UUID NOT NULL,
    "jenis" "inventory"."MovementJenis" NOT NULL,
    "item_jenis" "inventory"."ItemJenis" NOT NULL,
    "item_id" UUID NOT NULL,
    "from_location_id" UUID,
    "to_location_id" UUID,
    "batch_id" UUID,
    "qty" INTEGER NOT NULL,
    "ref_type" TEXT,
    "ref_no" TEXT,
    "ref_id" UUID,
    "alasan" TEXT,
    "petugas" TEXT NOT NULL,
    "actor_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory"."stock_batch" (
    "id" UUID NOT NULL,
    "item_jenis" "inventory"."ItemJenis" NOT NULL,
    "item_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "batch_no" TEXT NOT NULL,
    "expiry_date" DATE,
    "qty_on_hand" INTEGER NOT NULL DEFAULT 0,
    "qty_reserved" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "stock_batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory"."stock_balance" (
    "id" UUID NOT NULL,
    "item_jenis" "inventory"."ItemJenis" NOT NULL,
    "item_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "qty_on_hand" INTEGER NOT NULL DEFAULT 0,
    "qty_reserved" INTEGER NOT NULL DEFAULT 0,
    "min" INTEGER NOT NULL DEFAULT 0,
    "max" INTEGER NOT NULL DEFAULT 0,
    "reorder_point" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "stock_balance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory"."vendor" (
    "id" UUID NOT NULL,
    "kode" TEXT NOT NULL DEFAULT '',
    "nama" TEXT NOT NULL,
    "jenis" "inventory"."VendorJenis" NOT NULL,
    "izin_pbf" TEXT,
    "kontak_nama" TEXT NOT NULL,
    "telp" TEXT NOT NULL,
    "email" TEXT,
    "alamat" TEXT NOT NULL,
    "lead_time_hari" INTEGER NOT NULL DEFAULT 0,
    "status" "inventory"."VendorStatus" NOT NULL DEFAULT 'Aktif',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory"."goods_receipt" (
    "id" UUID NOT NULL,
    "no_dokumen" TEXT NOT NULL,
    "tanggal" DATE NOT NULL,
    "vendor_id" UUID NOT NULL,
    "no_surat_jalan" TEXT,
    "no_po" TEXT,
    "to_location_id" UUID NOT NULL,
    "status" "inventory"."DocStatus" NOT NULL DEFAULT 'Draft',
    "petugas" TEXT NOT NULL,
    "actor_id" UUID,
    "posted_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "goods_receipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory"."goods_receipt_item" (
    "id" UUID NOT NULL,
    "receipt_id" UUID NOT NULL,
    "item_jenis" "inventory"."ItemJenis" NOT NULL,
    "item_id" UUID NOT NULL,
    "batch_no" TEXT NOT NULL,
    "expiry_date" DATE,
    "qty" INTEGER NOT NULL,
    "harga_beli" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "goods_receipt_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory"."stock_transfer" (
    "id" UUID NOT NULL,
    "no_dokumen" TEXT NOT NULL,
    "tanggal" DATE NOT NULL,
    "from_location_id" UUID NOT NULL,
    "to_location_id" UUID NOT NULL,
    "status" "inventory"."DocStatus" NOT NULL DEFAULT 'Draft',
    "petugas" TEXT NOT NULL,
    "actor_id" UUID,
    "posted_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "stock_transfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory"."stock_transfer_item" (
    "id" UUID NOT NULL,
    "transfer_id" UUID NOT NULL,
    "item_jenis" "inventory"."ItemJenis" NOT NULL,
    "item_id" UUID NOT NULL,
    "batch_no" TEXT,
    "qty" INTEGER NOT NULL,

    CONSTRAINT "stock_transfer_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory"."distribusi_request" (
    "id" UUID NOT NULL,
    "no_dokumen" TEXT NOT NULL,
    "tanggal" DATE NOT NULL,
    "from_location_id" UUID NOT NULL,
    "to_location_id" UUID NOT NULL,
    "status" "inventory"."DocStatus" NOT NULL DEFAULT 'Draft',
    "pemohon" TEXT NOT NULL,
    "petugas" TEXT,
    "actor_id" UUID,
    "posted_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "distribusi_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory"."distribusi_item" (
    "id" UUID NOT NULL,
    "request_id" UUID NOT NULL,
    "item_jenis" "inventory"."ItemJenis" NOT NULL,
    "item_id" UUID NOT NULL,
    "qty_minta" INTEGER NOT NULL,
    "qty_keluar" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "distribusi_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory"."opname_session" (
    "id" UUID NOT NULL,
    "no_dokumen" TEXT NOT NULL,
    "tanggal" DATE NOT NULL,
    "location_id" UUID NOT NULL,
    "status" "inventory"."OpnameStatus" NOT NULL DEFAULT 'Draft',
    "petugas" TEXT NOT NULL,
    "actor_id" UUID,
    "posted_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "opname_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory"."opname_item" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "item_jenis" "inventory"."ItemJenis" NOT NULL,
    "item_id" UUID NOT NULL,
    "qty_sistem" INTEGER NOT NULL,
    "qty_fisik" INTEGER,
    "alasan" TEXT,

    CONSTRAINT "opname_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stock_movement_item_jenis_item_id_idx" ON "inventory"."stock_movement"("item_jenis", "item_id");
CREATE INDEX "stock_movement_from_location_id_idx" ON "inventory"."stock_movement"("from_location_id");
CREATE INDEX "stock_movement_to_location_id_idx" ON "inventory"."stock_movement"("to_location_id");
CREATE INDEX "stock_movement_ref_type_ref_no_idx" ON "inventory"."stock_movement"("ref_type", "ref_no");
CREATE INDEX "stock_movement_created_at_id_idx" ON "inventory"."stock_movement"("created_at", "id");
CREATE INDEX "stock_batch_item_jenis_item_id_idx" ON "inventory"."stock_batch"("item_jenis", "item_id");
CREATE INDEX "stock_batch_location_id_idx" ON "inventory"."stock_batch"("location_id");
CREATE INDEX "stock_batch_expiry_date_idx" ON "inventory"."stock_batch"("expiry_date");
CREATE UNIQUE INDEX "stock_batch_location_id_item_jenis_item_id_batch_no_key" ON "inventory"."stock_batch"("location_id", "item_jenis", "item_id", "batch_no");
CREATE INDEX "stock_balance_item_jenis_item_id_idx" ON "inventory"."stock_balance"("item_jenis", "item_id");
CREATE UNIQUE INDEX "stock_balance_location_id_item_jenis_item_id_key" ON "inventory"."stock_balance"("location_id", "item_jenis", "item_id");
CREATE INDEX "vendor_status_idx" ON "inventory"."vendor"("status");
CREATE UNIQUE INDEX "goods_receipt_no_dokumen_key" ON "inventory"."goods_receipt"("no_dokumen");
CREATE INDEX "goods_receipt_status_tanggal_idx" ON "inventory"."goods_receipt"("status", "tanggal");
CREATE INDEX "goods_receipt_vendor_id_idx" ON "inventory"."goods_receipt"("vendor_id");
CREATE INDEX "goods_receipt_item_receipt_id_idx" ON "inventory"."goods_receipt_item"("receipt_id");
CREATE UNIQUE INDEX "stock_transfer_no_dokumen_key" ON "inventory"."stock_transfer"("no_dokumen");
CREATE INDEX "stock_transfer_status_tanggal_idx" ON "inventory"."stock_transfer"("status", "tanggal");
CREATE INDEX "stock_transfer_item_transfer_id_idx" ON "inventory"."stock_transfer_item"("transfer_id");
CREATE UNIQUE INDEX "distribusi_request_no_dokumen_key" ON "inventory"."distribusi_request"("no_dokumen");
CREATE INDEX "distribusi_request_status_tanggal_idx" ON "inventory"."distribusi_request"("status", "tanggal");
CREATE INDEX "distribusi_item_request_id_idx" ON "inventory"."distribusi_item"("request_id");
CREATE UNIQUE INDEX "opname_session_no_dokumen_key" ON "inventory"."opname_session"("no_dokumen");
CREATE INDEX "opname_session_status_tanggal_idx" ON "inventory"."opname_session"("status", "tanggal");
CREATE INDEX "opname_item_session_id_idx" ON "inventory"."opname_item"("session_id");

-- AddForeignKey
ALTER TABLE "inventory"."stock_movement" ADD CONSTRAINT "stock_movement_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "inventory"."stock_batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "inventory"."goods_receipt" ADD CONSTRAINT "goods_receipt_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "inventory"."vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "inventory"."goods_receipt_item" ADD CONSTRAINT "goods_receipt_item_receipt_id_fkey" FOREIGN KEY ("receipt_id") REFERENCES "inventory"."goods_receipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory"."stock_transfer_item" ADD CONSTRAINT "stock_transfer_item_transfer_id_fkey" FOREIGN KEY ("transfer_id") REFERENCES "inventory"."stock_transfer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory"."distribusi_item" ADD CONSTRAINT "distribusi_item_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "inventory"."distribusi_request"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory"."opname_item" ADD CONSTRAINT "opname_item_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "inventory"."opname_session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
