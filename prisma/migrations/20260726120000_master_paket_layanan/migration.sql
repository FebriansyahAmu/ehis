-- CreateTable
CREATE TABLE "master"."paket_layanan" (
    "id" UUID NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kategori" TEXT NOT NULL DEFAULT 'Lainnya',
    "deskripsi" TEXT NOT NULL DEFAULT '',
    "items" JSONB NOT NULL,
    "harga_umum" INTEGER NOT NULL,
    "harga_bpjs" INTEGER,
    "diskon_pct" INTEGER,
    "badge" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Aktif',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "paket_layanan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master"."paket_counter" (
    "scope" TEXT NOT NULL,
    "last_seq" INTEGER NOT NULL,

    CONSTRAINT "paket_counter_pkey" PRIMARY KEY ("scope")
);

-- CreateIndex
CREATE INDEX "paket_layanan_kategori_deleted_at_idx" ON "master"."paket_layanan"("kategori", "deleted_at");
