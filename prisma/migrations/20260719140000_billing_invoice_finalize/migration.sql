-- Slice 2f — finalize/lock lifecycle invoice (billing).
-- Invoice: status Draft|Final + stempel finalize (server-resolved). Reopen membalik ke Draft.
ALTER TABLE "billing"."invoice"
  ADD COLUMN "status" TEXT NOT NULL DEFAULT 'Draft',
  ADD COLUMN "finalized_at" TIMESTAMPTZ(3),
  ADD COLUMN "finalized_by" TEXT,
  ADD COLUMN "finalized_by_user_id" UUID;

CREATE INDEX "invoice_status_idx" ON "billing"."invoice"("status");

-- InvoiceItem: SNAPSHOT baris charge saat finalize (beku). Ditulis dari proyeksi order
-- di tx finalize; dihapus saat reopen. Report periode meng-agregasi tabel ini (SUM per kategori).
CREATE TABLE "billing"."invoice_item" (
  "id" UUID NOT NULL,
  "invoice_id" UUID NOT NULL,
  "tanggal" TIMESTAMPTZ(3) NOT NULL,
  "nama" TEXT NOT NULL,
  "source_modul" TEXT NOT NULL,
  "source_ref" TEXT NOT NULL,
  "kategori" TEXT NOT NULL,
  "qty" INTEGER NOT NULL,
  "satuan" TEXT NOT NULL,
  "harga_satuan" INTEGER NOT NULL,
  "coverage" TEXT NOT NULL,
  "untariffed" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "invoice_item_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "invoice_item_invoice_id_idx" ON "billing"."invoice_item"("invoice_id");
CREATE INDEX "invoice_item_kategori_idx" ON "billing"."invoice_item"("kategori");

ALTER TABLE "billing"."invoice_item"
  ADD CONSTRAINT "invoice_item_invoice_id_fkey" FOREIGN KEY ("invoice_id")
  REFERENCES "billing"."invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
