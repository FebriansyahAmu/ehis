-- S6b (FHIR L16 · FG-53): Specimen Lab.
-- 1) master.lab_test.spesimen_snomed — jenis spesimen SNOMED (daftar terkurasi SPESIMEN_SNOMED, conceptMap).
--    Backfill dari teks `spesimen` yang sudah ada (pola paling spesifik lebih dulu); admin dapat mengubah.
-- 2) medicalrecord.lab_order.diterima_* — stamp aksi "Terima" Lab (Specimen.receivedTime + ReceivedPerson).
--    Data lama tidak di-backfill (waktu/petugas terima tidak pernah dicatat).

ALTER TABLE "master"."lab_test" ADD COLUMN "spesimen_snomed" TEXT;

UPDATE "master"."lab_test"
SET spesimen_snomed = CASE
  WHEN spesimen ILIKE 'serum%'           THEN '119364003' -- Serum specimen
  WHEN spesimen ILIKE 'urin%pancar%'     THEN '122880004' -- Urine specimen obtained by clean catch procedure
  WHEN spesimen ILIKE 'urin%'            THEN '122575003' -- Urine specimen
  WHEN spesimen ILIKE 'plasma%'          THEN '119361006' -- Plasma specimen
  WHEN spesimen ILIKE 'darah vena%'      THEN '122555007' -- Venous blood specimen
  WHEN spesimen ILIKE 'darah arteri%'    THEN '122552005' -- Arterial blood specimen
  WHEN spesimen ILIKE 'darah kapiler'    THEN '122554006' -- Capillary blood specimen
  WHEN spesimen ILIKE 'darah%'           THEN '119297000' -- Blood specimen
  WHEN spesimen ILIKE 'feses%'           THEN '119339001' -- Stool specimen
  WHEN spesimen ILIKE 'sputum%'          THEN '119334006' -- Sputum specimen
END
WHERE spesimen_snomed IS NULL AND spesimen IS NOT NULL;

ALTER TABLE "medicalrecord"."lab_order"
  ADD COLUMN "diterima_at" TIMESTAMPTZ(3),
  ADD COLUMN "diterima_oleh" TEXT,
  ADD COLUMN "diterima_oleh_pegawai_id" UUID;
