-- D4 / L03 (FHIR keluhan utama → Condition chief-complaint): keluhan utama berkode SNOMED CT.
-- Additive. Diterapkan: `prisma db execute` + `prisma migrate resolve --applied 20261117140000_keluhan_snomed`.
--
-- 1) master.asesmen_item.snomed_display — display resmi SNOMED (Inggris) pendamping snomed_code.
--    Dipakai sebagai `coding.display` FHIR; `nama` (Indonesia) tetap label UI. Kategori baru
--    "KeluhanUtama" (prefix KU) = subset keluhan terkurasi (data di-seed seed-keluhan-utama.mts).
-- 2) medicalrecord.anamnesis.keluhan_snomed_{kode,display} — SNAPSHOT kode keluhan terpilih saat
--    anamnesis disimpan (display diturunkan server dari master, bukan dari klien). Teks bebas
--    `keluhan_utama` tetap = `code.text`.

ALTER TABLE "master"."asesmen_item" ADD COLUMN "snomed_display" TEXT;

ALTER TABLE "medicalrecord"."anamnesis"
  ADD COLUMN "keluhan_snomed_kode" TEXT,
  ADD COLUMN "keluhan_snomed_display" TEXT;

-- Kode & display selalu berpasangan; kode = SCTID (6–18 digit, tanpa nol di depan).
-- IS NOT NULL eksplisit: tanpa itu `length(btrim(NULL)) > 0` = NULL → CHECK menganggap lolos.
ALTER TABLE "medicalrecord"."anamnesis" ADD CONSTRAINT "anamnesis_keluhan_snomed_chk" CHECK (
  ("keluhan_snomed_kode" IS NULL AND "keluhan_snomed_display" IS NULL)
  OR (
    "keluhan_snomed_kode" IS NOT NULL AND "keluhan_snomed_display" IS NOT NULL
    AND "keluhan_snomed_kode" ~ '^[1-9][0-9]{5,17}$' AND length(btrim("keluhan_snomed_display")) > 0
  )
);
