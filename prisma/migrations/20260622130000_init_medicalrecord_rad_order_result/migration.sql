-- Rekam Medis — Order Radiologi + Hasil (Ekspertise). Mirror alur Lab.
-- rad_order (header) → rad_order_item (baris pemeriksaan). rad_result (ekspertise: radiografer +
-- radiolog + criticalNotifs JSONB + validasi) → rad_result_item (temuan/kesan per pemeriksaan).
-- Order append-only (koreksi = soft-delete + order baru). status/prioritas MUTABLE → workflow Rad.
-- FK → encounter.kunjungan (order) & medicalrecord.rad_order (result) cascade.
-- Gate clinical.tindakan (Dokter create order) · ancillary.rad.worklist (radiografer/radiolog).

-- CreateTable
CREATE TABLE "medicalrecord"."rad_order" (
    "id" UUID NOT NULL,
    "kunjungan_id" UUID NOT NULL,
    "rad_kode" TEXT,
    "rad_nama" TEXT NOT NULL,
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

    CONSTRAINT "rad_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicalrecord"."rad_order_item" (
    "id" UUID NOT NULL,
    "rad_order_id" UUID NOT NULL,
    "rad_catalog_id" UUID,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "modalitas" TEXT NOT NULL DEFAULT '',
    "region" TEXT NOT NULL DEFAULT '',
    "waktu_tunggu" TEXT,
    "persiapan" TEXT,
    "harga" INTEGER,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rad_order_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicalrecord"."rad_result" (
    "id" UUID NOT NULL,
    "rad_order_id" UUID NOT NULL,
    "kunjungan_id" UUID NOT NULL,
    "radiografer" TEXT,
    "radiolog" TEXT NOT NULL,
    "author_user_id" UUID,
    "author_pegawai_id" UUID,
    "catatan" TEXT,
    "critical_notifs" JSONB,
    "validator" TEXT,
    "validator_user_id" UUID,
    "catatan_validator" TEXT,
    "validated_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rad_result_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicalrecord"."rad_result_item" (
    "id" UUID NOT NULL,
    "rad_result_id" UUID NOT NULL,
    "rad_order_item_id" UUID,
    "row_key" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "modalitas" TEXT NOT NULL DEFAULT '',
    "proyeksi" TEXT,
    "temuan" TEXT,
    "kesan" TEXT,
    "urutan" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "rad_result_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rad_order_kunjungan_id_deleted_at_idx" ON "medicalrecord"."rad_order"("kunjungan_id", "deleted_at");

-- CreateIndex
CREATE INDEX "rad_order_rad_kode_status_idx" ON "medicalrecord"."rad_order"("rad_kode", "status");

-- CreateIndex
CREATE INDEX "rad_order_item_rad_order_id_idx" ON "medicalrecord"."rad_order_item"("rad_order_id");

-- CreateIndex
CREATE INDEX "rad_result_rad_order_id_created_at_idx" ON "medicalrecord"."rad_result"("rad_order_id", "created_at");

-- CreateIndex
CREATE INDEX "rad_result_item_rad_result_id_idx" ON "medicalrecord"."rad_result_item"("rad_result_id");

-- AddForeignKey
ALTER TABLE "medicalrecord"."rad_order"
    ADD CONSTRAINT "rad_order_kunjungan_id_fkey"
    FOREIGN KEY ("kunjungan_id") REFERENCES "encounter"."kunjungan"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicalrecord"."rad_order_item"
    ADD CONSTRAINT "rad_order_item_rad_order_id_fkey"
    FOREIGN KEY ("rad_order_id") REFERENCES "medicalrecord"."rad_order"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicalrecord"."rad_result"
    ADD CONSTRAINT "rad_result_rad_order_id_fkey"
    FOREIGN KEY ("rad_order_id") REFERENCES "medicalrecord"."rad_order"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicalrecord"."rad_result_item"
    ADD CONSTRAINT "rad_result_item_rad_result_id_fkey"
    FOREIGN KEY ("rad_result_id") REFERENCES "medicalrecord"."rad_result"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
