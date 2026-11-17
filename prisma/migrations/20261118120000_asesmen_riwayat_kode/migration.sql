-- FHIR S4d (D7, L04 · L05): riwayat penyakit pribadi & keluarga menyimpan KODE item katalog, bukan hanya nama.
-- Additive. Diterapkan: `prisma db execute` + `prisma migrate resolve --applied 20261118120000_asesmen_riwayat_kode`.
--
-- penyakit_kode sejajar indeks dengan penyakit (label snapshot); '' = nama tidak ada di katalog → Issue L04/L05.
-- Sesudah migrasi ini kode diturunkan Service saat simpan (cocok nama di katalog kategori yang sama).

ALTER TABLE "medicalrecord"."asesmen_penyakit_dahulu"
  ADD COLUMN "penyakit_kode" TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE "medicalrecord"."asesmen_penyakit_keluarga_item"
  ADD COLUMN "anggota_kode" TEXT,
  ADD COLUMN "penyakit_kode" TEXT[] NOT NULL DEFAULT '{}';

-- Backfill baris lama: cocokkan nama (case-insensitive, trim) ke katalog hidup per kategori.
UPDATE "medicalrecord"."asesmen_penyakit_dahulu" d
SET "penyakit_kode" = COALESCE((
  SELECT array_agg(COALESCE((
    SELECT a."kode" FROM "master"."asesmen_item" a
    WHERE a."kategori" = 'PenyakitDahulu' AND a."deleted_at" IS NULL AND lower(trim(a."nama")) = lower(trim(p.nm))
    ORDER BY a."created_at" LIMIT 1), '') ORDER BY p.ord)
  FROM unnest(d."penyakit") WITH ORDINALITY AS p(nm, ord)), '{}');

UPDATE "medicalrecord"."asesmen_penyakit_keluarga_item" i
SET "anggota_kode" = (
      SELECT a."kode" FROM "master"."asesmen_item" a
      WHERE a."kategori" = 'AnggotaKeluarga' AND a."deleted_at" IS NULL AND lower(trim(a."nama")) = lower(trim(i."anggota"))
      ORDER BY a."created_at" LIMIT 1),
    "penyakit_kode" = COALESCE((
      SELECT array_agg(COALESCE((
        SELECT a."kode" FROM "master"."asesmen_item" a
        WHERE a."kategori" = 'PenyakitKeluarga' AND a."deleted_at" IS NULL AND lower(trim(a."nama")) = lower(trim(p.nm))
        ORDER BY a."created_at" LIMIT 1), '') ORDER BY p.ord)
      FROM unnest(i."penyakit") WITH ORDINALITY AS p(nm, ord)), '{}');

-- SNOMED "History of …" (< 417662000) / "Family history …" (< 416471007) untuk item katalog bawaan yang punya
-- padanan pasti di kamus SNOMED lokal (master.snomed_concept, rilis 2002 — FG-87; status aktif rilis terkini
-- belum terverifikasi, FG-127). Display = sinonim "H/O: …" / "FH: …" (gaya contoh resmi: 161527007 "H/O: asthma").
-- Item tanpa padanan pasti (PJK, stroke, PPOK, hepatitis, HIV, GGK, kanker, tiroid, SLE, …) sengaja dibiarkan
-- kosong → ditahan sebagai Issue sampai diisi admin di Master Asesmen Katalog. Hanya mengisi yang masih kosong.
UPDATE "master"."asesmen_item" a SET "snomed_code" = v.code, "snomed_display" = v.display
FROM (VALUES
  ('PenyakitDahulu',   'Hipertensi',              '161501007', 'H/O: hypertension'),
  ('PenyakitDahulu',   'Diabetes Melitus',        '161445009', 'H/O: diabetes mellitus'),
  ('PenyakitDahulu',   'Gagal Jantung Kongestif', '161505003', 'H/O: heart failure'),
  ('PenyakitDahulu',   'Asma Bronkial',           '161527007', 'H/O: asthma'),
  ('PenyakitDahulu',   'Tuberkulosis Paru',       '161414005', 'H/O: tuberculosis'),
  ('PenyakitDahulu',   'Batu Saluran Kemih',      '161548009', 'H/O: urinary stone'),
  ('PenyakitDahulu',   'Epilepsi',                '161480008', 'H/O: epilepsy'),
  ('PenyakitDahulu',   'Gangguan Jiwa',           '161464003', 'H/O: psychiatric disorder'),
  ('PenyakitDahulu',   'Rheumatoid Arthritis',    '161567008', 'H/O: rheumatoid arthritis'),
  ('PenyakitKeluarga', 'Hipertensi',              '160357008', 'FH: Hypertension'),
  ('PenyakitKeluarga', 'Diabetes Melitus',        '160303001', 'FH: Diabetes mellitus'),
  ('PenyakitKeluarga', 'Tuberkulosis',            '160280002', 'FH: Tuberculosis'),
  ('PenyakitKeluarga', 'Asma',                    '160377001', 'FH: Asthma'),
  ('PenyakitKeluarga', 'Thalassemia',             '160319008', 'FH: Thalassemia')
) AS v(kategori, nama, code, display)
WHERE a."kategori" = v.kategori AND a."nama" = v.nama AND a."deleted_at" IS NULL AND a."snomed_code" IS NULL;
