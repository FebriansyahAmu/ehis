-- CreateTable
CREATE TABLE "bpjs"."bpjs_audit_log" (
    "id" UUID NOT NULL,
    "started_at" TIMESTAMPTZ(3) NOT NULL,
    "mode" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "request_hash" TEXT,
    "response_hash" TEXT,
    "no_kartu_hash" TEXT,
    "nik_hash" TEXT,
    "response_code" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "duration_ms" INTEGER NOT NULL,
    "error_type" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "actor" TEXT NOT NULL,
    "actor_role" TEXT NOT NULL,
    "cons_id" TEXT NOT NULL,
    "idempotency_key" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bpjs_audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bpjs_audit_log_started_at_idx" ON "bpjs"."bpjs_audit_log"("started_at");

-- CreateIndex
CREATE INDEX "bpjs_audit_log_service_endpoint_idx" ON "bpjs"."bpjs_audit_log"("service", "endpoint");

-- CreateIndex
CREATE INDEX "bpjs_audit_log_idempotency_key_idx" ON "bpjs"."bpjs_audit_log"("idempotency_key");

-- CreateIndex
CREATE INDEX "bpjs_audit_log_cons_id_idx" ON "bpjs"."bpjs_audit_log"("cons_id");
