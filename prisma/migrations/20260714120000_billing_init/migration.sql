-- billing — schema baru (Slice 2a). Invoice (1/kunjungan, lazy) + Payment (dalam shift kasir)
-- + BillingCounter (nomor INV/KW). Charge = PROYEKSI order (TIDAK disimpan); total/sisa dihitung
-- saat baca (proyeksi − Σ payment). Di-generate via `prisma migrate diff` (DDL Prisma-exact);
-- statement drift tabel lain (ambient, DROP DEFAULT/Rename dari migrasi lama) SENGAJA dibuang —
-- hanya statement schema `billing` di sini.

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "billing";

-- CreateTable
CREATE TABLE "billing"."billing_counter" (
    "kind" TEXT NOT NULL,
    "periode" TEXT NOT NULL,
    "last_seq" INTEGER NOT NULL,

    CONSTRAINT "billing_counter_pkey" PRIMARY KEY ("kind","periode")
);

-- CreateTable
CREATE TABLE "billing"."invoice" (
    "id" UUID NOT NULL,
    "kunjungan_id" UUID NOT NULL,
    "no_invoice" TEXT NOT NULL,
    "diskon_invoice" INTEGER NOT NULL DEFAULT 0,
    "materai" INTEGER NOT NULL DEFAULT 0,
    "ppn_pct" INTEGER NOT NULL DEFAULT 0,
    "catatan" TEXT,
    "created_by" TEXT,
    "author_user_id" UUID,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing"."payment" (
    "id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "no_kwitansi" TEXT NOT NULL,
    "metode" TEXT NOT NULL,
    "kategori" TEXT NOT NULL DEFAULT 'Pembayaran',
    "nominal" INTEGER NOT NULL,
    "kasir" TEXT NOT NULL,
    "author_user_id" UUID,
    "shift_id" TEXT,
    "source" TEXT,
    "bank" TEXT,
    "no_ref" TEXT,
    "bukti" TEXT,
    "catatan" TEXT,
    "refund_of" UUID,
    "voided" BOOLEAN NOT NULL DEFAULT false,
    "void_reason" TEXT,
    "voided_by" TEXT,
    "voided_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "invoice_kunjungan_id_key" ON "billing"."invoice"("kunjungan_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_no_invoice_key" ON "billing"."invoice"("no_invoice");

-- CreateIndex
CREATE UNIQUE INDEX "payment_no_kwitansi_key" ON "billing"."payment"("no_kwitansi");

-- CreateIndex
CREATE INDEX "payment_invoice_id_idx" ON "billing"."payment"("invoice_id");

-- AddForeignKey
ALTER TABLE "billing"."payment" ADD CONSTRAINT "payment_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "billing"."invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
