-- FHIR S5a (L07 Riwayat Pengobatan → MedicationStatement): item riwayat obat bisa ditautkan ke katalog
-- master.Obat (dipilih dari rekomendasi formularium) + status masih diminum / berhenti.
-- Additive. Diterapkan: `prisma db execute` + `prisma migrate resolve --applied 20261118140000_asesmen_obat_kfa`.
--
-- obat_id = soft-ref master.obat.id (tanpa FK lintas schema, pola inventory). Kode KFA TIDAK disimpan di
-- sini — diturunkan dari master.obat.kfa saat kirim (D7: kode milik katalog). Baris lama = ketik bebas
-- (obat_id NULL) → ditahan sebagai Issue L07 sampai diisi ulang lewat rekomendasi.

ALTER TABLE "medicalrecord"."asesmen_obat_item"
  ADD COLUMN "obat_id" UUID,
  ADD COLUMN "status" TEXT;
