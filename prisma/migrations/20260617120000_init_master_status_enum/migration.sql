-- Master Status Enum — schema "master". Katalog enum kecil lintas-modul (9 grup fixed ×
-- N entri). Kode auto `<PREFIX>-NNN` via enum_counter (per grup). Katalog leaf (tanpa version).
-- Dikonsumsi PasienPulang · StatusFisikPane · TTV · Transfer · Registrasi RI · Edukasi · MAR.

-- CreateTable
CREATE TABLE "master"."enum_entry" (
    "id" UUID NOT NULL,
    "group_key" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "deskripsi" TEXT NOT NULL DEFAULT '',
    "tone" TEXT NOT NULL DEFAULT 'slate',
    "icon" TEXT,
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Aktif',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "enum_entry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "enum_entry_group_key_deleted_at_idx" ON "master"."enum_entry"("group_key", "deleted_at");

-- Unik kode per grup (baris hidup saja) — kode auto-gen, tapi jaga integritas seed/manual.
CREATE UNIQUE INDEX "enum_entry_group_kode_uq" ON "master"."enum_entry"("group_key", "kode") WHERE "deleted_at" IS NULL;

-- CreateTable
CREATE TABLE "master"."enum_counter" (
    "scope" TEXT NOT NULL,
    "last_seq" INTEGER NOT NULL,

    CONSTRAINT "enum_counter_pkey" PRIMARY KEY ("scope")
);
