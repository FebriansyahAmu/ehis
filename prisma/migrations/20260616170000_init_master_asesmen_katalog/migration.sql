-- Master Asesmen Katalog — schema "master". Library referensi dropdown asesmen klinis
-- (allergen + reaksi, riwayat penyakit, perilaku, anggota keluarga, KB, persalinan).
-- Kode auto `<PREFIX>-NNN` via asesmen_counter (per kategori). Katalog leaf (tanpa version).
-- Dikonsumsi AllergyPane (Alergi) & RiwayatPane (Riwayat) di AsesmenMedisTab (IGD/RI).

-- CreateTable
CREATE TABLE "master"."asesmen_item" (
    "id" UUID NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kategori" TEXT NOT NULL,
    "deskripsi" TEXT NOT NULL DEFAULT '',
    "snomed_code" TEXT,
    "severity_default" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Aktif',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "asesmen_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "asesmen_item_kategori_deleted_at_idx" ON "master"."asesmen_item"("kategori", "deleted_at");

-- CreateTable
CREATE TABLE "master"."asesmen_counter" (
    "scope" TEXT NOT NULL,
    "last_seq" INTEGER NOT NULL,

    CONSTRAINT "asesmen_counter_pkey" PRIMARY KEY ("scope")
);
