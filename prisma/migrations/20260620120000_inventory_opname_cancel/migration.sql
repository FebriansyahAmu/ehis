-- Inventory Stok Opname: tambah status "Dibatalkan" (transisi batalkan perhitungan sebelum posting).
ALTER TYPE "inventory"."OpnameStatus" ADD VALUE IF NOT EXISTS 'Dibatalkan';
