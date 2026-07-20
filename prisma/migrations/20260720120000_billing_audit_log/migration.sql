-- billing.AuditLog — jejak immutable mutasi finansial invoice (UU PDP 27/2022).
-- Soft-ref invoiceId + kunjunganId (tanpa FK → audit bertahan independen).
CREATE TABLE "billing"."audit_log" (
  "id" UUID NOT NULL,
  "invoice_id" UUID NOT NULL,
  "kunjungan_id" UUID NOT NULL,
  "action" TEXT NOT NULL,
  "actor_nama" TEXT NOT NULL,
  "actor_role" TEXT,
  "actor_user_id" UUID,
  "summary" TEXT NOT NULL,
  "amount" INTEGER,
  "reason" TEXT,
  "no_kwitansi" TEXT,
  "meta" JSONB,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "audit_log_invoice_id_idx" ON "billing"."audit_log"("invoice_id");
CREATE INDEX "audit_log_kunjungan_id_idx" ON "billing"."audit_log"("kunjungan_id");
