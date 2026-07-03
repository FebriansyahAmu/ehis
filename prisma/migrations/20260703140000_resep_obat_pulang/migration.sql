-- Resep — flag Obat Pulang (discharge medication). Order resep dari tab Pasien Pulang RI
-- (sub Obat & Jadwal) ditandai is_obat_pulang = true → worklist Farmasi tampilkan badge
-- "Obat Pulang" (edukasi/serah beda perlakuan dari resep reguler). Additive, data-preserving.

ALTER TABLE "medicalrecord"."resep_order"
    ADD COLUMN "is_obat_pulang" BOOLEAN NOT NULL DEFAULT false;
