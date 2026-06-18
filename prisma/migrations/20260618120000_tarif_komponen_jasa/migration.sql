-- Komponen tarif (PMK 85/2015 — Pola Tarif Nasional): pecah harga total → Jasa Sarana + Jasa
-- Medis + Jasa Paramedis. Additive: 3 kolom nullable Int per tabel tarif (Tindakan/Lab/Rad).
-- harga TOTAL tetap (data lama aman); Service jaga harga = jumlah komponen bila komponen diisi.

ALTER TABLE "master"."tarif_tindakan"
  ADD COLUMN "jasa_sarana" INTEGER,
  ADD COLUMN "jasa_medis" INTEGER,
  ADD COLUMN "jasa_paramedis" INTEGER;

ALTER TABLE "master"."tarif_lab_test"
  ADD COLUMN "jasa_sarana" INTEGER,
  ADD COLUMN "jasa_medis" INTEGER,
  ADD COLUMN "jasa_paramedis" INTEGER;

ALTER TABLE "master"."tarif_rad_catalog"
  ADD COLUMN "jasa_sarana" INTEGER,
  ADD COLUMN "jasa_medis" INTEGER,
  ADD COLUMN "jasa_paramedis" INTEGER;
