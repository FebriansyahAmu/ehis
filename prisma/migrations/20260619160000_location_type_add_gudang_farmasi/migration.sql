-- Master — tambah nilai enum master.LocationType: 'Gudang_Farmasi' (gudang khusus farmasi,
-- dibedakan dari 'Gudang' = gudang/logistik umum). Dipakai modul Inventory + master Ruangan.
-- Idempoten (ADD VALUE IF NOT EXISTS). Catatan: nilai enum PG tak bisa di-drop (rollback manual).
ALTER TYPE "master"."LocationType" ADD VALUE IF NOT EXISTS 'Gudang_Farmasi';
