-- Master / Mapping Hub — Ketersediaan Farmasi (sub BMHP). Join N:N BMHP ⇄ Location:
-- "BMHP apa jadi daftar standar depo di lokasi farmasi mana". Bentuk PERSIS formularium_obat
-- (HARD delete, unik (bmhp, lokasi), idempoten grant). Idempoten (IF NOT EXISTS + guarded FK).

CREATE TABLE IF NOT EXISTS "master"."formularium_bmhp" (
  "id"          UUID NOT NULL,
  "bmhp_id"     UUID NOT NULL,
  "location_id" UUID NOT NULL,
  "created_at"  TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "formularium_bmhp_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "formularium_bmhp_bmhp_id_location_id_key"
  ON "master"."formularium_bmhp" ("bmhp_id", "location_id");
CREATE INDEX IF NOT EXISTS "formularium_bmhp_location_id_idx"
  ON "master"."formularium_bmhp" ("location_id");
CREATE INDEX IF NOT EXISTS "formularium_bmhp_bmhp_id_idx"
  ON "master"."formularium_bmhp" ("bmhp_id");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'formularium_bmhp_bmhp_id_fkey') THEN
    ALTER TABLE "master"."formularium_bmhp"
      ADD CONSTRAINT "formularium_bmhp_bmhp_id_fkey"
      FOREIGN KEY ("bmhp_id") REFERENCES "master"."bmhp"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'formularium_bmhp_location_id_fkey') THEN
    ALTER TABLE "master"."formularium_bmhp"
      ADD CONSTRAINT "formularium_bmhp_location_id_fkey"
      FOREIGN KEY ("location_id") REFERENCES "master"."location"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
