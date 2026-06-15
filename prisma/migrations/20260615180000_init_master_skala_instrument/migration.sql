-- Master Skala Klinis (skoring) — schema "master". Grup Risiko/Umum/Penyakit (struktur identik):
-- items×opsi skor + interpretasi (JSONB). Kode auto `<PREFIX>-NNNN` via skala_counter (per kategori).
-- Konsumen: tab Penilaian (IGD/RI/RJ/ICU) per `konsumen_modul`. Katalog leaf (tanpa version).

-- CreateTable
CREATE TABLE "master"."skala_instrument" (
    "id" UUID NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "singkat" TEXT NOT NULL DEFAULT '',
    "deskripsi" TEXT NOT NULL DEFAULT '',
    "referensi" TEXT NOT NULL DEFAULT '',
    "kategori" TEXT NOT NULL DEFAULT 'Risiko',
    "scoring_mode" TEXT NOT NULL,
    "arah" TEXT NOT NULL,
    "total_max" INTEGER NOT NULL DEFAULT 0,
    "items" JSONB NOT NULL,
    "interpretasi" JSONB NOT NULL,
    "konsumen_modul" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'Aktif',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "skala_instrument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "skala_instrument_kategori_deleted_at_idx" ON "master"."skala_instrument"("kategori", "deleted_at");

-- CreateTable
CREATE TABLE "master"."skala_counter" (
    "scope" TEXT NOT NULL,
    "last_seq" INTEGER NOT NULL,

    CONSTRAINT "skala_counter_pkey" PRIMARY KEY ("scope")
);
