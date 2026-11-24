-- Mutasi pasien (pindah ruangan/bed dalam kunjungan yang sama — IGD · Rawat Inap).
--
-- 1) Tabel encounter.mutasi + enum status (Diajukan → Selesai | Dibatalkan).
--    Partial unique: maksimal SATU mutasi berstatus Diajukan per kunjungan.
-- 2) Alokasi bed: index "satu alokasi aktif per kunjungan" dipecah menjadi satu Occupied + satu
--    Reserved per kunjungan. Selama mutasi Diajukan, kunjungan memegang bed asal (Occupied) DAN
--    bed tujuan (Reserved). Index "satu alokasi aktif per BED" tidak berubah (anti double-booking).
--    Data lama aman: setiap kunjungan saat ini memiliki ≤ 1 alokasi aktif.

CREATE TYPE "encounter"."MutasiStatus" AS ENUM ('Diajukan', 'Selesai', 'Dibatalkan');

CREATE TABLE "encounter"."mutasi" (
    "id" UUID NOT NULL,
    "kunjungan_id" UUID NOT NULL,
    "status" "encounter"."MutasiStatus" NOT NULL DEFAULT 'Diajukan',
    "dari_ruangan_id" UUID,
    "dari_ruangan_nama" TEXT,
    "dari_bed_id" UUID,
    "dari_bed_kode" TEXT,
    "dari_kelas" TEXT,
    "ke_ruangan_id" UUID NOT NULL,
    "ke_ruangan_nama" TEXT NOT NULL,
    "ke_bed_id" UUID,
    "ke_bed_kode" TEXT,
    "ke_kelas" TEXT,
    "alasan" TEXT NOT NULL,
    "catatan" TEXT,
    "diajukan_oleh" TEXT NOT NULL,
    "diajukan_oleh_user_id" UUID,
    "diajukan_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "selesai_oleh" TEXT,
    "selesai_at" TIMESTAMPTZ(3),
    "dibatalkan_oleh" TEXT,
    "dibatalkan_at" TIMESTAMPTZ(3),
    "alasan_batal" TEXT,
    "lembar_transfer" JSONB,
    "lembar_diisi_oleh" TEXT,
    "lembar_diisi_at" TIMESTAMPTZ(3),
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mutasi_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "mutasi_kunjungan_id_idx" ON "encounter"."mutasi"("kunjungan_id");

ALTER TABLE "encounter"."mutasi"
    ADD CONSTRAINT "mutasi_kunjungan_id_fkey"
    FOREIGN KEY ("kunjungan_id") REFERENCES "encounter"."kunjungan"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "mutasi_one_pending_per_kunjungan"
    ON "encounter"."mutasi"("kunjungan_id")
    WHERE "status" = 'Diajukan';

-- Alokasi bed: pecah index per kunjungan.
DROP INDEX IF EXISTS "encounter"."bed_alloc_one_active_per_kunjungan";

CREATE UNIQUE INDEX "bed_alloc_one_occupied_per_kunjungan"
    ON "encounter"."bed_allocation"("kunjungan_id")
    WHERE "status" = 'Occupied';

CREATE UNIQUE INDEX "bed_alloc_one_reserved_per_kunjungan"
    ON "encounter"."bed_allocation"("kunjungan_id")
    WHERE "status" = 'Reserved';
