-- FH9b — Tautan resource ↔ kunjungan untuk konsol Resource/Kunjungan.
-- Additive: kolom nullable (resource master Org/Location/Practitioner/Patient tetap NULL).
ALTER TABLE "fhir"."resource_map" ADD COLUMN IF NOT EXISTS "kunjungan_id" UUID;

CREATE INDEX IF NOT EXISTS "resource_map_env_kunjungan_id_idx"
  ON "fhir"."resource_map" ("env", "kunjungan_id");

-- Backfill: Encounter & Composition berkunci kunjunganId (1 per kunjungan).
-- Resource klinis lain terisi otomatis saat job kunjungan berikutnya berjalan (termasuk noop).
UPDATE "fhir"."resource_map"
SET "kunjungan_id" = "local_id"::uuid
WHERE "kunjungan_id" IS NULL
  AND "local_type" IN ('Encounter', 'Composition')
  AND "local_id" ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
