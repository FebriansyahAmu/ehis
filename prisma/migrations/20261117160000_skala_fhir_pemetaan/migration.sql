-- L11/L12 (FHIR skala nyeri & risiko → Observation): pemetaan instrumen skala ke kamar SatuSehat.
-- Additive. Diterapkan: `prisma db execute` + `prisma migrate resolve --applied 20261117160000_skala_fhir_pemetaan`.
--
-- master.skala_instrument.fhir_pemetaan — KUNCI pemetaan (mis. 'morse', 'humpty-dumpty', 'wong-baker',
-- 'barthel', 'tidak-dikirim'); kode/kategori/pita interpretasi ada di kode (src/lib/fhir/links/skalaPemetaan.ts,
-- verbatim playbook IGD v5.2). NULL = belum dipetakan → penilaian ditahan (Issue L12 di konsol FHIR).
-- Nilai divalidasi Zod di layer API (daftar kunci bisa bertambah tanpa migrasi).

ALTER TABLE "master"."skala_instrument" ADD COLUMN "fhir_pemetaan" TEXT;

-- Backfill SEKALI untuk 13 instrumen bawaan (seed-skala-risiko.mts). Sesudah ini pemetaan dikelola admin
-- lewat Master Skala — tidak lagi diturunkan dari nama.
UPDATE "master"."skala_instrument" SET "fhir_pemetaan" = CASE "nama"
    WHEN 'Morse Fall Scale' THEN 'morse'
    WHEN 'Humpty Dumpty Fall Scale' THEN 'humpty-dumpty'
    WHEN 'Wong-Baker FACES Pain Rating Scale' THEN 'wong-baker'
    WHEN 'NRS Pain Scale' THEN 'nrs'
    WHEN 'Neonatal Infant Pain Scale' THEN 'nips'
    WHEN 'FLACC Behavioral Pain Scale' THEN 'flacc'
    WHEN 'Critical-Care Pain Observation Tool' THEN 'cpot'
    WHEN 'Braden Scale' THEN 'braden'
    WHEN 'Braden Q Scale' THEN 'braden-q'
    WHEN 'Barthel Index' THEN 'barthel'
    WHEN 'MUST (Skrining Gizi)' THEN 'tidak-dikirim'
    WHEN 'Malnutrition Screening Tool' THEN 'tidak-dikirim'
    WHEN 'STRONGkids (Skrining Gizi Anak)' THEN 'tidak-dikirim'
  END
WHERE "kategori" = 'Risiko' AND "fhir_pemetaan" IS NULL AND "deleted_at" IS NULL;

-- Klasifikasi penyakit (Killip/NYHA/TIMI/ECOG/Grade/AJCC) dikonsumsi PenilaianKomposit, bukan kamar 3 modul dasar.
UPDATE "master"."skala_instrument" SET "fhir_pemetaan" = 'tidak-dikirim'
WHERE "kategori" = 'Penyakit' AND "fhir_pemetaan" IS NULL AND "deleted_at" IS NULL;
