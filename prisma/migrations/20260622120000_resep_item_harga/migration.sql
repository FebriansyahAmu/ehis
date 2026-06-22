-- Snapshot harga satuan obat (rupiah) saat order resep dibuat. Nullable: order lama / obat
-- tanpa tarif → NULL. Biaya baris dihitung di aplikasi = harga × jumlah. Selaras lab_order_item.harga.
ALTER TABLE "medicalrecord"."resep_item" ADD COLUMN "harga" INTEGER;
