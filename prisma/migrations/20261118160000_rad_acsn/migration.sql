-- S6a (FHIR L17 · FG-54): Accession Number (ACSN) per pemeriksaan radiologi.
-- Additive: kolom nullable + unique, tabel counter harian. Backfill item lama dengan pola yang sama
-- (`R` + YYMMDD tanggal WIB order + urutan 4 digit per hari), lalu counter di-set ke urutan tertinggi.

ALTER TABLE "medicalrecord"."rad_order_item" ADD COLUMN "acsn" TEXT;

CREATE UNIQUE INDEX "rad_order_item_acsn_key" ON "medicalrecord"."rad_order_item"("acsn");

CREATE TABLE "medicalrecord"."rad_acsn_counter" (
    "scope" TEXT NOT NULL,
    "seq" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "rad_acsn_counter_pkey" PRIMARY KEY ("scope")
);

WITH numbered AS (
  SELECT id,
         'R' || to_char(created_at AT TIME ZONE 'Asia/Jakarta', 'YYMMDD') AS scope,
         row_number() OVER (
           PARTITION BY to_char(created_at AT TIME ZONE 'Asia/Jakarta', 'YYMMDD')
           ORDER BY created_at, id
         ) AS seq
  FROM "medicalrecord"."rad_order_item"
  WHERE acsn IS NULL
)
UPDATE "medicalrecord"."rad_order_item" i
SET acsn = n.scope || lpad(n.seq::text, 4, '0')
FROM numbered n
WHERE i.id = n.id;

INSERT INTO "medicalrecord"."rad_acsn_counter" (scope, seq)
SELECT substring(acsn FROM 1 FOR 7), max(substring(acsn FROM 8)::int)
FROM "medicalrecord"."rad_order_item"
WHERE acsn ~ '^R[0-9]{10,}$'
GROUP BY 1
ON CONFLICT (scope) DO UPDATE SET seq = GREATEST("medicalrecord"."rad_acsn_counter".seq, EXCLUDED.seq);
