-- Log akses BACA rekam medis (PRD Kepatuhan E5 · FR-5.1 · SECURITY-GAP SG-10).
-- Ditulis otomatis oleh route() untuk GET clinical.* ber-kunjungan + rute ber-opsi `aksesLog`.
-- Dedup 1 baris per user × subjek × jendela 15 menit × hasil (upsert ON CONFLICT di DAL).
-- APPEND-ONLY di level DB: trigger menolak DELETE/TRUNCATE dan perubahan kolom identitas;
-- UPDATE hanya boleh menambah (last_at maju, hit_count naik, domains bertambah).

CREATE TABLE "auth"."akses_rekam_medis" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "pegawai_id" UUID,
    "roles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "patient_id" UUID,
    "kunjungan_id" UUID,
    "subject_key" TEXT NOT NULL,
    "unit" TEXT,
    "jalur" TEXT NOT NULL,
    "domains" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "hit_count" INTEGER NOT NULL DEFAULT 1,
    "outcome" TEXT NOT NULL,
    "ip_hash" TEXT,
    "bucket_start" TIMESTAMPTZ(3) NOT NULL,
    "first_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "akses_rekam_medis_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "akses_rekam_medis_outcome_chk" CHECK ("outcome" IN ('allowed', 'denied')),
    CONSTRAINT "akses_rekam_medis_jalur_chk" CHECK ("jalur" IN ('unit', 'penunjang', 'global', 'audit'))
);

CREATE UNIQUE INDEX "akses_rekam_medis_user_id_subject_key_bucket_start_outcome_key"
    ON "auth"."akses_rekam_medis"("user_id", "subject_key", "bucket_start", "outcome");
CREATE INDEX "akses_rekam_medis_patient_id_last_at_idx" ON "auth"."akses_rekam_medis"("patient_id", "last_at" DESC);
CREATE INDEX "akses_rekam_medis_user_id_last_at_idx" ON "auth"."akses_rekam_medis"("user_id", "last_at" DESC);
CREATE INDEX "akses_rekam_medis_kunjungan_id_idx" ON "auth"."akses_rekam_medis"("kunjungan_id");

-- ── Append-only guard ───────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION "auth"."akses_rekam_medis_append_only"() RETURNS trigger AS $$
BEGIN
  IF TG_OP IN ('DELETE', 'TRUNCATE') THEN
    RAISE EXCEPTION 'auth.akses_rekam_medis bersifat append-only: % ditolak', TG_OP;
  END IF;
  IF NEW."id" <> OLD."id"
     OR NEW."user_id" <> OLD."user_id"
     OR NEW."pegawai_id" IS DISTINCT FROM OLD."pegawai_id"
     OR NEW."patient_id" IS DISTINCT FROM OLD."patient_id"
     OR NEW."kunjungan_id" IS DISTINCT FROM OLD."kunjungan_id"
     OR NEW."subject_key" <> OLD."subject_key"
     OR NEW."outcome" <> OLD."outcome"
     OR NEW."jalur" <> OLD."jalur"
     OR NEW."bucket_start" <> OLD."bucket_start"
     OR NEW."first_at" <> OLD."first_at"
     OR NEW."last_at" < OLD."last_at"
     OR NEW."hit_count" < OLD."hit_count"
     OR NOT (OLD."domains" <@ NEW."domains") THEN
    RAISE EXCEPTION 'auth.akses_rekam_medis bersifat append-only: kolom identitas tidak boleh diubah';
  END IF;
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER "akses_rekam_medis_append_only_row"
    BEFORE UPDATE OR DELETE ON "auth"."akses_rekam_medis"
    FOR EACH ROW EXECUTE FUNCTION "auth"."akses_rekam_medis_append_only"();

CREATE TRIGGER "akses_rekam_medis_append_only_truncate"
    BEFORE TRUNCATE ON "auth"."akses_rekam_medis"
    FOR EACH STATEMENT EXECUTE FUNCTION "auth"."akses_rekam_medis_append_only"();

-- ── RBAC: melihat log akses (Unit RM / DPO / Admin) ─────────────────────────────
-- Hanya READ: log ditulis sistem, tak ada create/update/delete lewat UI.
INSERT INTO "auth"."permissions" ("id","resource","action","kode","nama","modul") VALUES
  (gen_random_uuid(), 'audit.akses', 'read', 'audit.akses:read', 'Jejak Akses Rekam Medis — Lihat', 'audit')
ON CONFLICT ("kode") DO NOTHING;

-- Grant awal ke Admin. Unit RM / DPO diberi lewat Mapping Hub RBAC sesuai keputusan RS.
INSERT INTO "auth"."role_permissions" ("role_id","permission_id")
SELECT r."id", p."id" FROM "auth"."roles" r
  JOIN "auth"."permissions" p ON p."kode" = 'audit.akses:read'
 WHERE r."key" = 'Admin'
ON CONFLICT DO NOTHING;
