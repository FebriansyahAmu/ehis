-- billing.shift — sesi buka/tutup kasir (Slice 2e persist shift). Additive: 1 tabel baru.
-- Totals di-proyeksi dari billing.payment (open) & di-snapshot JSONB saat tutup (closed).
-- Owner sesi = author_user_id (persistensi "shift saya"); operator = kasir_pegawai_id.

-- CreateTable
CREATE TABLE "billing"."shift" (
    "id" UUID NOT NULL,
    "counter" TEXT NOT NULL,
    "kasir_nama" TEXT NOT NULL,
    "kasir_pegawai_id" UUID,
    "author_user_id" UUID,
    "status" TEXT NOT NULL DEFAULT 'Open',
    "buka_at" TIMESTAMPTZ(3) NOT NULL,
    "buka_saldo_awal" INTEGER NOT NULL,
    "buka_catatan" TEXT,
    "total_by_metode" JSONB,
    "total_transaksi" INTEGER NOT NULL DEFAULT 0,
    "total_refund" INTEGER NOT NULL DEFAULT 0,
    "tutup_at" TIMESTAMPTZ(3),
    "tutup_saldo_akhir" INTEGER,
    "selisih" INTEGER,
    "tutup_catatan" TEXT,
    "supervisor" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "shift_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shift_status_idx" ON "billing"."shift"("status");

-- CreateIndex
CREATE INDEX "shift_author_user_id_status_idx" ON "billing"."shift"("author_user_id", "status");
