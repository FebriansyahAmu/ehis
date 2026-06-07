-- Triase parameter: tambah hint tipe nilai + satuan (fondasi auto-klasifikasi level dari TTV).
-- Aditif & data-preserving: kolom baru dengan default; baris existing terisi 'Kategori' / NULL.
ALTER TABLE "master"."triase_parameter"
  ADD COLUMN "tipe_nilai" TEXT NOT NULL DEFAULT 'Kategori',
  ADD COLUMN "satuan"     TEXT;
