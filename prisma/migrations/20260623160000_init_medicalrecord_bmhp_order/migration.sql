-- Rekam Medis — Order BMHP (tab Order BMHP). Permintaan Bahan Medis Habis Pakai dari klinis
-- (IGD/RI/RJ) ke depo/apotek Farmasi. 1 bmhp_order (header) → banyak bmhp_item (baris BMHP).
-- Order append-only (immutable; koreksi = soft-delete + order baru). status/prioritas MUTABLE →
-- workflow Farmasi (Menunggu→Diterima→…→Selesai/Dibatalkan). Depo = snapshot kode+nama Location
-- kategori "Farmasi". FK → encounter.kunjungan cascade. Gate clinical.tindakan (Dokter/Perawat).
-- Selaras lab_order. Mirror struktur resep_order tapi tanpa telaah/dispensing/TTE (BMHP ≠ obat).

-- CreateTable
CREATE TABLE "medicalrecord"."bmhp_order" (
    "id" UUID NOT NULL,
    "kunjungan_id" UUID NOT NULL,
    "depo_kode" TEXT,
    "depo_nama" TEXT NOT NULL,
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

    CONSTRAINT "bmhp_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicalrecord"."bmhp_item" (
    "id" UUID NOT NULL,
    "bmhp_order_id" UUID NOT NULL,
    "bmhp_id" UUID,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "satuan" TEXT NOT NULL DEFAULT '',
    "kategori" TEXT NOT NULL DEFAULT '',
    "jumlah" INTEGER NOT NULL DEFAULT 1,
    "keterangan" TEXT,
    "harga" INTEGER,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bmhp_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bmhp_order_kunjungan_id_deleted_at_idx" ON "medicalrecord"."bmhp_order"("kunjungan_id", "deleted_at");

-- CreateIndex
CREATE INDEX "bmhp_order_depo_kode_status_idx" ON "medicalrecord"."bmhp_order"("depo_kode", "status");

-- CreateIndex
CREATE INDEX "bmhp_item_bmhp_order_id_idx" ON "medicalrecord"."bmhp_item"("bmhp_order_id");

-- AddForeignKey
ALTER TABLE "medicalrecord"."bmhp_order"
    ADD CONSTRAINT "bmhp_order_kunjungan_id_fkey"
    FOREIGN KEY ("kunjungan_id") REFERENCES "encounter"."kunjungan"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicalrecord"."bmhp_item"
    ADD CONSTRAINT "bmhp_item_bmhp_order_id_fkey"
    FOREIGN KEY ("bmhp_order_id") REFERENCES "medicalrecord"."bmhp_order"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
