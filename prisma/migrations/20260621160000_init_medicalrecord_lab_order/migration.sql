-- Rekam Medis — Order Lab (tab Order Lab). Order pemeriksaan lab dari klinis (IGD/RI/RJ) ke unit
-- Laboratorium. 1 lab_order (header) → banyak lab_order_item (baris tes). Order append-only
-- (immutable; koreksi = soft-delete + order baru). status/prioritas MUTABLE → workflow Lab
-- (Menunggu→Diterima→…→Selesai/Ditolak). Lab tujuan = snapshot kode+nama Location kategori
-- "Laboratorium". Item snapshot katalog master.LabTest (kode/nama/kategori/TAT/harga) saat order.
-- FK → encounter.kunjungan cascade. Gate clinical.tindakan (Dokter create) · ancillary.lab.worklist (analis baca worklist).

-- CreateTable
CREATE TABLE "medicalrecord"."lab_order" (
    "id" UUID NOT NULL,
    "kunjungan_id" UUID NOT NULL,
    "lab_kode" TEXT,
    "lab_nama" TEXT NOT NULL,
    "catatan" TEXT,
    "prioritas" TEXT NOT NULL DEFAULT 'Rutin',
    "status" TEXT NOT NULL DEFAULT 'Menunggu',
    "penulis" TEXT NOT NULL,
    "penulis_kontak" TEXT,
    "author_user_id" UUID,
    "author_pegawai_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "lab_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicalrecord"."lab_order_item" (
    "id" UUID NOT NULL,
    "lab_order_id" UUID NOT NULL,
    "lab_test_id" UUID,
    "kode_tes" TEXT NOT NULL,
    "nama_tes" TEXT NOT NULL,
    "kategori" TEXT NOT NULL DEFAULT '',
    "waktu_tunggu" TEXT,
    "harga" INTEGER,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lab_order_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lab_order_kunjungan_id_deleted_at_idx" ON "medicalrecord"."lab_order"("kunjungan_id", "deleted_at");

-- CreateIndex
CREATE INDEX "lab_order_lab_kode_status_idx" ON "medicalrecord"."lab_order"("lab_kode", "status");

-- CreateIndex
CREATE INDEX "lab_order_item_lab_order_id_idx" ON "medicalrecord"."lab_order_item"("lab_order_id");

-- AddForeignKey
ALTER TABLE "medicalrecord"."lab_order"
    ADD CONSTRAINT "lab_order_kunjungan_id_fkey"
    FOREIGN KEY ("kunjungan_id") REFERENCES "encounter"."kunjungan"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicalrecord"."lab_order_item"
    ADD CONSTRAINT "lab_order_item_lab_order_id_fkey"
    FOREIGN KEY ("lab_order_id") REFERENCES "medicalrecord"."lab_order"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
