-- Terminologi Laboratorium resmi SatuSehat (Lampiran LOINC Laboratorium) — master.terminologi_lab +
-- master.terminologi_lab_jawaban. Additive. Data di-seed oleh prisma/scripts/seed-terminologi-lab.mts dari
-- file lampiran lokal yang TIDAK di-commit (docs/terminologi/loinc-lab/).
-- Diterapkan: pg + `prisma migrate resolve --applied 20261117130000_master_terminologi_lab`.

CREATE TABLE IF NOT EXISTS "master"."terminologi_lab" (
  "id"               BIGSERIAL NOT NULL,
  "sumber"           TEXT NOT NULL,
  "sumber_versi"     TEXT,
  "baris"            INTEGER NOT NULL,
  "kategori"         TEXT,
  "nama_pemeriksaan" TEXT NOT NULL,
  "permintaan_hasil" TEXT,
  "spesimen"         TEXT,
  "tipe_hasil"       TEXT,
  "satuan"           TEXT,
  "metode"           TEXT,
  "code"             TEXT NOT NULL,
  "code_system"      TEXT NOT NULL,
  "display"          TEXT,
  "component"        TEXT,
  "property"         TEXT,
  "timing"           TEXT,
  "loinc_system"     TEXT,
  "scale"            TEXT,
  "loinc_method"     TEXT,
  "ucum"             TEXT,
  CONSTRAINT "terminologi_lab_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "terminologi_lab_permintaan_hasil_chk"
    CHECK ("permintaan_hasil" IS NULL OR "permintaan_hasil" IN ('Permintaan', 'Hasil', 'Permintaan & Hasil')),
  CONSTRAINT "terminologi_lab_tipe_hasil_chk"
    CHECK ("tipe_hasil" IS NULL OR "tipe_hasil" IN ('Nominal', 'Ordinal', 'Quantitative', 'OrdQn', 'Narrative', 'SemiQuantitative', 'Qualitative')),
  CONSTRAINT "terminologi_lab_loinc_format_chk"
    CHECK ("code_system" <> 'http://loinc.org' OR "code" ~ '^[0-9]{1,7}-[0-9]$')
);

CREATE UNIQUE INDEX IF NOT EXISTS "terminologi_lab_sumber_baris_key"
  ON "master"."terminologi_lab" ("sumber", "baris");
CREATE INDEX IF NOT EXISTS "terminologi_lab_code_idx"
  ON "master"."terminologi_lab" ("code");

CREATE TABLE IF NOT EXISTS "master"."terminologi_lab_jawaban" (
  "id"               BIGSERIAL NOT NULL,
  "sumber"           TEXT NOT NULL,
  "kode_pemeriksaan" TEXT NOT NULL,
  "code"             TEXT NOT NULL,
  "display"          TEXT NOT NULL,
  "code_system"      TEXT NOT NULL,
  "urutan"           INTEGER,
  "keterangan"       TEXT,
  CONSTRAINT "terminologi_lab_jawaban_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "terminologi_lab_jawaban_sumber_kode_pemeriksaan_code_key"
  ON "master"."terminologi_lab_jawaban" ("sumber", "kode_pemeriksaan", "code");
CREATE INDEX IF NOT EXISTS "terminologi_lab_jawaban_kode_pemeriksaan_idx"
  ON "master"."terminologi_lab_jawaban" ("kode_pemeriksaan");
