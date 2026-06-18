-- AsesmenAlergi: +bza_kode (kode BZA zat aktif KFA) — terisi bila allergen Obat dipilih
-- dari Katalog Obat → menautkan alergi obat ke peresepan. Data-preserving (nullable).
ALTER TABLE "medicalrecord"."asesmen_alergi" ADD COLUMN IF NOT EXISTS "bza_kode" TEXT;
