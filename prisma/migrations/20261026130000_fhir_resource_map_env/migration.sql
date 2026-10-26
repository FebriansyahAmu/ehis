-- fhir.resource_map + kolom `env` (mock|sandbox|prod). IHS id berbeda per environment → peta
-- dipisah per env (ganti SATUSEHAT_MODE tak memakai id basi). Tabel masih kosong saat migrasi
-- ini dibuat (FH0 baru terpasang), default 'mock' hanya untuk keamanan baris lama bila ada.

ALTER TABLE "fhir"."resource_map" ADD COLUMN "env" TEXT NOT NULL DEFAULT 'mock';
ALTER TABLE "fhir"."resource_map" ALTER COLUMN "env" DROP DEFAULT;

DROP INDEX "fhir"."resource_map_local_type_local_id_key";
DROP INDEX "fhir"."resource_map_resource_type_ihs_id_idx";

CREATE UNIQUE INDEX "resource_map_env_local_type_local_id_key" ON "fhir"."resource_map"("env", "local_type", "local_id");
CREATE INDEX "resource_map_env_resource_type_ihs_id_idx" ON "fhir"."resource_map"("env", "resource_type", "ihs_id");
