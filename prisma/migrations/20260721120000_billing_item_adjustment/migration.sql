-- billing.ItemAdjustment — penyesuaian per baris charge (overlay proyeksi, Slice 2d Fase 2).
-- 1 aktif per (invoice, sourceRef). `reduksi` = Rp aktual dikurangi (dipakai detail + board).
CREATE TABLE "billing"."item_adjustment" (
  "id" UUID NOT NULL,
  "invoice_id" UUID NOT NULL,
  "source_ref" TEXT NOT NULL,
  "jenis" TEXT NOT NULL,
  "mode" TEXT,
  "nilai" INTEGER NOT NULL DEFAULT 0,
  "reduksi" INTEGER NOT NULL DEFAULT 0,
  "alasan" TEXT,
  "actor_nama" TEXT,
  "actor_user_id" UUID,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "item_adjustment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "item_adjustment_invoice_id_source_ref_key" ON "billing"."item_adjustment"("invoice_id", "source_ref");
CREATE INDEX "item_adjustment_invoice_id_idx" ON "billing"."item_adjustment"("invoice_id");

ALTER TABLE "billing"."item_adjustment"
  ADD CONSTRAINT "item_adjustment_invoice_id_fkey" FOREIGN KEY ("invoice_id")
  REFERENCES "billing"."invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
