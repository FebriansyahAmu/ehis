-- Rekam Medis — Resep (tab Resep Pasien). Order obat dari klinis (IGD/RI/RJ) ke depo/apotek
-- Farmasi. 1 resep_order (header) → banyak resep_item (baris obat). Order append-only (immutable;
-- koreksi = soft-delete + order baru). status/prioritas MUTABLE → workflow Farmasi
-- (Menunggu→Ditelaah→Siap Diserahkan→Selesai/Dikembalikan). Depo = snapshot kode+nama Location
-- kategori "Farmasi". Kondisi klinis (ginjal/menyusui/kehamilan) = snapshot decision-support.
-- FK → encounter.kunjungan cascade. Gate clinical.resep (Dokter create) · ancillary.farmasi.* (Apoteker baca worklist).

-- CreateTable
CREATE TABLE "medicalrecord"."resep_order" (
    "id" UUID NOT NULL,
    "kunjungan_id" UUID NOT NULL,
    "depo_kode" TEXT,
    "depo_nama" TEXT NOT NULL,
    "catatan" TEXT,
    "kondisi_ginjal" TEXT,
    "kondisi_menyusui" TEXT,
    "kondisi_kehamilan" TEXT,
    "prioritas" TEXT NOT NULL DEFAULT 'Rutin',
    "status" TEXT NOT NULL DEFAULT 'Menunggu',
    "penulis" TEXT NOT NULL,
    "penulis_kontak" TEXT,
    "author_user_id" UUID,
    "author_pegawai_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "resep_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicalrecord"."resep_item" (
    "id" UUID NOT NULL,
    "resep_order_id" UUID NOT NULL,
    "kode_obat" TEXT NOT NULL,
    "nama_obat" TEXT NOT NULL,
    "bza_kode" TEXT,
    "dosis" TEXT,
    "dosis_sekali" TEXT,
    "signa" TEXT,
    "jumlah" INTEGER NOT NULL DEFAULT 1,
    "rute" TEXT,
    "aturan_pakai" TEXT,
    "kategori" TEXT NOT NULL DEFAULT 'Reguler',
    "durasi_hari" INTEGER NOT NULL DEFAULT 1,
    "keterangan" TEXT,
    "is_ham" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resep_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "resep_order_kunjungan_id_deleted_at_idx" ON "medicalrecord"."resep_order"("kunjungan_id", "deleted_at");

-- CreateIndex
CREATE INDEX "resep_order_depo_kode_status_idx" ON "medicalrecord"."resep_order"("depo_kode", "status");

-- CreateIndex
CREATE INDEX "resep_item_resep_order_id_idx" ON "medicalrecord"."resep_item"("resep_order_id");

-- AddForeignKey
ALTER TABLE "medicalrecord"."resep_order"
    ADD CONSTRAINT "resep_order_kunjungan_id_fkey"
    FOREIGN KEY ("kunjungan_id") REFERENCES "encounter"."kunjungan"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicalrecord"."resep_item"
    ADD CONSTRAINT "resep_item_resep_order_id_fkey"
    FOREIGN KEY ("resep_order_id") REFERENCES "medicalrecord"."resep_order"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
