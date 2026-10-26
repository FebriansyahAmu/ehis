-- fhir — schema baru (FH0 Connector Spine SatuSehat). ResourceMap (lokal ↔ IHS id, resolve-first)
-- + SyncLog (outbox, R4) + FhirAuditLog (audit per call, PII di-hash, R9). Consent menyusul FH2.
-- DDL ditulis Prisma-exact (pola billing_init); hanya statement schema `fhir` + RBAC `fhir.sync`.

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "fhir";

-- CreateEnum
CREATE TYPE "fhir"."SyncStatus" AS ENUM ('Pending', 'Sending', 'Acked', 'Failed', 'Skipped');

-- CreateTable
CREATE TABLE "fhir"."resource_map" (
    "id" UUID NOT NULL,
    "local_type" TEXT NOT NULL,
    "local_id" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "ihs_id" TEXT NOT NULL,
    "version_id" TEXT,
    "hash" TEXT,
    "last_sync_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "resource_map_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fhir"."sync_log" (
    "id" UUID NOT NULL,
    "trigger" TEXT NOT NULL,
    "kunjungan_id" UUID,
    "bundle_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "fhir"."SyncStatus" NOT NULL DEFAULT 'Pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_error" JSONB,
    "ihs_refs" JSONB,
    "next_attempt_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "sync_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fhir"."fhir_audit_log" (
    "id" UUID NOT NULL,
    "started_at" TIMESTAMPTZ(3) NOT NULL,
    "mode" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "resource_type" TEXT,
    "ihs_id" TEXT,
    "request_hash" TEXT,
    "response_status" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "duration_ms" INTEGER NOT NULL,
    "error_type" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "nik_hash" TEXT,
    "actor" TEXT NOT NULL,
    "actor_role" TEXT NOT NULL,
    "idempotency_key" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fhir_audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "resource_map_local_type_local_id_key" ON "fhir"."resource_map"("local_type", "local_id");
CREATE INDEX "resource_map_resource_type_ihs_id_idx" ON "fhir"."resource_map"("resource_type", "ihs_id");
CREATE INDEX "sync_log_status_created_at_idx" ON "fhir"."sync_log"("status", "created_at");
CREATE INDEX "sync_log_kunjungan_id_idx" ON "fhir"."sync_log"("kunjungan_id");
CREATE INDEX "fhir_audit_log_started_at_idx" ON "fhir"."fhir_audit_log"("started_at");
CREATE INDEX "fhir_audit_log_target_endpoint_idx" ON "fhir"."fhir_audit_log"("target", "endpoint");

-- ── RBAC: fhir.sync (konsol /ehis-fhir — operator interop). Grant default ke Admin. ──
-- Hook otomatis aksi klinis → SyncLog TIDAK butuh grant (side-effect server).
INSERT INTO "auth"."permissions" ("id","resource","action","kode","nama","modul") VALUES
  (gen_random_uuid(), 'fhir.sync', 'read',   'fhir.sync:read',   'Integrasi SatuSehat — Lihat',  'fhir'),
  (gen_random_uuid(), 'fhir.sync', 'create', 'fhir.sync:create', 'Integrasi SatuSehat — Kirim',  'fhir'),
  (gen_random_uuid(), 'fhir.sync', 'update', 'fhir.sync:update', 'Integrasi SatuSehat — Ubah',   'fhir'),
  (gen_random_uuid(), 'fhir.sync', 'delete', 'fhir.sync:delete', 'Integrasi SatuSehat — Hapus',  'fhir')
ON CONFLICT ("kode") DO NOTHING;

INSERT INTO "auth"."role_permissions" ("role_id","permission_id")
SELECT r."id", p."id" FROM "auth"."roles" r
  JOIN "auth"."permissions" p ON p."modul" = 'fhir'
  WHERE r."key" = 'Admin'
ON CONFLICT DO NOTHING;
