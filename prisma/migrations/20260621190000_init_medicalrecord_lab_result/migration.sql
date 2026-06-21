-- Rekam Medis — Hasil Lab (tab Entry Hasil). Nilai pemeriksaan per parameter utk 1 lab_order.
-- 1 lab_result (header: analis + catatan + criticalNotifs JSONB) → banyak lab_result_value (baris
-- per parameter, snapshot katalog master.LabTest/LabParameter). APPEND-ONLY "latest wins": koreksi =
-- baris baru. Saat tersimpan, status lab_order → "Divalidasi" (transisi atomik, di Service).
-- FK → medicalrecord.lab_order cascade. Gate ancillary.lab.worklist (analis entry hasil).

-- CreateTable
CREATE TABLE "medicalrecord"."lab_result" (
    "id" UUID NOT NULL,
    "lab_order_id" UUID NOT NULL,
    "kunjungan_id" UUID NOT NULL,
    "analis" TEXT NOT NULL,
    "author_user_id" UUID,
    "author_pegawai_id" UUID,
    "catatan" TEXT,
    "critical_notifs" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lab_result_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicalrecord"."lab_result_value" (
    "id" UUID NOT NULL,
    "lab_result_id" UUID NOT NULL,
    "lab_test_id" UUID,
    "lab_parameter_id" UUID,
    "row_key" TEXT NOT NULL,
    "kode_tes" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kategori" TEXT NOT NULL DEFAULT '',
    "nilai" TEXT,
    "satuan" TEXT NOT NULL DEFAULT '',
    "rujukan_str" TEXT NOT NULL DEFAULT '—',
    "nilai_min" DOUBLE PRECISION,
    "nilai_max" DOUBLE PRECISION,
    "critical_low" DOUBLE PRECISION,
    "critical_high" DOUBLE PRECISION,
    "flag" TEXT,
    "urutan" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "lab_result_value_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lab_result_lab_order_id_created_at_idx" ON "medicalrecord"."lab_result"("lab_order_id", "created_at");

-- CreateIndex
CREATE INDEX "lab_result_value_lab_result_id_idx" ON "medicalrecord"."lab_result_value"("lab_result_id");

-- AddForeignKey
ALTER TABLE "medicalrecord"."lab_result"
    ADD CONSTRAINT "lab_result_lab_order_id_fkey"
    FOREIGN KEY ("lab_order_id") REFERENCES "medicalrecord"."lab_order"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicalrecord"."lab_result_value"
    ADD CONSTRAINT "lab_result_value_lab_result_id_fkey"
    FOREIGN KEY ("lab_result_id") REFERENCES "medicalrecord"."lab_result"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
