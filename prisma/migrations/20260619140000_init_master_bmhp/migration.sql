-- Master — Katalog BMHP/BHP (Bahan Medis Habis Pakai). Katalog leaf TERPISAH dari Obat
-- (beda field set/konsumen/regulasi). Kode auto BHP-<YYMM><NNN> via bmhp_counter (atomik,
-- reset per bulan WIB). Soft-delete (deleted_at). Enum FE-facing = TEXT pass-through.
-- KFA Alkes (jsonb) DISIAPKAN tapi ditunda. Leaf mandiri → tanpa FK lintas-schema.

-- CreateTable
CREATE TABLE "master"."bmhp" (
    "id" UUID NOT NULL,
    "kode" TEXT NOT NULL DEFAULT '',
    "nama" TEXT NOT NULL,
    "merek" TEXT,
    "pabrik" TEXT,
    "kategori" TEXT NOT NULL,
    "ukuran" TEXT,
    "satuan" TEXT NOT NULL,
    "isi_per_kemasan" INTEGER,
    "is_steril" BOOLEAN NOT NULL DEFAULT false,
    "is_single_use" BOOLEAN NOT NULL DEFAULT true,
    "is_implan" BOOLEAN NOT NULL DEFAULT false,
    "kelas_risiko" TEXT,
    "is_formularium" BOOLEAN NOT NULL DEFAULT false,
    "nomor_izin_edar" TEXT,
    "kode_e_katalog" TEXT,
    "harga_satuan" INTEGER NOT NULL DEFAULT 0,
    "hpp" INTEGER,
    "het" INTEGER,
    "bpjs_coverage" BOOLEAN NOT NULL DEFAULT false,
    "kfa" JSONB,
    "catatan" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Aktif',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "bmhp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master"."bmhp_counter" (
    "periode" CHAR(4) NOT NULL,
    "last_seq" INTEGER NOT NULL,

    CONSTRAINT "bmhp_counter_pkey" PRIMARY KEY ("periode")
);

-- CreateIndex
CREATE INDEX "bmhp_kategori_deleted_at_idx" ON "master"."bmhp"("kategori", "deleted_at");

-- CreateIndex
CREATE INDEX "bmhp_kode_idx" ON "master"."bmhp"("kode");
