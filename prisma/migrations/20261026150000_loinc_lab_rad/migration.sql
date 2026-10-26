-- LOINC untuk katalog Lab (tes + parameter) & Radiologi — prasyarat FHIR SatuSehat FH6
-- (ServiceRequest/Observation/DiagnosticReport wajib LOINC). Additive & nullable: item tanpa
-- LOINC tidak dikirim ke SatuSehat (dicatat sebagai catatan job). Pengisian = FHIR-GAP FG-52.

ALTER TABLE "master"."lab_test" ADD COLUMN "loinc_code" TEXT;
ALTER TABLE "master"."lab_test" ADD COLUMN "loinc_display" TEXT;
ALTER TABLE "master"."lab_parameter" ADD COLUMN "loinc_code" TEXT;
ALTER TABLE "master"."lab_parameter" ADD COLUMN "loinc_display" TEXT;
ALTER TABLE "master"."rad_catalog" ADD COLUMN "loinc_code" TEXT;
ALTER TABLE "master"."rad_catalog" ADD COLUMN "loinc_display" TEXT;
