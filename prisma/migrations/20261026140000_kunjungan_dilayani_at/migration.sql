-- encounter.kunjungan + dilayani_at — waktu pertama diterima/dilayani (transisi receive → InService),
-- set sekali di Service. Sumber statusHistory FHIR Encounter (arrived → in-progress, FH3).
-- Additive & nullable: data lama tetap NULL (fallback waktu_kunjungan di adapter).

ALTER TABLE "encounter"."kunjungan" ADD COLUMN "dilayani_at" TIMESTAMPTZ(3);
