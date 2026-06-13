-- Master Katalog Keperawatan (schema "master"): diagnosa SDKI + luaran SLKI + intervensi SIKI.
-- Additive — hanya objek baru. Katalog leaf (tanpa version) + soft-delete.
-- data_mayor/data_minor/intervensi = JSONB (blok terstruktur). kriteria_hasil = text[].
-- Kode `D.NNNN` auto-gen via counter `sdki_counter` (satu baris global scope="D", anti-race).

-- CreateTable
CREATE TABLE "master"."sdki" (
    "id" UUID NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kategori" TEXT NOT NULL,
    "sub_kategori" TEXT NOT NULL DEFAULT '',
    "jenis" TEXT NOT NULL,
    "penyebab_umum" TEXT NOT NULL DEFAULT '',
    "faktor_resiko" TEXT,
    "data_mayor" JSONB NOT NULL,
    "data_minor" JSONB NOT NULL,
    "kriteria_hasil" TEXT[],
    "intervensi" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Aktif',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "sdki_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master"."sdki_counter" (
    "scope" TEXT NOT NULL,
    "last_seq" INTEGER NOT NULL,

    CONSTRAINT "sdki_counter_pkey" PRIMARY KEY ("scope")
);

-- CreateIndex
CREATE INDEX "sdki_kategori_deleted_at_idx" ON "master"."sdki"("kategori", "deleted_at");

-- CreateIndex
CREATE INDEX "sdki_jenis_idx" ON "master"."sdki"("jenis");

-- CreateIndex — kode unik antar baris HIDUP (soft-delete aman; gap kode resmi tak diisi ulang)
CREATE UNIQUE INDEX "sdki_kode_alive_key" ON "master"."sdki"("kode") WHERE "deleted_at" IS NULL;
