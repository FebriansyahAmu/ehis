-- LocationType enum (schema "master") += Farmasi, Gudang.
-- Jenis ruangan baru utk modul Farmasi & logistik Gudang. Additive — tidak menghapus value lama.
-- ALTER TYPE ADD VALUE tak boleh dipakai di transaksi yg sama dengan pemakaiannya (kita hanya ADD).

ALTER TYPE "master"."LocationType" ADD VALUE IF NOT EXISTS 'Farmasi';
ALTER TYPE "master"."LocationType" ADD VALUE IF NOT EXISTS 'Gudang';
