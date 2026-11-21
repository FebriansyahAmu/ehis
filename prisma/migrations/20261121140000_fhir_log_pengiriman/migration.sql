-- Log pengiriman SatuSehat per data (konsol FHIR, 2026-11-21).
--
-- 1) fhir_audit_log ditautkan ke data lokal: local_type/local_id (Organization/Location/Practitioner/
--    Patient/resource klinis), kunjungan_id + local_refs (isi Bundle transaction per kunjungan),
--    request_path = path nyata (NIK sudah dimasker di Service).
-- 2) Isi request/response di tabel TERPISAH fhir_audit_payload (1:1): terenkripsi AES-256-GCM
--    (data klinis = data pribadi spesifik UU PDP), dipangkas terjadwal (retensi) tanpa menyentuh
--    baris audit 5 tahun, dan tak membebani scan daftar log (body besar di luar tabel utama).
-- Additive saja; baris lama tetap valid (kolom baru NULL).

ALTER TABLE "fhir"."fhir_audit_log"
  ADD COLUMN "local_type"   TEXT,
  ADD COLUMN "local_id"     TEXT,
  ADD COLUMN "kunjungan_id" UUID,
  ADD COLUMN "local_refs"   TEXT[],
  ADD COLUMN "request_path" TEXT;

-- Riwayat per data, terbaru dulu. Urutan kolom = (kesetaraan…, urutan keyset) → ORDER BY
-- started_at DESC, id DESC + LIMIT dilayani index tanpa sort.
CREATE INDEX "fhir_audit_log_local_idx"
  ON "fhir"."fhir_audit_log" ("mode", "local_type", "local_id", "started_at" DESC, "id" DESC);

-- Bundle transaction per kunjungan (resource klinis mencari Bundle yang memuat dirinya).
CREATE INDEX "fhir_audit_log_kunjungan_idx"
  ON "fhir"."fhir_audit_log" ("mode", "kunjungan_id", "started_at" DESC, "id" DESC);

CREATE TABLE "fhir"."fhir_audit_payload" (
  "audit_id"       UUID NOT NULL,
  "request_enc"    TEXT,
  "response_enc"   TEXT,
  "request_bytes"  INTEGER,
  "response_bytes" INTEGER,
  "truncated"      BOOLEAN NOT NULL DEFAULT false,
  "created_at"     TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "fhir_audit_payload_pkey" PRIMARY KEY ("audit_id"),
  CONSTRAINT "fhir_audit_payload_audit_id_fkey" FOREIGN KEY ("audit_id")
    REFERENCES "fhir"."fhir_audit_log"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Pemangkasan retensi: DELETE … WHERE created_at < batas → range scan, bukan seq scan.
CREATE INDEX "fhir_audit_payload_created_at_idx" ON "fhir"."fhir_audit_payload" ("created_at");

-- Konsol Resource: daftar per resourceType urut last_sync_at DESC (sebelumnya sort penuh).
CREATE INDEX "resource_map_env_resource_type_last_sync_at_idx"
  ON "fhir"."resource_map" ("env", "resource_type", "last_sync_at" DESC);
