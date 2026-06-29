-- Kunjungan RI: TITIPAN (kamar ≠ hak kelas) + snapshot hak kelas (basis tagihan) + alasan.
-- Additive & data-preserving: kolom nullable + boolean default false. Tidak menyentuh data lama.
ALTER TABLE "encounter"."kunjungan"
  ADD COLUMN "kelas_hak" "encounter"."KelasRawat",
  ADD COLUMN "titipan" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "titipan_alasan" TEXT;
