-- Backfill relasi katalog hasil Lab (FHIR-GAP FG-58). Entry Hasil lama tak mengirim
-- lab_test_id/lab_parameter_id; keduanya ada di row_key = "<labTestId>:<labParameterId>".
-- Data-only, idempoten (hanya baris NULL ber-row_key format uuid:uuid). Tanpa FK (soft-ref).

UPDATE "medicalrecord"."lab_result_value"
SET
  "lab_test_id"      = COALESCE("lab_test_id", split_part("row_key", ':', 1)::uuid),
  "lab_parameter_id" = COALESCE("lab_parameter_id", split_part("row_key", ':', 2)::uuid)
WHERE ("lab_test_id" IS NULL OR "lab_parameter_id" IS NULL)
  AND "row_key" ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
