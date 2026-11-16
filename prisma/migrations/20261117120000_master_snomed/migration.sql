-- Kamus SNOMED CT lokal (SEMENTARA) — master.snomed_description + master.snomed_concept.
-- Additive. Data di-seed oleh prisma/scripts/seed-snomed.mts dari file lokal yang TIDAK di-commit.
-- Diterapkan: prisma db execute / pg + `prisma migrate resolve --applied 20261117120000_master_snomed`.

CREATE EXTENSION IF NOT EXISTS "pg_trgm";

CREATE TABLE IF NOT EXISTS "master"."snomed_description" (
  "id"             BIGSERIAL NOT NULL,
  "concept_id"     TEXT NOT NULL,
  "term"           TEXT NOT NULL,
  "type"           TEXT NOT NULL,
  "language_code"  TEXT NOT NULL DEFAULT 'en',
  "effective_time" INTEGER NOT NULL,
  CONSTRAINT "snomed_description_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "snomed_description_type_chk" CHECK ("type" IN ('FSN', 'SYN', 'DEF')),
  CONSTRAINT "snomed_description_concept_id_chk" CHECK ("concept_id" ~ '^[1-9][0-9]{5,17}$')
);

-- Anti duplikat (sumber memuat tiap deskripsi 2×) + lookup per konsep (kolom terdepan concept_id).
CREATE UNIQUE INDEX IF NOT EXISTS "snomed_description_concept_id_type_term_key"
  ON "master"."snomed_description" ("concept_id", "type", "term");
CREATE INDEX IF NOT EXISTS "snomed_description_term_trgm_idx"
  ON "master"."snomed_description" USING GIN ("term" gin_trgm_ops);

CREATE TABLE IF NOT EXISTS "master"."snomed_concept" (
  "concept_id"     TEXT NOT NULL,
  "fsn"            TEXT,
  "display"        TEXT NOT NULL,
  "display_source" TEXT NOT NULL,
  "semantic_tag"   TEXT,
  "effective_time" INTEGER NOT NULL,
  CONSTRAINT "snomed_concept_pkey" PRIMARY KEY ("concept_id"),
  CONSTRAINT "snomed_concept_id_chk" CHECK ("concept_id" ~ '^[1-9][0-9]{5,17}$'),
  CONSTRAINT "snomed_concept_display_source_chk" CHECK ("display_source" IN ('FSN', 'SYN'))
);

CREATE INDEX IF NOT EXISTS "snomed_concept_semantic_tag_idx"
  ON "master"."snomed_concept" ("semantic_tag");
