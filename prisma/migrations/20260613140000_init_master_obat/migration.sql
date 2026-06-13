-- Master Katalog Obat (schema "master"). Additive — hanya objek baru.
-- Katalog leaf (tanpa version) + soft-delete. Pemetaan KFA = kolom JSONB (`kfa`).
-- `lasa_pair_ids` = text[] soft-ref ke obat lain (tanpa FK).

-- CreateTable
CREATE TABLE "master"."obat" (
    "id" UUID NOT NULL,
    "kode" TEXT NOT NULL DEFAULT '',
    "nama_generik" TEXT NOT NULL,
    "nama_dagang" TEXT NOT NULL,
    "pabrik" TEXT,
    "kategori" TEXT NOT NULL,
    "bentuk" TEXT NOT NULL,
    "kekuatan" TEXT NOT NULL,
    "satuan_terkecil" TEXT,
    "rute" TEXT,
    "is_formularium" BOOLEAN NOT NULL DEFAULT false,
    "is_ham" BOOLEAN NOT NULL DEFAULT false,
    "is_lasa" BOOLEAN NOT NULL DEFAULT false,
    "lasa_pair_ids" TEXT[],
    "golongan" TEXT,
    "is_cold_chain" BOOLEAN NOT NULL DEFAULT false,
    "is_restricted" BOOLEAN NOT NULL DEFAULT false,
    "indikasi" TEXT,
    "kontraindikasi" TEXT,
    "dosis_dewasa" TEXT,
    "dosis_anak" TEXT,
    "efek_samping" TEXT,
    "interaksi_obat" TEXT,
    "catatan_khusus" TEXT,
    "harga_satuan" INTEGER NOT NULL DEFAULT 0,
    "hpp" INTEGER,
    "het" INTEGER,
    "kode_fornas" TEXT,
    "bpjs_coverage" BOOLEAN NOT NULL DEFAULT false,
    "batas_resep_per_kunjungan" INTEGER,
    "kfa" JSONB,
    "status" TEXT NOT NULL DEFAULT 'Aktif',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "obat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "obat_kategori_deleted_at_idx" ON "master"."obat"("kategori", "deleted_at");

-- CreateIndex
CREATE INDEX "obat_kode_idx" ON "master"."obat"("kode");
