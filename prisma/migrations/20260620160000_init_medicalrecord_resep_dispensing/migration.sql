-- Rekam Medis — Dispensing & Serah Obat (SNARS PKPO 5/6 · SatuSehat MedicationDispense).
-- 1 baris = 1 penyiapan+penyerahan obat oleh Apoteker. Append-only. Mengubah status
-- resep_order (Ditelaah → Selesai) di transaksi milik Service. FK → medicalrecord.resep_order cascade.

-- CreateTable
CREATE TABLE "medicalrecord"."resep_dispensing" (
    "id" UUID NOT NULL,
    "resep_order_id" UUID NOT NULL,
    "kunjungan_id" UUID NOT NULL,
    "edukasi" TEXT[],
    "semua_label_dicetak" BOOLEAN NOT NULL DEFAULT false,
    "lasa_konfirmasi" BOOLEAN,
    "petugas2_nar" TEXT,
    "nar_double_check" BOOLEAN,
    "apoteker" TEXT NOT NULL,
    "author_user_id" UUID,
    "author_pegawai_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resep_dispensing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "resep_dispensing_resep_order_id_created_at_idx" ON "medicalrecord"."resep_dispensing"("resep_order_id", "created_at");

-- AddForeignKey
ALTER TABLE "medicalrecord"."resep_dispensing"
    ADD CONSTRAINT "resep_dispensing_resep_order_id_fkey"
    FOREIGN KEY ("resep_order_id") REFERENCES "medicalrecord"."resep_order"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
